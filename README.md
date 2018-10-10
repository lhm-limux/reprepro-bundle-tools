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

=== bin ===
The bin-folder contains bin wrappers to easily execute the bundle-tools *bundle* and *bundle-compose*

=== reprepro_bundle ===
A python3 module containing the classes needed for the tool *bundle*. With this tool it is possible to **manage single bundles** and to perform the following steps on a bundle:

* create a new (empty) bundle
* add and maintain packages (from predefined supplier-suites)
* blacklist particular binary packages
* edit the bundles metadata
* apply changes using *reprepro*
* mark a bundle as completed (from developers point of view), which means to seal a bundle
* to clone a bundle

=== reprepro_bundle_compose ===
A python3 module containing the classes needed for the tool *bundle-compose*. With this tool it is possible
to **manage the status of bundles in the context of your quality assurance (QA) workflow**. The supports the
following steps:

* synconronize the list of bundles against the current bundle-repositories provided by the development.
  A file called *bundles* will then contain the authorative source for managing the status of bundles
  regarding the QA-workflow.
  
* optionally: Synchronize bundles against a trac-Ticket system to support the QA-workflow

* change the **QA-workflow state** of bundles and control the *stage* on which bundles are visible,
  e.g. dev, test and production

* apply the settings: **create reprepro config files** for the different target suites and stages

=== test ===
The test folder contains a concrete example setup of config files and templates to demonstrate
the management of an own distribution *mybionic* that is based on ubuntu bionic. Look here
to get inspired and as a first startup. 

It also contains a Makefile doing an automatic (integration-)test of the reprepro-bundle-tools
using this example setup. Note: the example setup doesn't show all possible features at the moment
- I'm still working on improving the test suite.
