# Nginx + PocketBase + Cloudflare Architecture Plan

## Overview

This plan outlines how to set up nginx as a reverse proxy to expose only PocketBase to the public internet, with Cloudflare handling DNS, SSL, and security.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUDFLARE                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │    DNS      │───▶│   SSL/TLS   │───▶│    WAF      │───▶│   Cache     │  │
│  │  (CNAME)    │    │  (Full/Full   │    │  (Rules)    │    │  (Static)   │  │
│  │             │    │    Strict)    │    │             │    │             │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   Nginx Server  │
                              │   (DMZ/Edge)    │
                              │                 │
                              │  ┌───────────┐  │
                              │  │  Reverse  │  │
                              │  │   Proxy   │  │
                              │  │  (nginx)  │  │
                              │  └───────────┘  │
                              │        │        │
                              └────────┼────────┘
                                       │
                              ┌────────┴────────┐
                              │   Private Net   │
                              │                 │
                              │  ┌───────────┐  │
                              │  │ PocketBase│  │
                              │  │  (Docker) │  │
                              │  │  :8090    │  │
                              │  └───────────┘  │
                              │                 │
                              └─────────────────┘
```

## Network Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│Cloudflare│────▶│   Nginx  │────▶│Docker    │────▶│PocketBase│
│          │     │  (HTTPS) │     │  (HTTPS) │     │Network   │     │  (:8090) │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                 │                 │                 │                 │
     │                 │                 │                 │                 │
     ▼                 ▼                 ▼                 ▼                 ▼
  User Browser    api.yourdomain.com  SSL Termination   Internal Only    Actual API
                  CNAME → CF          Proxy Headers     No Direct Access  & Admin UI
```

## Components

### 1. PocketBase (Internal)

- **Port:** 8090 (internal only)
- **Access:** Not exposed to public directly
- **Docker:** Runs in isolated Docker network
- **Admin UI:** Available at `/_/`

### 2. Nginx (Reverse Proxy)

- **Public Ports:** 80, 443
- **Role:** SSL termination, request routing, rate limiting, security headers
- **Access:** Exposed to internet (behind Cloudflare)
- **Configuration:** Only forwards to PocketBase, blocks everything else

### 3. Cloudflare (DNS + Security)

- **DNS:** CNAME pointing to your server
- **SSL:** Full (strict) or Flexible
- **Security:** WAF rules, DDoS protection, Bot management
- **Caching:** Optional for static assets

## Security Model

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            SECURITY LAYERS                                 │
├────────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Cloudflare                                                        │
│   - DDoS Protection                                                        │
│   - WAF (Web Application Firewall)                                         │
│   - Bot Management                                                         │
│   - IP Reputation Filtering                                                │
│   - SSL/TLS Encryption (Edge to User)                                      │
├────────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Nginx                                                             │
│   - SSL/TLS Termination (Origin to Cloudflare)                             │
│   - Rate Limiting                                                          │
│   - Request Filtering                                                      │
│   - Security Headers (HSTS, CSP, etc.)                                     │
│   - IP Whitelist (Cloudflare IPs only - optional)                          │
│   - Access Logging                                                         │
├────────────────────────────────────────────────────────────────────────────┤
│ Layer 3: PocketBase                                                        │
│   - Built-in Authentication                                                │
│   - Admin Dashboard Auth                                                   │
│   - Collection-level Permissions                                           │
│   - API Rules                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
eggo-world-pb/
├── eggo-pb/
│   ├── docker-compose.yml          # PocketBase service
│   ├── Dockerfile
│   ├── pb_data/                    # Data volume
│   ├── pb_hooks/                   # Custom hooks
│   └── pb_public/                  # Public files (optional)
├── nginx/
│   ├── docker-compose.yml          # Nginx service
│   ├── nginx.conf                  # Main nginx config
│   ├── conf.d/
│   │   └── pocketbase.conf         # Site-specific config
│   ├── ssl/                        # SSL certificates
│   │   ├── fullchain.pem
│   │   └── privkey.pem
│   └── cloudflare.conf             # Cloudflare IP whitelist
├── frontend/                       # Your frontend (if applicable)
└── plans/
    └── nginx-pocketbase-cloudflare-plan.md  # This file
