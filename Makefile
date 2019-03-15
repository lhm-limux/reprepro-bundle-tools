SHELL:=/bin/bash
PRJDIR:=$(CURDIR)
DOCKER_COMPOSE:=source ./setup_env.sh && docker-compose

build: docker-buildenv/built
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml run --rm buildenv

debian: docker-buildenv/built
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml run --rm buildenv-debian

docker-buildenv/built: docker-buildenv/Dockerfile docker-buildenv/docker-compose.yml
	cp debian/control docker-buildenv/debian_control
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml build buildenv
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml build buildenv-debian
	touch docker-buildenv/built

build-in-buildenv:
	HOME="$(PRJDIR)" make -C ng-frontends/ng-bundle install build
	HOME="$(PRJDIR)" make -C ng-frontends/ng-bundle-compose install build

debian-build-in-buildenv:
	dpkg-buildpackage

clean:
	make -C ng-frontends/ng-bundle clean
	make -C ng-frontends/ng-bundle-compose clean
	rm -Rf docker-buildenv/built .npm .config
