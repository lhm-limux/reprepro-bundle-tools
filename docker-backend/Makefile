SHELL:=/bin/bash
DOCKER_COMPOSE:=source ./setup_env.sh && docker-compose

main: restart

setup_env.local.sh:
	touch setup_env.local.sh
	chmod u+x setup_env.local.sh

.backend.built: Dockerfile Dockerfile-webserver docker-compose.yml Makefile entrypoint.sh setup_env.sh setup_env.local.sh
	cp ../../*apt-repos*.deb ../deb/*.deb .
	docker pull ubuntu:bionic
	$(DOCKER_COMPOSE) build
	touch .backend.built

start: .backend.built
	$(DOCKER_COMPOSE) up -d

stop:
	$(DOCKER_COMPOSE) stop || true
	$(DOCKER_COMPOSE) rm -f || true

restart: stop .backend.built start
	$(DOCKER_COMPOSE) logs -f

image.tgz: .backend.built
	docker save reprepro-management-worker-service | gzip >../../reprepro-management-worker-service.tar.gz

clean:
	rm -Rf .backend.built *.deb
	$(DOCKER_COMPOSE) rm -f || true
