#!/bin/bash

echo "🚀 Building and deploying Chicken Poop Bingo for Docker..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application
echo "Building application..."
npm run build

echo "✅ Build complete! Ready for Docker deployment."
echo ""
echo "To deploy with Docker:"
echo "1. docker-compose down"
echo "2. docker-compose build"
echo "3. docker-compose up -d"
echo ""
echo "Check logs with: docker-compose logs -f"