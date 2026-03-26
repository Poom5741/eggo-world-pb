# Docker Deployment Guide

Complete guide for running eggo-pb with Docker Compose.

## Prerequisites

- Docker Desktop (macOS/Windows) or Docker Engine (Linux)
- Docker Compose v2.0+
- LINE Login channel credentials

## Quick Start

### 1. Clone and Setup

```bash
cd /Users/poom-work/tokenine/eggo-pocketbase/eggo-pb

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

### 2. Configure Environment Variables

Edit `.env` file:

```bash
# LINE OAuth (get from LINE Developers Console)
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=your_channel_secret_here

# Wallet Encryption (CRITICAL - generate new key!)
WALLET_MASTER_KEY=$(openssl rand -hex 32)

# Or manually create a 64-character hex string
WALLET_MASTER_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# App Configuration
APP_NAME=eggo-pb
APP_URL=http://localhost:8090
NODE_ENV=development
```

### 3. Build and Start

```bash
# Build Docker image and start container
docker compose up -d --build

# View logs
docker compose logs -f pocketbase

# Check status
docker compose ps
```

### 4. Access PocketBase

Open browser: http://localhost:8090/_/

Create your admin account on first login.

### 5. Import Collection Schema

1. Log into Admin UI: http://localhost:8090/_/
2. Go to **Settings** → **Import collections**
3. Copy and paste contents of `collections/users.json`
4. Click **Import**

### 6. Configure LINE OAuth

Follow `docs/LINE_OAUTH_SETUP.md` to configure LINE OAuth provider in PocketBase Admin UI.

---

## Docker Commands Reference

### Basic Operations

```bash
# Start (build if needed)
docker compose up -d --build

# Start without build
docker compose up -d

# Stop
docker compose down

# Stop and remove volumes (WARNING: deletes database!)
docker compose down -v

# Restart
docker compose restart

# View logs
docker compose logs

# Follow logs
docker compose logs -f

# View specific service logs
docker compose logs pocketbase
```

### Container Access

```bash
# Enter container shell
docker compose exec pocketbase sh

# Run PocketBase commands inside container
docker compose exec pocketbase ./pocketbase --help

# View container info
docker compose exec pocketbase ls -la /pb_data

# Check environment variables
docker compose exec pocketbase env | grep -E "LINE|WALLET|APP"
```

### Database Management

```bash
# Backup database
docker compose exec pocketbase cp /pb_data/data.db /pb_data/backup-$(date +%Y%m%d).db

# Export backup to host
docker compose cp pocketbase:/pb_data/data.db ./backups/data-$(date +%Y%m%d).db

# Restore from backup
docker compose cp ./backups/data-backup.db pocketbase:/pb_data/data.db
docker compose restart pocketbase
```

### Rebuilding

```bash
# Rebuild after changing hooks
docker compose up -d --build --force-recreate

# Rebuild without cache
docker compose build --no-cache pocketbase
docker compose up -d
```

---

## Production Deployment

### 1. Update Environment

```bash
# Production .env
NODE_ENV=production
APP_URL=https://pocketbase.your-domain.com
WALLET_MASTER_KEY=<generate-new-secure-key>
```

### 2. Use Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  pocketbase:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: eggo-pb-prod
    restart: always
    ports:
      - "8090:8090"
    volumes:
      - ./pb_data:/pb_data
      - ./pb_hooks:/pb/pb_hooks:ro
    environment:
      - LINE_CHANNEL_ID=${LINE_CHANNEL_ID}
      - LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET}
      - WALLET_MASTER_KEY=${WALLET_MASTER_KEY}
      - APP_NAME=${APP_NAME:-eggo-pb}
      - APP_URL=${APP_URL}
      - NODE_ENV=production
    env_file:
      - .env.production
    networks:
      - eggo-network
  
  # Optional: nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: eggo-pb-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - pocketbase
    networks:
      - eggo-network

networks:
  eggo-network:
    driver: bridge
```

