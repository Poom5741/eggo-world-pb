#!/bin/bash
# Rollback PocketBase deployment to previous version
# Usage: ./rollback.sh [--version=<hash>] [--auto] [--dry-run]
#
# Modes:
# --auto: Automatic rollback on deployment failure
# --version=<hash>: Rollback to specific git commit hash
# --dry-run: Show what would be done without executing
#
# Safety:
# - Never touches pb_data volume
# - Only reverts container image
# - Verifies health after rollback
# - Logs all actions

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-204.168.144.14}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
REMOTE_DIR="${REMOTE_DIR:-/root/eggo-pocketbase}"

REGISTRY="${REGISTRY:-ghcr.io/tokenine}"
IMAGE_NAME="eggo-pocketbase"
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"

ROLLBACK_VERSION=""
AUTO_MODE=false
DRY_RUN=false
VERBOSE=false
MAX_ROLLBACK_HISTORY=5
BACKUP_DIR="${REMOTE_DIR}/backups"

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_step() {
    echo -e "${BLUE}[ROLLBACK]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_dry_run() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    fi
}

ssh_cmd() {
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "SSH: $SSH_USER@$SSH_HOST - $1"
        return 0
    fi
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SSH_USER@$SSH_HOST" "$1"
}

# Send alert notification
send_alert() {
    local message="$1"
    local severity="${2:-error}"
    
    if [ -f "${SCRIPT_DIR}/monitoring/alert-hook.sh" ]; then
        if [ "$DRY_RUN" = true ]; then
            log_dry_run "Alert: [$severity] $message"
            return 0
        fi
        "${SCRIPT_DIR}/monitoring/alert-hook.sh" --message="$message" --severity="$severity" || {
            log_warn "Failed to send alert notification"
        }
    else
        log_warn "Alert hook not found, skipping notification"
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --version=*)
                ROLLBACK_VERSION="${1#*=}"
                shift
                ;;
            --auto)
                AUTO_MODE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
PocketBase Rollback Script

Usage: $0 [OPTIONS]

Options:
  --version=<hash>    Rollback to specific git commit hash or image tag
  --auto              Automatic rollback mode (called from deploy script)
  --dry-run           Show what would be done without executing
  --verbose           Enable verbose output
  -h, --help          Show this help message

Examples:
  $0                          # Rollback to most recent backup
  $0 --version=abc123         # Rollback to specific commit
  $0 --auto                   # Automatic rollback on failure
  $0 --dry-run                # Test rollback without changes

Rollback Behavior:
  - Reverts container image only (preserves pb_data)
  - Uses pre-deployment snapshots when available
  - Verifies health after rollback
  - Sends alert notifications
  - Logs all actions for audit

EOF
}

# Validate prerequisites
validate_prerequisites() {
    log_step "Validating prerequisites"
    
    if [ ! -f "$SSH_KEY" ] && [ "$DRY_RUN" = false ]; then
        log_error "SSH key not found: $SSH_KEY"
        log_error "Set SSH_KEY environment variable or ensure key exists"
        exit 1
    fi
    
    # Test SSH connection
        if [ "$DRY_RUN" = false ]; then
        log_info "Testing SSH connection..."
        if ! ssh_cmd "echo 'Connection successful'" > /dev/null 2>&1; then
            log_error "Cannot connect to remote server via SSH"
            log_error "Check SSH key permissions and network connectivity"
            exit 1
        fi
        log_success "SSH connection verified"
    else
        log_dry_run "Would test SSH connection to $SSH_USER@$SSH_HOST"
    fi
}

# Get available rollback versions
get_available_versions() {
    log_info "Fetching available rollback versions..."
    
    local versions
    versions=$(ssh_cmd "docker images --format '{{.Repository}}:{{.Tag}}' | grep '${FULL_IMAGE_NAME}' | sort -u" 2>/dev/null || echo "")
    
    if [ -z "$versions" ]; then
        log_warn "No backup images found on remote server"
        return 1
    fi
    
    log_info "Available versions:"
    echo "$versions" | while read -r version; do
        echo "  - $version"
    done
}

# Find the previous version to rollback to
find_previous_version() {
    if [ -n "$ROLLBACK_VERSION" ]; then
        log_info "Using specified version: $ROLLBACK_VERSION"
        echo "$ROLLBACK_VERSION"
        return 0
    fi
    
    log_info "Finding most recent backup snapshot..."
    
    local latest_snapshot
    latest_snapshot=$(ssh_cmd "ls -t ${BACKUP_DIR}/snapshot-*.json 2>/dev/null | head -1" || echo "")
    
    if [ -n "$latest_snapshot" ]; then
        log_info "Found snapshot metadata: $latest_snapshot"
        local version
        version=$(ssh_cmd "cat ${latest_snapshot} | grep -o '\"version\":\"[^\"]*\"' | cut -d'\"' -f4" || echo "")
        
        if [ -n "$version" ]; then
            log_info "Rollback target from snapshot: $version"
            echo "$version"
            return 0
        fi
    fi
    
    log_info "No snapshot found, using previous image tag..."
    local previous_version
    previous_version=$(ssh_cmd "docker images --format '{{.Repository}}:{{.Tag}}' | grep '${FULL_IMAGE_NAME}' | sort -u | tail -n 2 | head -1" || echo "")
    
    if [ -z "$previous_version" ]; then
        log_error "No previous version found for rollback"
        return 1
    fi
    
    log_info "Previous version: $previous_version"
    echo "$previous_version"
}

