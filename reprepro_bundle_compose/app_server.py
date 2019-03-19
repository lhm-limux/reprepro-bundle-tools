#!/usr/bin/python3
##########################################################################
# Copyright (c) 2018 Landeshauptstadt München
#           (c) 2018 Christoph Lutz (InterFace AG)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the European Union Public Licence (EUPL),
# version 1.1 (or any later version).
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# European Union Public Licence for more details.
#
# You should have received a copy of the European Union Public Licence
# along with this program. If not, see
# https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12
##########################################################################
'''
   This is the starter for the bundle-compose-tool frontend.

   It uses xdg-open to start the web-frontend of the bundle-compose-tool and
   runs the corresponding backend service.
'''

import logging
import json
import os
import io
import sys
from aiohttp import web
import asyncio
import concurrent.futures
import tempfile
import shutil
import git
import git.exc
from git.exc import GitCommandError
import subprocess
from urllib.parse import urlparse
import reprepro_bundle_compose
from reprepro_bundle_compose import \
        BUNDLES_LIST_FILE, BundleStatus, getTargetRepoSuites, \
        getBundleRepoSuitesAsync, parseBundlesAsync, updateBundles, trac_api, \
        getTracConfig, getGitRepoConfig, markBundlesForStatusAsync, \
        markBundlesForTarget, git_commit, ensure_clean_git_repo, GitNotCleanException
from reprepro_bundle_appserver import common_app_server, common_interfaces


progname = "bundle-compose-app"
logger = logging.getLogger("reprepro_bundle_appserver.bundle_compose_app")

APP_DIST = './ng-bundle-compose/'
if not os.path.exists(APP_DIST):
    APP_DIST = "/usr/lib/reprepro-bundle-apps/ng-bundle-compose/"

MAX_GIT_LIST_CHANGES = 200
publishedCommitsCache = set()
publishedCommitsLastHead = None

tpe = None # ThreadPoolExecutor set in main


async def handle_required_auth(request):
    res = list()
    try:
        req = common_interfaces.AuthRequired_validate(json.loads(request.rel_url.query['authRequired']))
        availableRefs = set()
        for authRef in req['refs']:
            if common_app_server.is_valid_authRef(authRef):
                availableRefs.add(authRef['authId'])
        if "login" == req['actionId']:
            res.extend(getRequiredAuthForConfig(
                availableRefs,
                getGitRepoConfig(),
                "RepoUrl",
                "Please enter your {CredentialType} authentication data in order to clone the GIT Reposiory!"
            ))
        elif "bundleSync" == req['actionId']:
            try:
                unused_session, unused_workingDir = validateSession(request)
            except Exception as e:
                return web.Response(text="Invalid Session: {}".format(e), status=401)
            res.extend(getRequiredAuthForConfig(
                availableRefs,
                getTracConfig(),
                "TracUrl",
                "Please enter your {CredentialType} authentication data to sync with Trac!"
            ))
        elif "publishChanges" == req['actionId']:
            try:
                unused_session, unused_workingDir = validateSession(request)
            except Exception as e:
                return web.Response(text="Invalid Session: {}".format(e), status=401)
            res.extend(getRequiredAuthForConfig(
                availableRefs,
                getGitRepoConfig(),
                "RepoUrl",
                "Please enter your {CredentialType} authentication data to publish changes to GIT!"
            ))
        return web.json_response(res)
    except Exception as e:
        return web.Response(text="Illegal Arguments Provided: {}".format(e), status=400)


def getRequiredAuthForConfig(availableRefs, config, urlKey, defaultHint):
    url  = config.get(urlKey)
    credType = config.get("CredentialType", "").upper()
    credHint = config.get("CredentialHint", defaultHint).format(
                CredentialType=credType, RepoUrl=url, TracUrl=url)
    if url and len(credType) > 0 and not credType in availableRefs:
        return [common_interfaces.AuthType(credType, credHint)]
    return []


