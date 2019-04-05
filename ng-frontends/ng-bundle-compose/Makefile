SHELL:=/bin/bash

build: src/favicon.ico dist/ng-bundle-compose

install: .symlinks-created .installed

prod: clean install src/favicon.ico dist/shared dist/bundle-auth
	ng build --prod --aot=false --build-optimizer=false

dist/shared: $(shell find ../ng-bundle-libs/shared -type f)
	ng build --project="shared"

dist/bundle-auth: $(shell find ../ng-bundle-libs/bundle-auth -type f)
	ng build --project="bundle-auth"

dist/ng-bundle-compose: dist/shared dist/bundle-auth $(shell find src -type f)
	ng build

src/favicon.ico: src/assets/icon.png
	/usr/bin/convert -resize x16 -gravity center -crop 16x16+0+0 src/assets/icon.png -flatten -colors 256 -background transparent src/favicon.ico

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
	rm -Rf dist/shared dist/bundle-auth dist/ng-bundle-compose node_modules .symlinks-created .installed

