SHELL:=/bin/bash

build: src/favicon.ico dist/ng-bundle-compose

install: create-symlinks package-lock.json

package-lock.json: package.json
	npm install

dist/shared: $(shell find ../ng-bundle-libs/shared -type f)
	ng build --project="shared"

dist/ng-bundle-compose: dist/shared $(shell find src -type f)
	ng build

src/favicon.ico: src/assets/icon.png
	/usr/bin/convert -resize x16 -gravity center -crop 16x16+0+0 src/assets/icon.png -flatten -colors 256 -background transparent src/favicon.ico

clean:
	rm -Rf dist/shared dist/ng-bundle-compose node_modules symlinks-created

create-symlinks: symlinks-created

symlinks-created:
	find projects.symlink src | grep -P ".symlink$$" | while read i; do echo "$$i"; linkFrom="$$(cat $$i)"; linkTo="$${i/.symlink/}"; rm -f "$$linkTo"; ln -s "$$linkFrom" "$$linkTo"; done
	touch symlinks-created