async def handle_login(request):
    logger.info("handling 'login'")

    config, repoUrl, branch, credType, useAuthentication = None, None, None, None, None
    try:
        config = getGitRepoConfig(required=True)
        repoUrl = config["RepoUrl"]
        branch = config.get("Branch") or "master"
        credType = config.get("CredentialType", "").upper()
        useAuthentication = len(credType) > 0
    except Exception as e:
        return web.Response(text="Invalid Configuration: {}".format(e), status=500)

    user, password, ssId = "", "", None
    try:
        if useAuthentication:
            (user, password, ssId) = common_app_server.get_credentials(request, credType)
    except Exception as e:
        return web.Response(text="Illegal Arguments Provided: {}".format(e), status=400)

    res = []
    session = None
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            tmpDir = tempfile.mkdtemp()
            logger.debug("Cloning '{}' to '{}'".format(repoUrl, tmpDir))
            repo = git.Repo.init(tmpDir)
            repo.create_remote("origin", url=repoUrl)
            if useAuthentication:
                configureGitCredentialHelper(repo, repoUrl, user, password)
            repo.git.fetch("origin", branch)
            repo.git.checkout(branch)
            logger.info("Successfully cloned {} to a (temporary) local working directory, branch '{}'.".format(repoUrl, branch))
            session = createSession(tmpDir)
            session["RepoUrl"] = repoUrl
            session["Branch"] = branch
        except (Exception, GitCommandError) as e:
            logger.error(str(e))
            common_app_server.invalidate_credentials(ssId)
        res = logs.toBackendLogEntryList()
    response = web.json_response(res)
    emitOrCleanSessionCookie(response, session)
    return response


async def handle_logout(request):
    try:
        session, unused_workingDir = validateSession(request)
        common_app_server.expire_session(session)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)
    return web.json_response([])


async def handle_latest_published_change(request):
    workingDir = None
    try:
        unused_session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    repo = git.Repo(workingDir)
    tracking = repo.head.ref.tracking_branch()
    if tracking:
        res = common_interfaces.VersionedChange(tracking.commit, True)
        return web.json_response(res)
    return web.json_response(None)


async def handle_list_changes(request):
    session, workingDir = None, None
    try:
        session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    res = []
    repo = git.Repo(workingDir)
    published = getPublishedCommits(repo, session)
    count = MAX_GIT_LIST_CHANGES
    c = repo.head.commit
    while c and count > 0:
        res.append(common_interfaces.VersionedChange(c, c.hexsha in published))
        c = c.parents[0] if len(c.parents) > 0 else None
        count-=1
    return web.json_response(res)


def getPublishedCommits(repo, session):
    publishedCommitsLastHead = session.get("publishedCommitsLastHead")
    publishedCommitsCache = session.get("publishedCommitsCache", set())
    commits = set()
    remote = repo.head.ref.tracking_branch()
    if not remote or not remote.commit:
        return commits
    if remote.commit.hexsha == publishedCommitsLastHead:
        return publishedCommitsCache
    c = remote.commit if remote else None
    while c:
        commits.add(c.hexsha)
        c = c.parents[0] if len(c.parents) > 0 else None
    session['publishedCommitsCache'] = commits
    session['publishedCommitsLastHead'] = remote.commit.hexsha
    return commits


async def handle_undo_last_change(request):
    workingDir = None
    try:
        unused_session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    logger.info("handling 'Undo last Change'")
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(workingDir)
            ensure_clean_git_repo(repo)
            repo.git.reset('--hard', "HEAD^1")
            logger.info("Undoing last Change was successfull")
        except GitCommandError as e:
            logger.error("Undoing last Change failed:\n{}".format(e))
        except GitNotCleanException as e:
            logger.error(e)
        finally:
            res = logs.toBackendLogEntryList()
    return web.json_response(res)


async def handle_publish_changes(request):
    workingDir = None
    try:
        unused_session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    logger.info("handling 'Publish Changes'")

    repoUrl, credType, useAuthentication = None, None, None
    try:
        config = getGitRepoConfig(required=True)
        repoUrl = config["RepoUrl"]
        credType = config.get("CredentialType", "").upper()
        useAuthentication = len(credType) > 0
    except Exception as e:
        return web.Response(text="Invalid Configuration: {}".format(e), status=500)

    user, password, ssId = "", "", None
    try:
        if useAuthentication:
            (user, password, ssId) = common_app_server.get_credentials(request, credType)
    except Exception as e:
        return web.Response(text="Illegal Arguments Provided: {}".format(e), status=400)

    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(workingDir)
            if useAuthentication:
                configureGitCredentialHelper(repo, repoUrl, user, password)
            repo.git.push()
            logger.info("Successfully published Changes")
        except (Exception, GitCommandError) as e:
            logger.error("Publishing Changes failed:\n{}".format(e))
            common_app_server.invalidate_credentials(ssId)
        res = logs.toBackendLogEntryList()
    return web.json_response(res)


async def handle_mark_for_status(request):
    workingDir = None
    try:
        unused_session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    status = BundleStatus.getByName(request.rel_url.query['status'])
    ids = json.loads(request.rel_url.query['bundles'])
    logger.info("mark for status: {} --> {}".format(ids, status))
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(workingDir)
            ensure_clean_git_repo(repo)
            bundles = await parseBundlesAsync(tpe, workingDir=workingDir)
            await markBundlesForStatusAsync(tpe, bundles, set(ids), status, force=True, checkOwnSuite=False, workingDir=workingDir)
            msg = "MARKED for status '{}'\n\n - {}".format(status, "\n - ".join(sorted(ids)))
            if len(ids) == 1:
              msg = "MARKED {} for status '{}'".format("".join(ids), status)
            git_commit(repo, [BUNDLES_LIST_FILE], msg)
        except GitNotCleanException as e:
            logger.error(e)
        finally:
            res = logs.toBackendLogEntryList()
    return web.json_response(res)


