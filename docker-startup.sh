#!/bin/sh

# Docker startup script for Chicken Poop Bingo
# This script runs database migrations before starting the application

set -e

echo "Starting Chicken Poop Bingo application..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h database -U app_user -d chicken_poop_bingo > /dev/null 2>&1; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Run database migrations/schema push
echo "Running database migrations..."
if npm run db:push --force; then
  echo "Database migrations completed successfully"
else
  echo "Warning: Database migrations failed, but continuing startup..."
fi

# Start the application
echo "Starting application server..."
exec node dist/server-bundle.js
