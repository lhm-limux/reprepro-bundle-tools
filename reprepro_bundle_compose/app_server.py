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
from aiohttp import web
import git
import reprepro_bundle_compose
from reprepro_bundle_compose import PROJECT_DIR, BUNDLES_LIST_FILE, BundleStatus, getTargetRepoSuites, getBundleRepoSuites, parseBundles, updateBundles, trac_api, getTracConfig, markBundlesForStatus, markBundlesForTarget, git_commit, ensure_clean_git_repo, GitNotCleanException
from reprepro_bundle_appserver import common_app_server, common_interfaces


progname = "bundle-compose-app"
logger = logging.getLogger("reprepro_bundle_appserver.bundle_compose_app")

APP_DIST = './ng-bundle-compose/'
if not os.path.exists(APP_DIST):
    APP_DIST = "/usr/lib/reprepro-bundle-apps/ng-bundle-compose/"

MAX_GIT_LIST_CHANGES = 200
publishedCommitsCache = set()
publishedCommitsLastHead = None


async def handle_required_auth(request):
    res = list()
    try:
        req = common_interfaces.AuthRequired_validate(json.loads(request.rel_url.query['authRequired']))
        availableRefs = set()
        for authRef in req['refs']:
            if common_app_server.is_valid_authRef(authRef):
                availableRefs.add(authRef['authId'])
        if "publishChanges" == req['actionId']:
            '''if not "ldap" in availableRefs:
                res.append(common_interfaces.AuthType("ldap", "Required to publish changes into the shared GIT-Repository"))'''
        elif "bundleSync" == req['actionId']:
            if not "ldap" in availableRefs:
                res.append(common_interfaces.AuthType("ldap", "Required for the synchronization with the Ticket system. Leave empty to skip trac-synchronisation."))
                # res.append(common_interfaces.AuthType("ldap", "Required for the shared GIT-Repository recieve the latest status"))
            # if not "ldapAdmin" in availableRefs:
            #    res.append(common_interfaces.AuthType("ldapAdmin", "Required to create FAI-Classes for new bundles"))
        return web.json_response(res)
    except Exception as e:
        return web.Response(text="IllegalArgumentsProvided:{}".format(e), status=400)


async def handle_latest_published_change(request):
    repo = git.Repo(PROJECT_DIR)
    tracking = repo.head.ref.tracking_branch()
    if tracking:
        res = common_interfaces.VersionedChange(tracking.commit, True)
        return web.json_response(res)
    return web.json_response(None)


async def handle_list_changes(request):
    res = []
    repo = git.Repo(PROJECT_DIR)
    published = getPublishedCommits(repo)
    count = MAX_GIT_LIST_CHANGES
    c = repo.head.commit
    while c and count > 0:
        res.append(common_interfaces.VersionedChange(c, c.hexsha in published))
        c = c.parents[0] if len(c.parents) > 0 else None
        count-=1
    return web.json_response(res)


def getPublishedCommits(repo):
    global publishedCommitsLastHead
    global publishedCommitsCache
    commits = set()
    remote = repo.head.ref.tracking_branch()
    if publishedCommitsLastHead == remote.commit.hexsha:
        return publishedCommitsCache
    c = remote.commit if remote else None
    while c:
        commits.add(c.hexsha)
        c = c.parents[0] if len(c.parents) > 0 else None
    publishedCommitsCache = commits
    publishedCommitsLastHead = remote.commit.hexsha
    return commits


async def handle_undo_last_change(request):
    logger.info("handling 'Undo last Change'")
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(PROJECT_DIR)
            ensure_clean_git_repo(repo)
            repo.git.reset('--hard', "HEAD^1")
            logger.info("Undoing last Change was successfull")
        except git.exc.GitCommandError as e:
            logger.error("Undoing last Change failed:\n{}".format(e))
        except GitNotCleanException as e:
            logger.error(e)
        finally:
            res = logs.toBackendLogEntryList()
    return web.json_response(res)


async def handle_publish_changes(request):
    logger.info("handling 'Publish Changes'")
    res = ["default"]
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(PROJECT_DIR)
            repo.git.push()
            logger.info("Successfully published Changes")
        except git.exc.GitCommandError as e:
            logger.error("Publishing Changes failed:\n{}".format(e))
        res = logs.toBackendLogEntryList()
    return web.json_response(res)


