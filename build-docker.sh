#!/bin/bash

# Docker Build Script for Chicken Poop Bingo
# This script ensures environment variables are properly loaded before building

echo "🐔 Building Chicken Poop Bingo Docker Images..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and set your environment variables."
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables from .env file..."
set -a
source .env
set +a

# Check required variables
required_vars=("VITE_VENMO_USERNAME" "VITE_PAYPAL_ME_USERNAME" "DB_PASSWORD")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo "Please set these variables in your .env file."
    exit 1
fi

echo "✅ Environment variables loaded successfully:"
echo "   VITE_VENMO_USERNAME: $VITE_VENMO_USERNAME"
echo "   VITE_PAYPAL_ME_USERNAME: $VITE_PAYPAL_ME_USERNAME"

# Build with docker-compose
echo "🔨 Building Docker images..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Docker build completed successfully!"
    echo "🚀 You can now run: docker-compose up -d"
else
    echo "❌ Docker build failed!"
    exit 1
fi