# settings for the git repository representing the reprepro-managment project
export GIT_REPO_URL="https://github.com/chrlutz/bundle-test"
export GIT_BRANCH="master"

# git config settings required for commits created by the tooling
export GIT_USERNAME="Reprepro Management Service"
export GIT_EMAIL="repoman@my-own-bionic-distri.org"

# control how the started docker services should be exposed on this host
export HOST_IP="127.0.0.1"
export HOST_NAME="localhost"

# Please use the file setup_env.local.sh to add local
# settings (e.g. for the injection of credentials) that
# should not be versioned. Please copy this example
# config to setup_env.local.sh and adjust it as needed:
#
# export SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)"
# export SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)"
# export SSH_KNOWN_HOSTS="$(cat ~/.ssh/known_hosts)"
#
# export GPG_KEYS="$(GNUPGHOME=... gpg --export-secret-keys --armor)"
#
test -r setup_env.local.sh && source setup_env.local.sh
