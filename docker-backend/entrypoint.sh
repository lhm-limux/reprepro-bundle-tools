#!/bin/bash
set -e

if [ "$1" = 'reprepro-management-service' ]; then
    test -z "${GIT_REPO_URL}" && { echo "Error: Please set environment variable GIT_REPO_URL!"; exit 1; }
    echo "Using GIT_REPO_URL=${GIT_REPO_URL}"
    if [ -x "/reprepro-management/.git" ]; then
        git pull -r
    else
	git clone "${GIT_REPO_URL}" /reprepro-management
	git submodule init
    fi
    git submodule update
fi

exec "$@"
