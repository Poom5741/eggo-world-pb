# Troubleshooting Guide

Comprehensive troubleshooting guide for the Eggo PocketBase deployment. Use this guide to diagnose and resolve common issues.

## Table of Contents

- [Common Deployment Failures](#common-deployment-failures)
- [Health Check Failures](#health-check-failures)
- [Rollback Issues](#rollback-issues)
- [SSH Connection Problems](#ssh-connection-problems)
- [Docker Issues](#docker-issues)
- [Database Issues](#database-issues)
- [Network Issues](#network-issues)
- [Debug Commands](#debug-commands)

---

## Common Deployment Failures

### Stage 00: Pre-deployment Checks Fail

**Error**: `Missing required environment variables`

**Symptoms**:

```
[ERROR] Missing required environment variables: SSH_USER SSH_KEY REGISTRY
```

**Solutions**:

```bash
# 1. Check if .env.production exists
ls -la .env.production

# 2. Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# 3. Verify variables are set
echo "SSH_USER: $SSH_USER"
echo "SSH_KEY: $SSH_KEY"
echo "REGISTRY: $REGISTRY"

# 4. If using direnv, allow it
direnv allow

# 5. Validate secrets
./scripts/setup-secrets.sh --validate
```

---

**Error**: `Docker daemon is not running`

**Symptoms**:

```
[ERROR] Docker daemon is not running
```

**Solutions**:

```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker

# Verify
docker ps
```

---

**Error**: `SSH connection failed`

**Symptoms**:

```
[ERROR] Cannot connect to remote server via SSH
```

**Solutions**:

```bash
# 1. Check SSH key exists
ls -la ~/.ssh/id_rsa

# 2. Fix permissions
chmod 600 ~/.ssh/id_rsa
chmod 700 ~/.ssh

# 3. Test connection
ssh -i ~/.ssh/id_rsa root@204.168.144.14 "echo 'OK'"

# 4. Add to known hosts (first time)
ssh-keyscan -H 204.168.144.14 >> ~/.ssh/known_hosts

# 5. Check firewall
ssh -v -i ~/.ssh/id_rsa root@204.168.144.14
```

---

### Stage 10: Build Failures

**Error**: `Docker build failed`

**Symptoms**:

```
[ERROR] failed to solve: rpc error: code = Unknown desc = failed to solve...
```

**Solutions**:

```bash
# 1. Clean Docker build cache
docker builder prune -f

# 2. Rebuild without cache
./scripts/stages/10-build.sh --no-cache

# 3. Check Dockerfile syntax
docker build -t test-build -f apps/backend/Dockerfile apps/backend

# 4. Check disk space
df -h

# 5. Restart Docker (if cache corruption suspected)
# macOS: Quit and reopen Docker Desktop
# Linux: sudo systemctl restart docker
```

---

### Stage 20: Push Failures

**Error**: `Authentication failed`

**Symptoms**:

```
[ERROR] denied: requested access to the resource is denied
```

**Solutions**:

```bash
# 1. Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 2. Verify permissions
# Check GitHub Packages settings for your repository

# 3. Check image tag
docker images | grep eggo-pocketbase

# 4. Retry push
docker push ghcr.io/tokenine/eggo-pocketbase:latest
```

---

**Error**: `Network timeout during push`

**Solutions**:

```bash
# 1. Check network
curl -I https://ghcr.io

# 2. Retry with longer timeout
docker push --retry 5 ghcr.io/tokenine/eggo-pocketbase:latest

# 3. Use different network (if corporate firewall)
# Try from different network or VPN
```

---

### Stage 30: Backup Failures

**Error**: `Backup directory not accessible`

**Symptoms**:

```
[ERROR] Cannot write to backup directory
```

**Solutions**:

```bash
# SSH to server and fix permissions
ssh root@204.168.144.14

# Create backup directory
mkdir -p /root/eggo-pocketbase/backups

# Set permissions
chmod 755 /root/eggo-pocketbase/backups

# Check disk space
df -h /root

# Clean old backups if needed
find /root/eggo-pocketbase/backups -mtime +30 -delete
```

---

### Stage 40: Deploy Failures

**Error**: `Container start failed`

**Symptoms**:

```
[ERROR] Failed to start PocketBase container
```

**Solutions**:

```bash
# SSH to server and investigate
ssh root@204.168.144.14

# Check existing containers
docker ps -a | grep eggo

# Remove stuck containers
docker rm -f eggo-pb eggo-wallet-api

# Check port conflicts
netstat -tulpn | grep 8090

# Check logs
docker logs eggo-pb

# Manual start for debugging
docker run -it --rm \
  -p 8090:8090 \
  -v /root/eggo-pocketbase/apps/backend/pb_data:/pb/pb_data \
  ghcr.io/tokenine/eggo-pocketbase:latest
```

---

**Error**: `Image pull failed`

**Solutions**:

```bash
# SSH to server
ssh root@204.168.144.14

# Login to registry
docker login ghcr.io -u USERNAME

# Pull manually
docker pull ghcr.io/tokenine/eggo-pocketbase:latest

# Check if image exists locally
docker images | grep eggo
```

---

### Stage 50: Migration Failures

**Error**: `Migration failed`

**Symptoms**:

```
[ERROR] Migration 123_abc.pb.js failed
```

**Solutions**:

```bash
# SSH to server
ssh root@204.168.144.14

# Check migration logs
docker logs eggo-pb | grep -i migration

# Check migration status
curl http://localhost:8090/api/collections/_migrations/records

# List migration files
ls -la /root/eggo-pocketbase/apps/backend/pb_migrations/

# If migration is stuck, check for locks
ls -la /root/eggo-pocketbase/apps/backend/pb_data/

# Manual migration (use with caution)
docker exec eggo-pb ./pocketbase migrate
```

---

### Stage 60: Verification Failures

**Error**: `Health check failed`

**Symptoms**:

```
[ERROR] Health check failed after 5 attempts
```

**Solutions**:

```bash
# Check if container is running
ssh root@204.168.144.14 "docker ps | grep eggo-pb"

# Check logs
docker logs --tail 100 eggo-pb

# Test health endpoint manually
ssh root@204.168.144.14 "curl -s http://localhost:8090/api/health"

# Check if port is listening
ssh root@204.168.144.14 "netstat -tulpn | grep 8090"

# Restart container
ssh root@204.168.144.14 "docker restart eggo-pb"
```

---

## Health Check Failures

### PocketBase API Unhealthy

**Symptoms**:

```
✗ FAIL: PocketBase API health check (HTTP 000)
```

**Solutions**:

```bash
# 1. Check if container is running
ssh root@204.168.144.14 "docker ps | grep eggo-pb"

# 2. Check logs for startup errors
docker logs --tail 50 eggo-pb

# 3. Test locally on server
ssh root@204.168.144.14 "curl -s http://localhost:8090/api/health"

# 4. Check firewall/iptables
ssh root@204.168.144.14 "iptables -L | grep 8090"

# 5. Check if PocketBase is still starting
ssh root@204.168.144.14 "docker logs eggo-pb | grep 'Server started'"

# 6. Restart if needed
ssh root@204.168.144.14 "docker restart eggo-pb"
```

---

### Wallet API Unhealthy

**Symptoms**:

```
✗ FAIL: Wallet API health check
```

**Solutions**:

```bash
# Check Wallet API logs
docker logs --tail 50 eggo-wallet-api

# Check if port 3001 is accessible
ssh root@204.168.144.14 "curl -s http://localhost:3001/health"

# Check environment variables
docker exec eggo-wallet-api env | grep WALLET

# Restart Wallet API
ssh root@204.168.144.14 "docker restart eggo-wallet-api"
```

---

### Database Connectivity Failed

**Symptoms**:

```
✗ FAIL: Database connectivity check
```

**Solutions**:

```bash
# Check if pb_data directory exists
ssh root@204.168.144.14 "ls -la /root/eggo-pocketbase/apps/backend/pb_data/"

# Check disk space
df -h /root

# Check database permissions
ls -la /root/eggo-pocketbase/apps/backend/pb_data/data.db

# If corrupted, restore from backup
# WARNING: This will lose data since last backup
cp /root/eggo-pocketbase/backups/data-*.db /root/eggo-pocketbase/apps/backend/pb_data/data.db
```

---

### Nginx Proxy Issues

**Symptoms**:

```
⚠ WARN: Nginx proxy health check
```

**Solutions**:

```bash
# Check nginx container
ssh root@204.168.144.14 "docker ps | grep nginx"

# Check nginx config
docker exec eggo-nginx nginx -t

# Check nginx logs
docker logs eggo-nginx

# Reload nginx
docker exec eggo-nginx nginx -s reload

# Restart nginx container
ssh root@204.168.144.14 "docker restart eggo-nginx"
```

---

## Rollback Issues

### Rollback Fails

**Symptoms**:

```
[ERROR] Rollback FAILED - health check unsuccessful
```

**Solutions**:

```bash
# 1. Check available images
ssh root@204.168.144.14 "docker images | grep eggo-pocketbase"

# 2. Manual rollback to specific version
docker pull ghcr.io/tokenine/eggo-pocketbase:stable-tag
docker stop eggo-pb eggo-wallet-api
docker rm eggo-pb eggo-wallet-api

# 3. Start with explicit version
docker run -d --name eggo-pb -p 8090:8090 \
  -v /root/eggo-pocketbase/apps/backend/pb_data:/pb/pb_data \
  ghcr.io/tokenine/eggo-pocketbase:stable-tag

# 4. If all else fails, use docker-compose
ssh root@204.168.144.14 "cd /root/eggo-pocketbase && docker-compose down && docker-compose up -d"
```

---

### No Previous Version Found

**Symptoms**:

```
[ERROR] No previous version found for rollback
```

**Solutions**:

```bash
# List all available images
ssh root@204.168.144.14 "docker images --format '{{.Repository}}:{{.Tag}}' | grep eggo-pocketbase"

# Pull a known stable version
docker pull ghcr.io/tokenine/eggo-pocketbase:latest

# Or use backup snapshot
ssh root@204.168.144.14 "cat /root/eggo-pocketbase/backups/snapshot-*.json | grep version"
```

---

## SSH Connection Problems

### Permission Denied

**Symptoms**:

```
Permission denied (publickey,password)
```

**Solutions**:

```bash
# 1. Check key permissions
chmod 600 ~/.ssh/id_rsa
chmod 700 ~/.ssh

# 2. Verify key is added to agent
ssh-add -l
ssh-add ~/.ssh/id_rsa

# 3. Test with verbose output
ssh -v -i ~/.ssh/id_rsa root@204.168.144.14

# 4. Check authorized_keys on server
# (You'll need console access or another user)
cat /root/.ssh/authorized_keys

# 5. If key was lost, add new key via console
```

---

### Connection Timeout

**Symptoms**:

```
ssh: connect to host 204.168.144.14 port 22: Connection timed out
```

**Solutions**:

```bash
# 1. Check network connectivity
ping 204.168.144.14

# 2. Check if SSH port is open
nc -zv 204.168.144.14 22

# 3. Check if IP changed
# Contact hosting provider or check console

# 4. Try alternative access (if configured)
# Console access, VPN, etc.
```

---

### Host Key Changed

**Symptoms**:

```
WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!
```

**Solutions**:

```bash
# 1. Remove old host key
ssh-keygen -R 204.168.144.14

# 2. Accept new key
ssh -i ~/.ssh/id_rsa root@204.168.144.14

# 3. If unexpected, investigate before accepting
# Could be man-in-the-middle attack
```

---

## Docker Issues

### Container Won't Start

**Symptoms**:

```
Error response from daemon: driver failed programming external connectivity
```

**Solutions**:

```bash
# 1. Check port conflicts
netstat -tulpn | grep 8090

# 2. Kill process using port
kill -9 $(lsof -t -i:8090)

# 3. Remove existing containers
docker rm -f eggo-pb

# 4. Check Docker daemon
systemctl status docker

# 5. Restart Docker
systemctl restart docker
```

---

### Out of Disk Space

**Symptoms**:

```
Error: No space left on device
```

**Solutions**:

```bash
# 1. Check disk usage
df -h

# 2. Clean Docker
docker system prune -a -f

# 3. Clean old backups
find /root/eggo-pocketbase/backups -mtime +30 -delete

# 4. Clean old logs
find /var/log -name "*.log" -mtime +7 -delete

# 5. Check large files
find / -type f -size +100M -exec ls -lh {} \;
```

---

### Image Pull Errors

**Symptoms**:

```
Error response from daemon: pull access denied
```

**Solutions**:

```bash
# 1. Login to registry
docker login ghcr.io

# 2. Check image name
docker pull ghcr.io/tokenine/eggo-pocketbase:latest

# 3. Check if image exists
# Visit: https://github.com/tokenine/eggo-pocketbase/pkgs/container/eggo-pocketbase

# 4. Verify permissions
# Check GitHub Packages settings
```

---

## Database Issues

### Database Locked

**Symptoms**:

```
database is locked
```

**Solutions**:

```bash
# 1. Check for running processes
ssh root@204.168.144.14 "lsof /root/eggo-pocketbase/apps/backend/pb_data/data.db"

# 2. Restart container
ssh root@204.168.144.14 "docker restart eggo-pb"

# 3. If persists, check for zombie processes
ps aux | grep pocketbase

# 4. Last resort: backup and restore
# (See backup/restore procedures)
```

---

### Data Corruption

**Symptoms**:

```
Error: database disk image is malformed
```

**Solutions**:

```bash
# 1. Stop container immediately
docker stop eggo-pb

# 2. Backup corrupted database
cp /root/eggo-pocketbase/apps/backend/pb_data/data.db \
   /root/eggo-pocketbase/backups/data-corrupted-$(date +%Y%m%d).db

# 3. Restore from backup
ls -lt /root/eggo-pocketbase/backups/data-*.db | head -5

# 4. Use most recent good backup
cp /root/eggo-pocketbase/backups/data-YYYYMMDD.db \
   /root/eggo-pocketbase/apps/backend/pb_data/data.db

# 5. Restart
docker start eggo-pb

# 6. Verify
curl http://localhost:8090/api/health
```

---

### Migration Errors

**Symptoms**:

```
[ERROR] failed to apply migration
```

**Solutions**:

```bash
# 1. Check migration logs
docker logs eggo-pb | grep -A 10 -i migration

# 2. List applied migrations
curl http://localhost:8090/api/collections/_migrations/records

# 3. Check migration file
ls -la /root/eggo-pocketbase/apps/backend/pb_migrations/

# 4. If migration is bad, remove it (use with caution)
# Only remove if it hasn't partially run
rm /root/eggo-pocketbase/apps/backend/pb_migrations/XXX_bad.pb.js

# 5. Restart
docker restart eggo-pb
```

---

## Network Issues

### DNS Resolution Failures

**Symptoms**:

```
curl: (6) Could not resolve host: pb.eggoworld.io
```

**Solutions**:

```bash
# 1. Check DNS resolution
nslookup pb.eggoworld.io

# 2. Check DNS propagation
dig pb.eggoworld.io

# 3. Check local DNS
cat /etc/resolv.conf

# 4. Use Google DNS temporarily
# Edit /etc/resolv.conf
nameserver 8.8.8.8
```

---

### SSL/TLS Errors

**Symptoms**:

```
curl: (60) SSL certificate problem: certificate has expired
```

**Solutions**:

```bash
# 1. Check certificate expiry
echo | openssl s_client -servername pb.eggoworld.io -connect pb.eggoworld.io:443 2>/dev/null | openssl x509 -noout -dates

# 2. Check Cloudflare/CDN status
# Visit: https://dash.cloudflare.com

# 3. Check certificate on server
ssh root@204.168.144.14 "openssl x509 -in /path/to/cert.pem -noout -text"

# 4. If self-signed, update trust store (for testing only)
# curl -k https://pb.eggoworld.io/api/health
```

---

### Connection Refused

**Symptoms**:

```
curl: (7) Failed to connect to pb.eggoworld.io port 443: Connection refused
```

**Solutions**:

```bash
# 1. Check if server is up
ping pb.eggoworld.io

# 2. Check if service is listening locally
ssh root@204.168.144.14 "netstat -tulpn | grep 8090"

# 3. Check firewall
ssh root@204.168.144.14 "iptables -L | grep 8090"

# 4. Check nginx proxy
ssh root@204.168.144.14 "docker logs eggo-nginx | tail -20"
```

---

## Debug Commands

### Container Debugging

```bash
# Get shell in container
docker exec -it eggo-pb /bin/sh

# View environment variables
docker exec eggo-pb env

# View process list
docker exec eggo-pb ps aux

# View resource usage
docker stats eggo-pb

# Copy files from container
docker cp eggo-pb:/pb/pb_data/data.db ./data.db
```

---

### Log Analysis

```bash
# Follow logs in real-time
docker logs -f eggo-pb

# Search for errors
docker logs eggo-pb 2>&1 | grep -i error

# Get last N lines
docker logs --tail 500 eggo-pb

# Logs since specific time
docker logs --since 2026-04-12T10:00:00 eggo-pb

# Export logs
docker logs eggo-pb > /tmp/eggo-logs-$(date +%Y%m%d-%H%M%S).log
```

---

### Network Debugging

```bash
# Test connectivity from container
docker exec eggo-pb wget -qO- http://localhost:8090/api/health

# Check DNS from container
docker exec eggo-pb nslookup pb.eggoworld.io

# Check open ports
ss -tulpn

# Trace route
traceroute pb.eggoworld.io

# TCP dump (advanced)
tcpdump -i any port 8090 -w /tmp/capture.pcap
```

---

### Performance Debugging

```bash
# Check CPU/Memory
top
htop

# Check disk I/O
iotop

# Check database performance
# Access PocketBase admin and check slow queries

# Profile API calls
curl -w "@curl-format.txt" -o /dev/null -s https://pb.eggoworld.io/api/health
```

Contents of `curl-format.txt`:

```
time_namelookup: %{time_namelookup}\n
time_connect: %{time_connect}\n
time_appconnect: %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect: %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n
time_total: %{time_total}\n
```

---

### Database Debugging

```bash
# Access SQLite database directly
ssh root@204.168.144.14
sqlite3 /root/eggo-pocketbase/apps/backend/pb_data/data.db

# Common SQLite commands
.tables                    # List tables
.schema users              # Show table schema
SELECT count(*) FROM users;  # Count records
SELECT * FROM _migrations;  # Check migrations
.exit                      # Quit

# Check database integrity
sqlite3 data.db "PRAGMA integrity_check;"

# Vacuum database (reclaim space)
sqlite3 data.db "VACUUM;"
```

---

## Quick Fixes

### Restart Everything

```bash
# Nuclear option - restart all services
ssh root@204.168.144.14 "cd /root/eggo-pocketbase && docker-compose down && docker-compose up -d"
```

### Clear All Docker Data

```bash
# WARNING: Destructive - only use in emergencies
docker stop $(docker ps -q)
docker rm $(docker ps -aq)
docker system prune -a -f --volumes
```

### Reset to Last Known Good

```bash
# Rollback to previous deployment
make rollback-prod

# Or manually
cd /root/eggo-pocketbase
git log --oneline -10  # Find last good commit
./scripts/rollback.sh --version=<commit-hash>
```

---

## Getting Help

### Gather Debug Info

When asking for help, provide:

```bash
# Run this to gather info
{
  echo "=== Health Check ==="
  make health-check-prod 2>&1 || true
  echo ""
  echo "=== Container Status ==="
  ssh root@204.168.144.14 "docker ps -a" 2>&1 || true
  echo ""
  echo "=== Recent Logs ==="
  ssh root@204.168.144.14 "docker logs --tail 50 eggo-pb" 2>&1 || true
  echo ""
  echo "=== Disk Space ==="
  ssh root@204.168.144.14 "df -h" 2>&1 || true
} > /tmp/debug-info-$(date +%Y%m%d-%H%M%S).txt
```

### Support Resources

- [Deployment Guide](DEPLOY_PHASE02.md)
- [Operations Runbook](DEPLOY_RUNBOOK.md)
- [Secrets Setup](SECRETS_SETUP.md)
- [PocketBase Docs](https://pocketbase.io/docs/)

---

## Prevention

### Regular Maintenance

```bash
# Weekly
make health-check-prod
docker system prune -f

# Monthly
# Review and clean old backups
# Update base images
# Review logs for patterns

# Quarterly
# Rotate secrets
# Update SSL certificates
# Review access logs
```

### Monitoring Setup

```bash
# Set up cron for health checks
crontab -e

# Add:
*/5 * * * * /root/eggo-pocketbase/scripts/health-check.sh --remote --json >> /var/log/eggo-health.log 2>&1
```

---

**Last Updated**: 2026-04-12
**Version**: 1.0.0
