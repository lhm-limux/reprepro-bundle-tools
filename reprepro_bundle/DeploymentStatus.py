#!/usr/bin/python3 -Es
# -*- coding: utf-8 -*-
import logging
from enum import Enum
import reprepro_bundle
from reprepro_bundle.PackageExistence import PackageExistence

logger = logging.getLogger(__name__)

class DeploymentStatus(Enum):
    '''
        This class defines the stages of a deployment process that are supported
        and trackable. Tracking is done using different tags within the apt-repos
        suites configuration of bundles.
    '''
    STAGING    = (1, "staging")
    ROLLOUT    = (2, "rollout")
    PRODUCTION = (3, "production")
    UNKNOWN    = (4, "unknown")

    def __str__(self):
        # pylint: disable=E1136
        return str(self.value[1])

    def __hash__(self):
        return hash(str(self))

    def __eq__(self, other):
        return self.name == other.name

    def __ne__(self, other):
        return not(self == other)

    def __lt__(self, other):
        # pylint: disable=E1136
        return self.value[0] < other.value[0]

    @staticmethod
    def getByStr(strVal):
        for p in PackageExistence:
            if strVal.upper() == p.value[1]:
                return p
        return DeploymentStatus.UNKNOWN

    @staticmethod
    def getByName(name):
        for p in PackageExistence:
            if name.upper() == p.name:
                return p
        return DeploymentStatus.UNKNOWN
