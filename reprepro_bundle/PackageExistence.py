#!/usr/bin/python3 -Es
# -*- coding: utf-8 -*-
from enum import Enum

class PackageExistence(Enum):
    '''
        This Enum describes in which form a package can exist in a repository:
        as source (only), as binaries(only) as source + binaries and missing.
    '''
    MISSING = (1, "MISSING")
    BIN     = (2, "BINARIES")
    SRCBIN  = (3, "SRC+BIN")
    SOURCE  = (4, "SOURCE")

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
        return PackageExistence.MISSING

    @staticmethod
    def getByName(name):
        for p in PackageExistence:
            if name.upper() == p.name:
                return p
        return PackageExistence.MISSING
