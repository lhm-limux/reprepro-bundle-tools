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
import argparse
import logging
import re
import subprocess
import apt_pkg
import apt_repos
import reprepro_bundle_compose
from reprepro_bundle_compose import PROJECT_DIR, BUNDLES_LIST_FILE, progname, parseBundles, updateBundles, markBundlesForStatus, getBundleRepoSuites, getTargetRepoSuites, trac_api, getTracConfig
from reprepro_bundle_compose.bundle_status import BundleStatus
from reprepro_bundle_compose.managed_bundle import ManagedBundle
from reprepro_bundle_compose.distribution import Distribution
from os.path import expanduser
from shutil import copyfile
from urllib.parse import urljoin, urlparse
from jinja2 import Environment, FileSystemLoader


TEMPLATES_DIR = os.path.join(PROJECT_DIR, "templates", "bundle_compose")
logger = logging.getLogger(progname)
templateEnv = Environment(loader=FileSystemLoader(TEMPLATES_DIR))


def setupLogging(loglevel):
    """
    Initializing logging and set log-level
    :param loglevel: see python logger
    """
    kwargs = {
        'format': '%(levelname)s[%(name)s]: %(message)s',
        'level': loglevel,
        'stream': sys.stderr
    }
    logging.basicConfig(**kwargs)
    logging.getLogger("urllib3").setLevel(logging.ERROR)
    if loglevel == logging.DEBUG:
        logging.getLogger("apt_repos").setLevel(logging.INFO)
    else:
        logging.getLogger("apt_repos").setLevel(logging.ERROR)


def main():
    """
        Main entry point for this script
    """
    # fixup to get help-messages for subcommands that require positional argmuments
    # so that "apt-repos -h <subcommand>" prints a help-message and not an error
    for subcmd in ['mark-for-stage', 'stage', 'mark' ]:
        if ("-h" in sys.argv or "--help" in sys.argv) and subcmd in sys.argv:
            sys.argv.append("drop")

    parser = argparse.ArgumentParser(description=__doc__, prog=progname, add_help=False)
    parser.add_argument("-h", "--help", action="store_true", help="""
                        Show a (subcommand specific) help message""")
    parser.add_argument("-d", "--debug", action="store_true", default=False, help="Show debug messages.")
    subparsers = parser.add_subparsers(help='choose one of these subcommands')
    parser.set_defaults(debug=False)

    # subcommand parsers
    parse_ub     = subparsers.add_parser("update-bundles",  help=cmd_update_bundles.__doc__, description=cmd_update_bundles.__doc__, aliases=['ub'])
    parse_stage  = subparsers.add_parser("mark-for-stage",  help=cmd_stage.__doc__, description=cmd_stage.__doc__, aliases=['stage', 'mark'])
    parse_list   = subparsers.add_parser("list",  help=cmd_list.__doc__, description=cmd_list.__doc__, aliases=['ls', 'lsb'])
    parse_apply  = subparsers.add_parser("apply",  help=cmd_apply.__doc__, description=cmd_apply.__doc__)

    parse_ub.set_defaults(sub_function=cmd_update_bundles, sub_parser=parse_ub)
    parse_stage.set_defaults(sub_function=cmd_stage, sub_parser=parse_stage)
    parse_list.set_defaults(sub_function=cmd_list, sub_parser=parse_list)
    parse_apply.set_defaults(sub_function=cmd_apply, sub_parser=parse_apply)

    for p in [parse_ub]:
        p.add_argument("--no-trac", action="store_true", help="""
                        Don't sync against trac.""")

    for p in [parse_list]:
        p.add_argument("-s", "--stage", default=None, choices=sorted(BundleStatus.getAvailableStages()), help="""
                        Select only bundles in the provided stage.""")
        p.add_argument("-c", "--candidates", action="store_true", help="""
                        Print the list of candidates for each (selected) status.""")

    for p in [parse_stage]:
        p.add_argument("-c", "--candidates", action="store_true", help="""
                        Automatically add all candiates for this stage. Available candidates can be viewed with '{} list -c'.""".format(progname))
        p.add_argument("-f", "--force", action="store_true", help="""
                        Don't check if a bundle is ready for being put into the new stage.""")
        p.add_argument('stage', nargs=1, choices=sorted(BundleStatus.getAvailableStages()), help="""
                        The stage bundles should be marked for.""")
        p.add_argument('bundleName', nargs='*', help="""
                        Identifier of a bundle (as listed in the first column of '{} list').""".format(progname))

    parser.set_defaults()
    args = parser.parse_args()
    setupLogging(logging.DEBUG if args.debug else logging.INFO)
    apt_repos.setAptReposBaseDir(os.path.join(PROJECT_DIR, ".apt-repos"))

    if "sub_function" in args.__dict__:
        if args.help:
            args.sub_parser.print_help()
            sys.exit(0)
        else:
            args.sub_function(args)
            sys.exit(0)
    else:
        if args.help:
            parser.print_help()
            sys.exit(0)
        else:
            parser.print_usage()
            sys.exit(1)


