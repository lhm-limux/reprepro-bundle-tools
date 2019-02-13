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
from enum import Enum


class BundleStatus(Enum):
    '''
        This Enum describes the values defined for Status-Fields inside the file `bundles`.

        The meaning of the below parameters are:
        - ord: the uniq id of the enum value
        - stage: the name of the delivery-stage that corresponds to this status.
        - candidates: the status from which we get our candidates for this status.
        - repoSuiteTag: propose a bundle for this status if the bundles RepoSuite defines this tag
        - tracStatus: propose a bundle for this status if the corresponding trac ticket is in this status.
        - tracResolution: if provided, the status is only proposed if both, tracStatus and tracResolution match.
        - override: the status can be automatically replaced by a better matching status. Don't set it for Status that is manually controlled.
        - comment: comments the status
    '''

    UNKNOWN = { 'ord': 0, 'comment': '''
        The status is unkonwn.
    '''}

    STAGING = { 'ord': 1, 'repoSuiteTag': 'staging', 'override':True, 'comment': '''
        The bundle is still in development but already transferred to the backbone for developer tests ('staging').
        In this stage there is no ticket assigned to the bundle.
    '''}

    NEW = { 'ord': 2, 'repoSuiteTag': 'rollout', 'tracStatus': 'new', 'stage': 'dev', 'override':True, 'comment': '''
        The bundle is available (transferred to the backbone by the development) and 'sealed' which means
        it is ready for internal tests.
    '''}

    TEST_INT = { 'ord': 3, 'tracStatus': 'Test', 'stage': 'dev', 'override':True, 'comment': '''
        The bundle is currently in test by the internal test team.
    '''}

    ACK_DEV = { 'ord': 4, 'tracStatus': 'Bestätigung', 'stage': 'dev', 'override':True, 'comment': '''
        A successfully tested bundle needs a final acknowledgement by the developer before it could be seen by customers.
    '''}

    TESTED_AND_RELEASED = { 'ord': 5, 'tracStatus': 'Freigabe', 'stage': 'dev', 'comment': '''
        The bundle was successfully tested and is approved for being seen by customers. It is not yet visible for customers!
    '''}

    TEST_CUST = { 'ord': 6, 'stage': 'test', 'candidates': 'TESTED_AND_RELEASED', 'tracStatus': 'Referatstest', 'comment': '''
        The bundle is visible in the `test`-Teststufe and under test by customers.
    '''}

    PRODUCTION = { 'ord': 7, 'stage': 'prod', 'candidates': 'TEST_CUST', 'tracStatus': 'closed', 'tracResolution': 'fixed', 'comment': '''
        The bundle succesfully finished the customer tests and is now available for production.
    '''}

    DROPPED = { 'ord': 8, 'stage': 'drop', 'tracStatus': 'closed', 'tracResolution': 'invalid', 'override': False, 'comment': '''
        A test for the bundle failed and the bundle has to be dropped.
        A new bundle has to be created instead of fixing the old one.
    '''}

    def __str__(self):
        return str(self.name).lower()

    def getStage(self):
        # pylint: disable=E1101
        return self.value.get('stage')

    def getRepoSuiteTag(self):
        # pylint: disable=E1101
        return self.value.get('repoSuiteTag')

    def getTracStatus(self):
        # pylint: disable=E1101
        return self.value.get('tracStatus')

    def getTracResolution(self):
        # pylint: disable=E1101
        return self.value.get('tracResolution')

    def allowsOverride(self):
        # pylint: disable=E1101
        return self.value.get('override', False)

    def __hash__(self):
        return hash(self.value)

    def __eq__(self, other):
        # pylint: disable=E1136
        selfOrd = self.value['ord']
        otherOrd = other.value['ord']
        return selfOrd == otherOrd

    def __ne__(self, other):
        return not(self == other)

    def __lt__(self, other):
        # pylint: disable=E1136
        selfOrd = self.value['ord']
        otherOrd = other.value['ord']
        return selfOrd < otherOrd

    def getCandidates(self):
        # pylint: disable=E1101
        prev = self.value.get('candidates')
        if prev:
            return BundleStatus.getByName(prev)
        return BundleStatus.UNKNOWN

    @staticmethod
    def getByName(name):
        for s in BundleStatus:
            if name.upper() == s.name:
                return s
        return BundleStatus.UNKNOWN

    @staticmethod
    def getByStage(stage):
        '''returns the first BundleStatus that is assigned to the stage `stage`.'''
        for s in sorted(BundleStatus):
            if stage == s.getStage():
                return s
        return BundleStatus.UNKNOWN

    @staticmethod
    def getByTags(tags):
        for s in BundleStatus:
            tag = s.getRepoSuiteTag()
            if tag and tag in tags:
                return s
        return BundleStatus.UNKNOWN

    @staticmethod
    def getByTracStatus(tracStatus, tracResolution):
        for s in BundleStatus:
            if s.getTracStatus() and tracStatus == s.getTracStatus():
                resolution = s.getTracResolution()
                if s==BundleStatus.DROPPED and tracResolution != "fixed":
                    return s
                if resolution and resolution != tracResolution:
                    continue
                return s
        return BundleStatus.UNKNOWN

    @staticmethod
    def getAvailableStages():
        res = set()
        for s in BundleStatus:
            if 'stage' in s.value:
                res.add(s.value.get('stage'))
        return res