# Stop current containers
stop_containers() {
    log_step "Stopping current containers"
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Would stop containers: eggo-pb, eggo-wallet-api"
        return 0
    fi
    
    if ssh_cmd "docker ps -q -f name=eggo-pb" | grep -q .; then
        ssh_cmd "docker stop eggo-pb" || true
        ssh_cmd "docker rm eggo-pb" || true
        log_success "PocketBase container stopped"
    else
        log_info "No PocketBase container running"
    fi
    
    if ssh_cmd "docker ps -q -f name=eggo-wallet-api" | grep -q .; then
        ssh_cmd "docker stop eggo-wallet-api" || true
        ssh_cmd "docker rm eggo-wallet-api" || true
        log_success "Wallet API container stopped"
    else
        log_info "No Wallet API container running"
    fi
}

# Pull the rollback version
pull_rollback_image() {
    local version="$1"
    log_step "Pulling rollback image: $version"
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Would pull image: ${version}"
        return 0
    fi
    
    if ! ssh_cmd "docker pull ${version}" 2>/dev/null; then
        log_warn "Could not pull ${version}, checking local images..."
        
        if ! ssh_cmd "docker images --format '{{.Repository}}:{{.Tag}}' | grep -q '^${version}$'"; then
            log_error "Image not available: $version"
            log_error "Available images:"
            ssh_cmd "docker images --format '{{.Repository}}:{{.Tag}}' | grep '${FULL_IMAGE_NAME}'"
            return 1
        fi
    fi
    
    log_success "Rollback image ready: $version"
}

# Start containers with rollback version
start_rollback_containers() {
    local version="$1"
    log_step "Starting containers with rollback version"
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Would start containers from docker-compose.yml with image: ${version}"
        return 0
    fi
    
    ssh_cmd "cd ${REMOTE_DIR}"
    
    local network_name="eggo-network"
    
    log_info "Starting PocketBase container..."
    ssh_cmd "docker run -d \
        --name eggo-pb \
        --network ${network_name} \
        --restart unless-stopped \
        -p 8090:8090 \
        -v ${REMOTE_DIR}/apps/backend/pb_data:/pb/pb_data \
        -v ${REMOTE_DIR}/apps/backend/pb_hooks:/pb/pb_hooks \
        -v ${REMOTE_DIR}/apps/backend/pb_migrations:/pb/pb_migrations \
        -v ${REMOTE_DIR}/apps/backend/pb_public:/pb/pb_public \
        -e WALLET_SRV_URL=http://wallet-api:3001 \
        -e LINE_CHANNEL_ID=\${LINE_CHANNEL_ID} \
        -e LINE_CHANNEL_SECRET=\${LINE_CHANNEL_SECRET} \
        -e LINE_CALLBACK_URL=\${LINE_CALLBACK_URL} \
        -e APP_URL=\${APP_URL} \
        -e NODE_ENV=\${NODE_ENV} \
        -e WALLET_MASTER_KEY=\${WALLET_MASTER_KEY} \
        -e PB_PUBLIC_URL=\${PB_PUBLIC_URL} \
        -e WALLET_API_URL=http://wallet-api:3001 \
        -e POCKETBASE_ADMIN_EMAIL=\${POCKETBASE_ADMIN_EMAIL} \
        -e POCKETBASE_ADMIN_PASSWORD=\${POCKETBASE_ADMIN_PASSWORD} \
        ${version}" || {
        log_error "Failed to start PocketBase container"
        return 1
    }
    
    log_info "Starting Wallet API container..."
    ssh_cmd "docker run -d \
        --name eggo-wallet-api \
        --network ${network_name} \
        --restart unless-stopped \
        -p 3001:3001 \
        -e NODE_ENV=\${NODE_ENV} \
        -e PORT=3001 \
        -e WALLET_MASTER_KEY=\${WALLET_MASTER_KEY} \
        -e DACC_MNEMONIC=\${DACC_MNEMONIC} \
        -e PB_ADMIN_EMAIL=\${POCKETBASE_ADMIN_EMAIL} \
        -e PB_ADMIN_PASSWORD=\${POCKETBASE_ADMIN_PASSWORD} \
        ${FULL_IMAGE_NAME}:wallet-api-latest" || {
        log_warn "Failed to start Wallet API container, continuing with PocketBase only"
    }
    
    log_success "Containers started"
}