async def handle_set_target(request):
    workingDir = None
    try:
        unused_session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    target = request.rel_url.query['target']
    ids = json.loads(request.rel_url.query['bundles'])
    logger.info("mark for target: {} --> {}".format(ids, target))
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(workingDir)
            ensure_clean_git_repo(repo)
            bundles = await parseBundlesAsync(tpe, await getBundleRepoSuitesAsync(tpe, ids, workingDir=workingDir), workingDir=workingDir)
            markBundlesForTarget(bundles, set(ids), target, workingDir)
            msg = "MARKED for target '{}'\n\n - {}".format(target, "\n - ".join(sorted(ids)))
            if len(ids) == 1:
              msg = "MARKED {} for target '{}'".format("".join(ids), target)
            git_commit(repo, [BUNDLES_LIST_FILE], msg)
        except GitNotCleanException as e:
            logger.error(e)
        finally:
            res = logs.toBackendLogEntryList()
    return web.json_response(res)


async def handle_update_bundles(request):
    workingDir = None
    try:
        unused_session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    logger.info("handling 'Update Bundles'")
    config = getTracConfig()
    tracUrl  = config.get("TracUrl")
    credType = config.get("CredentialType", "").upper()
    useAuthentication = len(credType) > 0
    user, password, ssId = "", "", None
    try:
        if useAuthentication:
            (user, password, ssId) = common_app_server.get_credentials(request, credType)
    except Exception as e:
        '''Credentials are not mandatory for update_bundles - so just pass'''
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(workingDir)
            ensure_clean_git_repo(repo)
            tracApi = None
            try:
                if useAuthentication and user and len(user) > 0 and password and len(password) > 0:
                    tracApi = trac_api.TracApi(tracUrl, user, password)
                else:
                    logger.warn("Skipping synchronisation with trac as there are no/empty credentials specified.")
                    common_app_server.invalidate_credentials(ssId)
            except KeyError as e:
                logger.warn("Missing Key {} in config file '{}' --> no synchronization with trac will be done!".format(e, config['__file__']))
            updateBundles(tracApi, workingDir=workingDir)
            git_commit(repo, [BUNDLES_LIST_FILE], "UPDATED {}".format(BUNDLES_LIST_FILE))
        except GitNotCleanException as e:
            logger.error(e)
        except Exception as e:
            common_app_server.invalidate_credentials(ssId)
            logger.error(e)
        finally:
            res = logs.toBackendLogEntryList()
    return web.json_response(res)


async def handle_get_managed_bundles(request):
    workingDir = None
    try:
        unused_session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    # faster (doesn't need to query apt-repos and resolve info file)
    logger.debug("handle_get_managed_bundles called")
    res = list()
    bundles = await parseBundlesAsync(tpe, workingDir=workingDir)
    tracUrl = getTracConfig().get('TracUrl')
    for (unused_id, bundle) in sorted(bundles.items()):
        res.append(common_interfaces.ManagedBundle(bundle, tracBaseUrl = tracUrl))
    logger.debug("handle_get_managed_bundles finished")
    return web.json_response(res)


async def handle_get_managed_bundle_infos(request):
    workingDir = None
    try:
        unused_session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    # slower (as it needs to resolve info files)
    logger.debug("handle_get_managed_bundle_infos called")
    ids = common_interfaces.BundleIDs_validate(json.loads(request.rel_url.query['bundles']))
    bundles = await parseBundlesAsync(tpe, await getBundleRepoSuitesAsync(tpe, ids, workingDir=workingDir), workingDir=workingDir)
    tracUrl = getTracConfig().get('TracUrl')
    futures = [ asyncio.wrap_future(tpe.submit(common_interfaces.ManagedBundleInfo, bundle, tracBaseUrl = tracUrl))
                for bundle in bundles.values() ]
    (done, _) = await asyncio.wait(futures, return_when=asyncio.ALL_COMPLETED)
    res = [await f for f in done]
    logger.debug("handle_get_managed_bundle_infos finished")
    return web.json_response(res)


async def handle_get_configured_stages(request):
    workingDir = None
    try:
        unused_session, workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    res = list()
    for stage in sorted(BundleStatus.getAvailableStages()):
        targets = getTargetRepoSuites(stage, workingDir=workingDir)
        if len(targets) > 0:
            res.append(stage)
    return web.json_response(res)


