#!/usr/bin/python3

import time
import aiohttp
import os
import subprocess
from aiohttp import web
from aiohttp.web import run_app
import asyncio
from reprepro_bundle.BundleCLI import scanBundles, multilineToString

APP_DIST = './ng-bundle/'

events = set()


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

async def handle_exit(request):
    loop = asyncio.get_event_loop()
    loop.call_soon_threadsafe(loop.stop)
    return web.json_response("exiting")

async def wait_for_user_input_and_exit():
    loop = asyncio.get_event_loop()
    await input("Press <Enter> to quit…")
    loop.call_soon_threadsafe(loop.stop)

async def start_browser(url):
    subprocess.call(["xdg-open", url])

async def run_webserver():
    app = web.Application()
    app.add_routes([
        # api routes
        web.get('/api/log', websocket_handler),
        web.get('/api/bundleList', handle_get_bundleList),
        web.get('/api/bundleMetadata', handle_get_metadata),
        web.get('/api/exit', handle_exit),

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
    site = web.TCPSite(runner, 'localhost', 8081)
    url = f"http://localhost:8081/"
    await site.start()
    return (runner, url)


loop = asyncio.get_event_loop()
(runner, url) = loop.run_until_complete(run_webserver())
loop.run_until_complete(start_browser(url))
#loop.create_task(wait_for_user_input_and_exit())
loop.run_forever()
loop.run_until_complete(runner.cleanup())
