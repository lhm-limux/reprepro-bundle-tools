#!/usr/bin/python3
'''
   This is the common_app_server that contains shared code for concrete
   app_servers like bundle_compose.app_server.

   It uses xdg-open to start the web-frontend of the bundle-tool and
   runs the corresponding backend service.
'''

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
import apt_repos
from reprepro_bundle_compose import PROJECT_DIR

progname = "common_app_server"
logger = logging.getLogger(progname)

DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 4253

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
    logging.getLogger("apt_repos").setLevel(logging.ERROR if loglevel != logging.DEBUG else logging.INFO)


def mainLoop(progname=progname, description=__doc__, registerRoutes=None, serveDistPath=None):
    parser = argparse.ArgumentParser(description=description, prog=progname)
    parser.add_argument("-d", "--debug", action="store_true", default=False, help="Show debug messages.")
    parser.add_argument("--no-open-url", action="store_true", help="""
            Don't try to open the backend url in a browser.""")
    parser.add_argument("--no-static-files", action="store_true", help="""
            Don't serve static files in the backend.""")
    parser.add_argument("--host", default=DEFAULT_HOST, help="""
            Hostname for the backend to listen on. Default is '{}'.""".format(DEFAULT_HOST))
    parser.add_argument("--port", default=DEFAULT_PORT, help="""
            Port for the backend to listen on. Default is '{}'.""".format(DEFAULT_PORT))
    args = parser.parse_args()

    setupLogging(logging.DEBUG if args.debug else logging.INFO)
    apt_repos.setAptReposBaseDir(os.path.join(PROJECT_DIR, ".apt-repos"))

    loop = asyncio.get_event_loop()
    (backendStarted, runner, url) = loop.run_until_complete(run_webserver(args, registerRoutes, serveDistPath))
    if not args.no_open_url:
        loop.run_until_complete(start_browser(url))
    if backendStarted:
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
            #loop.call_soon_threadsafe(loop.stop)
        return web.json_response("unregistered")
    else:
        logger.debug("ignoring unregister unknown frontend with uuid '{}'".format(uuid))
        return web.json_response("error")


async def start_browser(url):
    logger.info("trying to open browser with url '{}'".format(url))
    subprocess.call(["xdg-open", url])


async def run_webserver(args, registerAdditionalRoutes=None, serveDistPath=None):
    app = web.Application()

    app.add_routes([
        # api routes
        web.get('/api/log', websocket_handler),
        web.get('/api/unregister', handle_unregister),
        web.get('/api/register', handle_register)
    ])
    if registerAdditionalRoutes:
        registerAdditionalRoutes(args, app) 
    if serveDistPath and not args.no_static_files:
        app.add_routes([ web.static('/', serveDistPath) ])

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, args.host, args.port)
    url = "http://{}:{}/".format(args.host, args.port)
    started = False
    try:
        await site.start()
        started = True
        logger.info("starting backend at url '{}'".format(url))
    except OSError as e:
        logger.info("could not start backend: {}".format(e))
    return (started, runner, url)
