FROM ubuntu:bionic

RUN apt update && apt install -y \
        nodejs \
        npm \
        git \
        make && \
    rm -rf /var/lib/apt/lists/*

RUN /usr/bin/npm install -g npm@6.9.0 && \
    rm /usr/bin/npm && \
    /usr/local/bin/npm install -g @angular/cli@6.2.5 && \
    mkdir /build

VOLUME /build

CMD [ "make", "-C", "/build", "build-in-buildenv" ]
