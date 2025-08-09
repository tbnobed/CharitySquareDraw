#!/bin/bash

echo "🔧 Fixing database schema for Chicken Poop Bingo..."

# Stop the current containers
echo "Stopping containers..."
docker-compose down

# Remove the database volume to force clean slate
echo "Removing database volume..."
docker volume rm charitysquaredraw_postgres_data 2>/dev/null || true

# Start just the database
echo "Starting database container..."
docker-compose up -d database

# Wait for database to be ready
echo "Waiting for database to initialize..."
sleep 10

# Copy schema file to container and execute
echo "Creating database schema..."
docker cp create-schema.sql chicken-poop-bingo-db:/tmp/create-schema.sql
docker exec chicken-poop-bingo-db psql -U app_user -d chicken_poop_bingo -f /tmp/create-schema.sql

# Check if tables were created
echo "Verifying tables..."
docker exec chicken-poop-bingo-db psql -U app_user -d chicken_poop_bingo -c "\dt"

# Start the application
echo "Starting application..."
docker-compose up -d app

echo "🎉 Database fix complete! Check logs with: docker-compose logs -f app"