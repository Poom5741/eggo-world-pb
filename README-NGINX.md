# Nginx + PocketBase Setup - Quick Reference

## Status

✅ **Setup Complete!** Both services are running.

## Running Services

| Service | Container | Status | Ports |
|---------|-----------|--------|-------|
| PocketBase | eggo-pb | ✅ Running (healthy) | Internal only |
| Nginx | eggo-nginx | ✅ Running | 80, 443 |

## Access Points

| Endpoint | URL | Notes |
|----------|-----|-------|
| Health Check | `https://localhost/api/health` | Returns 200 OK |
| Admin Dashboard | `https://localhost/_/` | PocketBase Admin UI |
| API | `https://localhost/api/` | All PocketBase API endpoints |

## Security Features

- ✅ SSL/TLS enabled (self-signed certificates)
- ✅ HTTP redirects to HTTPS
- ✅ Rate limiting (10r/s for API, 5r/m for admin)
- ✅ Cloudflare real IP support configured
- ✅ Security headers (HSTS, CSP, XSS protection)
- ✅ PocketBase port 8090 not exposed to host

## Quick Commands

```bash
# Check container status
docker ps | grep eggo

# View logs
docker logs -f eggo-nginx    # Nginx logs
docker logs -f eggo-pb       # PocketBase logs

# Restart services
cd /root/eggo-world-pb/eggo-pb && docker compose restart
cd /root/eggo-world-pb/nginx && docker compose restart

# Test endpoints
curl -k https://localhost/api/health
curl -k https://localhost/_/
```

## Next Steps: Cloudflare Setup

1. **Add your domain to Cloudflare**
   - Go to https://dash.cloudflare.com
   - Click "Add a Site"
   - Enter your domain

2. **Create DNS Record**
   - Type: A
   - Name: `api` (or your subdomain)
   - Content: Your server IP
   - Proxy status: 🟠 Proxied (orange cloud)

3. **Configure SSL/TLS**
   - SSL/TLS → Overview
   - Set to "Full (strict)" or "Full"
   - Enable "Always Use HTTPS"

4. **Install Cloudflare Origin Certificates** (Recommended)
   ```bash
   cd /root/eggo-world-pb
   ./setup.sh
   # Select option 9: Setup Cloudflare SSL certificates
   ```
   Or manually:
   - Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
   - Copy certificate to `nginx/ssl/fullchain.pem`
   - Copy private key to `nginx/ssl/privkey.pem`
   - Restart nginx: `cd nginx && docker compose restart`

5. **Update Domain in Nginx Config**
   ```bash
   # Edit the config
   nano /root/eggo-world-pb/nginx/conf.d/pocketbase.conf
   # Change: server_name _; to server_name api.yourdomain.com;
   
   # Restart nginx
   cd /root/eggo-world-pb/nginx && docker compose restart
   ```

## File Structure

```
/root/eggo-world-pb/
├── eggo-pb/
│   ├── docker-compose.yml    # PocketBase service (no public ports)
│   └── ...
├── nginx/
│   ├── nginx.conf            # Main nginx config
│   ├── conf.d/
│   │   └── pocketbase.conf   # Site config
│   ├── ssl/
│   │   ├── fullchain.pem     # SSL certificate
│   │   └── privkey.pem       # SSL private key
│   ├── docker-compose.yml    # Nginx service
│   └── ...
├── setup.sh                  # Interactive setup script
└── CLOUDFLARE_SETUP.md       # Detailed Cloudflare guide
```

## Important Notes

⚠️ **Current SSL certificates are self-signed** - browsers will show warnings. Replace with Cloudflare Origin certificates for production.

⚠️ **Update the domain** in `nginx/conf.d/pocketbase.conf` before going live.

✅ **Port 8090 is NOT exposed** - PocketBase is only accessible through nginx.

## Troubleshooting

**502 Bad Gateway Error:**
```bash
# Check PocketBase is running
docker ps | grep eggo-pb

# Test internal connection
docker exec eggo-nginx wget -O- http://eggo-pb:8090/api/health
```

**SSL Certificate Errors:**
```bash
# Verify certificates
openssl x509 -in /root/eggo-world-pb/nginx/ssl/fullchain.pem -noout -dates

# Check nginx config
docker exec eggo-nginx nginx -t
```

**Admin Dashboard Blank:**
```bash
# Check PocketBase logs
docker logs eggo-pb --tail=50
```

## Documentation

- **Detailed Plan**: `plans/nginx-pocketbase-cloudflare-plan.md`
- **Cloudflare Guide**: `CLOUDFLARE_SETUP.md`
- **Setup Script**: Run `./setup.sh` for interactive menu