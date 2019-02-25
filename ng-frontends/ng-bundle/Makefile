SHELL:=/bin/bash

all: create-symlinks dist/ng-bundle

install:
	npm install

dist/shared: $(shell find ../ng-bundle-libs/shared -type f)
	ng build --project="shared"

dist/ng-bundle: dist/shared $(shell find src -type f)
	ng build

create-symlinks:
	find projects.symlink src | grep -P ".symlink$$" | while read i; do echo "$$i"; link="$$(cat $$i)"; ln -f -s "$$link" "$${i/.symlink/}"; done
