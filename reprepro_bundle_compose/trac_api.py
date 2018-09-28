#!/usr/bin/python3

from xmlrpc.client import ServerProxy, ProtocolError
from urllib.parse import urljoin, urlparse, urlunparse
import getpass

class TracApi:
    def __init__(self, tracUrl, user, passwd=None):
        if not tracUrl.endswith("/"):
            tracUrl += "/"
        self.__tracUrl = tracUrl
        if not passwd:
            passwd = getpass.getpass("Please enter Trac-Password for user '{}' at '{}': ".format(user, tracUrl))
            if len(passwd) == 0:
                raise ValueError("Password must not be empty!")
        url = urlparse(tracUrl)
        proxyurl = "".join([url.scheme, '://', str(user), ':', str(passwd), '@', url.netloc, url.path, "login/rpc"])
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

    def updateTicket(self, id, comment="", description=None, state=None, resolution=None):
        args = dict()
        if state:
            args['status'] = str(state)
        if description:
            args['description'] = description
        #if resolution:
        args['resolution'] = resolution
        return self.server.ticket.update(int(id), comment, args)


def main():
    #Testroutine
    username = 'christoph.lutz'
    tracurl = 'http://limuxtrac.tvc.muenchen.de/test-limux'
    trac = TracApi(tracurl, username)

    title = 'Test für XMLRPC-Plugin'
    description = 'Ein mit Python erstelltes Ticket'
    deliveryrepo = 1007
    lieferstufe = 'plus'

    #tid = trac.createTicket(title, description, deliveryrepo, lieferstufe)
    tid = 19140

    print ('Ein neues Ticket mir Nummer %d wurde erstellt.' % tid)

    ticket = trac.getTicketValues(tid)

    print ('Das Ticket enthält folgende relevanten Informationen: {}'.format(ticket))

    ticket = trac.getTicketStatus(tid)

    print ('Der Status des Tickets ist: %s' % ticket)

    trac.updateTicket(tid, "test", None, "closed", "")

if __name__ == "__main__":
    main()
