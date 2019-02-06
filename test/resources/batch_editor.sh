#!/bin/bash

function batch_editor.sh {
  echo "This is a wrapper for multiple editor commands, called via symlink."
  echo ""
  echo "Usage: ln -s $0 batch_editor_X; ./batch_editor_X file_to_edit"
}

function bundle_03_edit {
  sed -i "s/# ADD_NEW           SRC+BIN  OF 0ad / ADD_NEW           SRC+BIN  OF 0ad /" "$1"
  sed -i "s/# ADD_NEW           SRC+BIN  OF 389-ds-base / ADD_NEW           SRC+BIN  OF 389-ds-base /" "$1"
}

function bundle_05_meta {
  cat "$1" >repo/editor.in
  sed -i "s/<Subject>/This is my best test bundle/" "$1"
  cat "$1" >repo/editor.out
}

function bundle_07_black {
  cat "$1" >repo/editor.in
  sed -i "s/# 389-ds-base-dev / 389-ds-base-dev /" "$1"
  sed -i "s/# python3/ python3/" "$1"
  cat "$1" >repo/editor.out
}

function bundle_compose_28_edit {
  # we don't want to change the sources list, but check if the reference-suites were considered
  grep "WE_CURRENTLY_HAVE" "$1" >repo/editor.in.grep_currently_have
}

function cancel {
  echo "Creating empty edit-result in order to cancel the current action"
  echo -n "" >"$1"
}

function bundle_10_edit_cancel {
  cancel "$1"
}

function bundle_11_meta_cancel {
  cat "$1" >repo/editor.in
  cancel "$1"
  cat "$1" >repo/editor.out
}

function bundle_12_black_cancel {
  cat "$1" >repo/editor.in
  cancel "$1"
  cat "$1" >repo/editor.out
}

function bundle_12o_edit {
  # temporarily add 'zurl'...
  sed -i "s/# ADD_NEW           SRC+BIN  OF zurl / ADD_NEW           SRC+BIN  OF zurl /" "$1"
}

function bundle_12r_black {
  # ... blacklist 'zurl' binary (needed because we already have other blacklisted binaries)
  sed -i "s/^# zurl / zurl /" "$1"
}

function bundle_12r_edit {
  # ... and remove 'zurl' again
  grep -v "zurl" "$1" >repo/tmp.out
  mv repo/tmp.out "$1"
}

function bundle_13_seal {
  cat "$1" >repo/editor.in
  sed -i "s/<Details>/We just need this bundle for the test automation./" "$1"
  cat "$1" >repo/editor.out
}

function bundle_20_meta {
  cat "$1" >repo/editor.in
  sed -i "s/^Rollout: false/Rollout: true/" "$1"
  cat "$1" >repo/editor.out
}

function bundle_compose_22_bseal {
  cat "$1" >repo/editor.in
  sed -i "s/best test bundle/improved best test bundle/" "$1"
  cat "$1" >repo/editor.out
}

cmd=$(basename $0)
cmd=${cmd/batch_editor_/}

echo "Calling batch-editor $cmd"
${cmd} "$@"
