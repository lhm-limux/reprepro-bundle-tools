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
"""
   Tool to merge bundles into result repositories depending on their delivery status.
"""
import os
import sys
import logging
import subprocess
import apt_pkg
import git
from reprepro_bundle_compose.bundle_status import BundleStatus
from reprepro_bundle_compose.managed_bundle import ManagedBundle
from reprepro_bundle_compose.distribution import Distribution

logger = logging.getLogger(__name__)

BUNDLES_LIST_FILE = 'bundle-compose.status'

PROJECT_DIR = os.getcwd()
local_apt_repos = os.path.join(PROJECT_DIR, "apt-repos")
if os.path.isdir(local_apt_repos):
    sys.path.insert(0, local_apt_repos)
import apt_repos

HERE = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/..")
if os.path.isdir(os.path.join(HERE, "reprepro_bundle_compose")):
    sys.path.insert(0, HERE)

progname = "bundle-compose"
tracConfFiles = [ os.path.join(PROJECT_DIR, ".bundle-compose.trac.conf"), os.path.join(os.path.expanduser("~"), ".config", progname, "trac.conf") ]
hooksConfFiles = [ os.path.join(PROJECT_DIR, ".bundle-compose.hooks.conf"), os.path.join(os.path.expanduser("~"), ".config", progname, "hooks.conf") ]

APT_REPOS_CMD = os.path.join(PROJECT_DIR, "apt-repos/bin/apt-repos")
if not os.path.exists(APT_REPOS_CMD):
    APT_REPOS_CMD = "apt-repos"


def updateBundles(tracApi=None):
    repo_suites = getBundleRepoSuites()
    managed_bundles = parseBundles()
    ids = set(repo_suites.keys()).union(managed_bundles.keys())

    for id in sorted(ids):
        logger.debug("Updating {}".format(id))
        bundle = managed_bundles.get(id)
        suite = repo_suites.get(id)
        if not bundle and suite:
            bundle = ManagedBundle(None, suite)
            managed_bundles[id] = bundle
        elif bundle and not suite:
            if bundle.getStatus() != BundleStatus.DROPPED:
                logger.warn("Das verwendete {} kann derzeit physikalisch nicht gefunden werden. Bitte überprüfen!".format(bundle))
        else:
            bundle.setRepoSuite(suite)
            if bundle.getInfo().get("Target") != bundle.getTarget():
                logger.warn("Das Target-Feld für {} ist nicht mehr aktuell. Bitte manuell im File '{}' von '{}' auf '{}' umstellen.".format(bundle, BUNDLES_LIST_FILE, bundle.getTarget(), bundle.getInfo().get("Target")))
            suiteStatus = BundleStatus.getByTags(suite.getTags())
            if bundle.getStatus() < suiteStatus:
                if bundle.getStatus().allowsOverride():
                    bundle.setStatus(suiteStatus)
                else:
                    logger.warn("Es gibt einen neuen Status im Bundle-Repository. Bitte manuell im File '{}' das {} von Status '{}' auf '{}' umstellen.".format(BUNDLES_LIST_FILE, bundle, bundle.getStatus(), suiteStatus))
        if tracApi:
            if not bundle.getTrac():
                if bundle.getStatus() > BundleStatus.STAGING:
                    tid = createTracTicketForBundle(tracApi, bundle)
                    bundle.setTrac(tid)
                else:
                    continue
            ticket = tracApi.getTicketValues(bundle.getTrac())
            fetchedTracStatus = BundleStatus.getByTracStatus(ticket['status'], ticket.get('resolution'))
            if bundle.getStatus() < fetchedTracStatus:
                if bundle.getStatus().allowsOverride():
                    bundle.setStatus(fetchedTracStatus)
                else:
                    logger.warn("Es gibt einen neuen Status im Trac-Ticket #{}. Bitte manuell im File '{}' das {} von Status '{}' auf '{}' umstellen.".format(bundle.getTrac(), BUNDLES_LIST_FILE, bundle, bundle.getStatus(), fetchedTracStatus))
                    continue
            pushTracStatus = bundle.getStatus().getTracStatus()
            pushTracResolution = bundle.getStatus().getTracResolution()
            if pushTracStatus and ticket['status'] != pushTracStatus:
                tracApi.updateTicket(bundle.getTrac(), "Bundle Status-Update durch Broker", None, pushTracStatus, pushTracResolution if pushTracResolution else "")
                logger.info("Updated {}, Trac-Ticket #{} to '{}'".format(bundle, bundle.getTrac(), (pushTracStatus + " as " + pushTracResolution) if pushTracResolution else pushTracStatus))

    storeBundles(managed_bundles)


def parseBundles(repoSuites=None):
    '''
        Parses the file BUNDLES_LIST_FILE and returns a dict of ID to ManagedBundle-Objects mappings
    '''
    res = dict()
    bundles = os.path.join(PROJECT_DIR, BUNDLES_LIST_FILE)
    if not os.path.isfile(bundles):
        logger.warning("File {} not found.".format(bundles))
        return res
    file_bundles = apt_pkg.TagFile(bundles)
    try:
        file_bundles.jump(0)
        for section in file_bundles:
            try:
                bundle = ManagedBundle(section)
                if repoSuites and bundle.getID() in repoSuites:
                    bundle.setRepoSuite(repoSuites[bundle.getID()])
                res[bundle.getID()] = bundle
            except KeyError as e:
                logger.warning("Skipping invalid section in bundles file ending at offset {}: Missing Key {} in\n{}".format(file_bundles.offset(), e, str(section).rstrip()))
    finally:
        file_bundles.close()
    return res


