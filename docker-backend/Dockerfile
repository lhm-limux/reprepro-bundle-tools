FROM ubuntu:bionic

RUN apt update && apt install -y \
        nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /app
VOLUME /app
WORKDIR "/app"

CMD [ "node", "backend/dist" ]