```

## Implementation Steps

### Phase 1: Nginx Setup

1. Create nginx directory structure
2. Create nginx configuration files
3. Set up Docker Compose for nginx
4. Configure SSL certificates (Let's Encrypt or Cloudflare Origin)

### Phase 2: Network Configuration

1. Create Docker network for internal communication
2. Configure PocketBase to use internal network only
3. Update PocketBase docker-compose.yml

### Phase 3: Cloudflare Configuration

1. Add domain to Cloudflare
2. Configure DNS records (CNAME)
3. Set SSL/TLS mode
4. Configure WAF rules
5. Optional: Enable Cloudflare Access for admin dashboard

### Phase 4: Security Hardening

1. Configure Cloudflare IP whitelist in nginx
2. Set up rate limiting
3. Add security headers
4. Configure logging and monitoring

## Configuration Files

### Nginx Main Config (`nginx/nginx.conf`)

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Cloudflare real IP
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 2400:cb00::/32;
    set_real_ip_from 2606:4700::/32;
    set_real_ip_from 2803:f800::/32;
    set_real_ip_from 2405:b500::/32;
    set_real_ip_from 2405:8100::/32;
    set_real_ip_from 2a06:98c0::/29;
    set_real_ip_from 2c0f:f248::/32;
    real_ip_header CF-Connecting-IP;

    # Include site configs
    include /etc/nginx/conf.d/*.conf;
}
```

### Nginx Site Config (`nginx/conf.d/pocketbase.conf`)

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Cloudflare flexible SSL support
    location / {
        return 301 https://$server_name$request_uri;
    }

    # ACME challenge for Let's Encrypt (if using)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

