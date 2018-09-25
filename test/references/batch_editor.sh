#!/bin/bash

function batch_editor.sh {
  echo "This is a wrapper for multiple editor commands, called via symlink."
  echo ""
  echo "Usage: ln -s $0 batch_editor_X; ./batch_editor_X file_to_edit"
}

function batch_editor_1 {
  sed -i "s/# ADD_NEW           SRC+BIN  OF 0ad / ADD_NEW           SRC+BIN  OF 0ad /" $@
}

cmd=$(basename $0)
${cmd} $@
