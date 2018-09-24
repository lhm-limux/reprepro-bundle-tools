#!/usr/bin/python3 -Es
# -*- coding: utf-8 -*-
"""
    This tool can be used to merge packages from different sources (so called supplier-suites)
    into a separate apt repository (managed by reprepro in the background), the so called "bundle".
    It provides an easy to use workflow for adding new bundles, and selecting packages, Upgrades
    and Downgrades that should be applied to the bundle and sealing a bundle for deployment.
    Additionally each bundle could be provided with metadata that could be usefull to automate
    deployment processes.
"""
import os
import sys

PROJECT_DIR = os.getcwd()
local_apt_repos = os.path.join(PROJECT_DIR, "apt-repos")
if os.path.isdir(local_apt_repos):
    sys.path.insert(0, local_apt_repos)
import apt_repos
from apt_repos import RepoSuite, PackageField, QueryResult

HERE = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/..")
if os.path.isdir(os.path.join(HERE, "reprepro_bundle")):
    sys.path.insert(0, HERE)


class BundleError (Exception):
    def __init__(self, message):
        super(BundleError, self).__init__(message)
