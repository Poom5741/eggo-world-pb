# Cloudflare Setup Guide for Nginx + PocketBase

This guide walks you through configuring Cloudflare to work with your Nginx + PocketBase setup.

## Table of Contents

1. [Initial Cloudflare Setup](#initial-cloudflare-setup)
2. [DNS Configuration](#dns-configuration)
3. [SSL/TLS Configuration](#ssltls-configuration)
4. [Security Settings](#security-settings)
5. [Origin Certificates](#origin-certificates)
6. [WAF Rules](#waf-rules)
7. [Troubleshooting](#troubleshooting)

---

## Initial Cloudflare Setup

### 1. Add Your Domain to Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Add a Site"
3. Enter your domain (e.g., `yourdomain.com`)
4. Select the Free plan (sufficient for most use cases)

### 2. Update Nameservers

Cloudflare will provide you with two nameservers:

```
ada.ns.cloudflare.com
ben.ns.cloudflare.com
```

1. Log in to your domain registrar
2. Replace existing nameservers with Cloudflare's
3. Wait for DNS propagation (usually 5 minutes to 24 hours)

---

## DNS Configuration

### Create A Record for API Subdomain

1. Go to Cloudflare Dashboard → Your Domain → DNS → Records
2. Click "Add Record"
3. Configure:
   - **Type**: A
   - **Name**: `api` (creates api.yourdomain.com)
   - **IPv4 address**: Your server IP address
   - **Proxy status**: 🟠 Proxied (orange cloud) - **IMPORTANT**
   - **TTL**: Auto

### Example DNS Records

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| A | api | YOUR_SERVER_IP | Proxied | Auto |
| A | @ (root) | YOUR_SERVER_IP | Proxied | Auto |

---

## SSL/TLS Configuration

### Overview Settings

1. Go to SSL/TLS → Overview
2. Select encryption mode:

**Recommended: Full (strict)**
- Encrypts end-to-end
- Requires valid certificate on origin server
- Most secure option

**Alternative: Full**
- Encrypts end-to-end
- Allows self-signed certificates

**Not Recommended: Flexible**
- Encrypts only between Cloudflare and visitor
- Traffic between Cloudflare and origin is HTTP

### Edge Certificates

1. Go to SSL/TLS → Edge Certificates
2. Settings:
   - **Always Use HTTPS**: ON
   - **Automatic HTTPS Rewrites**: ON
   - **Minimum TLS Version**: 1.2
   - **TLS 1.3**: ON

### HSTS (HTTP Strict Transport Security)

⚠️ **Warning**: Enable only after confirming HTTPS works!

1. Go to SSL/TLS → Edge Certificates
2. Scroll to "HTTP Strict Transport Security (HSTS)"
3. Click "Enable HSTS"
4. Settings:
   - **Max Age Header**: 6 months (15552000 seconds)
   - **Apply HSTS policy to subdomains**: ON
   - **No-Sniff Header**: ON

---

## Origin Certificates

### Create Origin Certificate

1. Go to SSL/TLS → Origin Server
2. Click "Create Certificate"
3. Options:
   - **Private key type**: RSA
   - **Certificate validity**: 15 years
4. Hostnames:
   - `*.yourdomain.com`
   - `yourdomain.com`
   - `api.yourdomain.com`
5. Click "Create"

### Download and Install

1. Download:
   - **PEM** (certificate): `origin_certificate.pem`
   - **Private Key**: `private_key.pem`

2. Copy to your server:
   ```bash
   # On your local machine
   scp origin_certificate.pem root@YOUR_SERVER_IP:/root/eggo-world-pb/nginx/ssl/fullchain.pem
   scp private_key.pem root@YOUR_SERVER_IP:/root/eggo-world-pb/nginx/ssl/privkey.pem
   ```

3. Or use the setup script:
   ```bash
   cd /root/eggo-world-pb
   ./setup.sh
   # Select option 9: Setup Cloudflare SSL certificates
   ```

4. Restart nginx:
   ```bash
   cd /root/eggo-world-pb/nginx
   docker compose restart nginx
   ```

---

## Security Settings

### Security Level

1. Go to Security → Settings
2. **Security Level**: Medium (or High for extra protection)

### Bot Fight Mode

1. Go to Security → Bots
2. Enable "Bot Fight Mode"

### Security Headers

Go to Rules → Transform Rules → Managed Transforms

Enable:
- **Add security headers**

### CORS Policy (if needed)

If your frontend is on a different domain, configure CORS:

1. Go to Rules → Transform Rules → Modify Response Header
2. Create rule:
   - **When**: Always
   - **Header name**: `Access-Control-Allow-Origin`
   - **Value**: `https://your-frontend-domain.com`

---

## WAF Rules

### Custom Rules

Go to Security → WAF → Custom Rules

#### Rule 1: Rate Limiting for API

```
Name: API Rate Limit
When incoming requests match...
  - Field: URI Path
  - Operator: Starts with
  - Value: /api/

Then...
  - Action: Block
  - Rate limiting:
    - Requests: 100
    - Period: 1 minute
```

#### Rule 2: Protect Admin Dashboard

```
Name: Admin Rate Limit
When incoming requests match...
  - Field: URI Path
  - Operator: Starts with
  - Value: /_/

Then...
  - Action: Challenge (Captcha)
  - Rate limiting:
    - Requests: 10
    - Period: 1 minute
```

#### Rule 3: Block Bad Bots

```
Name: Block Bad Bots
When incoming requests match...
  - Field: User Agent
  - Operator: Matches regex
  - Value: (bot|crawler|spider|scraper)

Then...
  - Action: Block
```

### Rate Limiting Rules

Go to Security → WAF → Rate limiting rules

Create rule:
- **Rule name**: General Rate Limit
- **When incoming requests match**: All requests
- **Rate exceeds**:
  - **Requests**: 100
  - **Period**: 1 minute
- **Then take action**: Challenge

---

## Cloudflare Access (Optional but Recommended)

For extra protection on the admin dashboard (`/_/`):

1. Go to Zero Trust → Access → Applications
2. Click "Add an application"
3. **Application Name**: PocketBase Admin
4. **Application domain**: `api.yourdomain.com/_/*`
5. **Session duration**: 24 hours

### Policies

Create policy:
- **Policy name**: Allow Admins
- **Action**: Allow
- **Include**:
  - Email addresses: `admin@yourdomain.com`
  - OR Email domain: `yourdomain.com`

---

## Performance Settings

### Caching

1. Go to Caching → Configuration
2. **Caching Level**: Standard
3. **Browser Cache TTL**: 4 hours

### Page Rules (Optional)

Go to Rules → Page Rules

Create rule for static assets:
- **URL**: `*api.yourdomain.com/*.js`
- **Settings**:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month

---

## Monitoring

### Analytics

View in Cloudflare Dashboard:
- **Analytics → Traffic**: Request volume, bandwidth
- **Analytics → Security**: Threats blocked, bot traffic
- **Analytics → Performance**: Response times

### Health Checks

Optional: Set up uptime monitoring:

1. Go to Traffic → Health Checks
2. Click "Create"
3. Configure:
   - **Name**: PocketBase Health
   - **URL**: `https://api.yourdomain.com/api/health`
   - **Monitor from**: Multiple regions

---

## Testing Your Setup

### 1. DNS Resolution

```bash
# Should return Cloudflare IPs (not your server IP)
dig api.yourdomain.com +short
```

### 2. SSL Certificate

```bash
# Should show Cloudflare certificate
echo | openssl s_client -showcerts -servername api.yourdomain.com -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -text | grep "Issuer:"
```

### 3. API Health Check

```bash
curl -I https://api.yourdomain.com/api/health
# Expected: HTTP/2 200
```

### 4. Admin Dashboard

Open in browser:
```
https://api.yourdomain.com/_/
```

Should show PocketBase admin login page with valid SSL certificate.

---

## Troubleshooting

### Issue: "Connection refused" or 502 Bad Gateway

**Symptoms**: Cloudflare shows 502 error

**Solution**:
1. Check nginx logs:
   ```bash
   docker logs eggo-nginx
   ```
2. Verify PocketBase is running:
   ```bash
   docker ps | grep eggo-pb
   ```
3. Test direct connection:
   ```bash
   docker exec eggo-nginx wget -O- http://eggo-pb:8090/api/health
   ```

### Issue: SSL Certificate Error

**Symptoms**: Browser shows certificate warning

**Solution**:
1. Verify certificates exist:
   ```bash
   ls -la /root/eggo-world-pb/nginx/ssl/
   ```
2. Check certificate validity:
   ```bash
   openssl x509 -in /root/eggo-world-pb/nginx/ssl/fullchain.pem -noout -dates
   ```
3. Ensure Cloudflare SSL mode is "Full (strict)" or "Full"

### Issue: Admin Dashboard Blank

**Symptoms**: `/_/` shows white page

**Solution**:
1. Check PocketBase logs:
   ```bash
   cd /root/eggo-world-pb/eggo-pb
   docker compose logs -f
   ```
2. Verify serve command is running:
   ```bash
   docker exec eggo-pb ps aux | grep pocketbase
   ```

### Issue: Real IP Shows Cloudflare IPs

**Symptoms**: Access logs show Cloudflare IPs instead of real visitor IPs

**Solution**:
1. Verify Cloudflare IP ranges in nginx.conf:
   ```bash
   grep set_real_ip_from /root/eggo-world-pb/nginx/nginx.conf
   ```
2. Ensure `real_ip_header CF-Connecting-IP;` is set

---

## Quick Reference

### Cloudflare Dashboard URLs

- Main Dashboard: https://dash.cloudflare.com
- DNS: https://dash.cloudflare.com/[domain]/dns/records
- SSL/TLS: https://dash.cloudflare.com/[domain]/ssl-tls
- Security: https://dash.cloudflare.com/[domain]/security
- Analytics: https://dash.cloudflare.com/[domain]/analytics

### Useful Commands

```bash
# Check Docker containers
docker ps | grep eggo

# View nginx logs
docker logs -f eggo-nginx

# View PocketBase logs
docker logs -f eggo-pb

# Test API
curl -k https://localhost/api/health

# Restart services
cd /root/eggo-world-pb/eggo-pb && docker compose restart
cd /root/eggo-world-pb/nginx && docker compose restart
```

---

## Support

For issues specific to this setup:
1. Check the main setup guide: `plans/nginx-pocketbase-cloudflare-plan.md`
2. Review Cloudflare documentation: https://developers.cloudflare.com
3. Check PocketBase documentation: https://pocketbase.io/docs