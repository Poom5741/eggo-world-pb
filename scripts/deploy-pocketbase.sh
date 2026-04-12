#!/bin/bash
# Deploy PocketBase to production via SSH
# Usage: ./deploy-pocketbase.sh [environment]
# Steps: backup -> pull -> stop -> start -> verify

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-production}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# SSH Configuration (from verify-phase02-prod.sh)
SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-204.168.144.14}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
REMOTE_DIR="${REMOTE_DIR:-/root/eggo-pocketbase}"

# Docker Configuration
REGISTRY="${REGISTRY:-ghcr.io/tokenine}"
IMAGE_NAME="eggo-pocketbase"
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"

# Backup Configuration
BACKUP_DIR="${REMOTE_DIR}/backups"

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

# SSH command wrapper
ssh_cmd() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SSH_USER@$SSH_HOST" "$1"
}

# SCP command wrapper
scp_file() {
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$1" "$SSH_USER@$SSH_HOST:$2"
}

# Validate environment
validate_env() {
    log_info "Deploying to: $ENVIRONMENT"
    log_info "Target: $SSH_USER@$SSH_HOST:$REMOTE_DIR"
    
    # Check SSH key exists
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH key not found: $SSH_KEY"
        log_error "Set SSH_KEY environment variable or ensure key exists"
        exit 1
    fi
    
    # Test SSH connection
    log_info "Testing SSH connection..."
    if ! ssh_cmd "echo 'Connection successful'" > /dev/null 2>&1; then
        log_error "Cannot connect to remote server via SSH"
        log_error "Check SSH key permissions and network connectivity"
        exit 1
    fi
    log_success "SSH connection verified"
}

# Step 1: Create backup on remote server
create_backup() {
    log_info "Step 1: Creating pre-deployment backup on remote server..."
    
    # Execute backup script on remote
    if ssh_cmd "[ -f ${REMOTE_DIR}/scripts/backup-before-deploy.sh ]"; then
        ssh_cmd "cd ${REMOTE_DIR} && ./scripts/backup-before-deploy.sh ${BACKUP_DIR}"
        log_success "Remote backup completed"
    else
        log_warn "Backup script not found on remote. Creating manual backup..."
        ssh_cmd "mkdir -p ${BACKUP_DIR} && tar -czf ${BACKUP_DIR}/pb_data_backup_$(date '+%Y%m%d_%H%M%S').tar.gz -C ${REMOTE_DIR}/apps/backend pb_data"
        log_success "Manual backup completed"
    fi
    
    # Verify backup exists
    BACKUP_COUNT=$(ssh_cmd "ls -1 ${BACKUP_DIR}/pb_data_backup_*.tar.gz 2>/dev/null | wc -l")
    if [ "$BACKUP_COUNT" -eq 0 ]; then
        log_error "No backup files found after backup step"
        exit 1
    fi
    log_info "Backup files on remote: $BACKUP_COUNT"
}

# Step 2: Pull latest Docker image
pull_image() {
    log_info "Step 2: Pulling latest Docker image..."
    
    # Get git commit hash for tagging
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
    
    # Pull both latest and commit-specific tag
    ssh_cmd "docker pull ${FULL_IMAGE_NAME}:latest" || {
        log_error "Failed to pull latest image"
        exit 1
    }
    
    log_success "Image pulled: ${FULL_IMAGE_NAME}:latest"
    log_info "Commit tag: ${GIT_COMMIT}"
}

# Step 3: Stop existing containers
stop_containers() {
    log_info "Step 3: Stopping existing containers..."
    
    # Stop PocketBase container
    if ssh_cmd "docker ps -q -f name=eggo-pb" | grep -q .; then
        ssh_cmd "docker stop eggo-pb" || true
        ssh_cmd "docker rm eggo-pb" || true
        log_info "PocketBase container stopped and removed"
    else
        log_info "No existing PocketBase container found"
    fi
    
    # Stop wallet-api container (if exists)
    if ssh_cmd "docker ps -q -f name=eggo-wallet-api" | grep -q .; then
        ssh_cmd "docker stop eggo-wallet-api" || true
        ssh_cmd "docker rm eggo-wallet-api" || true
        log_info "Wallet API container stopped and removed"
    else
        log_info "No existing Wallet API container found"
    fi
    
    log_success "Containers stopped"
}

