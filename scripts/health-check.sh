#!/bin/bash
# Comprehensive health check for PocketBase deployment
# Usage: ./health-check.sh [--local|--remote] [--json] [--verbose]
#
# Checks:
# - PocketBase API health
# - Wallet API health
# - Nginx proxy health
# - Database connectivity
# - Sync state status
# - Container status

set -e

# Default configuration
MODE="local"
JSON_OUTPUT=false
VERBOSE=false
RETRY_ATTEMPTS=3
RETRY_DELAY=2
ALERT_THRESHOLD=3

# Configuration files
CONFIG_FILE="${HOME}/.eggo-health-config"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
FAILURE_COUNT=0
CHECKS_PASSED=0
CHECKS_FAILED=0

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --local)
                MODE="local"
                shift
                ;;
            --remote)
                MODE="remote"
                shift
                ;;
            --json)
                JSON_OUTPUT=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --retry=*)
                RETRY_ATTEMPTS="${1#*=}"
                shift
                ;;
            --alert-threshold=*)
                ALERT_THRESHOLD="${1#*=}"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
PocketBase Health Check

Usage: $0 [OPTIONS]

Options:
  --local                 Run health checks on local deployment (default)
  --remote                Run health checks on production deployment
  --json                  Output results in JSON format
  --verbose               Enable verbose output
  --retry=N              Number of retry attempts (default: 3)
  --alert-threshold=N    Alert after N consecutive failures (default: 3)
  -h, --help             Show this help message

Examples:
  $0 --local --verbose
  $0 --remote --json
  $0 --retry=5 --alert-threshold=3

EOF
}

# Logging functions
log_info() {
    if [ "$VERBOSE" = true ] || [ "$JSON_OUTPUT" = false ]; then
        echo -e "${BLUE}INFO${NC}: $1"
    fi
}

log_pass() {
    ((CHECKS_PASSED++))
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${GREEN}✓ PASS${NC}: $1"
    fi
}

log_fail() {
    ((CHECKS_FAILED++))
    ((FAILURE_COUNT++))
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${RED}✗ FAIL${NC}: $1"
    fi
}

log_warn() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${YELLOW}⚠ WARN${NC}: $1"
    fi
}

# Load configuration
load_config() {
    if [ "$MODE" = "remote" ]; then
        export PB_URL="https://pb.eggoworld.io"
        export PB_ADMIN_TOKEN="${PB_ADMIN_TOKEN:-}"
        export WALLET_API_URL="https://pb.eggoworld.io"
    else
        export PB_URL="http://localhost:8090"
        export PB_ADMIN_TOKEN="${PB_ADMIN_TOKEN:-}"
        export WALLET_API_URL="http://localhost:3001"
    fi

    # Load from config file if exists
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi

    # Load from environment if available
    export PB_ADMIN_TOKEN="${PB_ADMIN_TOKEN:-}"
    export ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
}

# Retry wrapper for commands
retry_command() {
    local cmd="$1"
    local attempt=1
    local max_attempts="$RETRY_ATTEMPTS"
    
    while [ $attempt -le $max_attempts ]; do
        if eval "$cmd" 2>/dev/null; then
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            log_info "Retry $attempt/$max_attempts failed, waiting ${RETRY_DELAY}s..."
            sleep "$RETRY_DELAY"
        fi
        
        ((attempt++))
    done
    
    return 1
}

# Check PocketBase API health
check_pocketbase_health() {
    log_info "Checking PocketBase health at $PB_URL"
    
    local response
    local http_code
    
    if [ "$VERBOSE" = true ]; then
        response=$(curl -sS -w "\n%{http_code}" "$PB_URL/api/health")
        http_code=$(echo "$response" | tail -n1)
        response=$(echo "$response" | sed '$d')
    else
        response=$(curl -sS "$PB_URL/api/health")
        http_code=$(curl -sS -o /dev/null -w "%{http_code}" "$PB_URL/api/health")
    fi
    
    if [ "$http_code" = "200" ] && echo "$response" | jq -e '.code == 200' >/dev/null 2>&1; then
        log_pass "PocketBase API health check"
        return 0
    else
        log_fail "PocketBase API health check (HTTP $http_code): $response"
        return 1
    fi
}

