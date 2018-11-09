#!/usr/bin/python3
'''
   This is the starter for the bundle-tool frontend.

   It uses xdg-open to start the web-frontend of the bundle-tool and
   runs the corresponding backend service.
'''

import logging
import os
from reprepro_bundle_appserver import common_app_server
from aiohttp import web
from reprepro_bundle.BundleCLI import scanBundles, multilineToString

progname = "bundle-app"
logger = logging.getLogger(progname)

APP_DIST = './ng-bundle/'


async def handle_get_bundleList(request):
    res = list()
    for bundle in sorted(scanBundles()):
        res.append(bundleJson(bundle))
    return web.json_response(res)


async def handle_get_metadata(request):
    for bundle in sorted(scanBundles()):
        if bundle.bundleName == request.rel_url.query['bundlename']:
            rnParts = multilineToString(bundle.getInfoTag("Releasenotes", "")).split("\n", 2)
            meta = {
                'bundle': bundleJson(bundle),
                'basedOn': bundle.getInfoTag("BasedOn"),
                'releasenotes': rnParts[2] if (len(rnParts) == 3) else "",
            }
            return web.json_response(meta)
    return web.Response(text="error")


def bundleJson(bundle):
    return {
        'name': bundle.bundleName,
        'distribution': bundle.bundleName.split("/", 1)[0],
        'target': bundle.getInfoTag("Target", "no-target"),
        'subject': bundle.getInfoTag("Releasenotes", "--no-subject--").split("\n", 1)[0],
        'readonly': not bundle.isEditable(),
        'creator': bundle.getInfoTag("Creator", "unknown")
    }


async def handle_router_link(request):
    '''
        pass router-links to angular' main entry page so that
        they are handled by angulars router module
    '''
    return web.FileResponse(os.path.join(APP_DIST, 'index.html'))


def registerRoutes(args, app):
    app.add_routes([
        # api routes
        web.get('/api/bundleList', handle_get_bundleList),
        web.get('/api/bundleMetadata', handle_get_metadata),
    ])
    if not args.no_static_files:
        app.add_routes([
            # angular router-links
            web.get('/', handle_router_link),
            web.get('/bundle-list', handle_router_link),
            web.get('/bundle-list/{tail:.*}', handle_router_link),
            web.get('/bundle/{tail:.*}', handle_router_link),
        ])


if __name__ == "__main__":
    common_app_server.mainLoop(**{
        'progname': progname,
        'description': __doc__,
        'registerRoutes': registerRoutes,
        'serveDistPath': APP_DIST,
        'port': 4253
    })