def cmd_update_bundles(args):
    '''
        Updates the file `bundles` against the currently available (rolled out) bundles
        and synchronizes or creates the corresponding trac-Tickets.
    '''
    tracApi = None
    if not args.no_trac:
        try:
            config = getTracConfig()
            tracApi = trac_api.TracApi(config['TracUrl'], config['User'], config.get('Password'))
        except KeyError as e:
            logger.warn("Missing Key {} in config file '{}' --> no synchronization with trac will be done!".format(e, config['__file__']))
        except Exception as e:
            logger.warn("Trac will not be synchronized: {}".format(e))

    updateBundles(tracApi)


def cmd_stage(args):
    '''
        Marks specified bundles to be put into a particular stage.
    '''
    stageStatus = BundleStatus.getByStage(args.stage[0])
    bundles = parseBundles(getBundleRepoSuites())
    ids = set()
    if args.bundleName:
        ids = ids.union(args.bundleName)
    if args.candidates:
        candidates = filterBundles(bundles, stageStatus.getCandidates())
        ids = ids.union([bundle.getID() for bundle in candidates])
    markBundlesForStatus(bundles, ids, stageStatus, args.force)


def cmd_list(args):
    '''
        List all bundles grouped by their status / stage.
    '''
    bundles = parseBundles(getBundleRepoSuites())
    tracUrl = getTracConfig().get('TracUrl')
    nl = ""
    for status in BundleStatus:
        if args.stage and not status.getStage() == args.stage:
            continue
        selected = filterBundles(bundles, status if not args.candidates else status.getCandidates())
        if len(selected) > 0:
            headline="{}{} '{}'{}:".format(nl, "Bundles with status" if not args.candidates else "Candidates for status", status, " (stage '" + status.getStage() + "')" if status.getStage() else "")
            if True: # make it switchable later?
                print("{}\n{}".format(headline, "=" * len(headline)))
            listBundles(selected, tracUrl)
            nl = "\n"


def cmd_apply(args):
    '''
        Applies the bundles list to the reprepro configuration for all target suites.
    '''
    bundles = parseBundles(getBundleRepoSuites())
    createTargetRepreproConfigs(bundles)


def createTargetRepreproConfigs(bundles):
    """
        Creates reprepro config files for targets in all known stages
    """
    dist_template = templateEnv.get_template("target_distributions.skel")
    bundle_update_template = templateEnv.get_template("bundle_updates.skel")
    bundle_base_update_template = templateEnv.get_template("bundle-base_updates.skel")

    updateUrls = set()
    for stage in sorted(BundleStatus.getAvailableStages()):
        targets = getTargetRepoSuites(stage)
        logger.info("Found {} targets for stage '{}'".format(len(targets), stage))
        for _, target in sorted(targets.items()):
            logger.debug("Adding target {} with Url {}".format(target, target.getRepoUrl()))
            updateUrls.add(target.getRepoUrl())

    for url in sorted(updateUrls):
        p = urlparse(url)
        if p.scheme == "file":
            urlFilepath = p.path.replace("%20", " ")
            repoConfDir = os.path.join(urlFilepath, 'conf')
            if not os.path.isdir(repoConfDir):
                os.makedirs(repoConfDir)
        else:
            urlFilepath = re.sub("[^a-zA-z0-9]", "_", url)
            repoConfDir = os.path.join(PROJECT_DIR, 'repo', urlFilepath, 'conf')
            if not os.path.isdir(repoConfDir):
                os.mkdir(repoConfDir)
                # create the ('conf')-level only as urlFilepath is expected to be a preconfigured symlink
        repoTargets = list()
        for _, target in sorted(getTargetRepoSuites().items()):
            if target.getRepoUrl() == url:
                repoTargets.append(target)
        createTargetRepreproConfigForRepository(bundles, repoTargets, repoConfDir, bundle_update_template, bundle_base_update_template, dist_template)