### 3. nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream pocketbase {
        server pocketbase:8090;
    }
    
    server {
        listen 80;
        server_name pocketbase.your-domain.com;
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name pocketbase.your-domain.com;
        
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        location / {
            proxy_pass http://pocketbase;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### 4. Deploy

```bash
# Start production stack
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs pocketbase

# Check if port is in use
docker ps | grep 8090
lsof -i :8090

# Check environment variables
docker compose config
```

### Database not persisting

```bash
# Verify volume mount
docker compose exec pocketbase ls -la /pb_data

# Check permissions
docker compose exec pocketbase ls -la /pb_data/data.db
```

### Hooks not loading

```bash
# Verify hooks are mounted
docker compose exec pocketbase ls -la /pb/pb_hooks

# Check hook syntax
docker compose exec pocketbase node -c /pb/pb_hooks/00-config.pb.js
```

### WALLET_MASTER_KEY issues

```bash
# Verify key is set
docker compose exec pocketbase env | grep WALLET_MASTER_KEY

# Check key length
docker compose exec pocketbase sh -c 'echo $WALLET_MASTER_KEY | wc -c'
```

### Rebuild after code changes

```bash
# Force rebuild
docker compose up -d --build --force-recreate pocketbase

# Clear build cache
docker compose build --no-cache pocketbase
docker compose up -d
```

### Database migration errors

```bash
# Check pb_migrations directory
docker compose exec pocketbase ls -la /pb/pb_migrations

# View migration logs
docker compose logs pocketbase | grep -i migration
```

---

## Backup Strategy

### Automated Backups

Create `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T pocketbase cp /pb_data/data.db /tmp/data-$DATE.db
docker compose exec -T pocketbase tar -czf /tmp/data-$DATE.db.tar.gz /tmp/data-$DATE.db
docker compose cp pocketbase:/tmp/data-$DATE.db.tar.gz $BACKUP_DIR/
docker compose exec pocketbase rm /tmp/data-$DATE.db /tmp/data-$DATE.db.tar.gz

# Keep only last 7 days
find $BACKUP_DIR -name "data-*.db.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/data-$DATE.db.tar.gz"
```

Add to crontab:
```bash
0 2 * * * /path/to/eggo-pb/backup.sh
```

### Manual Backup

```bash
# Quick backup
docker compose cp pocketbase:/pb_data/data.db ./backup-$(date +%Y%m%d).db

# Full backup with metadata
docker compose exec pocketbase tar -czf /tmp/full-backup.tar.gz /pb_data
docker compose cp pocketbase:/tmp/full-backup.tar.gz ./backups/
```

### Restore from Backup

```bash
# Stop container
docker compose down

# Copy backup to data directory
cp ./backups/data-20240101.db ./pb_data/data.db

# Or restore from tar.gz
tar -xzf ./backups/full-backup.tar.gz -C ./pb_data

# Start container
docker compose up -d
```

---

## Security Considerations

### 1. Environment Variables

- ✅ Never commit `.env` to git
- ✅ Use strong `WALLET_MASTER_KEY` (64+ characters)
- ✅ Different keys for dev/staging/production
- ✅ Use Docker secrets in production (Swarm/Kubernetes)

### 2. Database Security

```yaml
# Add to docker-compose.yml for production
volumes:
  - ./pb_data:/pb_data:rw
```

- ✅ Set restrictive permissions: `chmod 700 pb_data/`
- ✅ Encrypt backups
- ✅ Don't expose port 8090 publicly (use nginx)

### 3. Network Security

```yaml
# Production: don't expose port directly
# Use nginx with HTTPS instead
networks:
  eggo-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### 4. Resource Limits

```yaml
# Add to docker-compose.yml
services:
  pocketbase:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## Monitoring

### Health Check

```bash
# Check health endpoint
curl http://localhost:8090/api/health

# From inside container
docker compose exec pocketbase wget -qO- http://localhost:8090/api/health
```

### Logs

```bash
# Real-time logs
docker compose logs -f pocketbase

# Last 100 lines
docker compose logs --tail=100 pocketbase

# Export logs
docker compose logs pocketbase > pocketbase.log
```

### Metrics

```bash
# Container stats
docker stats eggo-pb

# Container info
docker inspect eggo-pb

# Database size
docker compose exec pocketbase du -sh /pb_data
```

---

## Performance Tuning

### 1. Volume Performance (macOS)

For better performance on macOS:

```yaml
volumes:
  - ./pb_data:/pb_data:cached
  - ./pb_hooks:/pb/pb_hooks:ro,cached
```

### 2. Database Optimization

```bash
# Vacuum database (run periodically)
docker compose exec pocketbase ./pocketbase db vacuum

# Check database integrity
docker compose exec pocketbase ./pocketbase db integrity
```

### 3. Connection Pooling

For high-traffic production:

```yaml
# Add reverse proxy with connection pooling
# See nginx configuration above
```

---

## Common Issues

### Issue: "Permission denied" on volumes

**Solution**:
```bash
# Fix permissions
sudo chown -R $(whoami):$(whoami) ./pb_data
chmod 700 ./pb_data
```

### Issue: Container crashes on startup

**Solution**:
```bash
# Check logs
docker compose logs pocketbase

# Verify .env file exists and is valid
docker compose config
```

### Issue: Database locked

**Solution**:
```bash
# Stop container
docker compose down

# Remove lock file
rm ./pb_data/data.db-shm ./pb_data/data.db-wal

# Start container
docker compose up -d
```

### Issue: Hooks not reloading

**Solution**:
```bash
# Force recreate container
docker compose up -d --force-recreate pocketbase
```

---

## Next Steps

1. ✅ PocketBase running with Docker
2. → Import `collections/users.json` schema
3. → Configure LINE OAuth (see `docs/LINE_OAUTH_SETUP.md`)
4. → Test wallet creation
5. → Read `docs/WALLET_SECURITY.md` for security best practices

## Support

- Docker docs: https://docs.docker.com/
- Docker Compose docs: https://docs.docker.com/compose/
- PocketBase docs: https://pocketbase.io/docs/
