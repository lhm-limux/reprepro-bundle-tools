SHELL:=/bin/bash

build: dist/ng-bundle

prod: clean install dist/shared
	ng build --prod --aot=false --build-optimizer=false

install: .symlinks-created .installed

dist/shared: $(shell find ../ng-bundle-libs/shared -type f)
	ng build --project="shared"

dist/ng-bundle: dist/shared $(shell find src -type f)
	ng build

.installed: package.json
	npm ci
	touch .installed

.symlinks-created:
	find projects.symlink src | grep -P ".symlink$$" | while read i; do \
		echo "$$i"; \
		linkFrom="$$(cat $$i)"; linkTo="$${i/.symlink/}"; \
		rm -f "$$linkTo"; ln -s "$$linkFrom" "$$linkTo"; \
	done
	touch .symlinks-created

clean:
	rm -Rf dist/shared dist/ng-bundle node_modules .symlinks-created .installed

