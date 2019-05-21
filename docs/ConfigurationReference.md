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
for the `bundle`-tool to run and to create config files for the target folders
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

* `creator`:        This is the unix user name of the person running the `bundle` tool
                    as returned by the python call `getpass.getuser()`.
* `release`:        This is the name of the (target) release this bundle is created for.
                    In contrast to `bundleName` this contains just the release name
                    e.g. `mybionic` and not the bundle number.
* `readOnly`:       This variable by default contains "No". Only if a bundle is sealed,
                    This variable is put to "Yes"
* `bundleName`:     This variable contains the bundle name consisting of
                    `<release>/<bundle-number>`.
* `baseBundleName`: This variable contains the name of the bundle this bundle is
                    cloned of or "NEW" if the bundle is not cloned from another bundle.
* `updateRules`:    This variable contains the names of the update-Rules created in
                    the updates template. This value is typically meant to be used
                    within the `Update:`-rule of a `distributions` file.

The template engine also distinguishes the following different suffixes of template file names:

* `<name>.once`: The resulting target file `<name>` is only created if it is not already
                 existing. This is usefull to mark a template file to not override
                 an existing file in the target directory.
* `<name>.skel`: This template defines a snippet of lines (a section) that is
                 typically repeated within the resulting target file `<name>`.

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
[the apt-repos Condiguration.md document](https://github.com/lhm-limux/apt-repos/blob/master/docs/Configuration.md).

`bundle edit` supplies the
following additional variables to the `updates.skel` file:

* `ruleName`:   The name of the update rule as referred in the variable `updateRules`
                (see above).
* `repoUrl`:    This supplier suite specific information (pointing to the
                apt-repository) of the supplier suite is read from the apt-repos
                configuration.
* `suiteName`:  The `suiteName` of the supplier suite as it is defined
                in the apt-repos configuration. If the corresponding apt-repos
                config uses `"scan": true`, the suite name could be autodetected by
                apt-repos. Note, that the suite name of the supplier suite typically
                differs from the `release` name of our own distribution.
* `(udeb)Components`: The list of components of the supplier suites as defined in the
                apt-repos config. Components could also be autodetected using
                `"scan": true` in the apt-repos config.
* `architectures`: The list of architectures supported by the supplier suite. These
                values could also be autodetected if `"scan": true` is set in the
                apt-repos config.
* `publicKeys`: The bundle tool is able to create a list of valid keys, reflecting
                all gpg key id's found in the `"TrustedGPG"` file configured for the
                apt-repos suite. These keys are delivered in a form useful for the
                `VerifyRelease` keyword in the update rule.
* `filterListFile`: For each supplier suite, a FilterListFile is generated that
                defines the (source) packages `reprepro` should receive from the
                supplier suite. This variable contains the uniq name of the list file.
* `blacklistFile`: If `bundle blacklist` is used, a blacklist file in generated and
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
