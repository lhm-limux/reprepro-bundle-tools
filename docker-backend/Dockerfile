FROM ubuntu:bionic

RUN apt update && apt install -y \
	python3 \
	python3-apt \
	python3-git \
	python3-xdg \
	python3-urllib3 \
	python3-jinja2 \
	python3-crypto \
	python3-aiohttp \
	reprepro \
	git \
	make && \
    rm -rf /var/lib/apt/lists/*

COPY *.deb /

COPY entrypoint.sh /

RUN dpkg -i *.deb && \
    mkdir /reprepro-management && \
    useradd --create-home --shell=/bin/bash --uid=1024 repoman && \
    chown repoman:repoman /reprepro-management && \
    chmod 755 /entrypoint.sh && \
    rm -f /etc/apt/apt.conf.d/docker-*

VOLUME /reprepro-management

WORKDIR /reprepro-management

USER repoman

EXPOSE 8080

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "reprepro-management-service", "--no-open-url", "--host=0.0.0.0" ]
