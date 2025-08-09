#!/bin/bash

# Simple Deployment Script for Chicken Poop Bingo (No Nginx)
set -e

echo "🐔 Starting Chicken Poop Bingo deployment (Simple Mode)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your actual values:"
    print_warning "1. Set DB_PASSWORD to a secure password"
    print_warning "2. Add your STRIPE_SECRET_KEY (starts with sk_)"
    print_warning "3. Add your VITE_STRIPE_PUBLIC_KEY (starts with pk_)"
    echo
    read -p "Press Enter to continue after editing .env file..."
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs

# Set proper permissions
print_status "Setting permissions..."
chmod +x deploy-simple.sh
chmod 644 .env

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# Build and start the application
print_status "Building Docker images..."
docker-compose -f docker-compose.simple.yml build app database

print_status "Starting services..."
docker-compose -f docker-compose.simple.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 15

# Check if services are running
if docker-compose -f docker-compose.simple.yml ps | grep -q "Up"; then
    print_status "✅ Services are running!"
    
    # Display running services
    echo ""
    print_status "Running services:"
    docker-compose -f docker-compose.simple.yml ps
    
    echo ""
    print_status "🎉 Chicken Poop Bingo is now deployed!"
    print_status "Application URL: http://localhost:5000"
    print_status "Admin Dashboard: http://localhost:5000/admin"
    print_status "Seller Interface: http://localhost:5000/seller"
    print_status "History Page: http://localhost:5000/history"
    
    echo ""
    print_status "Useful commands:"
    echo "  View logs: docker-compose -f docker-compose.simple.yml logs -f"
    echo "  Stop services: docker-compose -f docker-compose.simple.yml down"
    echo "  Restart services: docker-compose -f docker-compose.simple.yml restart"
    echo "  Update app: docker-compose -f docker-compose.simple.yml build app && docker-compose -f docker-compose.simple.yml up -d app"
    
else
    print_error "❌ Some services failed to start. Check logs with: docker-compose -f docker-compose.simple.yml logs"
    docker-compose -f docker-compose.simple.yml logs
    exit 1
fi

print_status "🎯 Deployment complete!"