# Check Wallet API health
check_wallet_api_health() {
    log_info "Checking Wallet API health at $WALLET_API_URL"
    
    local response
    local http_code
    
    response=$(curl -sS "$WALLET_API_URL/health" 2>/dev/null || echo '{"status":"error"}')
    http_code=$(curl -sS -o /dev/null -w "%{http_code}" "$WALLET_API_URL/health" 2>/dev/null || echo "000")
    
    if [ "$http_code" = "200" ] || echo "$response" | jq -e '.status' >/dev/null 2>&1; then
        log_pass "Wallet API health check"
        return 0
    else
        log_fail "Wallet API health check (HTTP $http_code): $response"
        return 1
    fi
}

# Check Nginx proxy health
check_nginx_health() {
    log_info "Checking Nginx proxy health"
    
    if [ "$MODE" = "local" ]; then
        # Check if nginx container is running
        if docker ps --format '{{.Names}}' | grep -q "eggo-nginx"; then
            local response
            response=$(curl -sS "http://localhost/api/health" 2>/dev/null || echo '{"status":"error"}')
            
            if echo "$response" | jq -e '.code' >/dev/null 2>&1; then
                log_pass "Nginx proxy health check"
                return 0
            else
                log_fail "Nginx proxy health check: $response"
                return 1
            fi
        else
            log_warn "Nginx container not running (optional service)"
            return 0
        fi
    else
        # Remote: check via HTTPS
        local response
        local http_code
        response=$(curl -sS -k "https://pb.eggoworld.io/api/health" 2>/dev/null || echo '{"status":"error"}')
        http_code=$(curl -sS -k -o /dev/null -w "%{http_code}" "https://pb.eggoworld.io/api/health" 2>/dev/null || echo "000")
        
        if [ "$http_code" = "200" ]; then
            log_pass "Nginx proxy health check (remote)"
            return 0
        else
            log_warn "Nginx proxy health check (HTTP $http_code)"
            return 0
        fi
    fi
}

# Check database connectivity
check_database_connectivity() {
    log_info "Checking database connectivity"
    
    if [ -z "$PB_ADMIN_TOKEN" ]; then
        log_warn "Skipping database check (no admin token)"
        return 0
    fi
    
    # Try to fetch a simple record to verify DB connectivity
    local response
    response=$(curl -sS "$PB_URL/api/collections/users/records?perPage=1" \
        -H "Authorization: Bearer $PB_ADMIN_TOKEN" 2>/dev/null)
    
    if echo "$response" | jq -e '.page' >/dev/null 2>&1; then
        log_pass "Database connectivity check"
        return 0
    else
        log_fail "Database connectivity check: $response"
        return 1
    fi
}

# Check sync_state collection status
check_sync_state() {
    log_info "Checking sync_state collection status"
    
    if [ -z "$PB_ADMIN_TOKEN" ]; then
        log_warn "Skipping sync_state check (no admin token)"
        return 0
    fi
    
    local response
    response=$(curl -sS "$PB_URL/api/collections/sync_state/records?filter=id%3D%22config%22" \
        -H "Authorization: Bearer $PB_ADMIN_TOKEN" 2>/dev/null)
    
    if echo "$response" | jq -e '.items[0].id' >/dev/null 2>&1; then
        local status
        local last_block
        local last_sync
        local last_error
        
        status=$(echo "$response" | jq -r '.items[0].status // "unknown"')
        last_block=$(echo "$response" | jq -r '.items[0].lastProcessedBlock // 0')
        last_sync=$(echo "$response" | jq -r '.items[0].lastSyncTimestamp // "never"')
        last_error=$(echo "$response" | jq -r '.items[0].last_error // ""')
        
        log_pass "Sync state collection exists"
        
        if [ "$VERBOSE" = true ]; then
            echo "  Status: $status"
            echo "  Last processed block: $last_block"
            echo "  Last sync timestamp: $last_sync"
            if [ -n "$last_error" ] && [ "$last_error" != "null" ]; then
                log_warn "Last error: $last_error"
            fi
        fi
        
        # Check sync status
        if [ "$status" = "error" ]; then
            log_fail "Sync status is 'error'"
            return 1
        elif [ "$status" = "syncing" ]; then
            log_pass "Sync status is 'syncing'"
        else
            log_warn "Sync status is '$status'"
        fi
        
        return 0
    else
        log_warn "Sync state collection not found (may not be deployed yet)"
        return 0
    fi
}