async def handle_mark_for_status(request):
    status = BundleStatus.getByName(request.rel_url.query['status'])
    ids = json.loads(request.rel_url.query['bundles'])
    logger.info("mark for status: {} --> {}".format(ids, status))
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(PROJECT_DIR)
            ensure_clean_git_repo(repo)
            bundles = parseBundles(getBundleRepoSuites())
            markBundlesForStatus(bundles, set(ids), status, True)
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
    target = request.rel_url.query['target']
    ids = json.loads(request.rel_url.query['bundles'])
    logger.info("mark for target: {} --> {}".format(ids, target))
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(PROJECT_DIR)
            ensure_clean_git_repo(repo)
            bundles = parseBundles(getBundleRepoSuites())
            markBundlesForTarget(bundles, set(ids), target)
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
    user, password, ssId = "", "", None
    try:
        (user, password, ssId) = common_app_server.get_credentials(request, 'ldap')
    except Exception as e:
        return web.Response(text="IllegalArgumentsProvided:{}".format(e), status=400)
    logger.info("handling 'Update Bundles'")
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        try:
            repo = git.Repo(PROJECT_DIR)
            ensure_clean_git_repo(repo)
            tracApi = None
            try:
                if user and len(user) > 0 and password and len(password) > 0:
                    config = getTracConfig()
                    tracApi = trac_api.TracApi(config['TracUrl'], user, password)
                else:
                    logger.warn("Skipping synchronisation with trac as there are no/empty credentials specified.")
                    common_app_server.invalidate_credentials(ssId)
            except KeyError as e:
                logger.warn("Missing Key {} in config file '{}' --> no synchronization with trac will be done!".format(e, config['__file__']))
            updateBundles(tracApi)
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
    # faster (doesn't need to resolve info file)
    res = list()
    bundles = parseBundles(getBundleRepoSuites())
    for (unused_id, bundle) in sorted(bundles.items()):
        res.append(common_interfaces.ManagedBundle(bundle, **{'tracBaseUrl': getTracConfig().get('TracUrl')}))
    return web.json_response(res)


async def handle_get_managed_bundle_infos(request):
    # slower (as it needs to resolve info files)
    res = list()
    bundles = parseBundles(getBundleRepoSuites())
    for (unused_id, bundle) in sorted(bundles.items()):
        res.append(common_interfaces.ManagedBundleInfo(bundle, **{'tracBaseUrl': getTracConfig().get('TracUrl')}))
    return web.json_response(res)


async def handle_get_configured_stages(request):
    res = list()
    for stage in sorted(BundleStatus.getAvailableStages()):
        targets = getTargetRepoSuites(stage)
        if len(targets) > 0:
            res.append(stage)
    return web.json_response(res)

async def handle_get_configured_targets(request):
    # TODO: read this config from some config files
    res = [
        common_interfaces.TargetDescription('plus', 'Standard (PLUS)'),
        common_interfaces.TargetDescription('unattended', 'Unattended Security')
    ]
    return web.json_response(res)


async def handle_get_workflow_metadata(request):
    res = list()
    for status in sorted(BundleStatus):
        res.append(common_interfaces.WorkflowMetadata(status))
    return web.json_response(res)


async def handle_router_link(request):
    '''
        pass router-links to angular' main entry page so that
        they are handled by angulars router module
    '''
    return web.FileResponse(os.path.join(APP_DIST, 'index.html'))


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
    ])
    if not args.no_static_files:
        app.router.add_routes([
            # angular router-links
            web.get('/', handle_router_link),
            web.get('/workflow-status-editor', handle_router_link),
            web.get('/workflow-status-editor/{tail:.*}', handle_router_link),
            web.get('/managed-bundle/{tail:.*}', handle_router_link),
        ])


if __name__ == "__main__":
    common_app_server.mainLoop(**{
        'progname': progname,
        'description': __doc__,
        'registerRoutes': registerRoutes,
        'serveDistPath': APP_DIST,
        'port': 4255
    })
