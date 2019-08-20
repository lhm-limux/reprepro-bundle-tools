import sys

import reprepro_bundle
import reprepro_bundle_compose
import reprepro_bundle_appserver
import re

from distutils.core import setup

from debian.changelog import Changelog

with open('debian/changelog', 'rb') as reader:
    chlog = Changelog(reader, max_blocks = 1)
version = chlog.get_version().full_version

long_description = re.sub(' +', ' ', reprepro_bundle.__doc__.strip())
long_description = re.sub('\n ', '\n', long_description)

description = '''Python3 API and command line tools to manage delivery bundles and delivery workflows in form of apt-repositories created by reprepro'''

settings = dict(

    name = 'reprepro-bundle-tools',
    version = version,

    packages = [
        'reprepro_bundle',
        'reprepro_bundle_compose',
        'reprepro_bundle_appserver',
        'reprepro_management_service'
    ],

    author = 'Christoph Lutz',
    author_email = 'christoph.lutz@interface-ag.de',
    description = description,
    long_description = long_description,

    license = 'EUPL 1.0+',
    url = 'https://github.com/lhm-limux/reprepro-bundle-tools'

)

setup(**settings)
