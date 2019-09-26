This page descibes the steps necessary to build this project

Prerequisites
=============

* Ensure, the following software is installed on your system:

  * git
  * docker
  * docker-compose
  * make

  On a ubuntu (bionic) system this can for example be done using:
  `sudo apt install git docker.io docker-compose make`

* Ensure your user is allowed to use docker (see https://docs.docker.com/install/linux/linux-postinstall/):
  `sudo groupadd docker; sudo usermod -aG docker $USER`

* This repository needs to be cloned to your local machine: 
  `git clone https://github.com/lhm-limux/reprepro-bundle-tools`

* apt-repos needs to be already built - we expect the following deb-files to
  be provided in the parent folder of the reprepro-bundle-tools projects
  (see https://github.com/lhm-limux/apt-repos/blob/master/README.md for more
  infos):

  * apt-repos_<Version>_all.deb
  * python3-apt-repos_<Version>_all.deb



Build
=====

* Run `make debian-build` to create all debian packages for backend,
  frontend and command line tools. Please find the resulting artefacts
  in the `./deb` folder

* (after that) Run `make backend` to create the docker-images for the
  backend. The backend is also started locally for tests in this step.
  If everything was fine, there should be the following docker images
  created (see with `docker images`):

  * reprepro-management-worker-service
  * reprepro-management-webserver

* If you need to provide the image of the reprepro-management-worker-service
  as tar.gz file, please run `make -C docker-backend image.tgz` and find
  the resulting file in the parent folder of this reprepro-management-tools
  project.
