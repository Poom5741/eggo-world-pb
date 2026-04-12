#!/bin/bash
# Stage 00: Pre-deployment checks
# Validates prerequisites before deployment begins
# Usage: ./00-pre-deploy.sh [options]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default configuration
TARGET_ENV="production"
TARGET_HOST="204.168.144.14"
DRY_RUN=false

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
    echo -e "${BLUE}[STAGE 00]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env=*)
                TARGET_ENV="${1#*=}"
                shift
                ;;
            --host=*)
                TARGET_HOST="${1#*=}"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

validate_docker_daemon() {
    log_step "Validating Docker daemon status..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Skipping Docker daemon validation"
        return 0
    fi
    
    if ! docker ps >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_success "Docker daemon is running"
    
    # Show Docker info
    log_info "Docker version: $(docker --version)"
    log_info "Active containers: $(docker ps -q | wc -l)"
}

validate_ssh_connectivity() {
    log_step "Validating SSH connectivity to production..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Skipping SSH connectivity check"
        return 0
    fi
    
    # Get SSH configuration from environment
    SSH_USER="${SSH_USER:-root}"
    SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
    
    # Check if SSH key exists
    REAL_SSH_KEY="$SSH_KEY"
    # Expand ~ to home directory if needed
    if [[ "$SSH_KEY" == ~* ]]; then
        REAL_SSH_KEY="${SSH_KEY/#\~/$HOME}"
    fi
    
    if [ ! -f "$REAL_SSH_KEY" ]; then
        if [ -f ~/.ssh/id_rsa ]; then
            SSH_KEY=~/.ssh/id_rsa
            REAL_SSH_KEY="$HOME/.ssh/id_rsa"
        else
            log_error "SSH private key not found: $REAL_SSH_KEY"
            log_error "Please set SSH_KEY environment variable to point to your SSH private key"
            exit 1
        fi
    fi
    
    log_info "SSH target: $SSH_USER@$TARGET_HOST"
    log_info "SSH key: $REAL_SSH_KEY"
    
    # Configure SSH options to minimize user interaction
    SSH_OPTIONS="-i $REAL_SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"
    
    # Attempt to run a quick command on the remote server
    if ssh $SSH_OPTIONS "$SSH_USER@$TARGET_HOST" "echo 'Connection successful'" > /dev/null 2>&1; then
        log_success "SSH connectivity verified"
        
        # Get some system info to confirm access
        if [ "$TARGET_ENV" = "production" ]; then
            log_info "Connected to production environment"
        fi
        
        uptime_info=$(ssh $SSH_OPTIONS "$SSH_USER@$TARGET_HOST" "uptime" 2>/dev/null || echo "Unable to retrieve uptime")
        log_info "Remote system uptime: $uptime_info"
    else
        log_error "SSH connection failed to $SSH_USER@$TARGET_HOST"
        log_error "Please check: SSH key permission, network connectivity, and that host is reachable"
        exit 1
    fi
}

validate_required_env_vars() {
    log_step "Validating required environment variables..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Skipping environment variable validation"
        return 0
    fi
    
    # Define required environment variables
    local required_vars=(
        "SSH_USER"
        "SSH_KEY"
        "REGISTRY"
        "IMAGE_NAME"
    )
    
    # Set defaults if variables aren't already set
    : "${SSH_USER:=root}"
    : "${REGISTRY:=ghcr.io/tokenine}"
    : "${IMAGE_NAME:=eggo-pocketbase}"
    
    # Check if any required variable is still empty after defaults
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_info "Please set these variables:"
        for var in "${missing_vars[@]}"; do
            echo "  export $var=<value>"
        done
        exit 1
    fi
    
    log_success "Required environment variables are set"
    
    # Log non-sensitive values to show what will be used
    log_info "Registry: $REGISTRY"
    log_info "Image name: $IMAGE_NAME"
    log_info "SSH User: $SSH_USER"
}

validate_registry_access() {
    log_step "Validating registry access..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Skipping registry access validation"
        return 0
    fi
    
    : "${REGISTRY:=ghcr.io/tokenine}"
    
    # We can't easily check registry push permissions, but we can verify if we're logged in
    if docker info 2>/dev/null | grep -q "Username:"; then
        log_success "Docker is logged in to a registry"
    else
        log_warn "Not logged in to a Docker registry"
        log_warn "This might cause issues in the push stage"
    fi
    
    # Test that we can even call docker commands
    docker version >/dev/null 2>&1 || {
        log_error "Cannot communicate with Docker daemon"
        exit 1
    }
}

validate_git_status() {
    log_step "Validating Git repository status..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Skipping Git status validation"
        return 0
    fi
    
    if [ ! -d .git ] && [ ! -f .git ]; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes that might affect deployment
    if ! git diff --quiet 2>/dev/null; then
        log_warn "There are uncommitted changes in the repository"
        log_warn "This is generally OK for builds, but verify intentional"
    fi
    
    # Verify we can get git info for tagging purposes
    if git rev-parse --git-dir > /dev/null 2>&1; then
        GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        log_info "Current commit: $GIT_COMMIT"
    else
        log_error "Cannot access Git information"
        exit 1
    fi
    
    log_success "Git repository status validated"
}

main() {
    log_step "Starting pre-deployment validation stage"
    
    parse_args "$@"
    
    log_info "Target environment: $TARGET_ENV"
    log_info "Target host: $TARGET_HOST"
    log_info "Dry run: $DRY_RUN"
    
    # Execute validations
    validate_docker_daemon
    validate_ssh_connectivity
    validate_required_env_vars
    validate_registry_access
    validate_git_status
    
    echo ""
    log_success "Pre-deployment validation completed successfully!"
    log_info "All prerequisites validated - ready for deployment"
    echo ""
}

main "$@"