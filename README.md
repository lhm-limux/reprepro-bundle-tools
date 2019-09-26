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


Managing Your Distribution In A *reprepro-management* Project
-------------------------------------------------------------

Your own debian based distribution will typically consist of many apt-repositories.
Here are some examples:

 * You might want to mirror the apt-repositories of the upstream apt-repositories
   your distribution is based on to your local side to reduce external internet
   traffic and to get less dependent on you external internet connection.
   This could be done by providing a statical reprepro configuration that just
   updates your local mirrors from these upstream apt-repositories.

 * Each *bundle* is from a technical view an own apt-repository with an own
   dynamically created reprepro-configuration that needs to be stored somewhere.

 * Your own distribution might consist of multiple apt-repositories in which you
   provide the suites for different testing- and production environments. Your
   distribution can be considered as a combination of the upstream repositories
   and several bundles. We use configuration files and status files to control how
   the different repositories should be combined to differen *target*-suites.
   
Each of the mentioned examples needs to be configured somewhere. To provide a
(GIT)versioned place for that task, the term *reprepro-management*-project was
created. It contains all static configuration files, dynamic configuration files,
status files and may be helpfull tools in one GIT-Repository. This allows you
to control all changes to your distribution in a single place with a version
history. We give advice how to setup a *reprepro-management* project later.


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

### reprepro_management_service

A python3 module containing classes for a reprepro-management worker service that could be run
in a docker container. It's task is to apply reprepro changes whenever your *reprepro-management*
project changes.

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

### docker-buildenv

This project comes with a docker configuration for building the project


Usage Of The Command-Line-Tools `bundle` and `bundle-compose`
-------------------------------------------------------------

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
