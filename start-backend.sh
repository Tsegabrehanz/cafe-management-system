#!/usr/bin/env bash
# Starts the Spring Boot backend on http://localhost:8081
#   ./start-backend.sh          -> built-in database (no setup needed)
#   ./start-backend.sh mysql    -> MySQL (run database/cafe-mysql.sql first)
set -e
cd "$(dirname "$0")/backend"

# use Java 17+ even if Ubuntu's default java is older
for jdk in $(ls -d /usr/lib/jvm/java-2[0-9]*-openjdk-* /usr/lib/jvm/java-1[7-9]*-openjdk-* 2>/dev/null | sort -rV); do
  if [ -x "$jdk/bin/java" ]; then export JAVA_HOME="$jdk"; export PATH="$JAVA_HOME/bin:$PATH"; break; fi
done

if ! command -v java >/dev/null || ! command -v mvn >/dev/null; then
  echo "Java and Maven are needed:  sudo apt install -y openjdk-17-jdk maven"
  exit 1
fi

if [ "$1" = "mysql" ]; then
  echo "Starting backend with MySQL (user: ${DB_USERNAME:-cafe})..."
  exec mvn -q spring-boot:run -Dspring-boot.run.profiles=mysql
else
  echo "Starting backend with the built-in database (backend/data/)..."
  exec mvn -q spring-boot:run
fi
