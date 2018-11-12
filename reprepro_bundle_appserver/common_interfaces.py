#!/usr/bin/python3
'''
    This file contains interface implementations for common/shared interfaces
'''
from urllib.parse import urljoin


def Bundle(bundle):
    info = bundle.getInfo()
    return {
        'name': bundle.bundleName,
        'distribution': bundle.bundleName.split("/", 1)[0],
        'target': info.get("Target", "no-target"),
        'subject': info.get("Releasenotes", "--no-subject--").split("\n", 1)[0],
        'readonly': not bundle.isEditable(),
        'creator': info.get("Creator", "unknown")
    }

def BundleMetadata(bundle):
    info = bundle.getInfo()
    rnParts = info.get("Releasenotes", "").split("\n", 2)
    return {
        'bundle': Bundle(bundle),
        'basedOn': info.get("BasedOn"),
        'releasenotes': rnParts[2] if (len(rnParts) == 3) else "",
    }

def ManagedBundle(bundle, **kwargs):
    tracBaseUrl = kwargs.get('tracBaseUrl')

    ticket = ""
    ticketUrl = ""
    if tracBaseUrl and bundle.getTrac():
        if not tracBaseUrl.endswith("/"):
            tracBaseUrl += "/"
        ticket = bundle.getTrac()
        ticketUrl = urljoin(tracBaseUrl, "ticket/{}".format(ticket))

    return {
        'id': bundle.getID(),
        'distribution': bundle.getAptSuite(),
        'status': WorkflowMetadata(bundle.getStatus()),
        'target': bundle.getTarget(),
        'ticket': ticket,
        'ticketUrl': ticketUrl
    }

def ManagedBundleInfo(bundle, **kwargs):
    info = bundle.getInfo()
    return {
        'managedBundle': ManagedBundle(bundle, **kwargs),
        'basedOn': info.get("BasedOn"),
        'subject': info.get("Releasenotes", "--no-subject--").split("\n", 1)[0],
        'creator': info.get("Creator", "unknown"),
    }

def WorkflowMetadata(status):
    return {
        'ord': status.value.get('ord'),
        'name': status.name,
        'comment': status.value.get('comment'),
        'repoSuiteTag': status.value.get('repoSuiteTag'),
        'tracStatus': status.value.get('tracStatus'),
        'stage': status.value.get('stage'),
        'override': status.value.get('override'),
        'tracResolution': status.value.get('tracResolution'),
        'candidates': status.value.get('candidates')
    }
