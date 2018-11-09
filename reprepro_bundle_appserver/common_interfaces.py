#!/usr/bin/python3
'''
    This file contains interface implementations for common/shared interfaces
'''
import re

def Bundle(bundle):
    return {
        'name': bundle.bundleName,
        'distribution': bundle.bundleName.split("/", 1)[0],
        'target': bundle.getInfoTag("Target", "no-target"),
        'subject': bundle.getInfoTag("Releasenotes", "--no-subject--").split("\n", 1)[0],
        'readonly': not bundle.isEditable(),
        'creator': bundle.getInfoTag("Creator", "unknown")
    }

def BundleMetadata(bundle):
    rnParts = __multilineToString(bundle.getInfoTag("Releasenotes", "")).split("\n", 2)
    return {
        'bundle': Bundle(bundle),
        'basedOn': bundle.getInfoTag("BasedOn"),
        'releasenotes': rnParts[2] if (len(rnParts) == 3) else "",
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

def __multilineToString(multiline):
    res = list()
    for line in multiline.split("\n"):
        line = re.sub(r"^ ", "", line)
        line = re.sub(r"^\.$", "", line)
        res.append(line)
    return "\n".join(res)
