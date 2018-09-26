#!/bin/bash

function batch_editor.sh {
  echo "This is a wrapper for multiple editor commands, called via symlink."
  echo ""
  echo "Usage: ln -s $0 batch_editor_X; ./batch_editor_X file_to_edit"
}

function bundle_edit {
  sed -i "s/# ADD_NEW           SRC+BIN  OF 0ad / ADD_NEW           SRC+BIN  OF 0ad /" "$1"
}

cmd=$(basename $0)
cmd=${cmd/batch_editor_/}
${cmd} "$@"