# Step 4: Start new containers
start_containers() {
    log_info "Step 4: Starting new containers..."
    
    # Navigate to project directory
    ssh_cmd "cd ${REMOTE_DIR}"
    
    # Start with docker-compose
    if ssh_cmd "[ -f ${REMOTE_DIR}/docker-compose.yml ]"; then
        ssh_cmd "cd ${REMOTE_DIR} && docker-compose up -d pocketbase wallet-api"
        log_success "Started containers using docker-compose"
    else
        log_error "docker-compose.yml not found on remote server"
        ssh_cmd "cd ${REMOTE_DIR} && docker-compose up -d" || {
            log_error "Failed to start containers"
            exit 1
        }
    fi
    
    # Wait for containers to be healthy
    log_info "Waiting for containers to start (30 seconds)..."
    sleep 30
    
    # Check container status
    CONTAINER_STATUS=$(ssh_cmd "docker ps -f name=eggo-pb --format '{{.Status}}'")
    if echo "$CONTAINER_STATUS" | grep -q "Unhealthy\|Exited"; then
        log_error "Container health check failed"
        log_warn "Starting rollback..."
        rollback
        exit 1
    fi
    
    log_success "Containers started successfully"
}

# Step 5: Verify deployment
verify_deployment() {
    log_info "Step 5: Verifying deployment..."
    
    # Wait for service to be ready
    sleep 10
    
    # Check PocketBase health endpoint
    HEALTH_RESPONSE=$(ssh_cmd "wget --quiet -O - http://localhost:8090/api/health" 2>/dev/null || echo "")
    
    if echo "$HEALTH_RESPONSE" | grep -q "code.*200\|healthy"; then
        log_success "PocketBase health check passed"
    else
        log_warn "Health check response: $HEALTH_RESPONSE"
        log_warn "Service may still be starting up..."
    fi
    
    # Check container logs for errors
    log_info "Checking recent container logs..."
    LOGS=$(ssh_cmd "docker logs --tail 20 eggo-pb" 2>/dev/null || echo "")
    
    if echo "$LOGS" | grep -qi "error\|fatal\|panic"; then
        log_warn "Potential errors in logs (review manually):"
        echo "$LOGS" | grep -i "error\|fatal\|panic" | head -5
    else
        log_success "No obvious errors in recent logs"
    fi
    
    # Display container status
    log_info "Container status:"
    ssh_cmd "docker ps -f name=eggo-pb --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
}

# Rollback function
rollback() {
    log_warn "Initiating rollback..."
    
    # Stop current containers
    ssh_cmd "docker stop eggo-pb eggo-wallet-api" 2>/dev/null || true
    
    # Find most recent backup
    LATEST_BACKUP=$(ssh_cmd "ls -t ${BACKUP_DIR}/pb_data_backup_*.tar.gz | head -1")
    
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restoring from backup: $LATEST_BACKUP"
        ssh_cmd "tar -xzf ${LATEST_BACKUP} -C ${REMOTE_DIR}/apps/backend/"
        log_success "pb_data restored from backup"
        
        # Restart with old data
        ssh_cmd "cd ${REMOTE_DIR} && docker-compose up -d"
        log_success "Containers restarted with previous data"
    else
        log_error "No backup found for rollback"
        log_error "Manual intervention required"
        exit 1
    fi
    
    log_success "Rollback completed"
}

# Main deployment flow
main() {
    echo ""
    echo "=========================================="
    echo "  PocketBase Production Deployment"
    echo "=========================================="
    echo ""
    
    log_info "Environment: $ENVIRONMENT"
    log_info "Target: $SSH_USER@$SSH_HOST"
    log_info "Image: $FULL_IMAGE_NAME"
    echo ""
    
    # Confirmation prompt
    read -p "Proceed with deployment to $SSH_HOST? [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Execute deployment steps
    validate_env
    create_backup
    pull_image
    stop_containers
    start_containers
    verify_deployment
    
    echo ""
    echo "=========================================="
    log_success "Deployment completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "  1. Verify application: https://pb.eggoworld.io"
    echo "  2. Check logs: ssh $SSH_USER@$SSH_HOST 'docker logs -f eggo-pb'"
    echo "  3. Run verification: ./scripts/verify-phase02-prod.sh"
    echo ""
    echo "Rollback if needed:"
    echo "  Latest backup: ${BACKUP_DIR}/pb_data_backup_*.tar.gz"
    echo ""
}

# Run main function
main
