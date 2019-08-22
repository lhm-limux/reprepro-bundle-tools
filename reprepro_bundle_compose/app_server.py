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
import apt_repos
from urllib.parse import urlparse
import reprepro_bundle_compose
from reprepro_bundle_compose import \
        BUNDLES_LIST_FILE, BundleStatus, getTargetRepoSuites, \
        getBundleRepoSuites, parseBundles, trac_api, \
        getTracConfig, getGitRepoConfig, git_commit, \
        ensure_clean_git_repo, GitNotCleanException
from reprepro_bundle_appserver import common_app_server, common_interfaces
from apt_repos import RepoSuite, PackageField, QueryResult


progname = "bundle-compose-app"
logger = logging.getLogger("reprepro_bundle_appserver.bundle_compose_app")

APP_DIST = './ng-bundle-compose/'
if not os.path.exists(APP_DIST):
    APP_DIST = "/usr/lib/reprepro-bundle-apps/ng-bundle-compose/"

PROJECT_DIR = os.getcwd()
local_apt_repos = os.path.join(PROJECT_DIR, "apt-repos")
if os.path.isdir(local_apt_repos):
    sys.path.insert(0, local_apt_repos)
import apt_repos

MAX_GIT_LIST_CHANGES = 200
publishedCommitsCache = set()
publishedCommitsLastHead = None

ppe = None # ProcessPoolExecutor set in main

async def handle_get_suites(request):
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)
    searchString = json.loads(request.rel_url.query['suiteTag'])
    logger.info("Handling get_suites(suiteTag='{}')".format(searchString))
    res = await asyncio.wrap_future(ppe.submit(apt_repos_get_suites, [searchString], cwd = cwd))
    logger.debug("Handling get_suites finished")
    return web.json_response(res)

def apt_repos_get_suites(suiteSelectors, cwd=PROJECT_DIR):
    res = []
    apt_repos.setAptReposBaseDir(os.path.join(cwd, ".apt-repos"))
    for suite in sorted(apt_repos.getSuites(suiteSelectors)):
        res.append(common_interfaces.Suite(suite))
    return res

async def handle_get_custom_packages(request):
    res = []
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)
    searchStringSuites = json.loads(request.rel_url.query['suiteTag'])
    searchStringPackages = json.loads(request.rel_url.query['searchString'])
    logger.info("Handling get_custom_packages(suiteTag='{}', searchString='{}')".format(searchStringSuites, searchStringPackages))
    res = await asyncio.wrap_future(ppe.submit(apt_repos_query_packages, [searchStringSuites], [searchStringPackages], cwd = cwd))
    logger.debug("Mark for target finished")
    return web.json_response(res)

def apt_repos_query_packages(suiteSelectors, searchStrings, cwd = PROJECT_DIR):
    apt_repos.setAptReposBaseDir(os.path.join(cwd, ".apt-repos"))
    requestFields = PackageField.getByFieldsString("pvsaSC")
    packages = []
    for suite in sorted(apt_repos.getSuites(suiteSelectors)):
        suite.scan(True)
        packages.extend(suite.queryPackages(searchStrings, True, None, None, requestFields))
    res = []
    for package in sorted(packages):
        (packageName, version, packageSuite, architecture, section, source) = package.getData()
        res.append(common_interfaces.Package(packageName, version, packageSuite, architecture, section, source))
    return res

