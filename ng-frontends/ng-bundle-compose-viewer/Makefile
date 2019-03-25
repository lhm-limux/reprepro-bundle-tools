SHELL:=/bin/bash

build: dist/ng-bundle-compose-viewer

prod: clean install bundle-compose-viewer.tgz

bundle-compose-viewer.tgz:
	ng build --base-href ./ --prod
	rm -f $$(find dist -name "*.symlink")
	ln -s ng-bundle-compose-viewer dist/bundle-compose-viewer
	cd dist && tar czhv -f ../../../deb/bundle-compose-viewer.tgz bundle-compose-viewer
	rm -f dist/bundle-compose-viewer

install: .symlinks-created .installed

dist/ng-bundle-compose-viewer: $(shell find src -type f)
	ng build --base-href ./

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
	rm -Rf dist/shared dist/ng-bundle-compose-viewer \
	       node_modules .symlinks-created .installed \
	       bundle-compose-viewer.tgz

