#!/bin/bash

# Debug Environment Variables Script
echo "🔍 Debugging Environment Variables for Docker Build"
echo "=================================================="

# Check if .env file exists
if [ -f .env ]; then
    echo "✅ .env file found"
    echo ""
    echo "📋 Current VITE_ variables in .env:"
    grep "VITE_" .env || echo "❌ No VITE_ variables found in .env"
    echo ""
else
    echo "❌ .env file not found!"
    echo "   Please create .env file with your environment variables"
    echo ""
fi

# Check if environment variables are set in current shell
echo "🔍 Environment variables in current shell:"
echo "VITE_VENMO_USERNAME: ${VITE_VENMO_USERNAME:-'(not set)'}"
echo "VITE_PAYPAL_ME_USERNAME: ${VITE_PAYPAL_ME_USERNAME:-'(not set)'}"
echo ""

# Test what Docker would see during build
echo "🐳 Testing Docker build context:"
if [ -f .env ]; then
    source .env
    echo "After loading .env:"
    echo "VITE_VENMO_USERNAME: ${VITE_VENMO_USERNAME:-'(not set)'}"
    echo "VITE_PAYPAL_ME_USERNAME: ${VITE_PAYPAL_ME_USERNAME:-'(not set)'}"
else
    echo "Cannot test - no .env file found"
fi

echo ""
echo "💡 Next steps:"
echo "1. Create .env file with VITE_VENMO_USERNAME and VITE_PAYPAL_ME_USERNAME"
echo "2. Run: ./build-docker.sh"
echo "3. Check QR codes in payment modal"