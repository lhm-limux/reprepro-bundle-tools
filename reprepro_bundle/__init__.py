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

PROJECT_DIR = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/../..")
sys.path.insert(0, PROJECT_DIR + "/apt-repos/")
sys.path.insert(0, PROJECT_DIR + "/tools/")
import apt_repos
from apt_repos import RepoSuite, PackageField, QueryResult

class BundleError (Exception):
    def __init__(self, message):
        super(BundleError, self).__init__(message)