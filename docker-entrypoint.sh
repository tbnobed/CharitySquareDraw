#!/bin/sh
set -e

echo "Starting Chicken Poop Bingo application..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h database -U app_user -d chicken_poop_bingo > /dev/null 2>&1; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
node dist/run-migrations.js

# Start the application
echo "Starting application server..."
exec node dist/server-bundle.js
