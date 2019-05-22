This page describes the means we have to customize the reprepro-bundle-tools
and the resulting dynamic reprepro configuration to your own needs.

There are currently two kinds of configuration mechanism's that can be
used, `templates` and `apt-repos configuration files`.

In the chapter [Minimal Setup](../README.md#minimal-setup) we created a basic
configuration just by copying an existing configuration from the folder
reprepro-bundle-tools/test into our own "reprepro-management" project:

    cp -a reprepro-bundle-tools/test/.apt-repos/ reprepro-bundle-tools/test/templates/ .

To run the reprepro-bundle-tools, you always need a project directory that
contains at least a folder `templates` and a folder `.apt-repos`. Let's have
a look at these folders:


Templates
=========


Templates for the `bundle`-tool
-------------------------------

The folder `templates/bundle/<distribution>` contains templates needed
for the `bundle`-tool to run and to create config files for the bundle's config-folders
`repo/bundle/<distribution>/<bundle-number>/conf` (where `<distribution>` is
your distribution and `<bundle-number>` is the 5 digit number of a bundle
created with the `bundle`-tool; If you are managing multiple distributions, you would probarbly need more than `<distribution>` folder there).

Please refer to `man reprepro` for a detailled description of the configuration
files for reprepro. This knowledge is required in order to understand the details
of these config settings.

Each template files from this folder is processed by the `bundle` tool using the
jinja2 template engine. This way it is possible to provide great flexibility
for customizations. The jinja2 template language allows to use variables, expressions,
basic control structures and much more. Please have a look at the
[Jinja Template Designer Documentation](http://jinja.pocoo.org/docs/2.10/templates/) for more details.

The following variables are automatically set by the `bundle` tool and can be used
within a template:

* ***creator***:  This is the unix user name of the person running the `bundle` tool
                  as returned by the python call `getpass.getuser()`.
* ***release***:  This is the name of the (target) release this bundle is created for.
                  In contrast to `bundleName` this contains just the release name
                  e.g. `mybionic` and not the bundle number.
* ***readOnly***: This variable by default contains "No". Only if a bundle is sealed,
                  This variable is put to "Yes"
* ***bundleName***: This variable contains the bundle name consisting of
                  `<release>/<bundle-number>`.
* ***baseBundleName***: This variable contains the name of the bundle this bundle is
                  cloned of or "NEW" if the bundle is not cloned from another bundle.
* ***updateRules***: This variable contains the names of the update-Rules created in
                  the updates template. This value is typically meant to be used
                  within the `Update:`-rule of a `distributions` file.

The template engine also distinguishes the following different suffixes of template file names:

* ***<name>.once***: The resulting file `<name>` is only created if it is not already
                 existing. This is usefull to mark a template file to not override
                 an existing file in the bundle's conf directory.
* ***<name>.skel***: This template defines a snippet of lines (a section) that is
                 typically repeated within the resulting file `<name>`.


### distributions

This is the template for `distributions` file created for each bundle. The
`distributions` file is adjusted with each `bundle init`, `bundle clone` and
`bundle edit` call. It typically defines the keywords also contained in this example:

    Origin: MyOwnDistri
    Label: {{ bundleName }}
    Suite: {{ bundleName }}
    Codename: mybionic
    Version: …
    Description: …
    Architectures: i386 amd64 source
    Components: main restricted universe multiverse partner
    UDebComponents: main restricted universe multiverse partner
    Contents: .gz .bz2
    UDebIndices: Packages Release . .gz
    Tracking: minimal
    ReadOnly: {{ readOnly }}
    Update: - {{ updateRules }}


### info.once

This is the template for the `info`-file, a bundle-tool specific file that holds
metadata about the bundle and a Releasenotes section to store information for
latter custom usage. This is an example:

    Bundlename: {{ bundleName }}
    BasedOn: {{ baseBundleName }}
    Distribution: {{ release }}
    Rollout: false
    Target: standard
    Creator: {{ creator }}
    Releasenotes: <Subject>
     .
     <Details>
     .
     __DYNAMIC_PACKAGE_LIST__
     .


### sources_control.list.once

This file is just there to ensure that there's a `sources_control.list` file in
the bundle's conf folder. This list file is also bundle-tool specific and contains
the list of bundles selected by `bundle edit`. Initially this file is empty.


### updates.skel

This skeleton contains the definition of the update-rules generated into
the bundle's updates-file. For each supplier suite (set in `bundle edit`)
an update rule is generated referring to the supplier suite and defining
the relevant information such as Components, Architectures and the list of
Packages we want to use from that supplier suite. The supplier suite specific
information is read from the apt-repos configuration of the supplier-suite
defined in the `.apt-repos` folder (see below). If needed, please find a reference of
apt-repos specific keywords in
[the apt-repos Configuration.md document](https://github.com/lhm-limux/apt-repos/blob/master/docs/Configuration.md).

`bundle edit` supplies the
following additional variables to the `updates.skel` file:

* ***ruleName***: The reprepro identifier of the update rule as also referred
                  in the above variable `updateRules`.
* ***repoUrl***: This supplier suite specific information (pointing to the
                apt-repository) of the supplier suite is read from the apt-repos
                configuration.
* ***suiteName***: The `suiteName` of the supplier suite as it is defined
                in the apt-repos configuration. If the corresponding apt-repos
                config uses `"scan": true`, the suite name could be autodetected by
                apt-repos. Note, that the suite name of the supplier suite typically
                differs from the `release` name of our own distribution.
* ***(udeb)Components***: The list of components of the supplier suites as defined in the
                apt-repos config. Components could also be autodetected using
                `"scan": true` in the apt-repos config.
* ***architectures***: The list of architectures supported by the supplier suite. These
                values could also be autodetected if `"scan": true` is set in the
                apt-repos config.
* ***publicKeys***: The bundle tool is able to create a list of valid keys, reflecting
                all gpg key id's found in the `"TrustedGPG"` file configured for the
                apt-repos suite. These keys are delivered in a form useful for the
                `VerifyRelease` keyword in the update rule.
* ***filterListFile***: For each supplier suite, a FilterListFile is generated that
                defines the (source) packages `reprepro` should receive from the
                supplier suite. This variable contains the uniq name of the list file.
* ***blacklistFile***: If `bundle blacklist` is used, a blacklist file in generated and
                it's name is put into this variable.

Putting all this information together, an example for the updates.skel is:

    Name: {{ ruleName }}
    Method: {{ repoUrl }}
    Suite: {{ suiteName }}
    Components: {{ components }}
    UDebComponents:
    Architectures: {{ architectures }} source
    VerifyRelease: {{ publicKeys }}
    GetInRelease: no
    FilterSrcList: purge {{ filterListFile }}
    {%- if blacklistFile %}
    FilterList: install {{ blacklistFile }}
    {%- endif %}
    DownloadListsAs: .gz


Templates for the `bundle-compose`-tool
---------------------------------------

The folder `templates/bundle_compose/` contains templates that are evaluated by
`bundle-compose apply` for the creation of a reprepro configuration describing the
*target* repository. All generated configuration files for the target
repository can be found in `repo/target/conf`. The apt-repositoy itself is initially
empty. Using the command `reprepro -b repo/target update` causes reprepro to
read the configuration from `repo/target/conf` and to create an apt-repository
containing all our target-suites and their content.

Please refer to `man reprepro` for a detailled description of the configuration
files for reprepro. This knowledge is required in order to understand the details
of these config settings.

In order to create the *reprepro*-configuration, `bundle-compose apply` recursively
copies all files contained in `templates/bundle_compose/` into the target folder
`repo/target/conf` respecting the following rules for different suffixes:

* ***<name>.once***: The resulting file `<name>` is only created if it is not already
                 existing. This is usefull to mark a template file to not override
                 an existing file in the target's conf directory.
* ***<name>.symlink***: In the target's conf directory a symlink named `<name>` will
                 be created, pointing to the corresponding <name>.symlink file in
                 the templates dir. This means that the resulting file is not a
                 copy of the origin file but just a symlink to the origin file.
                 This could be usefull to avoid copies of redundant files. We used
                 this feature e.g. to define a common (and big) blacklist file.
* ****.skel***:  This template defines a snippet of lines (a section) that is
                 typically repeated within some other result file. `*.skel`-files are
                 not copied 1:1 to the target's conf directory but processed in
                 a special way described in the following sections:


### target_distributions.skel --> *distributions/bundle-compose_dynamic.conf*

This file contains the skeleton of a section in the (dynamic) result file
`repo/target/conf/distributions/bundle-compose_dynamic.conf` - *for each target suite*,
one section is added to the result file. Again, we are using the jinja2 template engine
to evaluate the skeleton (please see the
[Jinja Template Designer Documentation](http://jinja.pocoo.org/docs/2.10/templates/) for more details).

The list of available target suites is defined in form of an apt-repos configuration
in the `.apt-repos` folder (see below). Please note that **target suites necissaily
have to be defined in form of
[Self-Contained repo_descriptions](https://github.com/lhm-limux/apt-repos/blob/master/docs/Configuration.md#self-contained-repo_descriptions)!**
This allows us to configure the parameters for target suites even if the target suites
don't yet exist physically (this is needed for bootstrapping a target repository from
scratch).

`bundle-compose apply` reads the target suites from the apt-repos configuration and
passes these data over to the `target_distributions.skel` in form of the following
variables created for each suite:

* ***suite***: The suite name of the target suite (as defined in the apt-repos config).
* ***components***: The components defined for the suite.
* ***archtectures***: The architectures this suite will hold packages for.
* ***updates***: A list of reprepro update rule identifier describing the dynamic
                 content of the target suite (see below for details about the
                 selection of ted content of a target suite).

This is an example for a `target_distributions.skel` file using these variables:

    Origin: MyOwnDistri
    Label: {{ suite }}
    Suite: {{ suite }}
    Codename: {{ suite }}
    Description: merge target for {{ suite }}
    Architectures: {{ architectures }} source
    Components: {{ components }}
    Contents: .gz .bz2
    Update: - {{ updates }}


### bundle_updates.skel --> *updates/bundle-compose_dynamic.conf*

The skeleton `bundle_updates.skel` contains the definition of an update
rule added to the file `repo/target/conf/updates/bundle-compose_dynamic.conf`.
*For each bundle selected* for a target suite, one update rule is generated.
Again, the skeleton is evaluated as a jinja2 template.

The required information about the bundles is read from the apt-repos
configuration contained in the `.apt-repos` folder (details below).

For each bundle, the following variables are passed to the template engine:

* ***ruleName***: The reprepro identifier of the update rule as referred in the
                  variable `updates` (see target_distributions.skel)
* ***repoUrl***:  The repository URL of the bundle (read from the bundle's
                  apt-repos configuration).
* ***suite***:    The suite name of the bundle (read from the bundle's apt-repos
                  configuration). Typically this suitename is the same for all
                  bundles and has no bundle number.
* ***components***: The components defined in the bundle - typically autodetected
                    by apt-repos.
* ***architectures***: The architectures supported by the bundle - read from the
                       apt-repos configuration.
* ***publicKeys***: The public gpg-keys extracted from the TrustedGPG-Files referenced
                    by the apt-repos configuration of the bundles.

An example skeleton is:

    Name: {{ ruleName }}
    Method: {{ repoUrl }}
    Suite: {{ suite }}
    Components: {{ components }}
    Architectures: {{ architectures }} source
    DownloadListsAs: .gz
    GetInRelease: no
    VerifyRelease: {{ publicKeys }}


### bundle-base_updates.skel --> *updates/bundle-compose_dynamic.conf*

The skeleton `bundle-base_updates.skel` contains the definition of an update
rule that is also added to the file `repo/target/conf/updates/bundle-compose_dynamic.conf`.
In contrast to the previous skeleton, this skeleton ist added *for each base-suite* configured
for a target suite. A base suite could for example be a frozen version of an old
repository state - as it is for example used for so called "Point Releases". This
feature allows us to merge several base-suites together to one big repository.
Again, the skeleton is evaluated as a jinja2 template.

The list of base-suites for a target suite is read from the apt-repos
configuration contained in the `.apt-repos` folder (details below).

For each base-suite, the following variables are passed to the template engine:

* ***ruleName***: The reprepro identifier of the update rule as referred in the
                  variable `updates` (see target_distributions.skel)
* ***repoUrl***:  The repository URL of the base-suite (read from the apt-repos
                  configuration).
* ***suite***:    The suite name of the base-suite (read from the apt-repos
                  configuration).
* ***components***: The components defined in the base-suite - typically autodetected
                    by apt-repos.
* ***architectures***: The architectures supported by the base-suite - read from the
                       apt-repos configuration.
* ***targetDistribution***: The suite name of the target suite the bundle is selected
                            for. This suite typically differs from `suite`.
* ***publicKeys***: The public gpg-keys extracted from the TrustedGPG-Files referenced
                    by the apt-repos configuration of the base-suite.

An example skeleton is:

    Name: {{ ruleName }}
    Method: {{ repoUrl }}
    Suite: {{ suite }}
    Components: {{ components }}
    Architectures: {{ architectures }} source
    DownloadListsAs: .gz
    GetInRelease: no
    VerifyRelease: {{ publicKeys }}

An example for using the varibale `targetDistribution` could for example be the
usage of a blacklist of binary packages that should be ignored from the base-suite
during merge, adding the following line to the skeleton:

    FilterList: install FilterList.purge-from-{{ targetDistribution }}

To run this example, ensure that there's a blacklist file with the name `FilterList.purge-from-<targetDistribution>` with the following content:

    binary-package1 purge
    binary-package2 purge
    …
    binary-packageN purge

where *binary-package* are the names of real binary packages.
