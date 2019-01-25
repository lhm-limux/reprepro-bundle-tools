#!/usr/bin/python3 -Es
# -*- coding: utf-8 -*-
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
"""
    This tool can be used to merge packages from different sources (so called supplier-suites)
    into a separate apt repository (managed by reprepro in the background), the so called "bundle".
    It provides an easy to use workflow for adding new bundles, and selecting packages, Upgrades
    and Downgrades that should be applied to the bundle and sealing a bundle for deployment.
    Additionally each bundle could be provided with metadata that could be useful to automate
    deployment processes.
"""
import os
import sys
import apt_pkg

PROJECT_DIR = os.getcwd()
local_apt_repos = os.path.join(PROJECT_DIR, "apt-repos")
if os.path.isdir(local_apt_repos):
    sys.path.insert(0, local_apt_repos)
import apt_repos
from apt_repos import RepoSuite, PackageField, QueryResult

HERE = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/..")
if os.path.isdir(os.path.join(HERE, "reprepro_bundle")):
    sys.path.insert(0, HERE)

PROGNAME = "bundle"
hooksConfFiles = [ os.path.join(PROJECT_DIR, ".bundle.hooks.conf"), os.path.join(os.path.expanduser("~"), ".config", PROGNAME, "hooks.conf") ]


def getHooksConfig():
    return __getConfig(hooksConfFiles)


def __getConfig(confFiles):
    res = dict()
    res['__file__'] = None
    found = None
    for confFile in confFiles:
        if os.path.isfile(confFile):
            found = confFile
            break
    if not found:
        return res
    with apt_pkg.TagFile(found) as tagFile:
        res['__file__'] = found
        tagFile.jump(0)
        for section in tagFile:
            for key in section.keys():
                res[key] = section[key]
    return res


class BundleError (Exception):
    def __init__(self, message):
        super(BundleError, self).__init__(message)
