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
import re
import git.exc
from git.exc import GitCommandError
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

APT_REPOS_CMD = os.path.join(PROJECT_DIR, "apt-repos/bin/apt-repos")
if not os.path.exists(APT_REPOS_CMD):
    APT_REPOS_CMD = "apt-repos"


def updateBundles(tracApi=None, parentTicketsField=None, cwd=PROJECT_DIR):
    preUpdateHook = getHooksConfig(cwd=cwd).get('pre_update_bundles', None)
    if preUpdateHook:
        cmd = preUpdateHook.split()
        logger.info("Calling pre_update_bundles hook '{}'".format(" ".join(cmd)))
        try:
            subprocess.check_output(cmd, cwd=cwd, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            logger.warning("Hook execution failed with return code {}:\n{}".format(e.returncode, e.output.decode('utf-8')))

    repo_suites = getBundleRepoSuites(cwd=cwd)
    managed_bundles = parseBundles(cwd=cwd)
    ids = set(repo_suites.keys()).union(managed_bundles.keys())

    for id in sorted(ids):
        logger.debug("Updating {}".format(id))
        bundle = managed_bundles.get(id)
        suite = repo_suites.get(id)
        if not bundle and suite:
            bundle = ManagedBundle(None, suite)
            managed_bundles[id] = bundle
            logger.info("Added {} with status '{}'".format(bundle, bundle.getStatus()))
        elif bundle and not suite:
            if bundle.getStatus() != BundleStatus.DROPPED:
                logger.warn("Could not find an apt-repos suite for bundle {} - Please check!".format(bundle))
        else:
            bundle.setRepoSuite(suite)
            if not bundle.ignoresTargetFromInfoFile():
                info = bundle.getInfo()
                if info.get("Target") != bundle.getTarget():
                    if bundle.getTarget() == "unattended-applied" and info.get("Target") == "unattended":
                        pass
                    else:
                        logger.warn("Target-Fields of {} and it's info file dont't match ('{}' vs. '{}') - Please check!".format(bundle, bundle.getTarget(), info.get("Target")))
            suiteStatus = BundleStatus.getByTags(suite.getTags())
            if bundle.getStatus() < suiteStatus:
                if bundle.getStatus().allowsOverride():
                    bundle.setStatus(suiteStatus)
                    logger.info("Updated {} to status '{}'".format(bundle, suiteStatus))
                else:
                    logger.warn("Status of {} doesn't match it's apt-repos tag-status ('{}' vs. '{}') - Please check!".format(bundle, bundle.getStatus(), suiteStatus))
        if tracApi:
            if not bundle.getTrac():
                if bundle.getStatus() > BundleStatus.STAGING and bundle.getStatus() < BundleStatus.DROPPED:
                    tid = createTracTicketForBundle(tracApi, bundle, parentTicketsField=parentTicketsField, cwd=cwd)
                    bundle.setTrac(tid)
                    logger.info("Created Trac-Ticket #{} of {} - Don't forget to publish this change!".format(bundle.getTrac(), bundle))
                else:
                    continue
            ticket = tracApi.getTicketValues(bundle.getTrac())
            fetchedTracStatus = BundleStatus.getByTracStatus(ticket['status'], ticket.get('resolution'))
            if bundle.getStatus() < fetchedTracStatus:
                if bundle.getStatus().allowsOverride():
                    bundle.setStatus(fetchedTracStatus)
                    logger.info("Updated {} to status '{}'".format(bundle, fetchedTracStatus))
                else:
                    logger.warn("Status of {} doesn't match it's Trac-Ticket status ('{}' vs. '{}') - Please check!".format(bundle, bundle.getStatus(), fetchedTracStatus))
                    continue
            pushTracStatus = bundle.getStatus().getTracStatus()
            pushTracResolution = bundle.getStatus().getTracResolution()
            if pushTracStatus and ticket['status'] != pushTracStatus:
                tracApi.updateTicket(bundle.getTrac(), "Automatically updated by bundle-compose", {
                    'status': pushTracStatus,
                    'resolution': pushTracResolution if pushTracResolution else "",
                })
                logger.info("Updated Trac-Ticket #{} of {} to Status '{}'".format(bundle.getTrac(), bundle, (pushTracStatus + " as " + pushTracResolution) if pushTracResolution else pushTracStatus))
            pushTarget = bundle.getTarget()
            if pushTarget and ticket['bereitstellung'] != pushTarget:
                tracApi.updateTicket(bundle.getTrac(), "Automatically updated by bundle-compose", {
                    'bereitstellung': pushTarget
                })
                logger.info("Updated Trac-Ticket #{} of {} to Target '{}'".format(bundle.getTrac(), bundle, pushTarget))

    storeBundles(managed_bundles, cwd=cwd)


def parseBundles(repoSuites=None, selectIds=None, cwd=PROJECT_DIR):
    '''
        Parses the file BUNDLES_LIST_FILE and returns a dict of ID to ManagedBundle-Objects mappings
    '''
    bundlesListFile = os.path.join(cwd, BUNDLES_LIST_FILE)
    return parseBundlesListFile(bundlesListFile, repoSuites, selectIds)


def parseBundlesListFile(bundlesListFile, repoSuites=None, selectIds=None):
    '''
        Parses the file bundlesListsFile and returns a dict of ID to ManagedBundle-Objects mappings
    '''
    res = dict()
    if not os.path.isfile(bundlesListFile):
        logger.warning("File {} not found.".format(bundlesListFile))
        return res
    file_bundles = apt_pkg.TagFile(bundlesListFile)
    try:
        for section in file_bundles:
            try:
                bundle = ManagedBundle(section)
                if selectIds != None and not bundle.getID() in selectIds:
                    continue
                if repoSuites and bundle.getID() in repoSuites:
                    bundle.setRepoSuite(repoSuites[bundle.getID()])
                res[bundle.getID()] = bundle
            except KeyError as e:
                logger.warning("Skipping invalid section in bundles file ending at offset {}: Missing Key {} in\n{}".format(file_bundles.offset(), e, str(section).rstrip()))
    finally:
        file_bundles.close()
    return res


def storeBundles(bundlesDict, cwd=PROJECT_DIR):
    '''
        Expects a dict of ID to ManagedBundle-Objects and stores it's content in alpabetical
        order back to the file BUNDLES_LIST_FILE.
    '''
    with open(os.path.join(cwd, BUNDLES_LIST_FILE), "w") as bundles:
        bundles.write("\n".join([bundle.serialize() for (_, bundle) in sorted(bundlesDict.items())]))
        logger.debug("Updated file '{}'".format(BUNDLES_LIST_FILE))


def getBundleRepoSuites(ids=["bundle:"], cwd=PROJECT_DIR):
    '''
       This method uses apt-repos to get a list of all currently available (rolled out)
       bundles as a dict of ID to apt_repos.RepoSuite Objects

       WARNING: This method modifies the global apt-repos base directory and therefore must
                not be used in a multithreaded environment!
    '''
    res = dict()
    apt_repos.setAptReposBaseDir(os.path.join(cwd, ".apt-repos"))
    for suite in sorted(apt_repos.getSuites(ids)):
        res[suite.getSuiteName()] = suite
    return res


def getTargetRepoSuites(stage=None, cwd=PROJECT_DIR):
    '''
       This method uses apt-repos to get a list of all currently available target
       repositories/suites. If `stage` is specified, only target suites for this
       stage are returned. The result is a dict of ID to apt_repos.RepoSuite Objects.

       WARNING: This method modifies the global apt-repos base directory and therefore must
                not be used in a multithreaded environment!
    '''
    res = dict()
    apt_repos.setAptReposBaseDir(os.path.join(cwd, ".apt-repos"))
    for suite in sorted(apt_repos.getSuites(["bundle-compose-target:"])):
        if not stage or "bundle-stage.{}".format(stage) in suite.getTags():
            res[suite.getSuiteName()] = suite
    return res


def getGitRepoConfig(required=False, cwd=PROJECT_DIR):
    gitRepoConfFiles = [
        os.path.join(cwd, ".bundle-compose.git-repo.conf"),
        os.path.join(os.path.expanduser("~"), ".config", progname, "git-repo.conf")
    ]
    return __getConfig(gitRepoConfFiles, confType="git-repo", required=required)


def getTracConfig(required=False, cwd=PROJECT_DIR):
    tracConfFiles = [
        os.path.join(cwd, ".bundle-compose.trac.conf"),
        os.path.join(os.path.expanduser("~"), ".config", progname, "trac.conf")
    ]
    return __getConfig(tracConfFiles, confType="trac", required=required)


def getHooksConfig(required=False, cwd=PROJECT_DIR):
    hooksConfFiles = [
        os.path.join(cwd, ".bundle-compose.hooks.conf")
    ]
    return __getConfig(hooksConfFiles, confType="hooks", required=required)


def __getConfig(confFiles, confType, required=False):
    res = dict()
    for confFile in confFiles:
        if os.path.isfile(confFile):
            with apt_pkg.TagFile(confFile) as tagFile:
                tagFile.jump(0)
                for section in tagFile:
                    for key in section.keys():
                        res[key] = section[key]
    if required and len(res) == 0:
        msg = "No {} configuration file found at {}".format(confType, ", ".join(confFiles))
        logger.warning(msg)
        raise Exception(msg)
    return res


def getParentTicketsFromBundleInfo(info, parentTicketsField):
    if not info or not parentTicketsField:
        return None
    parentTickets = info.get(parentTicketsField)
    if not parentTickets:
        return None
    parentTickets = re.sub(r'[\s]+', ' ', re.sub(r'[^0-9]', " ", parentTickets)).strip()
    if len(parentTickets) > 0:
        return parentTickets.split()
    return None


def createTracTicketForBundle(trac, bundle, parentTicketsField=None, cwd=PROJECT_DIR):
    info = bundle.getInfo()
    milestone = Distribution.getByName(info.get('Distribution', '')).getMilestone()
    (subject, description) = splitReleasenotes(info)
    package_list = subprocess.check_output([APT_REPOS_CMD, "-b .apt-repos", "ls", "-s", str(bundle.getID()), "-col", "CpvaSs", "-r", "." ], cwd=cwd)
    description = description.replace("__DYNAMIC_PACKAGE_LIST__", package_list.decode("utf-8").rstrip())
    parentTickets = getParentTicketsFromBundleInfo(info, parentTicketsField)
    if parentTickets:
        parentTickets = " ".join([ "#{}".format(t) for t in parentTickets ])
    return trac.createTicket(subject, description, {
        'type': 'Betriebsuebernahme',
        'deliveryrepo': bundle.getID(),
        'bereitstellung': bundle.getTarget(),
        'umgesetzte_tickets': parentTickets or "",
        'milestone': milestone
    })


def splitReleasenotes(info):
    if not info:
        return ("", "")
    notes = info.get("Releasenotes", "")
    subject = notes[0:notes.find("\n")]
    text = notes[notes.find("\n"):]
    return (subject, text)


def markBundlesForStatus(bundles, bundleIds, status, force=False, checkOwnSuite=True, cwd=PROJECT_DIR):
    ids = set(bundleIds)
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
        if checkOwnSuite and not bundle.getAptSuite():
            logger.error("{} could not be found by apt-repos (possibly wrong config in .apt-repos)!".format(bid))
            ids.remove(bid)
            continue
        ids.remove(bid)
        bundle.setStatus(status)
        logger.info("marked {} for status '{}'".format(bid, status))
        changed = True
    if len(ids) > 0:
        logger.error("the following bundles are not defined: '{}'".format("', '".join(ids)))
    if changed:
        storeBundles(bundles, cwd=cwd)


def markBundlesForTarget(bundles, bundleIds, target, cwd=PROJECT_DIR, ignoreTargetFromInfoFile=None):
    ids = set(bundleIds)
    changed = False
    for (bid, bundle) in sorted(bundles.items()):
        if not bid in ids:
            continue
        ids.remove(bid)
        if ignoreTargetFromInfoFile != None and bundle.ignoresTargetFromInfoFile() != ignoreTargetFromInfoFile:
            bundle.setIgnoreTargetFromInfoFile(ignoreTargetFromInfoFile)
            logger.info("{}gnoring 'TargetFromInfoFile' for {}".format(("I" if ignoreTargetFromInfoFile else "No longer i"), bundle))
            changed = True
        if bundle.getTarget() != target:
            bundle.setTarget(target)
            logger.info("Marked {} for target '{}'".format(bid, target))
            changed = True
    if len(ids) > 0:
        logger.error("The following bundles are not defined: '{}'".format("', '".join(ids)))
    if changed:
        storeBundles(bundles, cwd)


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
    except GitCommandError as e:
        logger.error("Committing '{}' failed:\n{}".format(msg, e))


class GitNotCleanException(Exception):
    def __init__(self):
        Exception.__init__(self, "Action denied since the GIT-Repository is not clean.")


def ensure_clean_git_repo(repo):
    if len(repo.index.diff(None)) > 0 or len(repo.index.diff(repo.head.commit)) > 0:
        raise GitNotCleanException()
