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
import logging
import re
import subprocess
import apt_repos
from reprepro_bundle import BundleError

logger = logging.getLogger(__name__)

class UpdateRule:
    '''
        An UpdateRule describes one entry in the conf/updates file for a bundle.
        It consists of a suiteName - the name of an apt-repos suite - that is the
        suite the update rule is build for and a list of Package-Objects defining
        the packagages form that suite (that should be listed in a corresponding
        FilterSrcList in the end).
    '''
    def __init__(self, suiteName, packages):
        suites = sorted(apt_repos.getSuites([suiteName]))
        if len(suites) != 1:
            raise BundleError("Can't create UpdateRule for suite selector '{}' since it doesn't select exactly one suite.".format(suiteName))
        self.suite = suites[0]
        self.packages = packages

    def getRuleName(self):
        return "from-" + re.sub("[^a-zA-Z0-9]", "-", self.suite.getSuiteName())

    def getSuiteName(self):
        return self.suite.getSuiteName()

    def getFilterListFilename(self):
        return "FilterSrcList-" + self.getRuleName()

    def getUpdateRule(self, skeleton, ownSuiteName=None, blacklistFile=None):
        '''
            renders the update rule using the provided jinja2-template `skeleton`.
            If `blacklistFile` is provided and `ownSuiteName` is the suiteName associated
            to this update rule, the value blacklistFile is passed to the renderer,
            otherwise a None value ist passed (blacklists should only be set for own suites).
        '''
        suite = self.suite
        keyIds = sorted(self.getPublicKeyIDs(suite.getTrustedGPGFile()))
        filterListFile = self.getFilterListFilename()
        if not ownSuiteName or ownSuiteName != self.suite.getSuiteName():
            blacklistFile = None
        rule = skeleton.render(
            ruleName=self.getRuleName(), repoUrl=suite.getRepoUrl(),
            suiteName=suite.getAptSuite(), architectures=" ".join(suite.getArchitectures()),
            components=" ".join(suite.getComponents()), udebComponents=" ".join(suite.getComponents()),
            publicKeys=("!|".join(keyIds)+"!" if len(keyIds) > 0 else "blindtrust"),
            filterListFile=filterListFile, blacklistFile=blacklistFile
        )
        return re.sub("\n +", "\n", rule)

    def getFilterFileContent(self):
        res = ""
        for package in sorted(self.packages):
            res = res + "{} = {}\n".format(package.sourceName, package.version)
        return res

    def getPublicKeyIDs(self, gpgFile):
        ids = set()
        if gpgFile:
            res = subprocess.check_output(["gpg", "--list-public-keys", "--keyring", gpgFile, "--no-default-keyring", "--no-options", "--with-colons"]).decode('utf-8')
            for line in res.splitlines():
                parts = line.split(':')
                if len(parts) >= 5 and parts[0] in ["pub", "sub"]:
                    ids.add(parts[4])
        return ids