def createTargetRepreproConfigForRepository(bundles, repoTargets, repoConfDir, bundle_update_template, bundle_base_update_template, dist_template):
    '''
        creates the complete configuration for all suites (targets) belonging to the same repository
    '''
    logger.info("Creating reprepro-config at '{}' with {} suites".format(repoConfDir, len(repoTargets)))
    autogenerated = "# This file is auto-generated by '{}'. Don't edit it manually!\n".format(progname)
    update_line = {}
    update_rules = dict()
    # create update rules for bundles
    for target in repoTargets:
        for unused_bid, bundle in sorted(bundles.items()):
            if not bundle.isSupposedForTarget(target):
                continue
            ruleName = 'update-' + bundle.getID()
            keyIds = sorted(getPublicKeyIDs(target.getTrustedGPGFile()))
            chunk = bundle_update_template.render(
                ruleName=ruleName,
                repoUrl=bundle.getRepoUrl(),
                suite=bundle.getAptSuite(),
                components=" ".join(bundle.getComponents()),
                architectures=" ".join(bundle.getArchitectures()),
                publicKeys=("!|".join(keyIds)+"!" if len(keyIds) > 0 else ""))
            update_rules[ruleName] = chunk
            update_line[target] = update_line.get(target, "") + '\n ' + ruleName
    with open(os.path.join(repoConfDir, 'dynamic-distributions'), "w") as upconf:
        upconf.write(autogenerated)
        for target in repoTargets:
            # create update rule for bundle-base suites
            updates = update_line.get(target, "")
            targetDistribution = getBundleDist(target)
            if not targetDistribution:
                logger.warning("Skipping target {} as it has no 'bundle-dist.*' tag!".format(target))
                continue
            for suite in sorted(apt_repos.getSuites(["bundle-base.{}:".format(targetDistribution)])):
                ruleName = "update-" + suite.getSuiteName()
                keyIds = sorted(getPublicKeyIDs(suite.getTrustedGPGFile()))
                updates += '\n ' + ruleName
                chunk = bundle_base_update_template.render(
                    ruleName=ruleName,
                    repoUrl=suite.getRepoUrl(),
                    suite=suite.getAptSuite(),
                    components=" ".join(suite.getComponents()),
                    architectures=" ".join(suite.getArchitectures()),
                    targetDistribution = targetDistribution,
                    publicKeys=("!|".join(keyIds)+"!" if len(keyIds) > 0 else ""))
                update_rules[ruleName] = chunk

            # create distribution file
            logger.debug("Updating target {}".format(target))
            upconf.write(dist_template.render(
                updates=updates,
                suite=target.getAptSuite(),
                components=" ".join(target.getComponents()),
                architectures=" ".join(target.getArchitectures())))
    # create updates file
    with open(os.path.join(repoConfDir, 'updates'), "w") as upconf:
        upconf.write(autogenerated)
        upconf.write("".join([v for _, v in sorted(update_rules.items())]))
    for f in os.listdir(TEMPLATES_DIR):
        srcPath = os.path.join(TEMPLATES_DIR, f)
        if os.path.isdir(srcPath):
            continue
        elif f.endswith(".skel"):
            continue
        elif f.endswith(".symlink"):
            relPath = os.path.relpath(srcPath, repoConfDir)
            name = f[:-len(".symlink")]
            targetPath = os.path.join(repoConfDir, name)
            logger.debug("Creating symlink {} --> {}".format(relPath, targetPath))
            if os.path.exists(targetPath):
                os.remove(targetPath)
            os.symlink(relPath, targetPath)
        else:
            targetPath = os.path.join(repoConfDir, f)
            logger.debug("Copying file {} --> {}".format(srcPath, targetPath))
            copyfile(srcPath, targetPath)


def getBundleDist(targetRepoSuite):
    '''
        Returns the bundle-dist defined as a "bundle-dist.*"-tag within the supplied
        targetRepoSuite-object or None, if no such tag is available.
        This defines the suitename of a bundle the targetRepoSuite  is responsible for.
    '''
    for tag in targetRepoSuite.getTags():
        if tag.startswith("bundle-dist."):
            return tag[len("bundle-dist."):]
    return None


def filterBundles(bundles, status):
    res = set()
    for (unused_id, bundle) in sorted(bundles.items()):
        if bundle.getStatus() == status:
            res.add(bundle)
    return res


def listBundles(bundles, tracUrl=None):
    for bundle in sorted(bundles):
        info = bundle.getInfo()
        subject = ""
        if info:
            notes = info.get("Releasenotes", "")
            subject = notes[0:notes.find("\n")]
        ticketUrl = ""
        if tracUrl and bundle.getTrac():
            if not tracUrl.endswith("/"):
                tracUrl += "/"
            ticketUrl = " --> " + urljoin(tracUrl, "ticket/{}".format(bundle.getTrac()))
        print("{} [{}] {}{}".format(bundle.getID(), bundle.getTarget(), subject, ticketUrl))


def getPublicKeyIDs(gpgFile):
    ids = set()
    if gpgFile:
        res = subprocess.check_output(["gpg", "--list-public-keys", "--keyring", gpgFile, "--no-default-keyring", "--no-options", "--with-colons"]).decode('utf-8')
        for line in res.splitlines():
            parts = line.split(':')
            if len(parts) >= 5 and parts[0] == "pub":
                ids.add(parts[4])
    return ids


if __name__ == "__main__":
    main()
