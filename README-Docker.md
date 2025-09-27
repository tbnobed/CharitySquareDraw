# Docker Deployment Guide for Chicken Poop Bingo

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit your .env file with real values:**
   ```bash
   # Required payment account information
   VITE_VENMO_USERNAME=your_actual_venmo_username
   VITE_PAYPAL_ME_USERNAME=your_actual_paypal_username
   
   # Database password
   DB_PASSWORD=your_secure_database_password
   
   # Optional: Stripe keys if using Stripe payments
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
   ```

3. **Build and run:**
   ```bash
   # Use the provided build script (recommended)
   ./build-docker.sh
   
   # Or build manually
   docker-compose build --no-cache
   docker-compose up -d
   ```

## Important Notes

### Environment Variables in Docker

The `VITE_` prefixed environment variables (Venmo username, PayPal username, Stripe public key) are **embedded during build time** into the frontend bundle. This means:

- You must set these variables in your `.env` file **before** building the Docker image
- Changes to these variables require rebuilding the Docker image
- These variables will be visible in the frontend bundle (which is expected for client-side configuration)

### Build Process

The Docker build process:
1. Loads `VITE_` environment variables as build arguments
2. Embeds them into the Vite frontend bundle during build
3. Creates a production-ready container with your payment account information

### Rebuilding After Changes

If you change any `VITE_` environment variables:
```bash
# Stop the containers
docker-compose down

# Rebuild with new environment variables
./build-docker.sh

# Or manually
docker-compose build --no-cache
docker-compose up -d
```

### Security Considerations

- **Database passwords**: Only visible to the backend container
- **Stripe secret keys**: Only visible to the backend container  
- **Venmo/PayPal info**: Embedded in frontend (visible to users, which is expected)
- **Stripe public key**: Embedded in frontend (designed to be public)

## Troubleshooting

### Environment Variables Not Working

If your Venmo/PayPal information isn't showing up in QR codes:

1. Check your `.env` file has the correct values
2. Rebuild the Docker image: `./build-docker.sh`
3. Verify the build logs show your environment variables being loaded

### Build Script Errors

The `build-docker.sh` script will check for:
- Existence of `.env` file
- Required environment variables are set
- Successful Docker build completion

If it fails, follow the error messages to fix your `.env` configuration.