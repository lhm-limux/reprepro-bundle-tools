#!/usr/bin/python3
##########################################################################
# Copyright (c) 2019 Landeshauptstadt München
#           (c) 2019 Christoph Lutz (InterFace AG)
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
   This is the reprepro-management-service typically run on a
   reprepro-management server.

   Tested with 'bin/reprepro-management-service-execute'.
   But first, you once have to run 'bin/createSecretToken'.
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
import subprocess
import hashlib
import traceback
import re
from urllib.parse import urlparse
import reprepro_management_service
from reprepro_bundle_appserver import common_app_server


progname = "reprepro-management-service"
logger = logging.getLogger("reprepro_bundle_appserver.reprepro_management_service")

tpe = None # ThreadPoolExecutor set in main

ALLOWED_TOKEN_HASHES = '.allowedTokenHashes'
CMD_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]{1,50}$")

def getAllowedTokenHashes():
    res = dict()
    with open(ALLOWED_TOKEN_HASHES) as fh:
        for line in fh:
            line = line.rstrip()
            parts = line.split("  - ", 1)
            if len(parts) != 2:
                logger.warning("Ignoring invalid line in {}: '{}'".format(ALLOWED_TOKEN_HASHES, line))
                continue
            res[parts[0]] = parts[1]
    return res


def validateToken(request):
    token = request.headers['X-Gitlab-Token']
    if len(token) != 100:
        raise Exception("Token is of wrong length (must be 100 chars)")
    m = hashlib.md5()
    m.update(token.encode("utf-8"))
    md5sum = m.hexdigest()
    allowed = getAllowedTokenHashes()
    userinfo = allowed.get(md5sum)
    if not userinfo:
        raise Exception("This Token is not allowed.")
    return userinfo


async def handle_execute(request):
    logger.debug("Handling 'execute'")
    userinfo = None
    try:
        userinfo = validateToken(request)
    except Exception as e:
        traceback.print_exc()
        return web.Response(text="Invalid Access-Token: {}".format(e), status=401)
    cmd = request.rel_url.query['cmd']
    if not CMD_PATTERN.match(cmd):
        return web.Response(text="Illegal Arguments Provided: cmd", status=400)
    logger.info("Handling 'execute' with cmd='{}' for user {}".format(cmd, userinfo))
    res = []
    with common_app_server.logging_redirect_for_webapp() as logs:
        logger.debug("Calling 'make {}' now".format(cmd))
        try:
            ret = subprocess.check_output(["make", cmd], stderr=subprocess.STDOUT)
            logger.info(ret.decode('utf-8'))
        except subprocess.CalledProcessError as e:
            logger.error("Execute failed with returncode {}:\n{}".format(e.returncode, e.output.decode('utf-8')))
        res = logs.toBackendLogEntryList()
    response = web.json_response(res)
    return response


def registerRoutes(args, app):
    app.router.add_routes([
        web.get('/api/execute', handle_execute),
        web.post('/api/execute', handle_execute),
    ])
    #if not args.no_static_files:
    #    app.router.add_routes([])


if __name__ == "__main__":
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            tpe = executor
            common_app_server.mainLoop(
                progname = progname,
                description =  __doc__,
                registerRoutes = registerRoutes,
                port = 8080
            )
    except KeyboardInterrupt as e:
        logger.info("Stopping due to keyboard interrupt.")
        sys.exit(1)
