#!/bin/bash
set -e

if [ "$1" = 'reprepro-management-service' ]; then

    # create and use a fake user's homedir and nss-entries as the underlying
    # contaner system (e.g. OpenShift) might use an arbitrary uid which has
    # no assigned username
    uid=$(id -u)
    gid=$(id -g)
    export HOME="/tmp/home_$uid"
    test -d "$HOME" || mkdir -p "$HOME"
    echo "repoman::$uid:$gid::$HOME:" >"$HOME/fakePwd"
    echo "repoman::$gid:" >"$HOME/fakeGrp"
    export NSS_WRAPPER_PASSWD=$HOME/fakePwd
    export NSS_WRAPPER_GROUP=$HOME/fakeGrp
    export LD_PRELOAD=libnss_wrapper.so

    # copy provided credentials, ssh- and gnupg-settings to it's place
    # - variant 1: provided via mount to /etc/credentials/ssh and /etc/credentials/gnupg
    CRED=/etc/credentials
    mkdir -p ~/.ssh
    test -x ${CRED}/ssh && cp -a ${CRED}/ssh/* ~/.ssh/
    mkdir -p ~/.gnupg; chmod 700 ~/.gnupg
    test -x ${CRED}/gnupg && cp -a ${CRED}/gnupg/* ~/.gnupg/
    # - variant 2: provided via environment variables
    test -z "${SSH_PRIVATE_KEY}" || { echo "${SSH_PRIVATE_KEY}" >~/.ssh/id_rsa; chmod 600 ~/.ssh/id_rsa; }
    test -z "${SSH_PUBLIC_KEY}" || echo "${SSH_PUBLIC_KEY}" >~/.ssh/id_rsa.pub
    test -z "${SSH_KNOWN_HOSTS}" || echo "${SSH_KNOWN_HOSTS}" >~/.ssh/known_hosts
    test -z "${GPG_KEYS}" || { echo "${GPG_KEYS}" | gpg --import; }

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