async def handle_required_auth(request):
    res = list()
    try:
        req = common_interfaces.AuthRequired_validate(json.loads(request.rel_url.query['authRequired']))
        availableRefs = set()
        for authRef in req['refs']:
            if common_app_server.is_valid_authRef(authRef):
                availableRefs.add(authRef['authId'])
        actionId = req['actionId']
        logger.debug("handle_required_auth for actionId '{}'".format(actionId))
        if actionId == "login":
            res.extend(getRequiredAuthForConfig(
                availableRefs,
                getGitRepoConfig(),
                "RepoUrl",
                "Please enter your {CredentialType} authentication data in order to clone the GIT Reposiory!"
            ))
        elif actionId == "bundleSync":
            cwd = None
            try:
                unused_session, cwd = validateSession(request)
            except Exception as e:
                return web.Response(text="Invalid Session: {}".format(e), status=401)
            res.extend(getRequiredAuthForConfig(
                availableRefs,
                getTracConfig(cwd=cwd),
                "TracUrl",
                "Please enter your {CredentialType} authentication data to sync with Trac!"
            ))
        elif actionId == "gitPullRebase":
            cwd = None
            try:
                unused_session, cwd = validateSession(request)
            except Exception as e:
                return web.Response(text="Invalid Session: {}".format(e), status=401)
            res.extend(getRequiredAuthForConfig(
                availableRefs,
                getGitRepoConfig(cwd=cwd),
                "RepoUrl",
                "Please enter your {CredentialType} authentication data to pull changes from the Git-Server!"
            ))
        elif actionId == "publishChanges":
            try:
                unused_session, cwd = validateSession(request)
            except Exception as e:
                return web.Response(text="Invalid Session: {}".format(e), status=401)
            res.extend(getRequiredAuthForConfig(
                availableRefs,
                getGitRepoConfig(cwd=cwd),
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
    logger.info("Handling 'login'")

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
            await asyncio.wrap_future(ppe.submit(git_clone_repository, repoUrl, branch, tmpDir, useAuthentication, user, password))
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


def git_clone_repository(repoUrl, branch, tmpDir, useAuthentication, user, password):
    repo = git.Repo.init(tmpDir)
    repo.create_remote("origin", url=repoUrl)
    if useAuthentication:
        configureGitCredentialHelper(repo, repoUrl, user, password)
    repo.git.fetch("origin", branch)
    repo.git.checkout(branch)


async def handle_logout(request):
    try:
        session, unused_cwd = validateSession(request)
        common_app_server.expire_session(session)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)
    return web.json_response([])


async def handle_latest_published_change(request):
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    repo = git.Repo(cwd)
    tracking = repo.head.ref.tracking_branch()
    if tracking:
        res = common_interfaces.VersionedChange(tracking.commit, True)
        return web.json_response(res)
    return web.json_response(None)


async def handle_list_changes(request):
    session, cwd = None, None
    try:
        session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)
    repo = git.Repo(cwd)
    published = getPublishedCommits(repo, session)
    logger.debug("Handling 'List Changes'")
    res = await asyncio.wrap_future(ppe.submit(list_changes, published, cwd))
    logger.debug("Handling 'List Changes' finished")
    return web.json_response(res)


def list_changes(publishedCommits, cwd):
    res = []
    count = MAX_GIT_LIST_CHANGES
    repo = git.Repo(cwd)
    c = repo.head.commit
    while c and count > 0:
        res.append(common_interfaces.VersionedChange(c, c.hexsha in publishedCommits))
        c = c.parents[0] if len(c.parents) > 0 else None
        count-=1
    return res


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
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    logger.info("Handling 'Undo last Change'")
    res = await asyncio.wrap_future(ppe.submit(undo_last_change, cwd))
    logger.debug("Handling 'Undo last Change' finished")
    return web.json_response(res)


def undo_last_change(cwd):
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(cwd)
            ensure_clean_git_repo(repo)
            repo.git.reset('--hard', "HEAD^1")
            logger.info("Undoing last Change was successfull")
        except GitCommandError as e:
            logger.error("Undoing last Change failed:\n{}".format(e))
        except GitNotCleanException as e:
            logger.error(e)
        finally:
            res = logs.toBackendLogEntryList()
    return res


