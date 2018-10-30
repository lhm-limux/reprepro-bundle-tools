#!/usr/bin/python3

import time
import aiohttp
import logging
import argparse
import sys
import os
import subprocess
from aiohttp import web
from aiohttp.web import run_app
import asyncio
from reprepro_bundle.BundleCLI import scanBundles, multilineToString
'''
   This is the starter for the bundle-tool frontend.

   It uses xdg-open to start the web-frontend of the bundle-tool and
   runs the corresponding backend service.
'''

progname = "bundle-app"
logger = logging.getLogger(progname)

APP_DIST = './ng-bundle/'

events = set()
registeredClients = set()


def setupLogging(loglevel):
    '''
       Initializing logging and set log-level
    '''
    kwargs = {
        'format': '%(levelname)s[%(name)s]: %(message)s',
        'level': loglevel,
        'stream': sys.stderr
    }
    logging.basicConfig(**kwargs)
    logging.getLogger("urllib3").setLevel(logging.ERROR)
    logging.getLogger("aiohttp").setLevel(logging.ERROR if loglevel != logging.DEBUG else logging.INFO)


def main():
    parser = argparse.ArgumentParser(description=__doc__, prog=progname)
    parser.add_argument("-d", "--debug", action="store_true", default=False, help="Show debug messages.")
    args = parser.parse_args()

    setupLogging(logging.DEBUG if args.debug else logging.INFO)

    loop = asyncio.get_event_loop()
    (backendStarted, runner, url) = loop.run_until_complete(run_webserver("0.0.0.0", 8081))
    loop.run_until_complete(start_browser(url))
    if backendStarted:
        #loop.create_task(wait_for_user_input_and_exit())
        loop.run_forever()
        loop.run_until_complete(runner.cleanup())


def logMessage(msg):
    for event in events:
        event.data = msg
        event.set()


async def handle_doit(request):
    for i in range(1,10):
        logMessage(f"this is log {i}")
        await asyncio.sleep(1)
    logMessage("quit")
    return web.Response(text="ok")


async def handle_get_bundleList(request):
    res = list()
    for bundle in sorted(scanBundles()):
        res.append(bundleJson(bundle))
    return web.json_response(res)


async def handle_get_metadata(request):
    res = list()
    for bundle in sorted(scanBundles()):
        if bundle.bundleName == request.rel_url.query['bundlename']:
            rnParts = multilineToString(bundle.getInfoTag("Releasenotes", "")).split("\n", 2)
            meta = {
                'bundle': bundleJson(bundle),
                'basedOn': bundle.getInfoTag("BasedOn"),
                'releasenotes': rnParts[2] if (len(rnParts) == 3) else "",
            }
            return web.json_response(meta)
    return web.Response("error")


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


async def websocket_handler(request):
    global events
    ws = web.WebSocketResponse()
    print(f"request {request}: {request.method}")
    await ws.prepare(request)
    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            if msg.data == 'close':
                await ws.close()
            else:
                event = asyncio.Event()
                events.add(event) 
                while True:
                    await event.wait()
                    if event.data == "quit":
                        event.clear()
                        break
                    await ws.send_str(event.data)
                    event.clear()
                print("event done")
                events.remove(event)
                await ws.close()
        elif msg.type == aiohttp.WSMsgType.ERROR:
            print('ws connection closed with exception %s' %
                  ws.exception())
    print('websocket connection closed')
    return ws


async def handle_register(request):
    global registeredClients
    uuid = request.rel_url.query['uuid']
    registeredClients.add(uuid)
    logger.info("registered frontend with uuid '{}'".format(uuid))
    return web.json_response("registered")


async def handle_unregister(request):
    global registeredClients
    uuid = request.rel_url.query['uuid']
    if uuid in registeredClients:
        registeredClients.remove(uuid)
        logger.info("unregistered frontend with uuid '{}'".format(uuid))
        if len(registeredClients) == 0:
            logger.info("scheduled backend stop as no more clients are registered")
            loop = asyncio.get_event_loop()
            loop.call_soon_threadsafe(loop.stop)
        return web.json_response("unregistered")
    else:
        logger.debug("ignoring unregister unknown frontend with uuid '{}'".format(uuid))
        return web.json_response("error")


async def wait_for_user_input_and_exit():
    loop = asyncio.get_event_loop()
    await input("Press <Enter> to quit…")
    loop.call_soon_threadsafe(loop.stop)


async def start_browser(url):
    subprocess.call(["xdg-open", url])


async def run_webserver(hostname, port):
    app = web.Application()
    app.add_routes([
        # api routes
        web.get('/api/log', websocket_handler),
        web.get('/api/bundleList', handle_get_bundleList),
        web.get('/api/bundleMetadata', handle_get_metadata),
        web.get('/api/unregister', handle_unregister),
        web.get('/api/register', handle_register),

        # angular router-links
        web.get('/', handle_router_link),
        web.get('/bundle-list', handle_router_link),
        web.get('/bundle-list/{tail:.*}', handle_router_link),
        web.get('/bundle/{tail:.*}', handle_router_link),

        # static content
        web.static('/', APP_DIST)
    ])
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, hostname, port)
    url = "http://{}:{}/".format(hostname, port)
    started = False
    try:
        await site.start()
        started = True
    except OSError as e:
        print(e)
    return (started, runner, url)


if __name__ == "__main__":
    main()
