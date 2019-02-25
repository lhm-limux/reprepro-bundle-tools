FROM ubuntu:bionic

RUN apt update && apt install -y \
        nodejs \
        npm \
        git \
        make \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @angular-devkit/build-angular@~0.8.0 \
    @angular-devkit/build-ng-packagr@~0.8.0 \
    @angular/cli@~6.2.5 \
    @angular/compiler-cli@^6.1.0 \
    @angular/language-service@^6.1.0 \
    @types/jasmine@~2.8.8 \
    @types/jasminewd2@~2.0.3 \
    @types/node@~8.9.4 \
    codelyzer@~4.3.0 \
    jasmine-core@~2.99.1 \
    jasmine-spec-reporter@~4.2.1 \
    karma@~3.0.0 \
    karma-chrome-launcher@~2.2.0 \
    karma-coverage-istanbul-reporter@~2.0.1 \
    karma-firefox-launcher@^1.1.0 \
    karma-jasmine@~1.1.2 \
    karma-jasmine-html-reporter@^0.2.2 \
    ng-packagr@^4.1.0 \
    protractor@~5.4.0 \
    ts-node@~7.0.0 \
    tsickle@>=0.29.0 \
    tslib@^1.9.0 \
    tslint@~5.11.0 \
    typescript@~2.9.2

RUN mkdir /build
VOLUME /build

CMD [ "make", "-C", "/build", "build-in-buildenv" ]
