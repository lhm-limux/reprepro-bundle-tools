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


class Distribution(Enum):
    '''
        Maps distribution name (e.g. 'wanderer') to a trac milestone, e.g "Basisclient 5.5+"
    '''
    WANDERER = "Basisclient 5.5+"
    WALHALLA = "Basisclient 6.0+"
    UNKNOWN  = ""

    def getMilestone(self):
        return self.value

    @staticmethod
    def getByName(name):
        for s in Distribution:
            if name.upper() == s.name:
                return s
        return Distribution.UNKNOWN
