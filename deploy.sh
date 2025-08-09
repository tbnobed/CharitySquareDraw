#!/bin/bash

# Deployment script for Chicken Poop Bingo on Ubuntu Linux
set -e

echo "🐔 Starting Chicken Poop Bingo deployment..."

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
    print_warning ".env file not found. Copying from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your actual values before proceeding."
    print_warning "Especially update DB_PASSWORD and Stripe keys."
    read -p "Press Enter to continue after editing .env file..."
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs ssl

# Set proper permissions
print_status "Setting permissions..."
chmod +x deploy.sh
chmod 644 .env

# Build and start the application
print_status "Building Docker images..."
docker-compose build

print_status "Starting services..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Services are running!"
    
    # Display running services
    echo ""
    print_status "Running services:"
    docker-compose ps
    
    echo ""
    print_status "🎉 Chicken Poop Bingo is now deployed!"
    print_status "Application URL: http://localhost:5000"
    print_status "Admin Dashboard: http://localhost:5000/admin"
    print_status "Seller Interface: http://localhost:5000/seller"
    print_status "History Page: http://localhost:5000/history"
    
    echo ""
    print_status "Useful commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  Update application: docker-compose pull && docker-compose up -d"
    
else
    print_error "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Optional: Set up systemd service for auto-start
read -p "Do you want to set up auto-start on boot? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Setting up systemd service..."
    
    cat > /tmp/chicken-poop-bingo.service << EOF
[Unit]
Description=Chicken Poop Bingo Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo mv /tmp/chicken-poop-bingo.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable chicken-poop-bingo.service
    
    print_status "✅ Auto-start service installed!"
fi

print_status "🎯 Deployment complete!"