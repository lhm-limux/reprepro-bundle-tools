#!/bin/bash
set -e

for_env() {
  local name="$1"
  local var=$(eval echo \$$name)
  if [ -z "$var" ]; then
    echo "Warning: ENV-Variable $name is not set!"
    return -1
  else
    echo "Applying ENV-Variable $name…"
    return 0
  fi
}

# create and use a fake user's homedir and nss-entries as the underlying
# contaner system (e.g. OpenShift) might use an arbitrary uid which has
# no assigned username
uid=$(id -u)
gid=$(id -g)
export HOME="/tmp/home_$uid"
test -d "$HOME" || mkdir -p "$HOME"
echo "repoman::$uid:$gid::$HOME:" >"$HOME/.fakePwd"
echo "repoman::$gid:" >"$HOME/.fakeGrp"
export NSS_WRAPPER_PASSWD=$HOME/.fakePwd
export NSS_WRAPPER_GROUP=$HOME/.fakeGrp
export LD_PRELOAD=libnss_wrapper.so
echo "Setup HOME='$HOME' and the fake username 'repoman'."


if [ "$1" = 'reprepro-management-service' ]; then

    # copy provided credentials, ssh- and gnupg-settings to it's place
    mkdir -p ~/.ssh
    mkdir -p ~/.gnupg; chmod 700 ~/.gnupg
    for_env SSH_PRIVATE_KEY && { echo "${SSH_PRIVATE_KEY}" >~/.ssh/id_rsa; chmod 600 ~/.ssh/id_rsa; }
    for_env SSH_PUBLIC_KEY && echo "${SSH_PUBLIC_KEY}" >~/.ssh/id_rsa.pub
    for_env SSH_KNOWN_HOSTS && echo "${SSH_KNOWN_HOSTS}" >~/.ssh/known_hosts
    for_env GPG_KEYS && { echo "${GPG_KEYS}" | gpg --import; }

    # ensure that provided git-settings are used and the local repo is up to date
    # (even if the git repo already exists in the persistent storage)
    for_env GIT_REPO_URL || { echo "Error: GIT_REPO_URL is mandatory. Please set this variable!"; exit 1; }
    branch="${GIT_BRANCH:=master}"
    if [ -x "/reprepro-management/.git" ]; then
	echo "Reconfiguring already existing /reprepro-management project for GIT_REPO_URL '${GIT_REPO_URL}' and branch '$branch'."
	(
	    set -x +e
            git remote rm origin
            git remote add origin "${GIT_REPO_URL}"
            git fetch origin
            git branch --set-upstream-to="origin/${branch}" "${branch}"
            git pull -r
            git submodule update
	    true # continue even on err, so we can execute the container and manually fix things
	)
    else
	echo "Initializing new /reprepro-management project with '${GIT_REPO_URL}' and branch '$branch'."
	(
	    set -x +e
            git clone --branch "${branch}" "${GIT_REPO_URL}" /reprepro-management
            git submodule init
            git submodule update
	    true # continue even on err, so we can execute the container and manually fix things
	)
    fi

    # set global git config values requied for git commit
    for_env GIT_EMAIL && git config --global --add user.email "${GIT_EMAIL}"
    for_env GIT_USERNAME && git config --global --add user.name "${GIT_USERNAME}"

fi

exec "$@"