async def handle_publish_changes(request):
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    repoUrl, credType, useAuthentication = None, None, None
    try:
        config = getGitRepoConfig(required=True, cwd=cwd)
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
    logger.info("Handling 'Publish Changes'")
    res, auth_ok = await asyncio.wrap_future(ppe.submit(publish_changes, repoUrl, useAuthentication, user, password, cwd))
    if not auth_ok:
        common_app_server.invalidate_credentials(ssId)
    logger.debug("Handling 'Publish Changes' finished")
    return web.json_response(res)


def publish_changes(repoUrl, useAuthentication, user, password, cwd):
    res = []
    auth_ok = True
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(cwd)
            if useAuthentication:
                configureGitCredentialHelper(repo, repoUrl, user, password)
            repo.git.push()
            logger.info("Successfully published Changes")
        except (Exception, GitCommandError) as e:
            logger.error("Publishing Changes failed:\n{}".format(e))
            auth_ok = False
        res = logs.toBackendLogEntryList()
    return res, auth_ok


async def handle_mark_for_status(request):
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    status = BundleStatus.getByName(request.rel_url.query['status'])
    ids = json.loads(request.rel_url.query['bundles'])
    logger.info("Mark for status: {} --> {}".format(ids, status))
    res = await asyncio.wrap_future(ppe.submit(mark_bundles_for_status, ids, status, cwd))
    logger.debug("Mark for status finished")
    return web.json_response(res)


def mark_bundles_for_status(bundleIds, status, cwd):
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(cwd)
            ensure_clean_git_repo(repo)
            bundles = parseBundles(cwd=cwd)
            reprepro_bundle_compose.markBundlesForStatus(bundles, bundleIds, status, force=True, checkOwnSuite=False, cwd=cwd)
            msg = "MARKED for status '{}'\n\n - {}".format(status, "\n - ".join(sorted(bundleIds)))
            if len(bundleIds) == 1:
                msg = "MARKED {} for status '{}'".format("".join(bundleIds), status)
            git_commit(repo, [BUNDLES_LIST_FILE], msg)
        except GitNotCleanException as e:
            logger.error(e)
        finally:
            res = logs.toBackendLogEntryList()
    return res


async def handle_set_target(request):
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    target = request.rel_url.query['target']
    ids = json.loads(request.rel_url.query['bundles'])
    ignoreTargetFromInfoFile=request.rel_url.query.get('ignoreTargetFromInfoFile')
    if ignoreTargetFromInfoFile:
        ignoreTargetFromInfoFile = (ignoreTargetFromInfoFile.lower() == "true")
    logger.info("Mark for target: {} --> {}".format(ids, target))
    res = await asyncio.wrap_future(ppe.submit(mark_bundles_for_target, set(ids), target, ignoreTargetFromInfoFile, cwd))
    logger.debug("Mark for target finished")
    return web.json_response(res)


def mark_bundles_for_target(bundleIds, target, ignoreTargetFromInfoFile, cwd):
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(cwd)
            ensure_clean_git_repo(repo)
            bundles = parseBundles(getBundleRepoSuites(bundleIds, cwd=cwd), cwd=cwd)
            reprepro_bundle_compose.markBundlesForTarget(bundles, bundleIds, target, cwd, ignoreTargetFromInfoFile)
            msg = "MARKED for target '{}'\n\n - {}".format(target, "\n - ".join(sorted(bundleIds)))
            if len(bundleIds) == 1:
              msg = "MARKED {} for target '{}'".format("".join(bundleIds), target)
            git_commit(repo, [BUNDLES_LIST_FILE], msg)
        except GitNotCleanException as e:
            logger.error(e)
        finally:
            res = logs.toBackendLogEntryList()
    return res


async def handle_git_pull_rebase(request):
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    logger.info("Updating git-repository from the git-server")

    repoUrl, credType, useAuthentication = None, None, None
    try:
        config = getGitRepoConfig(required=True, cwd=cwd)
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
    res, auth_ok = await asyncio.wrap_future(ppe.submit(git_pull_rebase, repoUrl, useAuthentication, user, password, cwd))
    if not auth_ok:
        common_app_server.invalidate_credentials(ssId)
    return web.json_response(res)


