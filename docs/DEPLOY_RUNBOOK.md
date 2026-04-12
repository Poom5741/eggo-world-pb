# Deployment Runbook

Operations runbook for managing the Eggo PocketBase production deployment. Use this guide for daily operations, deployments, monitoring, and incident response.

## Table of Contents

- [Daily Operations Checklist](#daily-operations-checklist)
- [Deployment Procedures](#deployment-procedures)
- [Monitoring Procedures](#monitoring-procedures)
- [Incident Response](#incident-response)
- [Rollback Runbook](#rollback-runbook)
- [Emergency Contacts](#emergency-contacts)
- [Escalation Procedures](#escalation-procedures)

---

## Daily Operations Checklist

Run this checklist at the start of each day or shift.

### Morning Health Check

```bash
# Run comprehensive health check
make health-check-prod

# Expected: All checks PASS, Status: HEALTHY
```

### Manual Checks

```bash
# 1. Check container status
ssh root@204.168.144.14 "docker ps --filter 'name=eggo'"

# Expected output:
# CONTAINER ID   IMAGE                           STATUS          PORTS
# abc123...      ghcr.io/tokenine/eggo-pocketbase:latest   Up 12 hours     0.0.0.0:8090->8090/tcp
# def456...      ghcr.io/tokenine/eggo-pocketbase:wallet-api-latest   Up 12 hours     0.0.0.0:3001->3001/tcp

# 2. Check API health
curl -s https://pb.eggoworld.io/api/health | jq '.code'

# Expected: 200

# 3. Check disk space
ssh root@204.168.144.14 "df -h /"

# Expected: Less than 80% used

# 4. Check memory usage
ssh root@204.168.144.14 "free -h"

# 5. Check recent logs for errors
ssh root@204.168.144.14 "docker logs --tail 50 eggo-pb 2>&1 | grep -i error"

# Expected: No errors (or only expected warnings)
```

### Daily Checklist Table

| Check              | Command                                   | Expected Result      | Action if Failed               |
| ------------------ | ----------------------------------------- | -------------------- | ------------------------------ |
| API Health         | `curl https://pb.eggoworld.io/api/health` | HTTP 200             | Check logs, restart containers |
| Containers Running | `docker ps --filter 'name=eggo'`          | Both containers Up   | Investigate, restart           |
| Disk Space         | `df -h /`                                 | < 80% used           | Clean up old backups/logs      |
| Memory             | `free -h`                                 | < 90% used           | Check for memory leaks         |
| Error Logs         | `docker logs eggo-pb \| grep error`       | No critical errors   | Investigate errors             |
| Backup Status      | `ls -la /root/eggo-pocketbase/backups/`   | Recent backup exists | Run manual backup              |

### Weekly Tasks

Run these tasks once per week:

```bash
# 1. Review backup retention
ssh root@204.168.144.14 "ls -la /root/eggo-pocketbase/backups/"

# 2. Clean old backups (keeps last 30 days)
ssh root@204.168.144.14 "find /root/eggo-pocketbase/backups/ -name 'snapshot-*.json' -mtime +30 -delete"

# 3. Review Docker images
ssh root@204.168.144.14 "docker images --filter 'reference=ghcr.io/tokenine/eggo-pocketbase'"

# 4. Clean old Docker images
ssh root@204.168.144.14 "docker image prune -f"

# 5. Review resource usage
ssh root@204.168.144.14 "docker stats --no-stream --format 'table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}'"
```

---

## Deployment Procedures

### Standard Deployment

Follow this procedure for normal deployments:

#### Pre-Deployment

```bash
# 1. Check current health
make health-check-prod

# 2. Review changes
gh pr list

# 3. Verify secrets
./scripts/setup-secrets.sh --validate

# 4. Run dry-run
make deploy-prod-dry-run
```

#### Deployment Execution

```bash
# Run deployment
make deploy-prod

# Or with specific stage
./scripts/deploy-phase02.sh --stage=40
```

#### Post-Deployment Verification

```bash
# 1. Health check
make health-check-prod

# 2. API test
curl -s https://pb.eggoworld.io/api/health | jq

# 3. Admin panel access
open https://pb.eggoworld.io/_/

# 4. Test LINE OAuth
# Navigate to: https://pb.eggoworld.io/api/oauth2-redirect

# 5. Check logs for errors
ssh root@204.168.144.14 "docker logs --tail 100 eggo-pb"
```

### Emergency Deployment

For urgent hotfixes:

```bash
# 1. Create backup first
make backup-prod

# 2. Deploy with minimal checks
./scripts/deploy-phase02.sh --stage=40

# 3. Quick verification
curl https://pb.eggoworld.io/api/health

# 4. Monitor closely for 30 minutes
watch -n 5 'curl -s https://pb.eggoworld.io/api/health | jq .code'
```

### Deployment Windows

| Environment | Deployment Window | Notes                  |
| ----------- | ----------------- | ---------------------- |
| Production  | 02:00 - 06:00 UTC | Low traffic period     |
| Hotfix      | Any time          | With team notification |
| Scheduled   | Sundays 04:00 UTC | Regular maintenance    |

### Deployment Approval

| Deployment Type | Required Approval | Notification       |
| --------------- | ----------------- | ------------------ |
| Standard        | Tech Lead         | Slack #deployments |
| Hotfix          | On-call Engineer  | Slack #incidents   |
| Emergency       | Any senior dev    | Phone call         |

---

## Monitoring Procedures

### Health Monitoring

```bash
# Automated health check (every 5 minutes via cron)
*/5 * * * * /root/eggo-pocketbase/scripts/health-check.sh --remote --json >> /var/log/eggo-health.log
```

### Log Monitoring

```bash
# View real-time logs
ssh root@204.168.144.14 "docker logs -f eggo-pb"

# View Wallet API logs
ssh root@204.168.144.14 "docker logs -f eggo-wallet-api"

# Search for specific errors
ssh root@204.168.144.14 "docker logs eggo-pb 2>&1 | grep -i 'error\|fatal\|panic'"

# Export logs for analysis
ssh root@204.168.144.14 "docker logs eggo-pb > /tmp/eggo-logs-$(date +%Y%m%d).log"
```

### Metrics to Monitor

| Metric            | Normal Range | Alert Threshold | Check Command                                     |
| ----------------- | ------------ | --------------- | ------------------------------------------------- |
| API Response Time | < 500ms      | > 2s            | `time curl -s https://pb.eggoworld.io/api/health` |
| Container Uptime  | > 99.9%      | < 95%           | `docker ps --filter 'name=eggo'`                  |
| Disk Usage        | < 70%        | > 85%           | `df -h /`                                         |
| Memory Usage      | < 80%        | > 90%           | `free -h`                                         |
| Error Rate        | < 0.1%       | > 1%            | Check application logs                            |
| Backup Age        | < 24 hours   | > 48 hours      | `ls -la /root/eggo-pocketbase/backups/`           |

### Alert Configuration

Configure webhook alerts:

```bash
# Set alert webhook
export ALERT_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Test alert
./scripts/monitoring/alert-hook.sh --message="Test alert" --severity=info
```

### Monitoring Dashboard

Access monitoring endpoints:

```bash
# Health endpoint
curl https://pb.eggoworld.io/api/health

# Admin panel
open https://pb.eggoworld.io/_/

# Container metrics
ssh root@204.168.144.14 "docker stats --no-stream eggo-pb eggo-wallet-api"
```

---

## Incident Response

### Severity Levels

| Severity          | Description       | Examples                   | Response Time     |
| ----------------- | ----------------- | -------------------------- | ----------------- |
| **P0 - Critical** | Complete outage   | All services down          | 15 minutes        |
| **P1 - High**     | Major degradation | API errors, slow responses | 1 hour            |
| **P2 - Medium**   | Minor issues      | Non-critical errors        | 4 hours           |
| **P3 - Low**      | Cosmetic issues   | UI glitches, warnings      | Next business day |

### Incident Response Flow

```
1. DETECT
   └── Health check fails / Alert received

2. ACKNOWLEDGE
   └── Post in #incidents Slack channel
   └── Assign on-call engineer

3. ASSESS
   └── Determine severity level
   └── Identify affected services

4. RESPOND
   ├── P0: Immediate rollback
   ├── P1: Attempt fix, rollback if fails
   ├── P2: Schedule fix
   └── P3: Document for next sprint

5. RESOLVE
   └── Verify fix
   └── Update status page
   └── Post-mortem within 24h (P0/P1)
```

### P0 Incident Response

For complete outages:

```bash
# 1. Acknowledge incident
# Post in Slack: "P0 incident acknowledged - [your name]"

# 2. Immediate rollback
make rollback-prod

# 3. Verify rollback
make health-check-prod

# 4. If rollback fails, manual recovery
ssh root@204.168.144.14 "cd /root/eggo-pocketbase && docker-compose down && docker-compose up -d"

# 5. Verify services
curl -s https://pb.eggoworld.io/api/health

# 6. Update incident channel
# Post: "Service restored via rollback at [time]"
```

### P1 Incident Response

For major degradation:

```bash
# 1. Check current status
make health-check-prod

# 2. Identify failing component
ssh root@204.168.144.14 "docker ps"
ssh root@204.168.144.14 "docker logs eggo-pb --tail 100"

# 3. Attempt restart
ssh root@204.168.144.14 "docker restart eggo-pb"
sleep 30
make health-check-prod

# 4. If restart fails, rollback
make rollback-prod
```

### Communication Template

**Incident Started:**

```
🚨 INCIDENT: [Brief description]
Severity: [P0/P1/P2/P3]
Time: [ISO timestamp]
Impact: [What is affected]
On-call: [Your name]
Status: Investigating
```

**Incident Update:**

```
🔄 UPDATE: [Brief description]
Time: [ISO timestamp]
Action: [What you're doing]
ETA: [Estimated resolution]
```

**Incident Resolved:**

```
✅ RESOLVED: [Brief description]
Time: [ISO timestamp]
Duration: [X minutes]
Resolution: [How it was fixed]
Post-mortem: [Link or "To follow"]
```

---

## Rollback Runbook

### When to Rollback

Rollback immediately when:

- Health checks fail after deployment
- Error rates spike above 5%
- API response times exceed 5 seconds
- User reports critical functionality broken
- Database corruption detected

### Automatic Rollback

The deployment script triggers automatic rollback if any stage fails:

```
[ERROR] Stage 40 failed: 40-deploy.sh
[WARN] Rollback triggered due to stage failure...
[INFO] Running rollback script...
```

### Manual Rollback

```bash
# Standard rollback (to previous version)
make rollback-prod

# Or directly
./scripts/rollback.sh
```

### Rollback to Specific Version

```bash
# List available versions
ssh root@204.168.144.14 "docker images --format '{{.Repository}}:{{.Tag}}' | grep eggo-pocketbase"

# Rollback to specific version
./scripts/rollback.sh --version=ghcr.io/tokenine/eggo-pocketbase:abc123
```

### Emergency Manual Rollback

If the rollback script fails:

```bash
# SSH to server
ssh root@204.168.144.14

# Stop containers
docker stop eggo-pb eggo-wallet-api
docker rm eggo-pb eggo-wallet-api

# Pull previous image (replace with actual previous tag)
docker pull ghcr.io/tokenine/eggo-pocketbase:previous-tag

# Start containers
cd /root/eggo-pocketbase
docker-compose up -d

# Verify
curl http://localhost:8090/api/health
```

### Rollback Verification

```bash
# 1. Health check
make health-check-prod

# 2. Check container status
ssh root@204.168.144.14 "docker ps --filter 'name=eggo'"

# 3. Test API
curl https://pb.eggoworld.io/api/health

# 4. Check logs
ssh root@204.168.144.14 "docker logs --tail 50 eggo-pb"
```

### Post-Rollback Steps

1. **Verify service health**
2. **Notify team** in Slack
3. **Preserve logs** from failed deployment
4. **Create incident ticket**
5. **Schedule post-mortem** (for P0/P1)

---

## Emergency Contacts

### Team Contacts

| Role             | Name       | Phone   | Slack     | Email   |
| ---------------- | ---------- | ------- | --------- | ------- |
| Tech Lead        | [Name]     | [Phone] | @[handle] | [email] |
| DevOps Lead      | [Name]     | [Phone] | @[handle] | [email] |
| On-call Engineer | [Rotation] | [Phone] | @[handle] | [email] |
| Product Owner    | [Name]     | [Phone] | @[handle] | [email] |

### Vendor Contacts

| Service    | Contact    | URL                    | Status Page          |
| ---------- | ---------- | ---------------------- | -------------------- |
| GitHub     | Support    | support.github.com     | githubstatus.com     |
| Docker Hub | Support    | hub.docker.com         | status.docker.com    |
| Cloudflare | Support    | support.cloudflare.com | cloudflarestatus.com |
| LINE       | Developers | developers.line.biz    | -                    |

### Infrastructure

| Component          | IP/URL                     | Access Method   |
| ------------------ | -------------------------- | --------------- |
| Production Server  | 204.168.144.14             | SSH (key-based) |
| PocketBase API     | https://pb.eggoworld.io    | HTTPS           |
| Admin Panel        | https://pb.eggoworld.io/_/ | HTTPS + auth    |
| Container Registry | ghcr.io/tokenine           | Docker CLI      |

---

## Escalation Procedures

### Escalation Path

```
Level 1: On-call Engineer (0-15 min)
    ↓ No resolution
Level 2: Tech Lead (15-30 min)
    ↓ No resolution
Level 3: DevOps Lead (30-60 min)
    ↓ No resolution
Level 4: CTO / Executive (60+ min)
```

### Escalation Criteria

**Auto-escalate if:**

- P0 incident not acknowledged within 5 minutes
- No progress update in 15 minutes
- Rollback fails
- Data loss suspected

**Manual escalation when:**

- Need additional expertise
- Vendor support required
- Communication needed with users
- Legal/compliance issues

### Escalation Template

```
ESCALATION: [Incident ID]
Severity: [P0/P1/P2]
Time Open: [X minutes]
Current Owner: [Name]
Issue: [Brief description]
Actions Taken: [What was tried]
Escalating To: [Next level]
Reason: [Why escalating]
```

---

## Runbook Maintenance

### Review Schedule

| Task              | Frequency | Owner            |
| ----------------- | --------- | ---------------- |
| Review procedures | Monthly   | DevOps Lead      |
| Update contacts   | Quarterly | Tech Lead        |
| Test rollback     | Monthly   | On-call Engineer |
| Update alerts     | As needed | DevOps Lead      |
| Runbook training  | Quarterly | Tech Lead        |

### Version History

| Date       | Version | Changes         | Author |
| ---------- | ------- | --------------- | ------ |
| 2026-04-12 | 1.0.0   | Initial runbook | [Name] |

---

## Quick Reference

### Essential Commands

```bash
# Health check
make health-check-prod

# Deploy
make deploy-prod

# Rollback
make rollback-prod

# Backup
make backup-prod

# View logs
ssh root@204.168.144.14 "docker logs -f eggo-pb"

# Restart service
ssh root@204.168.144.14 "docker restart eggo-pb"

# Check status
ssh root@204.168.144.14 "docker ps --filter 'name=eggo'"
```

### Important URLs

- **Production API**: https://pb.eggoworld.io
- **Admin Panel**: https://pb.eggoworld.io/_/
- **Health Endpoint**: https://pb.eggoworld.io/api/health
- **GitHub Repo**: https://github.com/tokenine/eggo-pocketbase

### File Locations

```
/root/eggo-pocketbase/
├── apps/
│   └── backend/
│       ├── pb_data/          # Database files
│       ├── pb_hooks/         # Business logic hooks
│       └── pb_migrations/    # Database migrations
├── backups/                   # Backup files
├── docker-compose.yml         # Container orchestration
└── .env.production           # Production secrets (not in git)
```

---

**Last Updated**: 2026-04-12
**Version**: 1.0.0
**Next Review**: 2026-05-12
