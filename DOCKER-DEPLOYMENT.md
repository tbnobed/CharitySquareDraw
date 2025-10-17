# Docker Deployment Guide - Chicken Poop Bingo

This guide covers deploying the Chicken Poop Bingo application with Docker, including the new winner percentage split feature.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured (see `.env.example`)

## Features Included

✅ **Configurable Winner/Charity Split**: Admins can set what percentage of the pot goes to the winner vs charity (default 50/50)
✅ **Automatic Database Migrations**: Schema changes are applied automatically on startup
✅ **PostgreSQL Database**: Persistent data storage with automatic backups
✅ **Email Receipt System**: Automated receipt delivery via Gmail
✅ **Payment QR Codes**: Venmo, PayPal, and Cash payment support
✅ **Multi-round Support**: Complete historical data retention

## Quick Start

### 1. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

**Required Variables:**
- `DB_PASSWORD`: Secure database password
- `GMAIL_USER`: Gmail address for sending receipts
- `GMAIL_APP_PASSWORD`: Gmail app password (16 characters)
- `GMAIL_FROM_EMAIL`: From email address
- `ADMIN_PASSWORD`: Admin dashboard password
- `VITE_VENMO_USERNAME`: Venmo username for payments
- `VITE_PAYPAL_ME_USERNAME`: PayPal.me username

### 2. Build and Start Services

```bash
# Build the application (includes migrations)
docker-compose build

# Start all services
docker-compose up -d
```

### 3. Verify Deployment

Check that services are running:

```bash
docker-compose ps
```

Access the application:
- **Application**: http://localhost:5000
- **Admin Dashboard**: http://localhost:5000/admin
- **Seller Interface**: http://localhost:5000/seller

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Application only
docker-compose logs -f app

# Database only
docker-compose logs -f database
```

## Database Migrations

### Automatic Migration on Startup

The application automatically runs database migrations when the container starts. The startup script (`docker-startup.sh`):

1. Waits for PostgreSQL to be ready
2. Runs `npm run db:push --force` to apply schema changes
3. Starts the application server

### Manual Migration

If you need to run migrations manually:

```bash
# Execute migration inside running container
docker-compose exec app npm run db:push --force

# Or restart the app service to trigger migration
docker-compose restart app
```

### Schema Changes

The current schema includes:

- **Game Rounds**: `winner_percentage` field (0-100, default 50)
- **Participants**: Full participant data with payment status
- **Squares**: Square ownership and status tracking

## Winner Percentage Feature

### Default Behavior

- **50/50 split** between winner and charity by default
- Configurable in Admin Dashboard under "Game Settings"
- Percentage can be set from 0-100%

### How It Works

1. Admin sets winner percentage (e.g., 60%)
2. When a winner is drawn:
   - Winner gets 60% of total pot
   - Charity gets 40% of total pot
3. Split is displayed on:
   - Toast notifications
   - Winner display card
   - Receipt pages
   - Admin dashboard

## Environment Variables

### Critical Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_PASSWORD` | PostgreSQL password | ✅ |
| `GMAIL_USER` | Gmail account for receipts | ✅ |
| `GMAIL_APP_PASSWORD` | Gmail app password | ✅ |
| `ADMIN_PASSWORD` | Admin dashboard access | ✅ |
| `VITE_VENMO_USERNAME` | Venmo payment account | ✅ |
| `VITE_PAYPAL_ME_USERNAME` | PayPal payment account | ✅ |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Application port | 5000 |
| `NODE_ENV` | Environment mode | production |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |

## Updating the Application

### Deploy New Version

```bash
# Pull latest changes
git pull

# Rebuild containers
docker-compose build

# Restart services (migrations run automatically)
docker-compose up -d
```

### Zero-Downtime Updates

```bash
# Build new version
docker-compose build

# Create new containers without stopping old ones
docker-compose up -d --no-deps --build app

# Old containers are replaced automatically
```

## Data Backup

### Backup PostgreSQL Database

```bash
# Create backup
docker-compose exec database pg_dump -U app_user chicken_poop_bingo > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker-compose exec -T database psql -U app_user chicken_poop_bingo < backup_20250117_120000.sql
```

### Export Application Data

Use the Admin Dashboard:
1. Go to http://localhost:5000/admin
2. Click "Export Data" button
3. CSV file downloads with all rounds and participants

## Troubleshooting

### Database Migration Fails

```bash
# Check migration logs
docker-compose logs app | grep -i migration

# Force migration manually
docker-compose exec app npm run db:push --force

# Restart app
docker-compose restart app
```

### Connection Issues

```bash
# Check database health
docker-compose exec database pg_isready -U app_user

# Restart all services
docker-compose down
docker-compose up -d
```

### Email Receipts Not Sending

1. Verify Gmail credentials in `.env`
2. Check Gmail App Password is 16 characters
3. View logs: `docker-compose logs app | grep -i email`

## Security Recommendations

1. **Change Default Passwords**: Update `DB_PASSWORD` and `ADMIN_PASSWORD`
2. **Use App Passwords**: Gmail requires app-specific passwords
3. **Firewall Rules**: Only expose port 5000 if needed
4. **HTTPS**: Use reverse proxy (Nginx/Caddy) for SSL
5. **Regular Backups**: Automate database backups

## Performance Tuning

### PostgreSQL Optimization

Edit `docker-compose.yml`:

```yaml
database:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
    POSTGRES_MAX_CONNECTIONS: 100
```

### Application Scaling

```bash
# Run multiple app instances
docker-compose up -d --scale app=3
```

## Support

For issues or questions:
1. Check application logs: `docker-compose logs -f app`
2. Verify environment variables: `docker-compose config`
3. Review this guide for common solutions

## Quick Reference

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose build && docker-compose up -d

# Access app shell
docker-compose exec app sh

# Database backup
docker-compose exec database pg_dump -U app_user chicken_poop_bingo > backup.sql
```
