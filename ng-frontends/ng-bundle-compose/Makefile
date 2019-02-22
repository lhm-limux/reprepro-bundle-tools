all: create-symlinks dist/ng-bundle-compose

install:
	npm install

dist/shared: $(shell find ../ng-bundle-libs/shared -type f)
	ng build --project="shared"

dist/ng-bundle-compose: dist/shared $(shell find src -type f)
	ng build

clean:
	rm -Rf dist/shared dist/ng-bundle-compose node_modules

create-symlinks:
	find ./ | grep -P ".symlink$" | while read i; do echo $i; link=$(cat $i); ln -f -s $link ${i/.symlink/}; done