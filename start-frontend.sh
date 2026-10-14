#!/usr/bin/env bash
# Starts the Angular frontend on http://localhost:4200
set -e
cd "$(dirname "$0")/frontend"

# load nvm if it is installed, so the right Node version is used
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

if ! command -v node >/dev/null; then
  echo "Node.js is needed. Install it with nvm:  nvm install 20"
  exit 1
fi

[ -d node_modules ] || npm install
exec npm start
