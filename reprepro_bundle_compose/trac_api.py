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
from xmlrpc.client import ServerProxy, ProtocolError
from urllib.parse import urljoin, urlparse, urlunparse, quote
import getpass

class TracApi:
    def __init__(self, tracUrl, user=None, passwd=None):
        if not tracUrl.endswith("/"):
            tracUrl += "/"
        self.__tracUrl = tracUrl
        if not user:
            user = input("Please enter Username for Trac '{}': ".format(tracUrl))
            if len(user) == 0:
                raise ValueError("Username must not be empty!")
        if not passwd:
            passwd = getpass.getpass("Please enter Trac-Password for user '{}' at '{}': ".format(user, tracUrl))
            if len(passwd) == 0:
                raise ValueError("Password must not be empty!")
        url = urlparse(tracUrl)
        userinfo = "{}:{}".format(user, passwd)
        proxyurl = "".join([quote(url.scheme), '://', quote(userinfo), '@', quote(url.netloc), quote(url.path + "login/rpc")])
        self.server = ServerProxy(proxyurl)
        # ensure the connection works
        try:
            self.getTicket(1)
        except ProtocolError as e:
            raise Exception("Failed to read from trac: {}".format(e.errmsg))

    def getTracUrl(self):
        return self.__tracUrl

    def createTicket(self, title, text, args):
        return self.server.ticket.create(title, text, args)

    def getTicket(self, id):
        return self.server.ticket.get(id)

    def getTicketValues(self, id):
        (unused_id, unused_time_created, unused_time_changed, values) = self.getTicket(id)
        return values

    def getTicketStatus(self, id):
        values = self.getTicketValues(id)
        return values['status']

    def getTicketDescription(self, id):
        values = self.getTicketValues(id)
        return values['description']

    def getTicketSummary(self, id):
        values = self.getTicketValues(id)
        return values['summary']

    def updateTicket(self, id, comment="", args=dict()):
        return self.server.ticket.update(int(id), comment, args)
