#!/usr/bin/python3 -Es
# -*- coding: utf-8 -*-
"""
   Tool to merge bundles into result repositories depending on their delivery status.
"""

import os
import sys
import argparse
import logging
import re
import tempfile
import subprocess
import apt_repos
from reprepro_bundle_compose import trac_api, PROJECT_DIR
from os.path import expanduser
from shutil import copyfile
from enum import Enum
from urllib.parse import urljoin, urlparse
from jinja2 import Environment, FileSystemLoader
from apt_repos import RepositoryScanner


TEMPLATES_DIR = os.path.join(PROJECT_DIR, "templates", "bundle_compose")
progname = "bundle-compose"
logger = logging.getLogger(progname)
tracConf = os.path.join(expanduser("~"), ".config", progname, "trac.conf")
templateEnv = Environment(loader=FileSystemLoader(TEMPLATES_DIR))


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


class BundleStatus(Enum):
    '''
        This Enum describes the values defined for Status-Fields inside the file `bundles`.

        The meaning of the below parameters are:
        - ord: the uniq id of the enum value
        - stage: the name of the delivery-stage that corresponds to this status.
        - candidates: the status from which we get our candidates for this status.
        - repoSuiteTag: propose a bundle for this status if the bundles RepoSuite defines this tag
        - tracStatus: propose a bundle for this status if the corresponding trac ticket is in this status.
        - tracResolution: if provided, the status is only proposed if both, tracStatus and tracResolution match.
        - override: the status can be automatically replaced by a better matching status. Don't set it for Status that is manually controlled.
        - comment: comments the status
    '''

    UNKNOWN = { 'ord': 0, 'comment': '''
        The status is unkonwn.
    '''}

    STAGING = { 'ord': 1, 'repoSuiteTag': 'staging', 'override':True, 'comment': '''
        The bundle is still in development but already transferred to the backbone for developer tests ('staging').
        In this stage there is no ticket assigned to the bundle.
    '''}

    NEW = { 'ord': 2, 'repoSuiteTag': 'rollout', 'tracStatus': 'new', 'stage': 'dev', 'override':True, 'comment': '''
        The bundle is available (transferred to the backbone by the development) and 'sealed' which means
        it is ready for internal tests.
    '''}

    TEST_INT = { 'ord': 3, 'tracStatus': 'Test', 'override':True, 'comment': '''
        The bundle is currently in test by the internal test team.
    '''}

    REVIEW_DEV = { 'ord': 4, 'tracStatus': 'Übernahmereview', 'override':True, 'comment': '''
        A successfully tested bundle needs a final review by a developer before it could be seen by customers.
    '''}

    TESTED_AND_RELEASED = { 'ord': 5, 'tracStatus': 'Übernahmefreigabe', 'comment': '''
        The bundle was successfully tested and is approved for being seen by customers. It is not yet visible for customers!
    '''}

    TEST_CUST = { 'ord': 6, 'stage': 'test', 'candidates': 'TESTED_AND_RELEASED', 'tracStatus': 'Referatstest', 'comment': '''
        The bundle is visible in the `test`-Teststufe and under test by customers.
    '''}

    PRODUCTION = { 'ord': 7, 'stage': 'prod', 'candidates': 'TEST_CUST', 'tracStatus': 'closed', 'tracResolution': 'fixed', 'comment': '''
        The bundle succesfully finished the customer tests and is now available for production.
    '''}

    DROPPED = { 'ord': 8, 'stage': 'drop', 'tracStatus': 'closed', 'tracResolution': 'invalid', 'override': False, 'comment': '''
        A test for the bundle failed and the bundle has to be dropped.
        A new bundle has to be created instead of fixing the old one.
    '''}

    def __str__(self):
        return str(self.name).lower()

    def getStage(self):
        # pylint: disable=E1101
        return self.value.get('stage')

    def getRepoSuiteTag(self):
        # pylint: disable=E1101
        return self.value.get('repoSuiteTag')

    def getTracStatus(self):
        # pylint: disable=E1101
        return self.value.get('tracStatus')

    def getTracResolution(self):
        # pylint: disable=E1101
        return self.value.get('tracResolution')

    def allowsOverride(self):
        # pylint: disable=E1101
        return self.value.get('override', False)

    def __hash__(self):
        return hash(self.value)

    def __eq__(self, other):
        # pylint: disable=E1136
        selfOrd = self.value['ord']
        otherOrd = other.value['ord']
        return selfOrd == otherOrd

    def __ne__(self, other):
        return not(self == other)

    def __lt__(self, other):
        # pylint: disable=E1136
        selfOrd = self.value['ord']
        otherOrd = other.value['ord']
        return selfOrd < otherOrd

    def getCandidates(self):
        # pylint: disable=E1101
        prev = self.value.get('candidates')
        if prev:
            return BundleStatus.getByName(prev)
        return BundleStatus.UNKNOWN

    @staticmethod
    def getByName(name):
        for s in BundleStatus:
            if name.upper() == s.name:
                return s
        return BundleStatus.UNKNOWN

    @staticmethod
    def getByStage(stage):
        for s in BundleStatus:
            if stage == s.getStage():
                return s
        return BundleStatus.UNKNOWN

    @staticmethod
    def getByTags(tags):
        for s in BundleStatus:
            tag = s.getRepoSuiteTag()
            if tag and tag in tags:
                return s
        return BundleStatus.UNKNOWN

    @staticmethod
    def getByTracStatus(tracStatus, tracResolution):
        for s in BundleStatus:
            if s.getTracStatus() and tracStatus == s.getTracStatus():
                resolution = s.getTracResolution()
                if s==BundleStatus.DROPPED and tracResolution != "fixed":
                    return s
                if resolution and resolution != tracResolution:
                    continue
                return s
        return BundleStatus.UNKNOWN

    @staticmethod
    def getAvailableStages():
        res = set()
        for s in BundleStatus:
            if 'stage' in s.value:
                res.add(s.value.get('stage'))
        return res


