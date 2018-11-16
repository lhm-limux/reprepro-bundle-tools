#!/usr/bin/python3 -Es
# -*- coding: utf-8 -*-
##########################################################################
# Copyright (c) 2018 Landeshauptstadt München
#           (c) 2018 Christoph Lutz (InterFace AG)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the European Union Public Licence (EUPL),
# version 1.0 (or any later version).
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
   Tool to merge bundles into result repositories depending on their delivery status.
"""
import os
import sys
import logging
import subprocess

logger = logging.getLogger(__name__)

BUNDLES_LIST_FILE = 'bundles'

PROJECT_DIR = os.getcwd()
local_apt_repos = os.path.join(PROJECT_DIR, "apt-repos")
if os.path.isdir(local_apt_repos):
    sys.path.insert(0, local_apt_repos)
import apt_repos

HERE = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/..")
if os.path.isdir(os.path.join(HERE, "reprepro_bundle_compose")):
    sys.path.insert(0, HERE)


def git_commit(git_add_list, msg):
    if len(git_add_list) == 0:
        logger.info("Nothing to add for git commit --> skipping git commit")
        return
    try:
        add_cmd = ['git', 'add']
        add_cmd.extend(git_add_list)
        subprocess.check_call(add_cmd)
        subprocess.check_call(('git', 'commit', '-m', msg))
    except subprocess.CalledProcessError as e:
        for line in "Committing '{}' failed for folder '{}':\n{}".format(msg, os.getcwd(), e).split("\n"):
            logger.warning(line)
