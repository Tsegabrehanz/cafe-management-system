#!/usr/bin/env bash
# Builds the Angular app, puts it inside the Spring Boot app, and starts everything
# on ONE address:  http://localhost:8081
#
#   ./build-and-run.sh            -> built-in database
#   ./build-and-run.sh mysql      -> MySQL (run database/cafe-mysql.sql first)
#   ./build-and-run.sh --no-build -> skip the build, just start the last built version
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
JAR="$ROOT/backend/target/cafe-backend-1.0.0.jar"
PROFILE=""
BUILD=1
for arg in "$@"; do
  case "$arg" in
    mysql) PROFILE="--spring.profiles.active=mysql" ;;
    --no-build) BUILD=0 ;;
  esac
done

# ---------------------------------------------------------------- checks
# Spring Boot 3 needs Java 17+. Ubuntu may default to Java 11 (installed with Maven),
# so pick the newest JDK 17+ we can find and use it for this script.
for jdk in $(ls -d /usr/lib/jvm/java-2[0-9]*-openjdk-* /usr/lib/jvm/java-1[7-9]*-openjdk-* 2>/dev/null | sort -rV); do
  if [ -x "$jdk/bin/java" ]; then export JAVA_HOME="$jdk"; export PATH="$JAVA_HOME/bin:$PATH"; break; fi
done
command -v java >/dev/null || { echo "Java is missing:  sudo apt install -y openjdk-17-jdk"; exit 1; }
JAVA_MAJOR=$(java -version 2>&1 | sed -nE 's/.*version "([0-9]+).*/\1/p' | head -1)
[ "${JAVA_MAJOR:-0}" -ge 17 ] || { echo "Java 17 or newer is needed (found ${JAVA_MAJOR:-none}):  sudo apt install -y openjdk-17-jdk"; exit 1; }
command -v mvn  >/dev/null || { echo "Maven is missing: sudo apt install -y maven"; exit 1; }
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

if [ "$BUILD" = "1" ]; then
  command -v node >/dev/null || { echo "Node.js is missing: install nvm, then  nvm install 20"; exit 1; }

  echo "==> 1/3 Building the frontend (Angular)..."
  cd "$ROOT/frontend"
  [ -d node_modules ] || npm install
  npx ng build --configuration production

  echo "==> 2/3 Copying the frontend into the backend..."
  STATIC="$ROOT/backend/src/main/resources/static"
  rm -rf "$STATIC"
  mkdir -p "$STATIC"
  cp -r "$ROOT/frontend/dist/frontend/browser/." "$STATIC/"

  echo "==> 3/3 Building the backend (Spring Boot)..."
  cd "$ROOT/backend"
  mvn -q -DskipTests package
fi

[ -f "$JAR" ] || { echo "No build found. Run ./build-and-run.sh without --no-build first."; exit 1; }

echo
echo "==> Starting Cafe Management System"
echo "    Open:          http://localhost:8081"
echo "    Online orders: http://localhost:8081/online/menu"
echo "    Staff login:   admin@cafe.com / admin123"
echo "    Stop with Ctrl+C"
echo
cd "$ROOT/backend"          # database files stay in backend/data
exec java -jar "$JAR" $PROFILE
