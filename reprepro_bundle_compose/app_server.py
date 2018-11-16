#!/usr/bin/python3
'''
   This is the starter for the bundle-compose-tool frontend.

   It uses xdg-open to start the web-frontend of the bundle-compose-tool and
   runs the corresponding backend service.
'''

import logging
import os
from reprepro_bundle_compose import trac_api, PROJECT_DIR
from reprepro_bundle_appserver import common_app_server, common_interfaces
from aiohttp import web
from reprepro_bundle_compose.BundleComposeCLI import getTargetRepoSuites, getBundleRepoSuites, parseBundles, getTracConfig, update_bundles, markBundlesForStatus
from reprepro_bundle_compose.bundle_status import BundleStatus
import json


progname = "bundle-compose-app"
logger = logging.getLogger(progname)

APP_DIST = './ng-bundle-compose/'


async def handle_mark_for_status(request):
    res = "ok"
    status = BundleStatus.getByName(request.rel_url.query['status'])
    ids = set(json.loads(request.rel_url.query['bundles']))
    logger.info("mark for status: {} --> {}".format(ids, status))
    bundles = parseBundles(getBundleRepoSuites())
    markBundlesForStatus(bundles, ids, status, True)
    return web.json_response(res)

async def handle_update_bundles(request):
    res = "ok"
    logger.info("update bundles called")
    update_bundles()
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
    app.add_routes([
        # api routes
        web.get('/api/workflowMetadata', handle_get_workflow_metadata),
        web.get('/api/configuredStages', handle_get_configured_stages),
        web.get('/api/managedBundles', handle_get_managed_bundles),
        web.get('/api/managedBundleInfos', handle_get_managed_bundle_infos),
        web.get('/api/updateBundles', handle_update_bundles),
        web.get('/api/markForStatus', handle_mark_for_status),
    ])
    if not args.no_static_files:
        app.add_routes([
            # angular router-links
            web.get('/', handle_router_link),
            web.get('/workflow-status-editor', handle_router_link),
            web.get('/workflow-status-editor/{tail:.*}', handle_router_link),
            #web.get('/bundle/{tail:.*}', handle_router_link),
        ])


if __name__ == "__main__":
    common_app_server.mainLoop(**{
        'progname': progname,
        'description': __doc__,
        'registerRoutes': registerRoutes,
        'serveDistPath': APP_DIST,
        'port': 4255
    })