# HTTPS - Main server
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (from Let's Encrypt or Cloudflare Origin)
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS (enable after confirming HTTPS works)
    # add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Limit request size
    client_max_body_size 10M;

    # Proxy to PocketBase
    location / {
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
        # Proxy settings
        proxy_pass http://eggo-pb:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Admin dashboard - extra protection
    location /_/ {
        # Stricter rate limiting for admin
        limit_req zone=login burst=5 nodelay;
        
        # Optional: IP whitelist for admin (Cloudflare IPs already handled)
        # allow 1.2.3.4;  # Your IP
        # deny all;
        
        proxy_pass http://eggo-pb:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API health check
    location /api/health {
        proxy_pass http://eggo-pb:8090/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Nginx Docker Compose (`nginx/docker-compose.yml`)

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: eggo-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs:/var/log/nginx
    networks:
      - pocketbase_network
    depends_on:
      - pocketbase
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Certbot for Let's Encrypt
  certbot:
    image: certbot/certbot
    container_name: eggo-certbot
    volumes:
      - ./ssl:/etc/letsencrypt
      - ./certbot-data:/var/lib/letsencrypt
      - ./www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    profiles:
      - certbot

networks:
  pocketbase_network:
    external: true

volumes:
  certbot-data:
```

### Updated PocketBase Docker Compose (`eggo-pb/docker-compose.yml`)

```yaml
version: '3.8'

services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: eggo-pb
    restart: unless-stopped
    command: ["serve", "--http=0.0.0.0:8090", "--encryptionEnv=ENCRYPTION", "--hooksDir=/pb/pb_hooks"]
    environment:
      ENCRYPTION: ${ENCRYPTION:-4nWpfKByg2u3tkbbHAZ34div}
      OIDC_CLIENT_ID: ${OIDC_CLIENT_ID:-""}
      OIDC_CLIENT_SECRET: ${OIDC_CLIENT_SECRET:-""}
      OIDC_ISSUER_URL: ${OIDC_ISSUER_URL:-""}
      OIDC_REDIRECT_URI: ${OIDC_REDIRECT_URI:-""}
    # Remove ports - not exposed to host, only accessible via nginx
    # ports:
    #   - "8090:8090"
    volumes:
      - ./pb_data:/pb/pb_data
      - ./pb_migrations:/pb/pb_migrations
      - ./pb_hooks:/pb/pb_hooks
      - ./pb_public:/pb/pb_public
    networks:
      - pocketbase_network
    healthcheck:
      test: wget --no-verbose --tries=1 --spider http://localhost:8090/api/health || exit 1
      interval: 5s
      timeout: 5s
      retries: 5

networks:
  pocketbase_network:
    name: pocketbase_network
    driver: bridge
```

## Setup Instructions

### Step 1: Create Shared Network

```bash
cd /root/eggo-world-pb/eggo-pb
docker network create pocketbase_network
```

### Step 2: Start PocketBase

```bash
cd /root/eggo-world-pb/eggo-pb
docker compose up -d
```

Verify it's running:
```bash
docker compose ps
docker compose logs -f pocketbase
```

### Step 3: Setup Nginx

```bash
cd /root/eggo-world-pb
mkdir -p nginx/conf.d nginx/ssl nginx/logs
# Copy config files from above
```

### Step 4: SSL Certificates

**Option A: Cloudflare Origin Certificates (Recommended for CF users)**

1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server
2. Create Certificate
3. Download certificate and private key
4. Place in `nginx/ssl/`
   - `fullchain.pem` - certificate
   - `privkey.pem` - private key

**Option B: Let's Encrypt**

```bash
# Run certbot (first time)
docker run -it --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  -v $(pwd)/nginx/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos --no-eff-email \
  -d api.yourdomain.com

# Or use the docker-compose profile
cd nginx
docker compose --profile certbot up -d
```

### Step 5: Start Nginx

```bash
cd /root/eggo-world-pb/nginx
docker compose up -d
```

### Step 6: Cloudflare DNS Configuration

1. Add your domain to Cloudflare
2. Create DNS record:
   - Type: A (or CNAME)
   - Name: api
   - Content: Your server IP (or domain)
   - Proxy status: Proxied (orange cloud)
   - TTL: Auto

3. SSL/TLS Settings:
   - Overview → SSL/TLS
   - Set to "Full (strict)" for Origin certificates, or "Flexible" for HTTP only

### Step 7: Verify Setup

```bash
# Check nginx is working
curl -I http://api.yourdomain.com/api/health

# Check with HTTPS
curl -I https://api.yourdomain.com/api/health

# Test admin access (should redirect to HTTPS)
curl -I http://api.yourdomain.com/_/
```

## Cloudflare Security Settings

### SSL/TLS

```
SSL/TLS encryption mode: Full (strict)
  ↳ Encrypts end-to-end, requires valid certificate on origin

Always Use HTTPS: ON
Automatic HTTPS Rewrites: ON
```

### Security

```
Security Level: Medium
Challenge Passage: 30 minutes
Browser Integrity Check: ON
```

### WAF (Web Application Firewall)

Create custom rules:

1. **Rate Limiting Rule:**
   - If: URI Path contains /api/
   - Then: Rate limit - 100 requests per minute
   - Action: Block

2. **Block Bad Bots:**
   - If: User Agent contains (bot|crawler|spider)
   - And: Threat Score > 10
   - Then: Block

3. **Geographic Block (optional):**
   - If: Country is not in [US, UK, JP, etc.]
   - Then: Challenge

### Access (Zero Trust) - Optional but Recommended for Admin

```
Cloudflare Access → Applications → Add

Application Name: PocketBase Admin
Application Domain: api.yourdomain.com/_/*
Session Duration: 24 hours

Policies:
  - Name: Allow Admins
    Action: Allow
    Include: Emails ending in @yourcompany.com
    OR Include: Email is admin@example.com
```

## Monitoring and Logging

### Nginx Logs

Located at `nginx/logs/`:
- `access.log` - All requests
- `error.log` - Errors

### Cloudflare Analytics

View in Cloudflare Dashboard:
- Security events
- Traffic analytics
- Performance metrics

### Health Checks

```bash
# Add to crontab for monitoring
*/5 * * * * curl -f https://api.yourdomain.com/api/health || echo "PocketBase down" | mail -s "Alert" admin@example.com
```

## Maintenance

### Updating PocketBase

```bash
cd /root/eggo-world-pb/eggo-pb
docker compose pull
docker compose up -d
```

### Updating Nginx

```bash
cd /root/eggo-world-pb/nginx
docker compose pull
docker compose up -d
```

### Renewing SSL (Let's Encrypt)

```bash
docker run -it --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  certbot/certbot renew
# Or restart certbot container
```

## Troubleshooting

### Issue: 502 Bad Gateway

Check:
```bash
# Is PocketBase running?
docker ps | grep eggo-pb

# Is it accessible from nginx container?
docker exec eggo-nginx wget -O- http://eggo-pb:8090/api/health

# Check nginx error logs
cat nginx/logs/error.log
```

### Issue: SSL Certificate Errors

- Check certificate path in nginx config
- Verify certificate is not expired: `openssl x509 -in nginx/ssl/fullchain.pem -noout -dates`
- Ensure Cloudflare SSL mode matches your setup

### Issue: Admin Dashboard Blank

- Check PocketBase logs: `docker compose logs pocketbase`
- Verify `serve` command is in docker-compose
- Check browser console for CORS errors

### Issue: Real IP Shows Cloudflare IPs

- Ensure `real_ip_header CF-Connecting-IP;` is set
- Verify Cloudflare IP ranges are in nginx.conf

## Security Checklist

- [ ] PocketBase not exposed on host port (only in Docker network)
- [ ] SSL certificates installed and valid
- [ ] Cloudflare proxy enabled (orange cloud)
- [ ] SSL mode set correctly (Full strict recommended)
- [ ] Rate limiting configured in nginx
- [ ] Security headers added
- [ ] Admin dashboard has extra protection (Cloudflare Access recommended)
- [ ] Logging enabled and monitored
- [ ] Regular backups of `pb_data` configured
- [ ] ENCRYPTION key backed up securely

## Next Steps

1. Create the nginx configuration files
2. Set up SSL certificates
3. Configure Cloudflare DNS
4. Test the setup thoroughly
5. Enable Cloudflare Access for admin dashboard
6. Set up monitoring and alerting
7. Document admin credentials and access methods