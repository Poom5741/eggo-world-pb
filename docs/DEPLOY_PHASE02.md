# Phase 02 Deployment Guide

Complete deployment guide for the Eggo PocketBase production environment using the Phase 02 deployment pipeline.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Workflow](#deployment-workflow)
- [Environment Variables](#environment-variables)
- [Make Targets Reference](#make-targets-reference)
- [Verification Steps](#verification-steps)
- [Rollback Procedures](#rollback-procedures)

---

## Quick Start

Deploy to production with a single command:

```bash
make deploy-prod
```

This runs the complete Phase 02 deployment pipeline with all safety checks, backups, and verifications.

### One-Command Deployment

```bash
# Full production deployment
cd /path/to/eggo-pocketbase
make deploy-prod

# Or run the deployment script directly
./scripts/deploy-phase02.sh --env=production
```

Expected output:

```
=========================================
  Eggo PocketBase Deployment Orchestration
  Phase 02 - Full Deployment Pipeline
=========================================

[INFO] Initializing deployment...
[INFO] Prerequisites validated
[INFO] Environment variables validated
Deployment parameters:
  Environment: production
  Target host: 204.168.144.14
  Dry run mode: false
  Project root: /path/to/eggo-pocketbase

Press Ctrl+C to cancel, or Enter to continue:
[WARN] Starting production deployment. Press Ctrl+C to abort within 5 seconds.
[STEP] Executing stage: 00 - 00-pre-deploy.sh
[SUCCESS] Stage 00 completed successfully: 00-pre-deploy.sh
...
=========================================
[SUCCESS] Deployment completed successfully!
=========================================
```

---

## Prerequisites

### Required Software

| Software       | Version | Purpose                       | Verification             |
| -------------- | ------- | ----------------------------- | ------------------------ |
| Docker         | 24.0+   | Container runtime             | `docker --version`       |
| Docker Compose | 2.20+   | Multi-container orchestration | `docker compose version` |
| OpenSSL        | 3.0+    | Secret generation             | `openssl version`        |
| SSH            | Any     | Remote server access          | `ssh -V`                 |
| Make           | 3.81+   | Build automation              | `make --version`         |
| Bash           | 4.0+    | Script execution              | `bash --version`         |

### Required Access

- **SSH access** to production server (204.168.144.14)
- **Docker registry** access (ghcr.io/tokenine)
- **GitHub repository** access for secrets
- **Admin access** to PocketBase

### Environment Setup

Before deploying, ensure these environment variables are set:

```bash
# SSH Configuration
export SSH_USER=root
export SSH_KEY=~/.ssh/id_rsa
export SSH_HOST=204.168.144.14

# Container Registry
export REGISTRY=ghcr.io/tokenine

# Deployment (set via GitHub Secrets or .env.production)
export LINE_CHANNEL_ID=your-line-channel-id
export LINE_CHANNEL_SECRET=your-line-channel-secret
export WALLET_MASTER_KEY=your-wallet-master-key
export DACC_MNEMONIC=your-dacc-mnemonic
export POCKETBASE_ADMIN_EMAIL=admin@eggoworld.io
export POCKETBASE_ADMIN_PASSWORD=your-admin-password
```

See [docs/SECRETS_SETUP.md](SECRETS_SETUP.md) for detailed secret configuration.

---

## Initial Setup

### 1. Configure SSH Access

Generate and configure SSH key for production server:

```bash
# Generate SSH key (if not exists)
ssh-keygen -t rsa -b 4096 -C "deploy@eggoworld.io" -f ~/.ssh/id_rsa

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub root@204.168.144.14

# Test connection
ssh -i ~/.ssh/id_rsa root@204.168.144.14 "echo 'SSH OK'"
```

### 2. Set Up Secrets

Run the secrets setup script:

```bash
./scripts/setup-secrets.sh
```

Or manually configure:

```bash
# Copy template
cp .env.example .env.production

# Edit with your secrets
nano .env.production

# Validate
./scripts/setup-secrets.sh --validate
```

### 3. Configure GitHub Actions (Optional)

For automated deployments via GitHub Actions, add secrets:

```bash
# Using GitHub CLI
gh secret set SSH_USER --body "root"
gh secret set SSH_KEY < ~/.ssh/id_rsa
gh secret set LINE_CHANNEL_ID --body "your-channel-id"
# ... add all required secrets
```

See [docs/SECRETS_SETUP.md](SECRETS_SETUP.md) for complete list.

### 4. Verify Initial Setup

```bash
# Check prerequisites
./scripts/deploy-phase02.sh --dry-run

# Expected output should show all checks passing
```

---

## Deployment Workflow

The Phase 02 deployment pipeline consists of 7 stages (00-60) plus an optional rollback stage (70).

### Deployment Stages

```
Stage 00: Pre-deployment checks
    ├── Validate environment variables
    ├── Check Docker availability
    ├── Test SSH connectivity
    └── Verify secrets are configured

Stage 10: Build application
    ├── Build PocketBase Docker image
    ├── Build Wallet API Docker image
    ├── Tag images with git commit hash
    └── Run local tests

Stage 20: Push Docker image
    ├── Authenticate with registry (ghcr.io/tokenine)
    ├── Push PocketBase image
    ├── Push Wallet API image
    └── Verify images in registry

Stage 30: Backup current deployment
    ├── Create database snapshot
    ├── Backup pb_data directory
    ├── Save container state
    └── Record rollback metadata

Stage 40: Deploy to production
    ├── Pull new images on server
    ├── Stop existing containers
    ├── Start new containers
    └── Configure networking

Stage 50: Run migrations
    ├── Apply database migrations
    ├── Run pb_migrations
    └── Verify migration success

Stage 60: Verify deployment
    ├── Health check API endpoints
    ├── Verify database connectivity
    ├── Test LINE OAuth
    └── Confirm Wallet API
```

### Running Specific Stages

```bash
# Run specific stage by number
./scripts/deploy-phase02.sh --stage=40

# Run specific stage by name
./scripts/deploy-phase02.sh --stage=40-deploy.sh

# Run with dry-run (no actual changes)
./scripts/deploy-phase02.sh --stage=40 --dry-run
```

### Stage Details

#### Stage 00: Pre-deployment (`scripts/stages/00-pre-deploy.sh`)

Validates all prerequisites before deployment.

```bash
# Run manually
./scripts/stages/00-pre-deploy.sh --env=production

# Checks performed:
# - Environment variables set
# - Docker daemon running
# - SSH connectivity
# - Registry access
# - Required files exist
```

#### Stage 10: Build (`scripts/stages/10-build.sh`)

Builds Docker images locally.

```bash
# Run manually
./scripts/stages/10-build.sh --env=production

# Outputs:
# - ghcr.io/tokenine/eggo-pocketbase:<commit-hash>
# - ghcr.io/tokenine/eggo-pocketbase:wallet-api-latest
```

#### Stage 20: Push (`scripts/stages/20-push.sh`)

Pushes images to container registry.

```bash
# Run manually
./scripts/stages/20-push.sh --env=production

# Requires:
# - Docker login to ghcr.io
# - Registry write permissions
```

#### Stage 30: Backup (`scripts/stages/30-backup.sh`)

Creates pre-deployment backup.

```bash
# Run manually
./scripts/stages/30-backup.sh --env=production

# Creates:
# - /root/eggo-pocketbase/backups/snapshot-<timestamp>.json
# - Database dump
```

#### Stage 40: Deploy (`scripts/stages/40-deploy.sh`)

Deploys containers to production server.

```bash
# Run manually
./scripts/stages/40-deploy.sh --env=production

# Deploys:
# - PocketBase container (eggo-pb)
# - Wallet API container (eggo-wallet-api)
```

#### Stage 50: Migrate (`scripts/stages/50-migrate.sh`)

Runs database migrations.

```bash
# Run manually
./scripts/stages/50-migrate.sh --env=production

# Runs:
# - pb_migrations/*.pb.js files
# - Auto-executes in order
```

#### Stage 60: Verify (`scripts/stages/60-verify.sh`)

Verifies deployment health.

```bash
# Run manually
./scripts/stages/60-verify.sh --env=production

# Verifies:
# - API health endpoint
# - Database connectivity
# - Container status
```

---

## Environment Variables

### Required Variables

| Variable                    | Source      | Description                | Example              |
| --------------------------- | ----------- | -------------------------- | -------------------- |
| `SSH_USER`                  | Environment | SSH username               | `root`               |
| `SSH_KEY`                   | Environment | Path to SSH private key    | `~/.ssh/id_rsa`      |
| `SSH_HOST`                  | Environment | Production server IP       | `204.168.144.14`     |
| `REGISTRY`                  | Environment | Container registry         | `ghcr.io/tokenine`   |
| `LINE_CHANNEL_ID`           | Secret      | LINE OAuth app ID          | `1234567890`         |
| `LINE_CHANNEL_SECRET`       | Secret      | LINE OAuth app secret      | `abc123...`          |
| `WALLET_MASTER_KEY`         | Secret      | Encryption key for wallets | `hex64chars...`      |
| `DACC_MNEMONIC`             | Secret      | DACC blockchain mnemonic   | `12 words...`        |
| `POCKETBASE_ADMIN_EMAIL`    | Secret      | Admin email                | `admin@eggoworld.io` |
| `POCKETBASE_ADMIN_PASSWORD` | Secret      | Admin password             | `secure123`          |

### Optional Variables

| Variable                | Default                 | Description                   |
| ----------------------- | ----------------------- | ----------------------------- |
| `REMOTE_DIR`            | `/root/eggo-pocketbase` | Deployment path on server     |
| `BACKUP_RETENTION_DAYS` | `30`                    | Backup retention period       |
| `ALERT_WEBHOOK_URL`     | -                       | Webhook for deployment alerts |

### Loading Environment

```bash
# From .env.production file
export $(cat .env.production | grep -v '^#' | xargs)

# Verify loaded
echo "SSH_HOST: $SSH_HOST"
echo "REGISTRY: $REGISTRY"
```

---

## Make Targets Reference

### Deployment Targets

| Target                | Command                    | Description                         |
| --------------------- | -------------------------- | ----------------------------------- |
| `deploy-prod`         | `make deploy-prod`         | Full production deployment          |
| `deploy-prod-dry-run` | `make deploy-prod-dry-run` | Simulate deployment without changes |
| `backup-prod`         | `make backup-prod`         | Create production backup            |
| `rollback-prod`       | `make rollback-prod`       | Rollback to previous version        |
| `health-check-prod`   | `make health-check-prod`   | Check production health             |

### Development Targets

| Target         | Command             | Description                    |
| -------------- | ------------------- | ------------------------------ |
| `dev`          | `make dev`          | Start frontend (production PB) |
| `dev-local`    | `make dev-local`    | Start frontend (local PB)      |
| `install`      | `make install`      | Install dependencies           |
| `build`        | `make build`        | Build for production           |
| `start`        | `make start`        | Start production server        |
| `backend`      | `make backend`      | Start local PocketBase         |
| `backend-stop` | `make backend-stop` | Stop local PocketBase          |

### Contract Targets

| Target                     | Command                         | Description           |
| -------------------------- | ------------------------------- | --------------------- |
| `contracts-test`           | `make contracts-test`           | Run contract tests    |
| `contracts-build`          | `make contracts-build`          | Build contracts       |
| `contracts-deploy-testnet` | `make contracts-deploy-testnet` | Deploy to BSC testnet |
| `contracts-deploy-mainnet` | `make contracts-deploy-mainnet` | Deploy to BSC mainnet |

### Git Hook Targets

| Target       | Command           | Description          |
| ------------ | ----------------- | -------------------- |
| `pre-commit` | `make pre-commit` | Run pre-commit hooks |
| `pre-push`   | `make pre-push`   | Run pre-push hooks   |

### Utility Targets

| Target  | Command      | Description                   |
| ------- | ------------ | ----------------------------- |
| `clean` | `make clean` | Clean build artifacts         |
| `env`   | `make env`   | Create local environment file |
| `help`  | `make help`  | Show all available commands   |

---

## Verification Steps

### Post-Deployment Verification

After deployment completes, verify these endpoints:

```bash
# 1. Health check
make health-check-prod

# Expected output:
# ✓ PASS: PocketBase API health check
# ✓ PASS: Wallet API health check
# ✓ PASS: Database connectivity check
# Status: HEALTHY

# 2. Manual health check
curl -s https://pb.eggoworld.io/api/health | jq

# Expected:
# {
#   "code": 200,
#   "message": "API is healthy",
#   "data": { ... }
# }

# 3. LINE OAuth test
curl -s "https://pb.eggoworld.io/api/collections/users/auth-with-oauth2" | jq

# 4. Container status
ssh root@204.168.144.14 "docker ps --filter 'name=eggo'"

# Expected:
# CONTAINER ID   IMAGE                           STATUS
# abc123...      ghcr.io/tokenine/eggo-pocketbase:latest   Up 5 minutes
# def456...      ghcr.io/tokenine/eggo-pocketbase:wallet-api-latest   Up 5 minutes
```

### Database Verification

```bash
# Check migration status
ssh root@204.168.144.14 "cd /root/eggo-pocketbase && docker logs eggo-pb 2>&1 | grep -i migration"

# Check database size
ssh root@204.168.144.14 "du -sh /root/eggo-pocketbase/apps/backend/pb_data"

# Verify collections exist
ssh root@204.168.144.14 "curl -s http://localhost:8090/api/collections | jq '.collections[].name'"
```

### Log Verification

```bash
# View recent logs
ssh root@204.168.144.14 "docker logs --tail 100 eggo-pb"

# Follow logs
ssh root@204.168.144.14 "docker logs -f eggo-pb"

# Check for errors
ssh root@204.168.144.14 "docker logs eggo-pb 2>&1 | grep -i error"
```

---

## Rollback Procedures

### Automatic Rollback

If any deployment stage fails, rollback is triggered automatically:

```
[ERROR] Stage 40 failed: 40-deploy.sh (exit code: 1)
[WARN] Rollback triggered due to stage failure...
[INFO] Running rollback script: scripts/stages/70-rollback.sh
```

### Manual Rollback

```bash
# Rollback to previous version
make rollback-prod

# Or run directly
./scripts/rollback.sh

# Rollback to specific version
./scripts/rollback.sh --version=abc123

# Dry-run rollback
./scripts/rollback.sh --dry-run
```

### Rollback Behavior

The rollback procedure:

1. **Stops** current containers (preserves data)
2. **Pulls** the previous Docker image
3. **Starts** containers with previous version
4. **Verifies** health after rollback
5. **Records** rollback in history
6. **Sends** alert notification

### Safety Guarantees

- Database data (`pb_data`) is **never touched**
- Only container images are reverted
- Health verification confirms rollback success
- All actions are logged for audit

### Post-Rollback Steps

After rollback completes:

```bash
# 1. Verify rollback
make health-check-prod

# 2. Check logs for errors
curl https://pb.eggoworld.io/api/health

# 3. Investigate original failure
cat /root/eggo-pocketbase/backups/rollback-history.json

# 4. Fix the issue
# ... make code changes ...

# 5. Re-deploy
make deploy-prod
```

### Rollback History

View rollback history:

```bash
ssh root@204.168.144.14 "cat /root/eggo-pocketbase/backups/rollback-history.json"
```

Example output:

```json
{
  "timestamp": "2026-04-12T10:30:00Z",
  "version": "ghcr.io/tokenine/eggo-pocketbase:abc123",
  "trigger": "auto",
  "previous": "ghcr.io/tokenine/eggo-pocketbase:def456"
}
```

---

## Production URLs

| Service          | URL                                  | Purpose           |
| ---------------- | ------------------------------------ | ----------------- |
| PocketBase API   | `https://pb.eggoworld.io`            | Main API endpoint |
| PocketBase Admin | `https://pb.eggoworld.io/_/`         | Admin dashboard   |
| Health Check     | `https://pb.eggoworld.io/api/health` | Health endpoint   |
| Server IP        | `204.168.144.14`                     | Production server |

---

## Additional Resources

- [Secrets Setup Guide](SECRETS_SETUP.md) - Configure production secrets
- [Deployment Runbook](DEPLOY_RUNBOOK.md) - Operations procedures
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions
- [PocketBase Documentation](https://pocketbase.io/docs/) - PocketBase reference

---

**Last Updated**: 2026-04-12
**Version**: 1.0.0
**Deployment Pipeline**: Phase 02
