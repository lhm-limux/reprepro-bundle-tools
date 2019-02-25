SHELL:=/bin/bash

build: dist/ng-bundle

install: create-symlinks
	npm install

dist/shared: $(shell find ../ng-bundle-libs/shared -type f)
	ng build --project="shared"

dist/ng-bundle: dist/shared $(shell find src -type f)
	ng build

clean:
	rm -Rf dist/shared dist/ng-bundle-compose node_modules

create-symlinks:
	find projects.symlink src | grep -P ".symlink$$" | while read i; do echo "$$i"; linkFrom="$$(cat $$i)"; linkTo="$${i/.symlink/}"; rm -f "$$linkTo"; ln -s "$$linkFrom" "$$linkTo"; done
