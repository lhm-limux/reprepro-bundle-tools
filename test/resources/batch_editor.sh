#!/bin/bash

function batch_editor.sh {
  echo "This is a wrapper for multiple editor commands, called via symlink."
  echo ""
  echo "Usage: ln -s $0 batch_editor_X; ./batch_editor_X file_to_edit"
}

function bundle_03_edit {
  sed -i "s/# ADD_NEW           SRC+BIN  OF 0ad / ADD_NEW           SRC+BIN  OF 0ad /" "$1"
}

function bundle_05_meta {
  cat "$1" >repo/editor.in
  sed -i "s/.Subject./This is my best test bundle/" "$1"
  cat "$1" >repo/editor.out
}

function bundle_07_black {
  cat "$1" >repo/editor.in
  sed -i "s/# 0ad/ 0ad/" "$1"
  cat "$1" >repo/editor.out
}

cmd=$(basename $0)
cmd=${cmd/batch_editor_/}

echo "Calling batch-editor $cmd"
${cmd} "$@"
