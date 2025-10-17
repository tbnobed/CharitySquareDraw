#!/bin/bash
set -e

echo "Starting Chicken Poop Bingo application..."

# Validate DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo $DATABASE_URL | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_USER=$(echo $DATABASE_URL | sed -E 's|.*://([^:]+):.*|\1|')
DB_PASSWORD=$(echo $DATABASE_URL | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
DB_NAME=$(echo $DATABASE_URL | sed -E 's|.*/([^?]+).*|\1|')

export PGPASSWORD="$DB_PASSWORD"

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
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
