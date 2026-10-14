#!/usr/bin/env bash
# Deletes all data and rebuilds the database from scratch.
#   ./reset-database.sh          -> built-in database
#   ./reset-database.sh mysql    -> MySQL (drops and recreates the "cafe" database)
# Stop the backend first. On the next start the admin account
# (admin@cafe.com / admin123) and the sample menu are created again.
set -e
cd "$(dirname "$0")"

read -r -p "This deletes ALL users, products and bills. Continue? [y/N] " answer
[ "$answer" = "y" ] || [ "$answer" = "Y" ] || { echo "Cancelled."; exit 0; }

if [ "$1" = "mysql" ]; then
  sudo mysql < database/cafe-mysql.sql
  echo "MySQL database 'cafe' rebuilt. Start with:  ./start-backend.sh mysql"
else
  rm -rf backend/data
  echo "Built-in database deleted. Start with:  ./start-backend.sh"
fi