# Check container status (local only)
check_container_status() {
    if [ "$MODE" != "local" ]; then
        return 0
    fi
    
    log_info "Checking container status"
    
    local containers=("eggo-pb" "eggo-wallet-api")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            log_pass "Container '$container' is running"
        else
            log_fail "Container '$container' is not running"
            all_running=false
        fi
    done
    
    # Check nginx (optional)
    if docker ps --format '{{.Names}}' | grep -q "eggo-nginx"; then
        log_pass "Container 'eggo-nginx' is running"
    else
        log_info "Container 'eggo-nginx' not running (optional)"
    fi
    
    if [ "$all_running" = true ]; then
        return 0
    else
        return 1
    fi
}

# Check migration status
check_migration_status() {
    log_info "Checking migration status"
    
    if [ ! -d "apps/backend/pb_migrations" ]; then
        log_warn "Migration directory not found"
        return 0
    fi
    
    local migration_count
    migration_count=$(find apps/backend/pb_migrations -name "*.pb.js" 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$migration_count" -gt 0 ]; then
        log_pass "Migration files present ($migration_count files)"
        return 0
    else
        log_warn "No migration files found"
        return 0
    fi
}

# Send alert if threshold exceeded
send_alert_if_needed() {
    if [ "$FAILURE_COUNT" -ge "$ALERT_THRESHOLD" ]; then
        log_warn "Failure threshold exceeded ($FAILURE_COUNT >= $ALERT_THRESHOLD)"
        
        if [ -n "$ALERT_WEBHOOK_URL" ]; then
            local message="PocketBase health check failed: $CHECKS_FAILED checks failed"
            local severity="error"
            
            if [ "$MODE" = "remote" ]; then
                message="Production PocketBase health check failed: $CHECKS_FAILED checks failed"
                severity="critical"
            fi
            
            # Call alert hook
            if [ -x "scripts/monitoring/alert-hook.sh" ]; then
                ./scripts/monitoring/alert-hook.sh \
                    --message="$message" \
                    --severity="$severity"
            else
                # Direct webhook call
                curl -sS -X POST "$ALERT_WEBHOOK_URL" \
                    -H "Content-Type: application/json" \
                    -d "{\"text\":\"$message\",\"severity\":\"$severity\"}"
            fi
            
            log_info "Alert sent to webhook"
        else
            log_info "No alert webhook configured (set ALERT_WEBHOOK_URL)"
        fi
    fi
}

# Generate JSON output
generate_json_output() {
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    cat << EOF
{
  "timestamp": "$timestamp",
  "mode": "$MODE",
  "pb_url": "$PB_URL",
  "wallet_api_url": "$WALLET_API_URL",
  "checks_passed": $CHECKS_PASSED,
  "checks_failed": $CHECKS_FAILED,
  "failure_count": $FAILURE_COUNT,
  "alert_threshold": $ALERT_THRESHOLD,
  "status": "$([ $CHECKS_FAILED -eq 0 ] && echo 'healthy' || echo 'unhealthy')"
}
EOF
}

# Main execution
main() {
    parse_args "$@"
    load_config
    
    if [ "$JSON_OUTPUT" = false ]; then
        echo "=== PocketBase Health Check ==="
        echo "Mode: $MODE"
        echo "PocketBase URL: $PB_URL"
        echo "Wallet API URL: $WALLET_API_URL"
        echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
        echo ""
    fi
    
    # Run health checks
    check_pocketbase_health || true
    check_wallet_api_health || true
    check_nginx_health || true
    check_database_connectivity || true
    check_sync_state || true
    check_container_status || true
    check_migration_status || true
    
    # Check alert threshold
    send_alert_if_needed
    
    # Output results
    if [ "$JSON_OUTPUT" = true ]; then
        generate_json_output
    else
        echo ""
        echo "=== Health Check Summary ==="
        echo "Checks passed: $CHECKS_PASSED"
        echo "Checks failed: $CHECKS_FAILED"
        echo "Status: $([ $CHECKS_FAILED -eq 0 ] && echo -e "${GREEN}HEALTHY${NC}" || echo -e "${RED}UNHEALTHY${NC}")"
    fi
    
    # Exit with appropriate code
    if [ $CHECKS_FAILED -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main
main "$@"
