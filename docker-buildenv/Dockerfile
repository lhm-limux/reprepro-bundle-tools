FROM ubuntu:bionic

RUN apt update && apt install -y \
        nodejs \
        npm \
        git \
        make \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /build
VOLUME /build

CMD [ "make", "-C", "/build/", "build-in-buildenv" ]