def storeBundles(bundlesDict):
    '''
        Expects a dict of ID to ManagedBundle-Objects and stores it's content in alpabetical
        order back to the file BUNDLES_LIST_FILE.
    '''
    with open(os.path.join(PROJECT_DIR, BUNDLES_LIST_FILE), "w") as bundles:
        bundles.write("\n".join([bundle.serialize() for (_, bundle) in sorted(bundlesDict.items())]))
        logger.debug("Updated file '{}'".format(BUNDLES_LIST_FILE))


def getBundleRepoSuites():
    '''
       This method uses apt-repos to get a list of all currently available (rolled out)
       bundles as a dict of ID to apt_repos.RepoSuite Objects
    '''
    res = dict()
    for suite in sorted(apt_repos.getSuites(["bundle:"])):
        res[suite.getSuiteName()] = suite
    return res


def getTargetRepoSuites(stage=None):
    '''
       This method uses apt-repos to get a list of all currently available target
       repositories/suites. If `stage` is specified, only target suites for this
       stage are returned. The result is a dict of ID to apt_repos.RepoSuite Objects.
    '''
    res = dict()
    for suite in sorted(apt_repos.getSuites(["bundle-compose-target:"])):
        if not stage or "bundle-stage.{}".format(stage) in suite.getTags():
            res[suite.getSuiteName()] = suite
    return res


def getTracConfig():
    return __getConfig(tracConfFiles, warnType="trac")


def getHooksConfig():
    return __getConfig(hooksConfFiles)


def __getConfig(confFiles, warnType=None):
    res = dict()
    res['__file__'] = None
    found = None
    for confFile in confFiles:
        if os.path.isfile(confFile):
            found = confFile
            break
    if not found:
        if warnType:
            logger.warning("No {} configuration file found at {}".format(warnType, ", ".join(confFiles)))
        return res
    with apt_pkg.TagFile(found) as tagFile:
        res['__file__'] = found
        tagFile.jump(0)
        for section in tagFile:
            for key in section.keys():
                res[key] = section[key]
    return res


def createTracTicketForBundle(trac, bundle):
    info = bundle.getInfo()
    milestone = Distribution.getByName(info.get('Distribution', '')).getMilestone()
    (subject, description) = splitReleasenotes(info)
    package_list = subprocess.check_output([APT_REPOS_CMD, "-b .apt-repos", "ls", "-s", str(bundle.getID()), "-r", "." ])
    description = description.replace("__DYNAMIC_PACKAGE_LIST__", package_list.decode("utf-8").rstrip())
    return trac.createTicket(subject, description, {
        'type': 'Betriebsübernahme',
        'deliveryrepo': bundle.getID(),
        'lieferstufe': bundle.getTarget(),
        'milestone': milestone
    })


def splitReleasenotes(info):
    if not info:
        return ("", "")
    notes = info.get("Releasenotes", "")
    subject = notes[0:notes.find("\n")]
    text = notes[notes.find("\n"):]
    return (subject, text)


def markBundlesForStatus(bundles, ids, status, force=False):
    changed = False
    for (bid, bundle) in sorted(bundles.items()):
        if not bid in ids:
            continue
        elif bundle.getStatus() == status:
            logger.info("{} is already in state '{}'.".format(bid, status))
            ids.remove(bid)
            continue
        elif not bundle.getStatus() == status.getCandidates() and not force:
            logger.error("{} is not ready for being put into state '{}'!".format(bid, status))
            ids.remove(bid)
            continue
        if not bundle.getAptSuite():
            logger.error("{} could not be found by apt-repos (possibly wrong config in .apt-repos)!".format(bid))
            ids.remove(bid)
            continue
        ids.remove(bid)
        logger.info("setting {} to status '{}'".format(bid, status))
        bundle.setStatus(status)
        changed = True
    if len(ids) > 0:
        logger.error("the following bundles are not defined: '{}'".format("', '".join(ids)))
    if changed:
        storeBundles(bundles)


def markBundlesForTarget(bundles, ids, target):
    changed = False
    for (bid, bundle) in sorted(bundles.items()):
        if not bid in ids:
            continue
        elif bundle.getTarget() == target:
            logger.info("{} is already in target '{}'.".format(bid, target))
            ids.remove(bid)
            continue
        ids.remove(bid)
        logger.info("setting {} to target '{}'".format(bid, target))
        bundle.setTarget(target)
        changed = True
    if len(ids) > 0:
        logger.error("the following bundles are not defined: '{}'".format("', '".join(ids)))
    if changed:
        storeBundles(bundles)


def git_commit(repo, git_add_list, msg):
    if len(git_add_list) == 0:
        logger.warning("Nothing to add for git commit --> skipping git commit")
        return
    try:
        repo.index.add(git_add_list)
        if len(repo.index.diff(repo.head.commit)) > 0:
            repo.index.commit(msg)
        else:
            logger.info("No Changes --> No new Commit")
    except git.exc.GitCommandError as e:
        logger.error("Committing '{}' failed:\n{}".format(msg, e))


class GitNotCleanException(Exception):
    def __init__(self):
        Exception.__init__(self, "Action denied since the GIT-Repository is not clean.")


def ensure_clean_git_repo(repo):
    if len(repo.index.diff(None)) > 0 or len(repo.index.diff(repo.head.commit)) > 0:
        raise GitNotCleanException()