class ManagedBundle:
    '''
        This class represents a bundle provided by the apt-repos configuration and manually managed as
        an apt_pkg.TagSection entry found in the `bundles` file. In this context a ManagedBundle is a
        composition of an apt_repos.RepoSuite object and a dict containing the information from the
        apt_pkg.TagSection in which the RepoSuite is read-only and manual changes can be serialized
        back to the `bundles` file.

        This class contains methods to parse, validate and serialize the content from/to the TagSection
        and to modify single aspekts of the TagSection. It also provided methods to access information
        from the corresponding RepoSuite-object.
    '''
    BUNDLE_KEYS = [ "ID", "Status", "Target", "Trac" ]

    def __init__(self, tagSection, repoSuite=None):
        self.__repoSuite = repoSuite
        if tagSection:
            self.__tagSection = tagSection
            self.__id = tagSection['ID']
            self.__status = BundleStatus.getByName(tagSection['Status'])
            self.__target = tagSection['Target']
            self.__trac = tagSection.get('Trac', None)
        elif repoSuite:
            self.__id = repoSuite.getSuiteName()
            self.__tagSection = apt_pkg.TagSection("ID: {}\n".format(self.__id))
            self.__status = BundleStatus.getByTags(repoSuite.getTags())
            self.__target = self.getInfo().get("Target", "unknown")
            self.__trac = None

    def getInfo(self):
        '''
            This returns a dict with the content of the bundle's info-file
            or None if the info file could not be read.
        '''
        if not self.__repoSuite:
            logger.warning("Could not read info file of bundle {} as it's suite could not be found.".format(self.__id))
            return None
        url = urljoin(self.__repoSuite.getRepoUrl(), os.path.join('conf', 'info'))
        res = dict()
        try:
            data = RepositoryScanner.getFromURL(url)
            with tempfile.TemporaryFile() as fp:
                fp.write(data)
                fp.seek(0)
                with apt_pkg.TagFile(fp) as tagfile:
                    tagfile.step()
                    for key in tagfile.section.keys():
                        res[key] = self.__unescapeMultiline(tagfile.section[key])
                return res
        except Exception as e:
            logger.warning("Could not read info file of bundle {}:\n{}".format(self.__id, e))
        return None

    def __unescapeMultiline(self, value):
        lines = list()
        for line in value.split("\n"):
            line = re.sub(r"^ ", "", line)
            line = re.sub(r"^\.$", "", line)
            lines.append(line)
        return "\n".join(lines)

    def getTargetTag(self):
        '''
            This method returns the target tag which is a combination of "stage-distribution-target",
            where `stage` is e.g. "test" or "prod" (definded by the bundle's status),
            `distribution` is the bundles suite-name and `target` is the value of the `Target` field
            from the bundles file. The corresponding target-repoSuite has to define this targetTag
            as a tag in order to mark it responsible for this bundle.
        '''
        return "{}-{}-{}".format(self.getStatus().getStage(), self.getAptSuite(), self.getTarget())

    def getID(self):
        return self.__id

    def getStatus(self):
        return self.__status

    def getTarget(self):
        return self.__target

    def getTrac(self):
        return self.__trac

    def getAptSuite(self):
        if self.__repoSuite:
            return self.__repoSuite.getAptSuite()
        return None

    def getRepoUrl(self):
        if self.__repoSuite:
            return self.__repoSuite.getRepoUrl()
        return None

    def getComponents(self):
        if self.__repoSuite:
            return self.__repoSuite.getComponents()
        return None

    def getArchitectures(self):
        if self.__repoSuite:
            return self.__repoSuite.getArchitectures()
        return None

    def setRepoSuite(self, repoSuite):
        self.__repoSuite = repoSuite

    def setStatus(self, status):
        self.__status = status

    def setTrac(self, tid):
        self.__trac = str(tid)

    def serialize(self):
        changeset = list()
        changeset.append(('Status', str(self.__status)))
        changeset.append(('Target', self.__target))
        if self.__trac:
            changeset.append(('Trac', self.__trac))
        return apt_pkg.rewrite_section(self.__tagSection, self.BUNDLE_KEYS, changeset)

    def __str__(self):
        return self.getID()

    def __hash__(self):
        return hash(self.__id)

    def __eq__(self, other):
        return self.__id == other.__id and self.__status == other.__status and self.__target == other.__target and self.__trac == other.__trac

    def __ne__(self, other):
        return not(self == other)

    def __lt__(self, other):
        if self.__id < other.__id:
            return -1
        elif self.__status < other.__status:
            return -1
        return self.__target < other.__target



