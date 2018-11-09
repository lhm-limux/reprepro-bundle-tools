#!/usr/bin/python3
'''
   This is the starter for the bundle-compose-tool frontend.

   It uses xdg-open to start the web-frontend of the bundle-compose-tool and
   runs the corresponding backend service.
'''

import logging
import os
from reprepro_bundle_compose import trac_api, PROJECT_DIR
from reprepro_bundle_appserver import common_app_server
from aiohttp import web
from reprepro_bundle_compose.BundleComposeCLI import getTargetRepoSuites
from reprepro_bundle_compose.bundle_status import BundleStatus

progname = "bundle-compose-app"
logger = logging.getLogger(progname)

APP_DIST = './ng-bundle-compose/'


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
        res.append({
            'ord': status.value.get('ord'),
            'name': status.name,
            'comment': status.value.get('comment'),
            'repoSuiteTag': status.value.get('repoSuiteTag'),
            'tracStatus': status.value.get('tracStatus'),
            'stage': status.value.get('stage'),
            'override': status.value.get('override'),
            'tracResolution': status.value.get('tracResolution'),
            'candidates': status.value.get('candidates')
        })
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
