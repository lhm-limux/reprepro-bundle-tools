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
import os
import re
import tempfile
import logging
import apt_pkg
from apt_repos import RepositoryScanner
from reprepro_bundle_compose.bundle_status import BundleStatus
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)


class ManagedBundle:
    '''
        This class represents a bundle provided by the apt-repos configuration and manually managed as
        an apt_pkg.TagSection entry found in the `bundles` file. In this context a ManagedBundle is a
        composition of an apt_repos.RepoSuite object and a dict containing the information from the
        apt_pkg.TagSection in which the RepoSuite is read-only and manual changes can be serialized
        back to the `bundles` file.

        This class contains methods to parse, validate and serialize the content from/to the TagSection
        and to modify single aspekts of the TagSection. It also provided methods to access information
        from the corresponding RepoSuite-object.
    '''
    BUNDLE_KEYS = [ "ID", "Status", "Target", "Trac" ]

    def __init__(self, tagSection, repoSuite=None):
        self.__repoSuite = repoSuite
        if tagSection:
            self.__tagSection = tagSection
            self.__id = tagSection['ID']
            self.__status = BundleStatus.getByName(tagSection['Status'])
            self.__target = tagSection['Target']
            self.__trac = tagSection.get('Trac', None)
        elif repoSuite:
            self.__id = repoSuite.getSuiteName()
            self.__tagSection = apt_pkg.TagSection("ID: {}\n".format(self.__id))
            self.__status = BundleStatus.getByTags(repoSuite.getTags())
            self.__target = self.getInfo().get("Target", "unknown")
            self.__trac = None

    def getInfo(self):
        '''
            This returns a dict with the content of the bundle's info-file
            or None if the info file could not be read.
        '''
        if not self.__repoSuite:
            logger.warning("Could not read info file of bundle {} as it's suite could not be found.".format(self.__id))
            return None
        url = urljoin(self.__repoSuite.getRepoUrl(), os.path.join('conf', 'info'))
        res = dict()
        try:
            data = RepositoryScanner.getFromURL(url)
            with tempfile.TemporaryFile() as fp:
                fp.write(data)
                fp.seek(0)
                with apt_pkg.TagFile(fp) as tagfile:
                    tagfile.step()
                    for key in tagfile.section.keys():
                        res[key] = self.__unescapeMultiline(tagfile.section[key])
                return res
        except Exception as e:
            logger.warning("Could not read info file of bundle {}:\n{}".format(self.__id, e))
        return None

    def __unescapeMultiline(self, value):
        lines = list()
        for line in value.split("\n"):
            line = re.sub(r"^ ", "", line)
            line = re.sub(r"^\.$", "", line)
            lines.append(line)
        return "\n".join(lines)

    def getTargetTag(self):
        '''
            This method returns the target tag which is a combination of "stage-distribution-target",
            where `stage` is e.g. "test" or "prod" (definded by the bundle's status),
            `distribution` is the bundles suite-name and `target` is the value of the `Target` field
            from the bundles file. The corresponding target-repoSuite has to define this targetTag
            as a tag in order to mark it responsible for this bundle.
        '''
        return "{}-{}-{}".format(self.getStatus().getStage(), self.getAptSuite(), self.getTarget())

    def getID(self):
        return self.__id

    def getStatus(self):
        return self.__status

    def getTarget(self):
        return self.__target

    def getTrac(self):
        return self.__trac

    def getAptSuite(self):
        if self.__repoSuite:
            return self.__repoSuite.getAptSuite()
        return None

    def getRepoUrl(self):
        if self.__repoSuite:
            return self.__repoSuite.getRepoUrl()
        return None

    def getComponents(self):
        if self.__repoSuite:
            return self.__repoSuite.getComponents()
        return None

    def getArchitectures(self):
        if self.__repoSuite:
            return self.__repoSuite.getArchitectures()
        return None

    def setRepoSuite(self, repoSuite):
        self.__repoSuite = repoSuite

    def setStatus(self, status):
        self.__status = status

    def setTrac(self, tid):
        self.__trac = str(tid)

    def serialize(self):
        changeset = list()
        changeset.append(('Status', str(self.__status)))
        changeset.append(('Target', self.__target))
        if self.__trac:
            changeset.append(('Trac', self.__trac))
        return apt_pkg.rewrite_section(self.__tagSection, self.BUNDLE_KEYS, changeset)

    def __str__(self):
        return self.getID()

    def __hash__(self):
        return hash(self.__id)

    def __eq__(self, other):
        return self.__id == other.__id and self.__status == other.__status and self.__target == other.__target and self.__trac == other.__trac

    def __ne__(self, other):
        return not(self == other)

    def __lt__(self, other):
        if self.__id < other.__id:
            return -1
        elif self.__status < other.__status:
            return -1
        return self.__target < other.__target