def git_pull_rebase(repoUrl, useAuthentication, user, password, cwd):
    res = []
    auth_ok = True
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(cwd)
            if useAuthentication:
                configureGitCredentialHelper(repo, repoUrl, user, password)
            repo.git.fetch()
            try:
                repo.git.rebase()
            except GitCommandError as e:
                repo.git.rebase("--abort")
                return web.Response(text="Rebase is not possible due to merge-conflicts! Please UNDO your local changes and try again!", status=409)
            logger.info("Successfully pulled changes and rebased your repository")
        except (Exception, GitCommandError) as e:
            logger.error("Updating git-repository from the git-server failed:\n{}".format(e))
            auth_ok = False
        res = logs.toBackendLogEntryList()
    return res, auth_ok


async def handle_update_bundles(request):
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    config = getTracConfig(cwd=cwd)
    tracUrl  = config.get("TracUrl")
    credType = config.get("CredentialType", "").upper()
    parentTicketsField = config.get('UseParentTicketsFromInfoField')
    useAuthentication = len(credType) > 0
    user, password, ssId = "", "", None
    try:
        if useAuthentication:
            (user, password, ssId) = common_app_server.get_credentials(request, credType)
    except Exception as e:
        '''Credentials are not mandatory for update_bundles - so just pass'''

    logger.info("Handling 'Update Bundles'")
    res, auth_ok = await asyncio.wrap_future(ppe.submit(update_bundles, useAuthentication, user, password, tracUrl, parentTicketsField, cwd))
    if not auth_ok:
        common_app_server.invalidate_credentials(ssId)
    logger.debug("Handling 'Update Bundles' finished")
    return web.json_response(res)


def update_bundles(useAuthentication, user, password, tracUrl, parentTicketsField, cwd):
    res = []
    auth_ok = True
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(cwd)
            ensure_clean_git_repo(repo)
            tracApi = None
            try:
                if useAuthentication and user and len(user) > 0 and password and len(password) > 0:
                    tracApi = trac_api.TracApi(tracUrl, user, password)
                else:
                    logger.warn("Skipping synchronisation with trac as there are no/empty credentials specified.")
                    auth_ok = False
            except KeyError as e:
                logger.warn("Missing Key {} in local trac configuration --> no synchronization with trac will be done!".format(e))
            reprepro_bundle_compose.updateBundles(tracApi, parentTicketsField=parentTicketsField, cwd=cwd)
            git_commit(repo, [BUNDLES_LIST_FILE], "UPDATED {}".format(BUNDLES_LIST_FILE))
        except GitNotCleanException as e:
            logger.error(e)
        except Exception as e:
            auth_ok = False
            logger.error(e)
        finally:
            res = logs.toBackendLogEntryList()
    return res, auth_ok


async def handle_get_managed_bundles(request):
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    # faster (doesn't need to query apt-repos and resolve info file)
    logger.debug("handle_get_managed_bundles called")
    res = await asyncio.wrap_future(ppe.submit(get_managed_bundles, cwd))
    logger.debug("handle_get_managed_bundles finished")
    return web.json_response(res)


def get_managed_bundles(cwd):
    res = list()
    bundles = parseBundles(cwd=cwd)
    tracUrl = getTracConfig(cwd=cwd).get('TracUrl')
    for (unused_id, bundle) in sorted(bundles.items()):
        res.append(common_interfaces.ManagedBundle(bundle, tracBaseUrl = tracUrl))
    return res


async def handle_get_managed_bundle_infos(request):
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    # slower (as it needs to resolve info files)
    ids = common_interfaces.BundleIDs_validate(json.loads(request.rel_url.query['bundles']))
    logger.debug("handle_get_managed_bundle_infos called, ids='{}'".format("', '".join(ids)))
    res = await asyncio.wrap_future(ppe.submit(get_managed_bundle_infos, set(ids), cwd=cwd))
    logger.debug("handle_get_managed_bundle_infos finished")
    return web.json_response(res)


