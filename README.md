About the reprepro-bundle-tools
===============================

This repository contains a collection of tools that help managing APT-Repositories using
the well known debian tool *reprepro*. Reprepro is a good tool with many abilities.
In particular it allows to **merge packages from different sources (apt-repositories and
contained suites) together into a target repository** - let's say our own distribution.
This is exactly what debian distribution providers need to build up their own
distribution. Many of the well known distributions work like that:
They merge packages from the debian upstream repositories together with own, self
made packages and provide a new APT-repository with the combined set of packages.

With *reprepro* this task can be done by providing a correct set of configuration
files. Configuring reprepro could be exhausing and hard to maintain in complex
environments and in particular if the sources used for merging repositories are
dynamic. This is where the reprepro-bundle-tools come into play. The 
reprepro-bundle-tools provide a kind of convenient layer over *reprepro* so that
**reprepro configuration files are automtically created for you**.

The reprepro-bundle-tools introduce a concept of *bundles*. A *bundle* is a set
of debian packages needed to fulfill a particular task, i.g. for doing security
updates or working on a bug- or requirement ticket from your distributions ticket
system. With bundles it is possible:

* as a kind of **staging feature** to do development tests on the bundle before
  the bundle is added to the development trunk of your distribution (which means
  the bundle is effectiv for other developers, too). If a bundle doesn't pass
  the development process it can be either fixed or completely dropped again.

* as a kind of **release-information** to provide additional information 
  (so called bundle-metadata) that help inform customers about changes introduced
  with a bundle.

* to manage **testing-** and **production environments** for your distribution. It
  allows to define different stages and targets where bundles are added to
  selected target suites based on their status in the development and quality
  assurance process.

Another benefit is that all **changes to your distribution can be versioned
inside a GIT-Repository**, so that developers can always use means of git to
inspect the change history of the distribution.

Managing debian packages in the context of a *bundle* means to add or
change debian **source package versions** and just implied all their derived binary
packages. This means that we don't directly add or change binary packages but always
think on source package level. Once we added a source package (and all derived binary
packages) to our bundle, it is possible to **blacklist particular binary packages** not
needed or wanted inside our distribution. This approach has some advantages:

* It's not possible to incidentely mix up binaries from the same package source name
  but from different versions / builds of the source.

* The binary packages provided in a bundle are always **consistent** and known
  to be derived from the same sources and build-chain.

* The **source is contained** in the bundle, so that no sources are lost and 
  developers can use the source to improve it.

* Still **the mechanism is flexible enough to add packages that are available
  just in binary form** (e.g. if you have to include proprietary software to your
  distribution).

Besides the dependency to *reprepro*, the reprepro-bundle-tools also depend on
https://github.com/lhm-limux/apt-repos needed to define relevant apt-repositories and
suites. With this tool, all source-repositories, bundles and target-repositories
can be easily defined in form of json configuration files. The apt-repos configuration
plays an important part and works as a kind of database for available repositories
suites and their properties. 


Content of this repository
--------------------------

This repository consists of the following parts:

### bin

The bin-folder contains bin wrappers to easily execute the bundle-tools *bundle* and *bundle-compose*

### reprepro_bundle

A python3 module containing the classes needed for the tool *bundle*. With this tool it is possible to **manage single bundles** and to perform the following steps on a bundle:

* create a new (empty) bundle
* add and maintain packages (from predefined supplier-suites)
* blacklist particular binary packages
* edit the bundles metadata
* apply changes using *reprepro*
* mark a bundle as completed (from developers point of view), which means to seal a bundle
* to clone a bundle

### reprepro_bundle_compose

A python3 module containing the classes needed for the tool *bundle-compose*. With this tool it is possible
to **manage the status of bundles in the context of your quality assurance (QA) workflow**. The tool supports the
following steps:

* synconronize the list of bundles against the current bundle-repositories provided by the development.
  A file called *bundles* will then contain the authorative source for managing the status of bundles
  regarding the QA-workflow.
  
* optionally: Synchronize bundles against a trac-Ticket system to support the QA-workflow

* change the **QA-workflow state** of bundles and control the *stage* on which bundles are visible,
  e.g. dev, test and production

* apply the settings: **create reprepro config files** for the different target suites and stages

### reprepro_bundle_appserver

A python3 module containing common classes for an application-server serving the backend for the web-apps
of the reprepro-bundle-tools. At the moment the appserver is meant to run locally on the same
host that runs the frontend part. Being able to run the server part on a dedicated webserver is
subject of later activities.

### test

The test folder contains a concrete example setup of config files and templates to demonstrate
the management of an own distribution *mybionic* that is based on ubuntu bionic. Look here
to get inspired and as a first startup. 

It also contains a Makefile doing an automatic (integration-)test of the reprepro-bundle-tools
using this example setup. Note: the example setup doesn't show all possible features at the moment.
I'm still working on improving the test suite.

### ng-frontends

This folder contains angular 6 frontend code for the following frontent-projects:

