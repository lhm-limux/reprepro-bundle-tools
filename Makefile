SHELL:=/bin/bash
PRJDIR:=$(CURDIR)
DOCKER_COMPOSE:=source ./setup_env.sh && docker-compose

build: docker-buildenv/built
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml run --rm buildenv

debian-build: docker-buildenv/.buildenv.built docker-buildenv/.buildenv-debian.built
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml run --rm buildenv-debian

docker-buildenv/.buildenv.built: docker-buildenv/Dockerfile docker-buildenv/docker-compose.yml
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml build buildenv
	touch docker-buildenv/.buildenv.built

docker-buildenv/.buildenv-debian.built: docker-buildenv/Dockerfile-debian docker-buildenv/docker-compose.yml
	cp debian/control docker-buildenv/debian_control
	cp ../*apt-repos*.deb docker-buildenv/
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml build buildenv-debian
	touch docker-buildenv/.buildenv-debian.built

build-in-buildenv:
	HOME="$(PRJDIR)" make -C ng-frontends/ng-bundle install build
	HOME="$(PRJDIR)" make -C ng-frontends/ng-bundle-compose install build

debian-build-in-buildenv:
	USER="build" HOME="$(PRJDIR)" dpkg-buildpackage
	mkdir -p deb
	for i in $$(cat debian/files | awk '{print $$1}'); do cp ../$$i deb/; done
	cp ../*.changes deb/

clean:
	make -C ng-frontends/ng-bundle clean
	make -C ng-frontends/ng-bundle-compose clean
	rm -Rf .npm .config \
		docker-buildenv/.buildenv.built \
		docker-buildenv/.buildenv-debian.built \
		docker-buildenv/*apt-repos*.deb \
		deb/
