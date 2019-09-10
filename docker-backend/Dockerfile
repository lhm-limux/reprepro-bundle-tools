FROM ubuntu:bionic

RUN apt-get update && apt-get install -y \
	libnss-wrapper \
	locales \
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
    chmod 777 /reprepro-management && \
    chmod 755 /entrypoint.sh && \
    rm -f /etc/apt/apt.conf.d/docker-*

# Fix locales not well configured in ubuntu:bionic
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    dpkg-reconfigure --frontend=noninteractive locales && \
    update-locale LANG=en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

VOLUME /reprepro-management

WORKDIR /reprepro-management

EXPOSE 8080

ENTRYPOINT [ "/entrypoint.sh" ]

CMD [ "reprepro-management-service", "--no-open-url", "--host=0.0.0.0" ]