# Verify health after rollback
verify_health() {
    log_step "Verifying health after rollback"
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Would verify health endpoint: http://localhost:8090/api/health"
        return 0
    fi
    
    sleep 30
    
    local max_retries=5
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        local health_response
        health_response=$(ssh_cmd "wget --quiet -O - http://localhost:8090/api/health" 2>/dev/null || echo "")
        
        if echo "$health_response" | grep -qi "healthy\|code.*200\|dbNow"; then
            log_success "Health check passed"
            return 0
        fi
        
        retry=$((retry + 1))
        log_warn "Health check attempt $retry/$max_retries failed, retrying in 10s..."
        sleep 10
    done
    
    log_error "Health check failed after $max_retries attempts"
    
    log_warn "Recent container logs:"
    ssh_cmd "docker logs --tail 50 eggo-pb" 2>&1 || true
    
    return 1
}

# Record rollback in history
record_rollback() {
    local version="$1"
    local timestamp
    timestamp=$(date '+%Y%m%d_%H%M%S')
    local history_file="${REMOTE_DIR}/backups/rollback-history.json"
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Would record rollback to $version in history"
        return 0
    fi
    
    ssh_cmd "mkdir -p ${BACKUP_DIR}"
    
    local entry="{\"timestamp\":\"$(date -Iseconds)\",\"version\":\"${version}\",\"trigger\":\"${AUTO_MODE:+auto}manual\",\"previous\":\"unknown\"}"
    
    if ssh_cmd "[ -f ${history_file} ]"; then
        ssh_cmd "echo ${entry} >> ${history_file}.tmp"
    else
        ssh_cmd "echo ${entry} > ${history_file}"
    fi
    
    log_info "Rollback recorded: $version"
}

# Cleanup old rollback history
cleanup_history() {
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Would cleanup old rollback history (keeping last $MAX_ROLLBACK_HISTORY)"
        return 0
    fi
    
    local history_file="${REMOTE_DIR}/backups/rollback-history.json"
    
    if ssh_cmd "[ -f ${history_file} ]"; then
        local line_count
        line_count=$(ssh_cmd "wc -l < ${history_file}" || echo "0")
        
        if [ "$line_count" -gt "$MAX_ROLLBACK_HISTORY" ]; then
            ssh_cmd "tail -n ${MAX_ROLLBACK_HISTORY} ${history_file} > ${history_file}.tmp && mv ${history_file}.tmp ${history_file}"
            log_info "Cleaned up rollback history (kept last $MAX_ROLLBACK_HISTORY entries)"
        fi
    fi
}

# Main rollback procedure
perform_rollback() {
    local target_version
    target_version=$(find_previous_version) || {
        log_error "Could not determine rollback version"
        exit 1
    }
    
    log_step "Starting rollback to version: $target_version"
    
    send_alert "Rollback initiated to version: $target_version" "warning"
    
    stop_containers
    
    pull_rollback_image "$target_version"
    
    start_rollback_containers "$target_version"
    
    if ! verify_health; then
        log_error "Rollback health check failed"
        send_alert "Rollback FAILED - health check unsuccessful" "critical"
        exit 1
    fi
    
    # Record rollback
    record_rollback "$target_version"
    
    # Cleanup old history
    cleanup_history
    
    log_success "Rollback completed successfully"
    send_alert "Rollback completed successfully to version: $target_version" "warning"
    
    echo ""
    echo "=========================================="
    log_success "ROLLBACK SUCCESSFUL"
    echo "=========================================="
    echo ""
    echo "Rollback details:"
    echo "  Version: $target_version"
    echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  Mode: $([ "$AUTO_MODE" = true ] && echo "Automatic" || echo "Manual")"
    echo ""
    echo "Next steps:"
    echo "  1. Verify application: ssh $SSH_USER@$SSH_HOST 'docker logs -f eggo-pb'"
    echo "  2. Check health: curl http://localhost:8090/api/health"
    echo "  3. Investigate root cause of failed deployment"
    echo ""
}

main() {
    echo ""
    echo "=========================================="
    echo "  PocketBase Rollback"
    echo "=========================================="
    echo ""
    
    parse_args "$@"
    
    log_info "Rollback Mode: $([ "$AUTO_MODE" = true ] && echo "Automatic" || echo "Manual")"
    log_info "Target Host: $SSH_USER@$SSH_HOST"
    log_info "Dry Run: $DRY_RUN"
    [ -n "$ROLLBACK_VERSION" ] && log_info "Target Version: $ROLLBACK_VERSION"
    echo ""
    
    validate_prerequisites
    perform_rollback
}
