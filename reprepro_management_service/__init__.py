#!/usr/bin/python3 -Es
# -*- coding: utf-8 -*-
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
"""
   A Worker service that runs reprepro updates configured in a Makefile
   and triggered via http-GET calls.
"""
import os
import sys
import logging
import subprocess
import git
import re
import asyncio

logger = logging.getLogger(__name__)

PROJECT_DIR = os.getcwd()

HERE = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/..")
if os.path.isdir(os.path.join(HERE, "reprepro_management_service")):
    sys.path.insert(0, HERE)

progname = "reprepro-management-service"