* ng-bundle: The web-app counterpart of the command line tool ./bundle (see reprepro_bundle)

* ng-bundle-compose: The web-app counterpart of the command line tools ./bundle-compose (see reprepro_bundle_compose)

* ng-bundle-compose-viewer: a server less frontend displaying general bundle information - needs no login and
                            allows just read only access.

* ng-bundle-libs: common angular libraries used by any of the previously mentioned projects.


Setup
-----

There are only few depencencies required to do "repository managment" with reprepro and the reprepro-bundle-tools.
Depending on your requirements the setup of all services could become complex, but for the first start
and impressions, the setup is easy. So let's start with the

### Minimal Setup

The basic setup runs on a modern debian based system where *debian stretch* and *ubuntu bionic* are tested.
If not already available, the following packages have to be installed on your system:

    sudo apt install make python3 python3-apt python3-git python3-xdg python3-urllib3 python3-jinja2 reprepro git vim

Note: The bundle tools require a text editor and *vim* is used by default. If you
would like to use another editor, please ensure that your environment variable EDITOR
points to that editor (and it is installed).

Now let's start with setting up a project for your own "repository management" tasks.
It is suggested to create a new git repository containing all the configuration for your setup.
This git repository would keep track about all the changes in your distribution in the long run.

These steps would create the git repository for your project and install the required 
dependencies, the *reprepro-bundle-tools* and *apt-repos* as git submodules:

    git init reprepro-managment
    cd reprepro-managment
    git submodule init
    git submodule add https://github.com/lhm-limux/reprepro-bundle-tools.git reprepro-bundle-tools
    git submodule add https://github.com/lhm-limux/apt-repos.git apt-repos
    ln -s reprepro-bundle-tools/bin/bundle .
    ln -s reprepro-bundle-tools/bin/bundle-compose .
    git add bundle bundle-compose
    git commit -am "added initial submodules"

Now it's time to add a configuration. We used the example configuration from the "test" folder
as a template for that.

    cp -a reprepro-bundle-tools/test/.apt-repos/ reprepro-bundle-tools/test/templates/ .