def getBundleRepoSuites():
    '''
       This method uses apt-repos to get a list of all currently available (rolled out)
       bundles as a dict of ID to apt_repos.RepoSuite Objects
    '''
    res = dict()
    for suite in sorted(apt_repos.getSuites(["bundle:"])):
        res[suite.getSuiteName()] = suite
    return res


def getTargetRepoSuites(stage):
    '''
       This method uses apt-repos to get a list of all currently available target
       repositories/suites for the deployment stage `stage` as a dict of ID to
       apt_repos.RepoSuite Objects
    '''
    res = dict()
    for suite in sorted(apt_repos.getSuites(["bundle-compose-target:"])):
        if stage in suite.getTags():
            res[suite.getSuiteName()] = suite
    return res


def getUserTracConfig():
    res = dict()
    if not os.path.isfile(tracConf):
        logger.warning("File {} not found.".format(tracConf))
        return res
    with apt_pkg.TagFile(tracConf) as tagFile:
        tagFile.jump(0)
        for section in tagFile:
            for key in section.keys():
                res[key] = section[key]
    return res


def parseBundles(repoSuites=None):
    '''
        Parses the file `bundles` and returns a dict of ID to ManagedBundle-Objects mappings
    '''
    res = dict()
    bundles = os.path.join(PROJECT_DIR, 'bundles')
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
        order back to the file `bundles`
    '''
    with open(os.path.join(PROJECT_DIR, "bundles"), "w") as bundles:
        bundles.write("\n".join([bundle.serialize() for (_, bundle) in sorted(bundlesDict.items())]))
        logger.info("Updated file `bundles`")


def createTargetRepreproConfigs(bundles):
    """
        Creates reprepro config files for targets in all known stages
    """
    for stage in sorted(BundleStatus.getAvailableStages()):
        targets = getTargetRepoSuites(stage)
        if len(targets) > 0:
            createTargetRepreproConfig(bundles, targets, stage)


def createTargetRepreproConfig(bundles, targets, stage):
    """
        Creates reprepro config files for targets in stage stage
    """
    logger.info("Creating reprepro-config for stage '{}'".format(stage))
    autogenerated = "# This file is auto-generated by '{}'. Don't edit it manually!\n".format(progname)
    dist_template = templateEnv.get_template("target_distributions.skel")
    bundle_update_template = templateEnv.get_template("bundle_updates.skel")
    reference_update_template = templateEnv.get_template("reference_updates.skel")

    updateUrls = set()
    for _, target in sorted(targets.items()):
        updateUrls.add(target.getRepoUrl())
        logger.debug("Updating target {} with Url {}".format(target, target.getRepoUrl()))

    for url in sorted(updateUrls):
        logger.info("Creating reprepro-config for URL '{}'".format(url))
        update_line = {}
        update_rules = dict()
        update_targets = list()
        for _, target in sorted(targets.items()):
            if target.getRepoUrl() != url:
                continue
            update_targets.append(target)
            for unused_bid, bundle in sorted(bundles.items()):
                targetTag = bundle.getTargetTag()
                if not targetTag in target.getTags():
                    continue
                ruleName = 'update-' + bundle.getID()
                chunk = bundle_update_template.render(
                    ruleName=ruleName,
                    repoUrl=bundle.getRepoUrl(),
                    suite=bundle.getAptSuite(),
                    components=" ".join(bundle.getComponents()),
                    architectures=" ".join(bundle.getArchitectures()))
                update_rules[ruleName] = chunk
                update_line[target] = update_line.get(target, "") + " " + ruleName
        urlFilepath = re.sub("[^a-zA-z0-9]", "_", url)
        repoConfDir = os.path.join(PROJECT_DIR, 'repos', urlFilepath, 'conf')
        with open(os.path.join(repoConfDir, 'distributions'), "w") as upconf:
            upconf.write(autogenerated)
            for target in update_targets:
                # add references for target's suite
                updates = update_line.get(target, "")
                targetDistribution = target.getAptSuite().split("/")[0]
                for suite in sorted(apt_repos.getSuites(["{}-reference:".format(targetDistribution)])):
                    ruleName = "update-" + suite.getSuiteName()
                    updates += ' ' + ruleName
                    chunk = reference_update_template.render(
                        ruleName=ruleName,
                        repoUrl=suite.getRepoUrl(),
                        suite=suite.getAptSuite(),
                        components=" ".join(suite.getComponents()),
                        architectures=" ".join(suite.getArchitectures()),
                        targetDistribution = targetDistribution)
                    update_rules[ruleName] = chunk

                logger.debug("Updating target {}".format(target))
                upconf.write(dist_template.render(
                    updates=updates,
                    suite=target.getAptSuite(),
                    components=" ".join(target.getComponents()),
                    architectures=" ".join(target.getArchitectures())))
        with open(os.path.join(repoConfDir, 'updates'), "w") as upconf:
            upconf.write(autogenerated)
            upconf.write("".join([v for _, v in sorted(update_rules.items())]))
        for f in os.listdir(TEMPLATES_DIR):
            if not os.path.isdir(f) and not f.endswith(".skel"):
                copyfile(os.path.join(TEMPLATES_DIR, f), os.path.join(repoConfDir, f))


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

    for p in [parse_list]:
        p.add_argument("-s", "--stage", default=None, choices=sorted(BundleStatus.getAvailableStages()), help="""
                        Select only bundles in the provided stage.""")
        p.add_argument("-c", "--candidates", action="store_true", help="""
                        Print the list of candidates for each (selected) status.""")

    for p in [parse_stage]:
        p.add_argument("-c", "--candidates", action="store_true", help="""
                        Automatically add all candiates for this stage. Available candidates can be viewed with '{} list -c'.""".format(progname))
        p.add_argument("-f", "--force", action="store_true", help="""
                        Don't check if a bundle is ready for being put into the new stage.""".format(progname))
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
    repo_suites = getBundleRepoSuites()
    managed_bundles = parseBundles()
    ids = set(repo_suites.keys()).union(managed_bundles.keys())

    trac = None
    try:
        config = getUserTracConfig()
        trac = trac_api.TracApi(config['TracUrl'], config['User'], config.get('Password'))
    except KeyError as e:
        logger.warn("Missing Key {} in config file '{}' --> no synchronization with trac will be done!".format(e, tracConf))
    except Exception as e:
        logger.warn("Trac will not be synchronized: {}".format(e))

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
                logger.warn("Das Target-Feld für {} ist nicht mehr aktuell. Bitte manuell im File `bundles` von '{}' auf '{}' umstellen.".format(bundle, bundle.getTarget(), bundle.getInfo().get("Target")))
            suiteStatus = BundleStatus.getByTags(suite.getTags())
            if bundle.getStatus() < suiteStatus:
                if bundle.getStatus().allowsOverride():
                    bundle.setStatus(suiteStatus)
                else:
                    logger.warn("Es gibt einen neuen Status im Bundle-Repository. Bitte manuell im File `bundles` das {} von Status '{}' auf '{}' umstellen.".format(bundle, bundle.getStatus(), suiteStatus))
        if trac:
            if not bundle.getTrac():
                if bundle.getStatus() > BundleStatus.STAGING:
                    tid = createTracTicketForBundle(trac, bundle)
                    bundle.setTrac(tid)
                else:
                    continue
            ticket = trac.getTicketValues(bundle.getTrac())
            fetchedTracStatus = BundleStatus.getByTracStatus(ticket['status'], ticket.get('resolution'))
            if bundle.getStatus() < fetchedTracStatus:
                if bundle.getStatus().allowsOverride():
                    bundle.setStatus(fetchedTracStatus)
                else:
                    logger.warn("Es gibt einen neuen Status im Trac-Ticket #{}. Bitte manuell im File `bundles` das {} von Status '{}' auf '{}' umstellen.".format(bundle.getTrac(), bundle, bundle.getStatus(), fetchedTracStatus))
                    continue
            pushTracStatus = bundle.getStatus().getTracStatus()
            pushTracResolution = bundle.getStatus().getTracResolution()
            if pushTracStatus and ticket['status'] != pushTracStatus:
                trac.updateTicket(bundle.getTrac(), "Bundle Status-Update durch Broker", None, pushTracStatus, pushTracResolution if pushTracResolution else "")
                logger.info("Updated {}, Trac-Ticket #{} to '{}'".format(bundle, bundle.getTrac(), (pushTracStatus + " as " + pushTracResolution) if pushTracResolution else pushTracStatus))

    storeBundles(managed_bundles)


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
    tracUrl = getUserTracConfig().get('TracUrl')
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


def createTracTicketForBundle(trac, bundle):
    info = bundle.getInfo()
    milestone = Distribution.getByName(info.get('Distribution', '')).getMilestone()
    (subject, description) = splitReleasenotes(info)
    package_list = subprocess.check_output(["apt-repos/bin/apt-repos", "-b .apt-repos", "ls", "-s", str(bundle.getID()), "-r", "." ])
    description = description.replace("__DYNAMIC_PACKAGE_LIST__", package_list.decode("utf-8").rstrip())
    title = "[{}] {}".format(bundle.getTarget(), subject)
    return trac.createTicket(title, description, {
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


if __name__ == "__main__":
    main()
