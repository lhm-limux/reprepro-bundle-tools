SHELL:=/bin/bash
PRJDIR:=$(CURDIR)
DOCKER_COMPOSE:=source ./setup_env.sh && docker-compose

build: docker-buildenv/.buildenv.built
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml run --rm buildenv make -C /build build-in-buildenv

prod: docker-buildenv/.buildenv.built debian-build
	$(DOCKER_COMPOSE) -f docker-buildenv/docker-compose.yml run --rm buildenv make -C /build prod-in-buildenv

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
	HOME="$(PRJDIR)" make -C ng-frontends/ng-bundle-compose-viewer install build

prod-in-buildenv:
	HOME="$(PRJDIR)" make -C ng-frontends/ng-bundle-compose-viewer prod

debian-build-in-buildenv:
	USER="build" HOME="$(PRJDIR)" dpkg-buildpackage
	mkdir -p deb
	for i in $$(cat debian/files | awk '{print $$1}'); do cp ../$$i deb/; done
	cp ../*.changes deb/
	@echo -e "\nDebian-Build finished SUCCESSFULLY! Find Build-Results in folder ./deb/\n"

#backend: debian-build
backend:
	cp ../*apt-repos*.deb docker-backend/
	cp deb/*.deb docker-backend/
	$(DOCKER_COMPOSE) -f docker-backend/docker-compose.yml build
	touch docker-backend/.backend.built

clean:
	make -C ng-frontends/ng-bundle clean
	make -C ng-frontends/ng-bundle-compose clean
	rm -Rf .npm .npm-packages .config \
		docker-backend/.backend.built \
		docker-backend/*.deb \
		docker-buildenv/.buildenv.built \
		docker-buildenv/.buildenv-debian.built \
		docker-buildenv/*apt-repos*.deb \
		deb/
