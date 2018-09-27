#!/bin/bash

function batch_editor.sh {
  echo "This is a wrapper for multiple editor commands, called via symlink."
  echo ""
  echo "Usage: ln -s $0 batch_editor_X; ./batch_editor_X file_to_edit"
}

function bundle_03_edit {
  sed -i "s/# ADD_NEW           SRC+BIN  OF 0ad/ ADD_NEW           SRC+BIN  OF 0ad/" "$1"
}

function bundle_05_meta {
  cat "$1" >repo/editor.in
  sed -i "s/<Subject>/This is my best test bundle/" "$1"
  cat "$1" >repo/editor.out
}

function bundle_07_black {
  cat "$1" >repo/editor.in
  sed -i "s/# 0ad-data-common/ 0ad-data-common/" "$1"
  cat "$1" >repo/editor.out
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

function bundle_13_seal {
  cat "$1" >repo/editor.in
  sed -i "s/<Details>/We just need this bundle for the test automation./" "$1"
  cat "$1" >repo/editor.out
}

cmd=$(basename $0)
cmd=${cmd/batch_editor_/}

echo "Calling batch-editor $cmd"
${cmd} "$@"