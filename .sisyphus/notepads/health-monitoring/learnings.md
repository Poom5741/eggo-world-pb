## Health Monitoring System - Phase Completed

**Date:** 2026-04-12
**Scripts Created:** 3

### Files Created

1. **scripts/health-check.sh**
   - Comprehensive health checks for PocketBase deployment
   - Supports `--local` and `--remote` modes
   - Checks: PocketBase API, Wallet API, Nginx, database connectivity, sync_state, containers, migrations
   - Features: JSON output, retry logic, alert threshold, verbose mode
   - Verified: `./scripts/health-check.sh --local` runs without errors

2. **scripts/monitoring/log-aggregator.sh**
   - Collects logs from all containers
   - Supports: pocketbase, wallet-api, nginx containers
   - Features: `--follow` mode, JSON/text/combined formats, `--since` time filter
   - Can aggregate to file or stdout

3. **scripts/monitoring/alert-hook.sh**
   - Sends alerts via Slack/webhook/email
   - Severity levels: warning, error, critical
   - Environment variables: ALERT_WEBHOOK_URL, SLACK_WEBHOOK_URL, ALERT_EMAIL
   - Fixed: Removed bash 4+ associative arrays for compatibility

### Key Features

- **Health Check Modes:**
  - `--local`: Checks localhost:8090 (PocketBase), localhost:3001 (Wallet API)
  - `--remote`: Checks production at https://pb.eggoworld.io
  - `--json`: Machine-readable output for monitoring systems
  - `--verbose`: Detailed check information

- **Alert Threshold:** Configurable consecutive failures before alerting (default: 3)

- **Retry Logic:** Configurable retry attempts with exponential backoff (default: 3 attempts, 2s delay)

- **Container Detection:** Automatically detects running Docker containers

### Usage Examples

```bash
# Local health check with verbose output
./scripts/health-check.sh --local --verbose

# Remote health check with JSON output
./scripts/health-check.sh --remote --json

# Collect last hour of logs to file
./scripts/monitoring/log-aggregator.sh --since=1h --output=logs.txt

# Follow logs in real-time
./scripts/monitoring/log-aggregator.sh --follow --containers=eggo-pb,eggo-wallet-api

# Send critical alert (dry run)
./scripts/monitoring/alert-hook.sh --message="Service down" --severity=critical --dry-run
```

### Environment Variables

```bash
# Alert configuration
export ALERT_WEBHOOK_URL="https://hooks.slack.com/..."
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export SLACK_CHANNEL="#alerts-critical"
export ALERT_EMAIL="ops@example.com"
export ALERT_THRESHOLD=3

# Admin token for database checks (optional)
export PB_ADMIN_TOKEN="your-jwt-token"
```

### Integration Points

- Called by `health-check.sh` when threshold exceeded
- Can integrate with external monitoring systems via JSON output
- Supports generic webhooks and Slack webhooks

### Notes

- All scripts are executable (chmod +x)
- Bash syntax validated with `bash -n`
- Comments are minimal usage documentation (CLI help)
- No hardcoded credentials - all secrets via environment variables
