# Production Environment Setup

## Quick Fix for Environment Variables

Your Docker build isn't picking up the Venmo and Zelle account information because the environment variables aren't being passed during the build process.

### Step 1: Create .env file in your production directory

Create a `.env` file in the same directory as your `docker-compose.yml`:

```bash
# Database Configuration
DB_PASSWORD=your_secure_database_password

# Payment Account Information (Required for QR codes)
VITE_VENMO_USERNAME=this_is_a_test
VITE_ZELLE_EMAIL=test_zelle_email@example.com

# Stripe Payment Configuration (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here

# Application Configuration
NODE_ENV=production
PORT=5000

# Admin Security Configuration
ADMIN_PASSWORD=your_secure_admin_password_here
```

### Step 2: Rebuild Docker Image

Stop your current containers and rebuild with the new environment variables:

```bash
# Stop containers
docker-compose down

# Rebuild with environment variables (using our script)
./build-docker.sh

# Or manually
docker-compose build --no-cache
docker-compose up -d
```

### Step 3: Verify the Fix

After rebuilding, your QR codes should show:
- **Venmo**: `@this_is_a_test` (instead of `@nonprofitname`)
- **Zelle**: `test_zelle_email@example.com` (instead of `nonprofit@email.com`)

## Why This Happens

Vite environment variables (prefixed with `VITE_`) are embedded into the frontend bundle at **build time**, not runtime. This means:

1. Docker needs the variables during the `docker build` step
2. Our Dockerfile now accepts these as build arguments
3. The variables get permanently embedded in the built JavaScript

## For Real Deployment

Replace the test values with your actual payment accounts:

```bash
# Real payment accounts
VITE_VENMO_USERNAME=your_real_venmo_username
VITE_ZELLE_EMAIL=your_real_zelle_email@domain.com
```

Then rebuild the Docker image to embed your real payment information.

## Admin Password Security

The application now includes password protection for sensitive admin functions (Export Data and Reset System). This security feature requires configuration:

### Setting Up Admin Password

1. **Add to your .env file:**
   ```bash
   ADMIN_PASSWORD=your_secure_admin_password_here
   ```

2. **Choose a strong password** - This password protects access to:
   - Data export functionality
   - System reset operations
   - Other sensitive admin functions

3. **Docker Configuration** - The password is automatically passed to the Docker container through docker-compose.yml

### Important Security Notes

- **Change the default password** before production deployment
- **Use a strong, unique password** that's different from your database password
- **Keep the password secure** - only share with authorized administrators
- **The password is required** every time sensitive functions are accessed (no persistent login)