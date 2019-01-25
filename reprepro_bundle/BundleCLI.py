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
    This tool can be used to merge packages from different sources (so called supplier-suites)
    into a separate apt repository (managed by reprepro in the background), the so called "bundle".
    It provides an easy to use workflow for adding new bundles, and selecting packages, Upgrades
    and Downgrades that should be applied to the bundle and sealing a bundle for deployment.
    Additionally each bundle could be provided with metadata that could be useful to automate
    deployment processes.
"""
import os
import sys
import logging
import argparse
import re
import tempfile
import subprocess
import shutil
import apt_pkg
import apt_repos
from contextlib import contextmanager


CANCEL_REMARK = "# Note: clean this file completely to CANCEL this current '{action}' action\n"

import reprepro_bundle
from reprepro_bundle import BundleError
from .update_rule import UpdateRule
from .bundle import Bundle

APT_REPOS_CMD = "apt-repos/bin/apt-repos"
if not os.path.exists(APT_REPOS_CMD):
    APT_REPOS_CMD = "apt-repos"

logger = logging.getLogger(reprepro_bundle.PROGNAME)


def setupLogging(loglevel):
    '''
       Initializing logging and set log-level
    '''
    kwargs = {
        'format': '%(levelname)s[%(name)s]: %(message)s',
        'level': loglevel,
        'stream': sys.stderr
    }
    logging.basicConfig(**kwargs)
    logging.getLogger("urllib3").setLevel(logging.ERROR)


def main():
    DEFAULT_SUPPLIERS = "{distribution}-supplier:,user-{user}:{distribution}"
    DEFAULT_REFERENCES = "{distribution}-reference:,bundle:{bundle}"
    DEFAULT_OWN_SUITE = "bundle:{bundle}"
    DEFAULT_HIGHLIGHTED = DEFAULT_OWN_SUITE

    GIT_REPO_URL = getGitRepoUrl('origin', None)
    GIT_BRANCH = 'test'

    # fixup to get help-messages for subcommands that require positional argmuments
    # so that "apt-repos -h <subcommand>" prints a help-message and not an error
    for subcmd in ['init', 'edit', 'meta', 'show', 'seal', 'apply', 'clone', 'blacklist', 'black', 'list', 'ls']:
        if ("-h" in sys.argv or "--help" in sys.argv) and subcmd in sys.argv:
            sys.argv.append(".")

    parser = argparse.ArgumentParser(description=__doc__, prog=reprepro_bundle.PROGNAME, add_help=False)
    parser.add_argument("-h", "--help", action="store_true", help="""
                        Show a (subcommand specific) help message""")
    parser.add_argument("-d", "--debug", action="store_true", default=False, help="Show debug messages.")
    parser.add_argument("--no-info", action="store_true", default=False, help="Just show warnings and errors.")
    subparsers = parser.add_subparsers(help='choose one of these subcommands')
    parser.set_defaults(debug=False)

    # subcommand parsers
    parse_init  = subparsers.add_parser("init",  help=cmd_init.__doc__, description=cmd_init.__doc__)
    parse_edit  = subparsers.add_parser("edit",  help=cmd_edit.__doc__, description=cmd_edit.__doc__)
    parse_black = subparsers.add_parser("blacklist", help=cmd_blacklist.__doc__, description=cmd_blacklist.__doc__, aliases=['black'])
    parse_meta  = subparsers.add_parser("meta",  help=cmd_meta.__doc__, description=cmd_meta.__doc__)
    parse_show  = subparsers.add_parser("show",  help=cmd_show.__doc__, description=cmd_show.__doc__)
    parse_list  = subparsers.add_parser("list",  help=cmd_list.__doc__, description=cmd_list.__doc__, aliases=['ls'])
    parse_seal  = subparsers.add_parser("seal",  help=cmd_seal.__doc__, description=cmd_seal.__doc__)
    parse_apply = subparsers.add_parser("apply", help=cmd_apply.__doc__, description=cmd_apply.__doc__)
    parse_clone = subparsers.add_parser("clone", help=cmd_clone.__doc__, description=cmd_clone.__doc__)
    parse_bundles = subparsers.add_parser("bundles", help=cmd_bundles.__doc__, description=cmd_bundles.__doc__, aliases=['lsb'])
    parse_repos = subparsers.add_parser("update-repos-config", help=cmd_update_repos_config.__doc__, description=cmd_update_repos_config.__doc__, aliases=['repos'])

    parse_init.set_defaults(sub_function=cmd_init, sub_parser=parse_init)
    parse_edit.set_defaults(sub_function=cmd_edit, sub_parser=parse_edit)
    parse_black.set_defaults(sub_function=cmd_blacklist, sub_parser=parse_black)
    parse_meta.set_defaults(sub_function=cmd_meta, sub_parser=parse_meta)
    parse_show.set_defaults(sub_function=cmd_show, sub_parser=parse_show)
    parse_list.set_defaults(sub_function=cmd_list, sub_parser=parse_list)
    parse_seal.set_defaults(sub_function=cmd_seal, sub_parser=parse_seal)
    parse_apply.set_defaults(sub_function=cmd_apply, sub_parser=parse_apply)
    parse_clone.set_defaults(sub_function=cmd_clone, sub_parser=parse_clone)
    parse_bundles.set_defaults(sub_function=cmd_bundles, sub_parser=parse_bundles)
    parse_repos.set_defaults(sub_function=cmd_update_repos_config, sub_parser=parse_repos)

    for p in [parse_init, parse_edit, parse_black, parse_meta, parse_seal, parse_clone, parse_apply, parse_show, parse_list]:
        p.add_argument("--own-suite", default=DEFAULT_OWN_SUITE, help="""
                            Suite-Selectors that defines the own suite (the suite of this bundle).
                            The default value is '{}'.""".format(DEFAULT_OWN_SUITE))

    for p in [parse_init, parse_edit, parse_apply, parse_clone]:
        g = p.add_argument_group('advanced suites control parameters')
        g.add_argument("--no-apt-update", action="store_true", default=False, help="Skip download of packages list.")
        g.add_argument("--supplier-suites", default=DEFAULT_SUPPLIERS, help="""
                            Comma separated list of Suite-Selectors that define the supplier-suites to track.
                            The default value is '{}'.""".format(DEFAULT_SUPPLIERS))
        g.add_argument("--reference-suites", default=DEFAULT_REFERENCES, help="""
                            Comma separated list of Suite-Selectors that define the reference suites which hold the current state that we refer on.
                            The default value is '{}'.""".format(DEFAULT_REFERENCES))
        g.add_argument("--highlighted-suites", default=DEFAULT_HIGHLIGHTED, help="""
                            Comma separated list of Suite-Selectors that define suites whose entries should be put on top of the sources_control.list.
                            The default value is '{}'.""".format(DEFAULT_HIGHLIGHTED))

    for p in [parse_edit]:
        g = p.add_argument_group('''sub command 'edit' specific options''')
        g.add_argument("--add-from", default=None, help="""
                        Comma separated list of Suite-Selectors that define suites whose (all) packages are automatically activated for being added.""")
        g.add_argument("--upgrade-from", default=None, help="""
                        Comma separated list of Suite-Selectors that define suites whose (upgradable) packages are automatically upgraded if they
                        already exist in the reference-suites.""")
        g.add_argument("--no-upgrade-keep-component", action="store_true", default=False, help="""
                        If not set, when doing a package upgrade via --upgrade-from only those packages will
                        be upgraded that are keeping their physical component (which means after upgrade the package will resist
                        in the same component as before). In case the component of a package has changed in the supplier
                        suite or if the new component doesn't match the current component in the reference suite,
                        the package will not be automatically upgraded and a warning will be reported.""")
        g.add_argument("--batch", action="store_true", default=False, help="""Run in batch mode which means without user interaction.""")

    for p in [parse_init, parse_edit, parse_meta, parse_black, parse_seal, parse_clone, parse_apply, parse_repos]:
        g = p.add_argument_group('additional arguments for git-commit management')
        g.add_argument("--commit", action="store_true", default=False, help="Commit changed files to the (local) project git-repository.")
        if p in [parse_init, parse_clone]:
            g.add_argument("--no-clean-commit", action="store_false", dest="clean_commit", help="""
                        The subcommands 'init' and 'clone' implicitely behave as if --clean-commit was set. This means that a clone of the current
                        git-repository into a temporary folder is created and changes are automatically commited there and pushed back to the
                        server immediately. This is done to ensure that new bundleId's are immediately synced to the server! Use --no-clean-commit
                        to disable this default. With --no-clean-commit this tool would operate on the local project folder without any commits.""")
            g.set_defaults(clean_commit=True)
        else:
            g.add_argument("--clean-commit", action="store_true", dest="clean_commit", help="""
                        Create a clone of the current git-repository into a temporary folder, automatically commit changes there and immediately push back
                        the changes to the git server.""")
            g.set_defaults(clean_commit=False)
        g.add_argument("--git-repo-url", default=GIT_REPO_URL, help="""
                        GIT-Repository URL used to clone the repository during --clean-commit. Per default the current git tracking branch is used (if set).""")
        g.add_argument("--git-branch", default=GIT_BRANCH, help="""
                        GIT-Repository branch used to pull and push during --clean-commit. The default is '{}'.""".format(GIT_BRANCH))

    # positional argument
    for p in [parse_init, parse_edit, parse_black, parse_meta, parse_show, parse_list, parse_seal, parse_clone, parse_apply]:
        p.add_argument('bundleName', nargs=1, help="""
                        The bundleName is a value in the format <distribution>[/<bundleID>] that points to the path in the folder repo/bundle/
                        in which the bundle is stored. Is is possible to just provide the <distribution> part. In this case,
                        there will be a new bundle (with a newly incremented bundleID) created for this distribution. To support
                        command line completion, it is also allowed to specify the full path relative to the projects root in the form
                        repo/bundle/<distribution>[/<bundleID>].""")

    for p in [parse_bundles]:
        g = p.add_argument_group('''sub command 'bundles' specific options''')
        g.add_argument("-r", "--readonly", action="store_true", default=False, help="Just print bundles that are marked readonly (that are already sealed).")
        g.add_argument("-e", "--editable", action="store_true", default=False, help="Just print bundles that are marked editable (that are not sealed).")
        g.add_argument('bundleNameFilter', nargs='?', default="", help="""
                        The bundleNameFilter is either an empty string or a string value. In case of an empty
                        string is provided, all available bundles are matched. In case of a string value, only
                        bundles with their bundle name containing the string are matched.""")
    parser.set_defaults()

    args = parser.parse_args()
    setupLogging(logging.DEBUG if args.debug else logging.WARN if args.no_info else logging.INFO)

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


def cmd_init(args):
    '''
        Subcommand init: Reserves a new bundle ID and creates a new empty bundle for the given distribution
    '''
    #bundle = setupContext(args) - no setup here because context can only be initialized inside the commit_context
    with choose_commit_context(None, args, "INITIALIZED bundle '{bundleName}'", args.bundleName[0]) as (bundle, git_add):
        git_add.append(create_reprepro_config(bundle))
        git_add.append(updateReposConfig())


def cmd_edit(args):
    '''
        Subcommand edit: Add / Remove/ Upgrade/ Downgrade packages to/in the bundle by editing an automatically prepared list of available packages.
    '''
    bundle = setupContext(args)
    with choose_commit_context(bundle, args, "EDITED sources_control.list of bundle '{bundleName}'") as (bundle, git_add):
        originCopy = tempfile.NamedTemporaryFile(delete=False).name
        shutil.copyfile(bundle.scl, originCopy)
        update_sources_control_list(bundle, args, CANCEL_REMARK.format(action="edit"))
        if os.path.isfile(bundle.scl):
            if args.batch or editFile(bundle.scl):
                bundle.normalizeSourcesControlList()
            else:
                logger.info("Aborting as empty sources_control.list recognized!")
                shutil.copyfile(originCopy, bundle.scl) # (rollback)
                os.remove(originCopy)
                return
        git_add.append(create_reprepro_config(bundle))
        os.remove(originCopy)


def cmd_blacklist(args):
    '''
        Subcommand blacklist: Edit the bundle's blacklist to mark particular binary packages contained in a source package as blacklisted. Blacklisted packages will not be added to the bundle.
    '''
    bundle = setupContext(args)
    with choose_commit_context(bundle, args, "EDITED blacklist of bundle '{bundleName}'") as (bundle, git_add):
        originCopy = None
        if os.path.exists(bundle.getBlacklistFile()):
            originCopy = tempfile.NamedTemporaryFile(delete=False).name
            shutil.copyfile(bundle.getBlacklistFile(), originCopy)
        update_blacklist(bundle, args, CANCEL_REMARK.format(action="blacklist"))
        if os.path.isfile(bundle.getBlacklistFile()):
            if editFile(bundle.getBlacklistFile()):
                bundle.normalizeBlacklist()
            else:
                logger.info("Aborting as empty blacklist recognized!")
                if originCopy:
                    shutil.copyfile(originCopy, bundle.getBlacklistFile()) # (rollback)
                    os.remove(originCopy)
                return
        git_add.append(create_reprepro_config(bundle))
        if originCopy:
            os.remove(originCopy)


def cmd_meta(args):
    '''
        Subcommand meta: Edit the bundle's metadata
    '''
    bundle = setupContext(args)
    with choose_commit_context(bundle, args, "EDITED metadata of bundle '{bundleName}'") as (bundle, git_add):
        create_reprepro_config(bundle)
        infofile = edit_meta(bundle, CANCEL_REMARK.format(action="meta"))
        if infofile:
            git_add.append(infofile)
            git_add.append(updateReposConfig())


def cmd_show(args):
    '''
        Subcommand show: Give an overview about the bundle mata-data and it's content.
    '''
    bundle = setupContext(args, False)
    print_metadata(bundle)
    list_content(bundle)


def cmd_list(args):
    '''
        Subcommand list: List the content - the packages - of a bundle.
    '''
    bundle = setupContext(args, False)
    list_content(bundle)


def cmd_seal(args):
    '''
        Subcommand seal: Mark the bundle as ReadOnly and change a suite's tag from 'staging' to 'deploy'.
    '''
    bundle = setupContext(args)
    with choose_commit_context(bundle, args, "SEALED bundle '{bundleName}'") as (bundle, git_add):
        infofile = edit_meta(bundle, CANCEL_REMARK.format(action="seal"))
        if not infofile:
            return
        git_add.append(infofile)
        git_add.append(bundle.updateInfofile(rollout=True))
        git_add.append(create_reprepro_config(bundle, readOnly=True))
        git_add.append(updateReposConfig())
    sealedHook = reprepro_bundle.getHooksConfig().get('bundle_sealed', None)
    if sealedHook:
        cmd = [arg.format(bundleName=bundle.bundleName, bundleSuiteName=bundle.getOwnSuiteName()) for arg in sealedHook.split()]
        logger.info("Calling bundle_sealed hook '{}'".format(" ".join(cmd)))
        try:
            subprocess.check_call(cmd)
        except Exception as e:
            logger.warning("Hook execution failed: {}".format(e))


def cmd_apply(args):
    '''
        Subcommand apply: Use reprepro to update the bundle - This action typically runs on the reprepro server and not locally (besides for testing purposes)
    '''
    bundle = setupContext(args, False)
    if not bundle.isEditable():
        logger.warning("Skipping command 'apply' for {} as it is already sealed.".format(bundle))
        return
    create_reprepro_config(bundle)
    repreproCmd = os.environ.get("REPREPRO_CMD", "reprepro")
    cmd = [repreproCmd, "-b", "repo/bundle/{}".format(bundle.bundleName), "--noskipold", "update"]
    logger.info("Executing '{}'".format(" ".join(cmd)))
    subprocess.check_call(cmd)
    # also export because in case lists are empty update won't create a Release file
    cmd = [repreproCmd, "-b", "repo/bundle/{}".format(bundle.bundleName), "export"]
    logger.info("Executing '{}'".format(" ".join(cmd)))
    subprocess.check_call(cmd)
    with choose_commit_context(bundle, args, "APPLIED changes on bundle '{bundleName}'") as (bundle, git_add):
        git_add.append(update_sources_control_list(bundle, args))
        bundle.normalizeSourcesControlList()
        git_add.append(create_reprepro_config(bundle))


def cmd_update_repos_config(args):
    '''
        Subcommand update-repos-config: updates the file repo/bundle/bundle.repos
    '''
    with choose_commit_context(None, args, "UPDATED apt-repos config") as (unused_bundle, git_add):
        git_add.append(updateReposConfig())


def cmd_clone(args):
    '''
        Subcommand clone: Clones the bundle bundleName into a new bundle (with an automatically created number) for the same distribution.
    '''
    bundle = setupContext(args, False)
    print(bundle.getOwnSuiteName())
    with choose_commit_context(None, args, "CLONED bundle '{srcBundleName} --> '{bundleName}'".format(srcBundleName=bundle.bundleName, bundleName="{bundleName}"), bundle.distribution) as (newBundle, git_add):
        git_add.append(create_reprepro_config(newBundle))
        shutil.copy(bundle.getInfoFile(), newBundle.getInfoFile())
        git_add.append(newBundle.updateInfofile(bundleName=True, basedOn=bundle.bundleName, rollout=False))
        if os.path.exists(bundle.getBlacklistFile()):
            shutil.copy(bundle.getBlacklistFile(), newBundle.getBlacklistFile())
        srcSuiteName = bundle.getOwnSuiteName()
        args.supplier_suites = srcSuiteName
        args.highlighted_suites = srcSuiteName
        args.add_from = srcSuiteName
        args.reference_suites = None
        git_add.append(update_sources_control_list(newBundle, args))
        git_add.append(updateReposConfig())



def cmd_bundles(args):
    '''
        Subcommand bundles: list available bundles.
    '''
    for bundle in sorted(scanBundles()):
        if args.bundleNameFilter in bundle.bundleName:
            if args.readonly and bundle.isEditable():
                continue
            if args.editable and not bundle.isEditable():
                continue
            editable = "EDITABLE" if bundle.isEditable() else "READONLY"
            info = bundle.getInfo()
            target = "[{}]".format(info.get("Target", "no-target"))
            creator = "({})".format(info.get("Creator", "unknown-creator"))
            subject = info.get("Releasenotes", "--no-subject--").split("\n")[0]
            print(" ".join((bundle.bundleName, editable, target, subject, creator)))


def scanBundles():
    res = set()
    bundle_root = os.path.join("repo", "bundle")
    for distribution in os.listdir(bundle_root):
        distribution_path = os.path.join(bundle_root, distribution)
        if not os.path.isdir(distribution_path):
            continue
        for bundleId in os.listdir(distribution_path):
            bundle_path = os.path.join(distribution_path, bundleId)
            if not os.path.isdir(bundle_path):
                continue
            try:
                bundle = Bundle(bundle_path)
                res.add(bundle)
            except BundleError as e:
                logger.info("Skipping invalid bundle '{}': {}".format(bundle_path, str(e)))
    return res


def updateReposConfig():
    bundle_root = os.path.join("repo", "bundle")
    confFile = os.path.join(bundle_root, "bundle.repos")
    with open(confFile, "w") as out:
        print('[', file=out)
        dist = None
        liEnd = None
        for bundle in sorted(scanBundles()):
            if dist != bundle.distribution:
                dist = bundle.distribution
                if liEnd:
                    print(liEnd + ',', file=out)
                print(' {', file=out)
                print('    "Oid": "bundle-repositories-{}",'.format(bundle.distribution), file=out)
                print('    "Suites":', file=out)
                print('    ["--------",', file=out)
                liEnd='    "---------"]\n }'
            tags = list()
            tags.append("staging" if bundle.isEditable() else "sealed")
            rollout = bundle.getInfo().get("Rollout")
            if rollout and rollout.lower() == "true":
                tags.append("rollout")
            print('    {{ "Suite": "{}", "Url": "{}", "Tags": [ "{}" ] }},'.format(bundle.bundleName, bundle.bundleName, '", "'.join(tags)), file=out)
        if liEnd:
            print(liEnd, file=out)
        print(']', file=out)
    return confFile


def setupContext(args, require_editable=True):
    bundle = Bundle(args.bundleName[0])
    if require_editable and not bundle.isEditable():
        raise BundleError("Not allowed to modify bundle '{}' as it is readonly!".format(bundle.bundleName))
    if not os.path.isdir(bundle.getTemplateDir()):
        raise BundleError("No template folder found for distribution '{}'!".format(bundle.distribution))
    logger.info("You are now using bundle '{}'".format(bundle.bundleName))
    apt_repos.setAptReposBaseDir(bundle.getAptReposBasedir())
    try:
        bundle.setOwnSuite(args.own_suite)
    except BundleError as e:
        logger.warning("Could not set Own-Suite: {}".format(e))
    return bundle


def update_sources_control_list(bundle, args, cancel_remark=None):
    (refSuites, selector) = bundle.parseSuitesStr(args.reference_suites)
    logger.info("Setting reference-suites to '{}'".format(selector))
    (supplierSuites, selector) = bundle.parseSuitesStr(args.supplier_suites)
    logger.info("Setting supplier-suites to '{}'".format(selector))
    (highlightedSuites, selector) = bundle.parseSuitesStr(args.highlighted_suites)
    logger.info("Setting highlighted-suites to '{}'".format(selector))
    (addFrom, selector) = bundle.parseSuitesStr(args.add_from if "add_from" in args.__dict__ else None)
    logger.info("Setting add-from to '{}'".format(selector))
    (upgradeFrom, selector) = bundle.parseSuitesStr(args.upgrade_from  if "upgrade_from" in args.__dict__ else None)
    logger.info("Setting upgrade-from to '{}'".format(selector))
    highlightedSuites.extend(upgradeFrom)
    highlightedSuites.extend(addFrom)
    sourcesDict = bundle.parseSourcesControlList()
    upgrade_keep_component = not args.no_upgrade_keep_component if "no_upgrade_keep_component" in args.__dict__ else True
    with apt_repos.suppress_unwanted_apt_pkg_messages() as forked:
        if forked:
            bundle.updateSourcesControlList(supplierSuites, refSuites, sourcesDict, highlightedSuites, addFrom, upgradeFrom, upgrade_keep_component, args.no_apt_update, cancel_remark)
    return bundle.scl


def update_blacklist(bundle, args, cancel_remark=None):
    blacklisted = bundle.parseBlacklist()
    with apt_repos.suppress_unwanted_apt_pkg_messages() as forked:
        if forked:
            bundle.updateBlacklist(blacklisted, False, cancel_remark)
    return bundle.getBlacklistFile()


def create_reprepro_config(bundle, readOnly=False):
    sourcesDict = bundle.parseSourcesControlList()
    updateRules = list()
    suiteDict = dict()
    for unused_source, packages in sourcesDict.items():
        for package in sorted(packages):
            packages = suiteDict.get(package.suiteName, set())
            suiteDict[package.suiteName] = packages
            packages.add(package)
    for suite, packages in suiteDict.items():
        logger.info("Adding Update-Rules for suite {} with {} entries".format(suite, len(packages)))
        updateRules.append(UpdateRule(suite, sorted(packages)))
    return bundle.createConfigFiles(updateRules, readOnly=readOnly)


def edit_meta(bundle, cancel_remark=None):
    with tempfile.NamedTemporaryFile(mode='r+') as tmp:
        infofileToEditformat(bundle.getInfoFile(), tmp, cancel_remark)
        if editFile(tmp.name):
            editformatToInfofile(tmp.name, bundle.getInfoFile())
            return bundle.getInfoFile()
        else:
            logger.info("Aborting as empty metadata file recognized!")
            return None


def print_metadata(bundle):
    print()
    with tempfile.NamedTemporaryFile(mode='r+') as tmp:
        infofileToEditformat(bundle.getInfoFile(), tmp)
        tmp.seek(0)
        print("".join(tmp.readlines()), flush=True)


def list_content(bundle):
    if bundle.getOwnSuiteName():
        subprocess.check_call([APT_REPOS_CMD, "-b .apt-repos", "ls", "-s", bundle.getOwnSuiteName(), "-r", "." ])


def getGitRepoUrl(alias, default):
    pattern = re.compile(r"^" + alias + r"\s+(.*)\s+\(fetch\)$")
    try:
        with open(os.devnull, 'w') as DEV_NULL:
            # using the "long" way instead of 'get-url' for compatibility with older git versions
            for line in subprocess.check_output(["git", "remote", "-v"], stderr=DEV_NULL).decode("utf-8").split("\n"):
                m = pattern.match(line)
                if m:
                    return m.group(1)
    except Exception:
        pass
    return default


def infofileToEditformat(infile, out_fh, cancel_remark=None):
    '''
        converts the info file (which is in the apt_pkg.TagFile-format) into a
        more human editor-format. We don't want to bother our developers with
        details of multiline format.
    '''
    if cancel_remark:
        print(cancel_remark, file=out_fh)
    print("= Bundle-Metadata =".upper(), file=out_fh)
    if True:
        tagfile = apt_pkg.TagFile(infile)
        for section in tagfile:
            for key in section.keys():
                if key == "Releasenotes":
                    continue
                print("{}: {}".format(key, section[key]), file=out_fh)
            if "Releasenotes" in section:
                print("\n= Releasenotes =".upper(), file=out_fh)
                lines = Bundle.unescapeMultiline(section["Releasenotes"])
                for line in lines.split("\n"):
                    print(line, file=out_fh)
    out_fh.flush()


def editformatToInfofile(infile, outfile):
    '''
        converts back from the above human editor-format to TagFile format
    '''
    with open(infile, "r") as in_fh:
        with open(outfile, "w") as out:
            block = 0
            for line in in_fh.readlines():
                line = re.sub(r"\n$", "", line)
                if line == "= BUNDLE-METADATA =":
                    block = 1
                    continue
                elif line == "= RELEASENOTES =":
                    block = 2
                    print("Releasenotes:", end='', file=out)
                    continue
                elif block == 1:
                    if line == "":
                        continue
                    print(line, file=out)
                elif block == 2:
                    line = re.sub(r"^$", ".", line)
                    line = re.sub(r"^", r" ", line)
                    print(line, file=out)
            print("", file=out, flush=True)


def editFile(filepath):
    '''
       Use editor set in environment variable EDITOR or "vim" (if EDITOR is not set)
       to let the file filepath be edited by the user. Returns true if the edited file
       is has non zero size, otherwise false. This way it is possible to implement
       a cancel-mechanism for edit based workflows (similar to what git commit does
       with empty commit message files)
    '''
    editorCmd = os.environ.get("EDITOR", "vim")
    subprocess.check_call([editorCmd, filepath])
    return os.stat(filepath).st_size > 0


@contextmanager
def choose_commit_context(bundle, args, commit_msg, bundleName=None):
    '''
        This context manager evaluates the properties args.clean_commit and args.commit to decide
        how change tracking should be handled. Possible ways are:

        a) Don't track and commit changes
        b) track and commit changes inside the current project-folder
        c) clone the git project into a temporary folder, track and commit changes and push
           the results back to the git server.

        in case ob c), the arguments args.git_repo_url, args.git_branch and args.own_suite are
        required.

        bundle could be None. In this case, a bundleName has to be specified and a new Bundle is
        initialized inside the commit_context using bundleName
    '''
    if args.clean_commit and args.commit:
        raise BundleError("The command line switches --clean-commit and --commit can't be used together!")
    if args.clean_commit:
        with git_clean_commit_and_push_context(args.git_repo_url, args.git_branch, bundle, args.own_suite, commit_msg, bundleName) as (bundle, git_add_list):
            yield (bundle, git_add_list)
    elif args.commit:
        with git_local_commit_context(bundle, commit_msg, bundleName) as (bundle, git_add_list):
            yield (bundle, git_add_list)
    else:
        if (not bundle) and bundleName:
            bundle = Bundle(bundleName)
        yield (bundle, list())


@contextmanager
def git_local_commit_context(bundle, commit_msg, bundleName=None):
    git_add_list = list() # of filenames
    if (not bundle) and bundleName:
        bundle = Bundle(bundleName)
    yield (bundle, git_add_list)
    bundleName = bundle.bundleName if bundle else None
    git_commit(git_add_list, commit_msg.format(bundleName=bundleName))


@contextmanager
def git_clean_commit_and_push_context(git_repo_url, git_branch, bundle, own_suite, commit_msg, bundleName=None):
    if not git_repo_url:
        raise BundleError("Could not determine the git repository url. Use --git-repo-url to set one explicitely.")
    oldDir = os.getcwd()
    # clone to temp dir
    tmpDir = tempfile.mkdtemp()
    basedir = os.path.join(tmpDir, 'local_repo')
    logger.debug("Cloning {} to {}".format(git_repo_url, basedir))
    subprocess.check_call(('git', 'clone', git_repo_url, basedir))
    os.chdir(basedir)
    subprocess.check_call(('git', 'checkout', git_branch))

    if bundle:
        bundle = Bundle(bundle.bundleName, basedir)
    elif bundleName:
        bundle = Bundle(bundleName, basedir)
    try:
        if bundle and own_suite:
            bundle.setOwnSuite(own_suite)
    except BundleError as e:
        logger.warning(str(e))
    git_add_list = list() # of filenames

    yield (bundle, git_add_list)

    bundleName = bundle.bundleName if bundle else None
    git_commit(git_add_list, commit_msg.format(bundleName=bundleName))
    git_push(git_branch)
    os.chdir(oldDir)
    shutil.rmtree(tmpDir)


def git_commit(git_add_list, msg):
    if len(git_add_list) == 0:
        logger.info("Nothing to add for git commit --> skipping git commit")
        return
    try:
        add_cmd = ['git', 'add']
        add_cmd.extend(git_add_list)
        subprocess.check_call(add_cmd)
        subprocess.check_call(('git', 'commit', '-m', msg))
    except subprocess.CalledProcessError as e:
        for line in "Committing '{}' failed for folder '{}':\n{}".format(msg, os.getcwd(), e).split("\n"):
            logger.warning(line)


def git_push(git_branch):
    try:
        subprocess.check_call(('git', 'push', 'origin', git_branch))
    except subprocess.CalledProcessError:
        # did the 'push' failed because of another person pushed before?
        # - fix this situation and retry the 'push'
        subprocess.check_call(('git', 'pull', '-r'))
        subprocess.check_call(('git', 'push', 'origin', git_branch))


if __name__ == "__main__":
    try:
        main()
        sys.exit(0)
    except (BundleError) as e:
        logger.error(str(e))
        sys.exit(1)