def get_managed_bundle_infos(bundleIds, cwd):
    repoSuites = getBundleRepoSuites(bundleIds, cwd=cwd)
    bundles = parseBundles(repoSuites, selectIds=[str(s) for s in repoSuites], cwd=cwd)
    tracUrl = getTracConfig(cwd=cwd).get('TracUrl')
    res = [ common_interfaces.ManagedBundleInfo(bundle, tracBaseUrl = tracUrl)
        for bundle in bundles.values() ]
    return res


async def handle_get_configured_stages(request):
    cwd = None
    try:
        unused_session, cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    res = list()
    for stage in sorted(BundleStatus.getAvailableStages()):
        targets = getTargetRepoSuites(stage, cwd=cwd)
        if len(targets) > 0:
            res.append(stage)
    return web.json_response(res)


async def handle_get_configured_targets(request):
    try:
        unused_session, unused_cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    # TODO: read this config from some config files
    res = [
        common_interfaces.TargetDescription('standard', 'Standard (PLUS)'),
        common_interfaces.TargetDescription('unattended', 'Unattended Security (Vortest)'),
        common_interfaces.TargetDescription('unattended-applied', 'Unattended Security (aktiv)')
    ]
    return web.json_response(res)


async def handle_get_workflow_metadata(request):
    try:
        unused_session, _cwd = validateSession(request)
    except Exception as e:
        return web.Response(text="Invalid Session: {}".format(e), status=401)

    res = list()
    for status in sorted(BundleStatus):
        res.append(common_interfaces.WorkflowMetadata(status))
    return web.json_response(res)


async def handle_validate_session(request):
    try:
        session, unused_cwd = validateSession(request)
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
    cwd = session.get('cwd')
    if not cwd or not os.path.exists(cwd):
        raise Exception("Session has no working directory")
    logger.debug("Session info: cwd={}, sid={}".format(cwd, sid))
    return session, cwd


def createSession(cwd):
    session = common_app_server.create_session(sessionExpired)
    session['cwd'] = cwd
    return session


def sessionExpired(session):
    cwd = session.get('cwd')
    # checking existence of ".apt-repos" to not incidentely remove a wrong folder
    if cwd and os.path.exists(cwd) and os.path.exists(os.path.join(cwd, ".apt-repos")):
        try:
            shutil.rmtree(cwd)
        except OSError as e:
            logger.warn("Could not remove {}: {}".format(cwd, e))


def registerRoutes(args, app):
    app.router.add_routes([
        # api routes
        web.get('/api/getSuites', handle_get_suites),
        web.get('/api/getCustomPackages', handle_get_custom_packages),
        web.get('/api/workflowMetadata', handle_get_workflow_metadata),
        web.get('/api/configuredStages', handle_get_configured_stages),
        web.get('/api/configuredTargets', handle_get_configured_targets),
        web.get('/api/managedBundles', handle_get_managed_bundles),
        web.get('/api/managedBundleInfos', handle_get_managed_bundle_infos),
        web.get('/api/gitPullRebase', handle_git_pull_rebase),
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
            web.get('/apt-repos-search', handle_router_link),
            web.get('/apt-repos-search/{tail:.*}', handle_router_link),
            web.get('/workflow-status-editor', handle_router_link),
            web.get('/workflow-status-editor/{tail:.*}', handle_router_link),
            web.get('/managed-bundle/{tail:.*}', handle_router_link),
        ])


if __name__ == "__main__":
    try:
        # We need a ProcessPoolExecutor to run blocking code asynchronously.
        # A ProcessPoolExecutor is required (instead of ThreadPoolExecutor)
        # because apt-repo's suite.scan() uses global scope and only the
        # ProcessPoolExecutor separates these global scopes correctly.
        with concurrent.futures.ProcessPoolExecutor(max_workers=5) as __ppe:
            ppe = __ppe
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
