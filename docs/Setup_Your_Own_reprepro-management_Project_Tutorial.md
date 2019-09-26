Setting Up Your Own reprepro-management Project
===============================================

There are only few depencencies required to do "repository managment" with reprepro and the reprepro-bundle-tools.
Depending on your requirements the setup of all services could become complex, but for the first start
and impressions, the setup is easy. So let's start with the

Minimal Setup
-------------

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
