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
   This is the common_app_server that contains shared code for concrete
   app_servers like bundle_compose.app_server.

   It uses xdg-open to start the web-frontend of the bundle-tool and
   runs the corresponding backend service.
'''

import time
import aiohttp
import logging
from logging import handlers
import argparse
import sys
import os
import io
import queue
import subprocess
import uuid
import json
import binascii
import Crypto
from Crypto.Cipher import AES
from aiohttp import web
from aiohttp.web import run_app
import asyncio
import apt_repos
from reprepro_bundle_appserver import common_interfaces, IllegalArgumentException
from reprepro_bundle_compose import PROJECT_DIR

PROGNAME = "common_app_server"
logger = logging.getLogger(__name__)

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 4253
RE_REGISTER_DELAY_SECONDS = 2

events = set()
registeredClients = set()
__storedPwds = dict() # storageId -> encryptedPwd


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


def mainLoop(**kwargs):
    progname=kwargs.get('progname', PROGNAME)
    description=kwargs.get('description', __doc__)
    registerRoutes=kwargs.get('registerRoutes', None)
    serveDistPath=kwargs.get('serveDistPath', None)
    host=kwargs.get('host', DEFAULT_HOST)
    port=kwargs.get('port', DEFAULT_PORT)

    parser = argparse.ArgumentParser(description=description, prog=progname)
    parser.add_argument("-d", "--debug", action="store_true", default=False, help="Show debug messages.")
    parser.add_argument("--no-open-url", action="store_true", help="""
            Don't try to open the backend url in a browser.""")
    parser.add_argument("--no-static-files", action="store_true", help="""
            Don't serve static files in the backend.""")
    parser.add_argument("--host", default=host, help="""
            Hostname for the backend to listen on. Default is '{}'.""".format(host))
    parser.add_argument("--port", default=port, help="""
            Port for the backend to listen on. Default is '{}'.""".format(port))
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


async def handle_store_credentials(request):
    global __storedPwds
    res = list()
    try:
        refs = common_interfaces.AuthRefList_validate(json.loads(request.rel_url.query['refs']))
        pwds = json.loads(request.rel_url.query['pwds'])
        for x, authRef in enumerate(refs):
            slotId = str(uuid.uuid4())
            authRef['storageSlotId'] = slotId
            __storedPwds[slotId] = pwds[x]
            res.append(authRef)
            logger.info("stored encrypted password for authId '{}'".format(authRef.get('authId')))
        return web.json_response(res)
    except Exception as e:
        return web.Response(text="IllegalArgumentsProvided:{}".format(e), status=400)


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
        loop = asyncio.get_event_loop()
        loop.call_later(RE_REGISTER_DELAY_SECONDS, stop_backend_if_unused)
        return web.json_response("unregistered")
    else:
        logger.debug("ignoring unregister unknown frontend with uuid '{}'".format(uuid))
        return web.json_response("error", status=400)


def stop_backend_if_unused():
    logger.debug("triggered: stop_backend_if_unused")
    global registeredClients
    if len(registeredClients) == 0:
        logger.info("stopping backend as there are no more frontends registered")
        loop = asyncio.get_event_loop()
        loop.call_soon_threadsafe(loop.stop)
    else:
        logger.debug("keep running as there are still frontends registered")


async def start_browser(url):
    logger.info("trying to open browser with url '{}'".format(url))
    subprocess.call(["xdg-open", url])


async def run_webserver(args, registerAdditionalRoutes=None, serveDistPath=None):
    app = web.Application()

    app.router.add_routes([
        # api routes
        web.get('/api/log', websocket_handler),
        web.get('/api/unregister', handle_unregister),
        web.get('/api/register', handle_register),
        web.get('/api/storeCredentials', handle_store_credentials)
    ])
    if registerAdditionalRoutes:
        registerAdditionalRoutes(args, app)
    if serveDistPath and not args.no_static_files:
        app.router.add_static('/', serveDistPath)

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


def is_valid_authRef(authRef):
    global __storedPwds
    return authRef['storageSlotId'] in __storedPwds


def invalidate_credentials(storageSlotId):
    global __storedPwds
    __storedPwds.pop(storageSlotId, None)


def get_credentials(request, authId):
    global __storedPwds
    authRefs = common_interfaces.AuthRefList_validate(json.loads(request.rel_url.query['refs']))
    ref = None
    for x, r in enumerate(authRefs):
        if r['authId'] == authId:
            ref = r
            break
    if not ref:
        raise IllegalArgumentException("No AuthRef for authId='{}' found.".format(authId))
    slotId = ref['storageSlotId']
    aesCipherParamsStr = __storedPwds[slotId]
    username = ref['user']
    try:
        pwd = decrypt(aesCipherParamsStr, ref['key'])
    except Exception as e:
        logger.error("Could not decrypt Credentials for user {}: {}".format(username, e))
        logger.exception(e)
        return(username, None, slotId)
    #logger.info("Got credentials user, pwd: '{}', '{}'".format(username, pwd))
    return (username, pwd, slotId)


def decrypt(aesCipherParamsStr, key):
    aesCipherParams = json.loads(aesCipherParamsStr)
    #logger.info(f"Params: '{aesCipherParams}'', Key: '{key}'")
    cipher = binascii.a2b_hex(aesCipherParams["cipher"])
    iv =     binascii.a2b_hex(aesCipherParams["iv"])
    key =    binascii.a2b_hex(key)
    aes = Crypto.Cipher.AES.new(key, Crypto.Cipher.AES.MODE_CFB, iv, segment_size=128)
    res = aes.decrypt(cipher)
    return res.decode("utf-8")


class WebappLoggingHandler(logging.handlers.QueueHandler):
    def toBackendLogEntryList(self):
        res = list()
        while not self.queue.empty():
          res.append(common_interfaces.BackendLogEntry(self.queue.get()))
        return res


import contextlib
@contextlib.contextmanager
def logging_redirect_for_webapp():
    que = queue.Queue(-1)
    hndlr = WebappLoggingHandler(que)
    logger.addHandler(hndlr)
    logging.getLogger('reprepro_bundle').addHandler(hndlr)
    logging.getLogger('reprepro_bundle_compose').addHandler(hndlr)
    logging.getLogger('reprepro_bundle_appserver').addHandler(hndlr)
    logging.getLogger('apt_repos').addHandler(hndlr)
    yield hndlr
    logging.getLogger('apt_repos').removeHandler(hndlr)
    logging.getLogger('reprepro_bundle_appserver').removeHandler(hndlr)
    logging.getLogger('reprepro_bundle_compose').removeHandler(hndlr)
    logging.getLogger('reprepro_bundle').removeHandler(hndlr)
    logger.removeHandler(hndlr)
