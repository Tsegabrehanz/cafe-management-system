#!/usr/bin/env bash
# One-time setup for Ubuntu: installs Java 17, Maven and Node.js 20 if missing,
# then builds and starts the Cafe Management System on http://localhost:8081
#
#   ./setup.sh          -> install what's missing, build, run
#   ./setup.sh mysql    -> same, but run with MySQL (see database/cafe-mysql.sql)
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

say() { printf '\n\033[1;35m==> %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- Java 17 + Maven
NEED_APT=()
ls -d /usr/lib/jvm/java-1[7-9]* /usr/lib/jvm/java-2[0-9]* >/dev/null 2>&1 || NEED_APT+=(openjdk-17-jdk)
command -v mvn   >/dev/null || NEED_APT+=(maven)
command -v curl  >/dev/null || NEED_APT+=(curl)
command -v unzip >/dev/null || NEED_APT+=(unzip)

if [ ${#NEED_APT[@]} -gt 0 ]; then
  say "Installing: ${NEED_APT[*]} (your password may be asked)"
  sudo apt update
  sudo apt install -y "${NEED_APT[@]}"
else
  say "Java 17+ and Maven are already installed"
fi

# ---------------------------------------------------------------- Node.js 20 via nvm
set +e   # nvm's own scripts don't work with "set -e"
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  say "Installing nvm (Node version manager)"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0)
if [ "${NODE_MAJOR:-0}" -lt 20 ]; then
  say "Installing Node.js 20"
  nvm install 20
fi
nvm use 20 >/dev/null 2>&1
command -v node >/dev/null || { echo "Node.js could not be installed. Run:  nvm install 20"; exit 1; }
set -e

# ---------------------------------------------------------------- build + run
chmod +x "$ROOT"/*.sh
say "Everything is installed. Building and starting the app..."
exec "$ROOT/build-and-run.sh" "$@"
