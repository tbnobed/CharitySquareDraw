# Chicken Poop Bingo - Docker Deployment Guide

This guide will help you deploy the Chicken Poop Bingo application using Docker on Ubuntu Linux.

## 📋 Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM and 10GB disk space
- Internet connection for downloading images

## 🚀 Quick Deployment

### 1. Install Docker (if not already installed)

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Logout and login again, or run:
newgrp docker
```

### 2. Clone and Configure

```bash
# Navigate to your project directory
cd /path/to/chicken-poop-bingo

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
- `DB_PASSWORD`: Strong password for PostgreSQL
- `STRIPE_SECRET_KEY`: Your Stripe secret key (sk_...)
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe public key (pk_...)

### 3. Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 🐳 Manual Docker Commands

### Build and Start Services

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Manage Services

```bash
# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update and restart
docker-compose pull && docker-compose up -d

# Remove everything (including data)
docker-compose down -v
```

## 🗂️ File Structure

```
chicken-poop-bingo/
├── Dockerfile              # Multi-stage build for the app
├── docker-compose.yml      # Service orchestration
├── nginx.conf              # Reverse proxy configuration
├── init.sql                # Database initialization
├── .env                    # Environment variables
├── .dockerignore           # Docker build exclusions
├── deploy.sh               # Automated deployment script
└── README-Docker.md        # This file
```

## 🌐 Service Architecture

### Services Included:

1. **PostgreSQL Database** (`database`)
   - Port: 5432
   - Volume: `postgres_data`
   - Health checks enabled

2. **Node.js Application** (`app`)
   - Port: 5000
   - Depends on database
   - Health checks enabled

3. **Nginx Reverse Proxy** (`nginx`)
   - Ports: 80, 443
   - Load balancing and caching
   - Rate limiting configured

### Network Configuration:
- Internal network: `chicken-poop-network`
- External ports: 80 (HTTP), 443 (HTTPS), 5000 (Direct app access)

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_PASSWORD` | PostgreSQL password | - | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | - | ✅ |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key | - | ✅ |
| `NODE_ENV` | Application environment | production | ❌ |
| `PORT` | Application port | 5000 | ❌ |

### Volume Mounts

- `postgres_data`: Database persistence
- `app_logs`: Application logs
- `./ssl`: SSL certificates (optional)

## 🔒 SSL/HTTPS Setup (Optional)

1. Obtain SSL certificates (Let's Encrypt recommended):
```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com
```

2. Copy certificates:
```bash
mkdir ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown -R $USER:$USER ssl/
```

3. Uncomment SSL section in `nginx.conf`

## 📊 Monitoring and Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f database

# Last 100 lines
docker-compose logs --tail=100 app
```

### Health Checks
```bash
# Check app health
curl http://localhost:5000/api/game

# Check nginx health
curl http://localhost/health

# Check database connection
docker-compose exec database pg_isready -U app_user
```

### Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo netstat -tulpn | grep :5000
   sudo lsof -i :5000
   ```

2. **Database connection failed**
   ```bash
   docker-compose exec database psql -U app_user -d chicken_poop_bingo
   ```

3. **Application won't start**
   ```bash
   docker-compose logs app
   ```

4. **Build failures**
   ```bash
   docker-compose build --no-cache
   ```

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v
docker system prune -f

# Remove all images
docker rmi $(docker images -q)

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build app
docker-compose up -d app
```

### Database Backups
```bash
# Create backup
docker-compose exec database pg_dump -U app_user chicken_poop_bingo > backup.sql

# Restore backup
docker-compose exec -T database psql -U app_user chicken_poop_bingo < backup.sql
```

### System Maintenance
```bash
# Clean up unused resources
docker system prune -f

# Update base images
docker-compose pull
docker-compose up -d
```

## 📞 Support

### Access Points
- **Application**: http://localhost:5000
- **Admin Dashboard**: http://localhost:5000/admin  
- **Seller Interface**: http://localhost:5000/seller

### Log Locations
- Application logs: `./logs/` (mounted volume)
- Container logs: `docker-compose logs`
- System logs: `/var/log/docker/`

For additional support, check the main project documentation or create an issue in the repository.