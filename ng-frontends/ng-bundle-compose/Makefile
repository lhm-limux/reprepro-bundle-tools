all: dist/ng-bundle-compose

install:
	npm install

dist/shared: $(shell find ../ng-bundle-libs/shared -type f)
	ng build --project="shared"

dist/ng-bundle-compose: dist/shared $(shell find src -type f)
	ng build

clean:
	rm -Rf dist/shared dist/ng-bundle-compose node_modules
