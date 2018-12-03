all: dist/ng-bundle

install:
	npm install

dist/shared: $(shell find ../ng-bundle-libs/shared -type f)
	ng build --project="shared"

dist/ng-bundle: dist/shared $(shell find src -type f)
	ng build