async def handle_get_configured_targets(request):
    try:
        unused_session, unused_workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    # TODO: read this config from some config files
    res = [
        common_interfaces.TargetDescription('standard', 'Standard (PLUS)'),
        common_interfaces.TargetDescription('unattended', 'Unattended Security')
    ]
    return web.json_response(res)


async def handle_get_workflow_metadata(request):
    try:
        unused_session, _workingDir = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    res = list()
    for status in sorted(BundleStatus):
        res.append(common_interfaces.WorkflowMetadata(status))
    return web.json_response(res)


async def handle_validate_session(request):
    try:
        session, unused_workingDir = validateSession(request)
        return web.json_response(common_interfaces.SessionInfo(session['RepoUrl'], session['Branch']))
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)


async def handle_router_link(request):
    '''
        pass router-links to angular' main entry page so that
        they are handled by angulars router module
    '''
    return web.FileResponse(os.path.join(APP_DIST, 'index.html'))


def configureGitCredentialHelper(repo, repoUrl, user, password, timeout=5):
    if repo and repo.remotes.origin.url != repoUrl:
        raise Exception("The configured RepoUrl {} doesn't match the current origin {}".format(repoUrl, repo.remotes.origin.url))
    url = urlparse(repoUrl)
    repo.git.config("credential.helper", "cache --timeout={}".format(timeout))
    proc = subprocess.Popen(["git", "credential", "approve"], stdin=subprocess.PIPE, cwd=repo.git_dir)
    git_cred = "protocol={}\nhost={}\nusername={}\npassword={}\n".format(url.scheme, url.netloc, user, password)
    proc.stdin.write(git_cred.encode('utf-8'))
    proc.stdin.close()


def emitOrCleanSessionCookie(response, session):
    if session:
        response.cookies['sessionId'] = session['id']
    else:
        if 'sessionId' in response.cookies:
            del response.cookies['sessionId']


def validateSession(request):
    sid = request.cookies['sessionId']
    session = common_app_server.get_session(sid)
    if not session:
        raise Exception("Invalid Session")
    workingDir = session.get('workingDir')
    if not workingDir or not os.path.exists(workingDir):
        raise Exception("Session has no working directory")
    return session, workingDir


def createSession(workingDir):
    session = common_app_server.create_session(sessionExpired)
    session['workingDir'] = workingDir
    return session


def sessionExpired(session):
    workingDir = session.get('workingDir')
    # checking existence of ".apt-repos" to not incidentely remove a wrong folder
    if workingDir and os.path.exists(workingDir) and os.path.exists(os.path.join(workingDir, ".apt-repos")):
        try:
            shutil.rmtree(workingDir)
        except OSError as e:
            logger.warn("Could not remove {}: {}".format(workingDir, e))


def registerRoutes(args, app):
    app.router.add_routes([
        # api routes
        web.get('/api/workflowMetadata', handle_get_workflow_metadata),
        web.get('/api/configuredStages', handle_get_configured_stages),
        web.get('/api/configuredTargets', handle_get_configured_targets),
        web.get('/api/managedBundles', handle_get_managed_bundles),
        web.get('/api/managedBundleInfos', handle_get_managed_bundle_infos),
        web.get('/api/updateBundles', handle_update_bundles),
        web.get('/api/markForStatus', handle_mark_for_status),
        web.get('/api/setTarget', handle_set_target),
        web.get('/api/listChanges', handle_list_changes),
        web.get('/api/latestPublishedChange', handle_latest_published_change),
        web.get('/api/undoLastChange', handle_undo_last_change),
        web.get('/api/publishChanges', handle_publish_changes),
        web.get('/api/requiredAuth', handle_required_auth),
        web.get('/api/validateSession', handle_validate_session),
        web.get('/api/login', handle_login),
        web.get('/api/logout', handle_logout),
    ])
    if not args.no_static_files:
        app.router.add_routes([
            # angular router-links
            web.get('/', handle_router_link),
            web.get('/login-page{tail:.*}', handle_router_link),
            web.get('/workflow-status-editor', handle_router_link),
            web.get('/workflow-status-editor/{tail:.*}', handle_router_link),
            web.get('/managed-bundle/{tail:.*}', handle_router_link),
        ])


if __name__ == "__main__":
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            tpe = executor
            common_app_server.mainLoop(
                progname = progname,
                description =  __doc__,
                registerRoutes = registerRoutes,
                serveDistPath = APP_DIST,
                port = 4255
            )
    except KeyboardInterrupt as e:
        logger.info("Stopping due to keyboard interrupt.")
        sys.exit(1)