To test if this (unchanged) example run in your environment use `apt-repos/bin/apt-repos -b .apt-repos/ suites` which should output something like:

    INFO[apt_repos]: Using basedir '.apt-repos'
    INFO[apt_repos.Repository]: Scanning Repository 'Main Ubuntu Repository' (http://archive.ubuntu.com/ubuntu/)
    INFO[apt_repos.Repository]: Scanning Repository 'MyBionic-Ziel Repository' (file://{PWD}/repo/target/)
    # ubuntu:bionic [mybionic-supplier:]
    # ubuntu:bionic-backports
    # ubuntu:bionic-proposed
    # ubuntu:bionic-security [mybionic-supplier:]
    # ubuntu:bionic-updates [mybionic-supplier:]
    # target:mybionic-test [bundle-compose-target:, bundle-dist.mybionic:, bundle-stage.prod:, bundle-stage.test:, bundle-target.plus:, bundle-target.unattended:, test:]
    # target:mybionic [bundle-compose-target:, bundle-dist.mybionic:, bundle-stage.prod:, bundle-target.plus:, bundle-target.unattended:, prod:]
    # target:mybionic-unattended [bundle-compose-target:, bundle-dist.mybionic:, bundle-stage.prod:, bundle-target.unattended:, prod:]

If this is given, your setup is ready for maintaining the example suite "mybionic". Please adjust the configuration in the folders *.apt-repos* and
*templates* according to your needs. Please use the above apt-repos command again to check that all apt-repositores and suites are defined for your environment.

* Please ensure that all suites used as upstream suites for your distribution are tagged with **"{yourdist}-supplier:"** (in the above example this is *ubuntu:bionic*, *ubuntu:bionic-security* and *ubuntu:bionic-updates*)
* Also ensure that there are some suites defined and tagged as **"bundle-compose-target:"** which describes the target suites holding your distribution. There are different *bundle-stage* and *bundle-target* attributes possible. With theese attributes it is possible describe the targets (i.g. *plus* and *unattended*) that are responsible for holding bundles that have passed the stages (i.g. *test*, *prod*) in your quality assurance process.

Once your configuration looks reasonable to you, you can commit it:

    git add .apt-repos templates
    git commit -m "my first initial configuration"


First Steps
-----------

Now that you have done the minimal setup, it's time to do the first steps.

This chapter should be described longer in a different document in future to capture the complete set of possible workflow. By now this is just a rough documentation to get the first steps. For the example we assume that you did use the above example configuration without changes (use your own distribution name if you have changed it).

Create your first bundle:

    ./bundle init mybionic --no-clean-commit --commit

Take the time and do `git show` after each step to see the changes that ./bundle automatically commits.

Edit the list of source packages that should be used from the configured supplier suites:

    ./bundle edit mybionic/0001 --commit # and uncomment some "ADD lines" for all packages that should be used.
                                         # I added just the first package "0ad" in my example.
                                         # save the changes and leave the editor to continue!

Apply the changes using reprepro

    gpg --import .apt-repos/gpg/*         # required to import the supplier-suite's public gpg-keys
    ./bundle apply mybionic/0001 --commit

Check the content of your first bundle:

    ./bundle ls mybionic/0001

In the example the following output could be expected:

    INFO[bundle]: You are now using bundle 'mybionic/0001'
    INFO[apt_repos]: Using basedir '.apt-repos'
    INFO[apt_repos.Repository]: Scanning Repository 'Bundle-Repositories for mybionic' (file://{PWD}/repo/bundle/)
    INFO[apt_repos]: Using basedir '.apt-repos'
    INFO[apt_repos.Repository]: Scanning Repository 'Bundle-Repositories for mybionic' (file://{PWD}/repo/bundle/)
    updating (use --no-update to skip) and querying packages lists for 1 suites.1
    Package | Version  | Suite                | Arch  | Section        | Source
    ======= | ======== | ==================== | ===== | ============== | ======
    0ad     | 0.0.22-4 | bundle:mybionic/0001 | amd64 | universe/games | 0ad   
    0ad     | 0.0.22-4 | bundle:mybionic/0001 | i386  | universe/games | 0ad

If you can see the binary packages of the source files just added, everything is fine.
Now it's time to test your bundle. The reprepro-bundle tools are written for a quality assurance process that
consist of tree steps:

 1. development tests,
 2. internal tests by QA-Team,
 3. tests by customers

Getting deeper into each of these steps would be too much for this first tutorial. So let's assume that your
first bundle has passed all these tests and that is now time to get the bundle productive. This is done
with the following commands:

    ./bundle-compose update-bundles
    ./bundle-compose mark-for-stage prod bundle:mybionic/0001 --force
    ./bundle-compose apply
    reprepro -b repo/target update

This should merge the bundle into the productive target suite. Check that everything is fine with

    ./apt-repos/bin/apt-repos -b .apt-repos ls -s target:mybionic -r .

And that's the expected output for the above command:

    INFO[apt_repos]: Using basedir '.apt-repos'
    INFO[apt_repos.Repository]: Scanning Repository 'MyBionic-Ziel Repository' (file://{PWD}/repo/target/)
    updating (use --no-update to skip) and querying packages lists for 1 suites.1
    Package | Version  | Suite           | Arch  | Section        | Source
    ======= | ======== | =============== | ===== | ============== | ======
    0ad     | 0.0.22-4 | target:mybionic | amd64 | universe/games | 0ad   
    0ad     | 0.0.22-4 | target:mybionic | i386  | universe/games | 0ad   

You can see that the packages are now available in *target:mybionic* which is our productive suite.
**Gratulation** if you got similar results!

*Note:* all the above steps, beginning with the "minimal setup" to these "first steps" were
successfully tested with a fresh docker container that was just started with 

    docker run -ti debian:stretch bash
    # apt update
    # apt install ....   # instead `sudo apt install`


Usage
-----

Sorry, ther's currently not the time for writing detailled usage information.

Please look at the (well maintained) command line help provided with each tool:

* ./bundle -h
* ./bundle-compose -h

Please also have a look at [the_testsuite's_Makefile](test/Makefile) for more usage examples of
*bundle* and *bundle-compose*.

And of course look at the above chapter "First Steps".


Enhanced Customization
----------------------

The reprepro-bundle-tools are in it's core just helpers to dynamically create
reprepro configuration files. As already mentioned in the previous chapters,
single aspects of the resulting reprepro config files can be modified using
**templates** and **apt-repos configuration files**. Other aspects regarding
the behaviour of *bundle* and *bundle-compose* can be configured in
**`.bundle.*` or `.bundle-compose.*` files** in the root of your *reprepro-management*
project.  All these means are described in more detail in the
[docs/ConfigurationReference.md](docs/ConfigurationReference.md).


Comparison with other Open Source solutions
-------------------------------------------

There is other Open Source software available targeting similar use cases. One is *aptly*. Others are the *Debian Archive Kit* (https://wiki.debian.org/DebianDak) and tasks also done with the *Ubuntu Launchpad*. This chapter shows some outstanding criteria that were important goals for the creation of this project:

* **Concept of bundles**: The concept of bundles which can contain multiple debian packages (including their sources) and where a bundle contains all outputs from a distribution maintainer "development task" (e.g. security-update, working on a ticket, ...) plays an important role here.
* **Staging and QA-workflows**: This tools were designed with the requirements of having a staging mechanism and supporting QA-workflows where target suites can get different sets of bundles depending on the bundle's status in the workflow.
* **Lightweight / Easy setup**: Reprepro is a lightweight tool that could be used directly from the command line without having any services running. The bundle-tools don't necessarily require a server (as seen in the "First Steps") but they could be combined with a server if necessary. 
* **Tracking distro changes**: Another interesting point is the ability to track all distro changes in a git-repository. This is very useful if a bigger team is maintaining the distribution.
* **Reliability**: *reprepro* has proven to have a stable Database Management in the background and it even works fine with large distributions.
