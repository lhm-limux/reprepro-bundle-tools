#!/bin/bash
set -e

if [ "$1" = 'reprepro-management-service' ]; then

    # apply provided .ssh-settings
    mkdir -p ~/.ssh
    ssh_private=$(echo "${SSH_PRIVATE_KEY}" | base64 -d || true)
    ssh_public=$(echo "${SSH_PUBLIC_KEY}" | base64 -d || true)
    ssh_known_hosts=$(echo "${SSH_KNOWN_HOSTS}" | base64 -d || true)
    test -z "${ssh_private}" || { echo "${ssh_private}" >~/.ssh/id_rsa; chmod 600 ~/.ssh/id_rsa; }
    test -z "${ssh_public}" || echo "${ssh_public}" >~/.ssh/id_rsa.pub
    test -z "${ssh_known_hosts}" || echo "${ssh_known_hosts}" >~/.ssh/known_hosts

    # ensure that provided git-settings are used and the local repo is up to date
    # (even if the git repo already exists in the persistent storage)
    test -z "${GIT_REPO_URL}" && { echo "Error: Please set environment variable GIT_REPO_URL!"; exit 1; }
    echo "Using GIT_REPO_URL=${GIT_REPO_URL}"
    branch="${GIT_BRANCH:=master}"
    if [ -x "/reprepro-management/.git" ]; then
        git remote rm origin
        git remote add origin "${GIT_REPO_URL}"
        git fetch origin
        git branch --set-upstream-to="origin/${branch}" "${branch}"
        git pull -r
    else
        git clone --branch "${branch}" "${GIT_REPO_URL}" /reprepro-management
        git submodule init
    fi
    git submodule update

    # set global git config values requied for git commit
    test -z "${GIT_EMAIL}" || git config --global --add user.email "${GIT_EMAIL}"
    test -z "${GIT_USERNAME}" || git config --global --add user.name "${GIT_USERNAME}"

fi

exec "$@"
