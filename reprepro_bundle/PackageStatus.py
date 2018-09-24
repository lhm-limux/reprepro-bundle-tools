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
import logging
from enum import Enum
from reprepro_bundle import BundleError

logger = logging.getLogger(__name__)

class PackageStatus(Enum):
    '''
        This Enum describes the current status of a package (in comparison to the package status
        in reference suites) and the corresponding action that a user could perform on the package
        by editing the sources_control.list
    '''
    SHOULD_BE_KEPT  = (1, "KEEP", "IN")
    IS_CURRENT      = (2, "WE_CURRENTLY_HAVE", "IN")
    IS_SAME_VERSION = (3, "ALSO_FOUND_AS", "IN")
    IS_DOWNGRADE    = (4, "DOWNGRADE_TO", "FROM")
    IS_UPGRADE      = (5, "UPGRADE_TO", "FROM")
    IS_MISSING      = (6, "ADD_NEW",  "FROM")
    UNKNOWN         = (7, "IGNORE", "FROM")

    def __str__(self):
        return str(self.name)

    def isInfo(self):
        return self == PackageStatus.IS_CURRENT or self == PackageStatus.IS_SAME_VERSION

    def getAction(self):
        # pylint: disable=E1136
        return (self.value[1], self.value[2])

    def __hash__(self):
        return hash(self.value)

    def __eq__(self, other):
        # pylint: disable=E1136
        return self.value[0] == other.value[0]

    def __ne__(self, other):
        return not(self == other)

    def __lt__(self, other):
        # pylint: disable=E1136
        return self.value[0] < other.value[0]
    
    @staticmethod    
    def getByAction(strVal):
        for p in PackageStatus:
            if strVal.upper() == p.value[1]:
                return p
        raise BundleError("Unknown Package-Status {}".format(strVal))

    @staticmethod
    def getByName(name):
        for p in PackageStatus:
            if name.upper() == p.name:
                return p
        raise BundleError("Unknown Package-Status {}".format(name))
