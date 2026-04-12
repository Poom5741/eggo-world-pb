#!/bin/bash
# Stage 40: Remote deployment
# Deploys the new Docker images to production server
# Usage: ./40-deploy.sh [options]

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
SSH_USER="${SSH_USER:-root}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
REGISTRY="${REGISTRY:-ghcr.io/tokenine}"
IMAGE_NAME="${IMAGE_NAME:-eggo-pocketbase}"

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
    echo -e "${BLUE}[STAGE 40]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
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

# SSH command wrapper
ssh_cmd() {
    local command="$1"
    local ssh_options="-i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=15"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would execute SSH command: $command"
        # Simulate typical output for dry run purposes
        case "$command" in
            *"docker ps"*) 
                echo "Simulation: container_id eggo-pb Exited (0) About an hour ago"
                ;;
            *"docker images"*) 
                echo "Simulation: $REGISTRY/$IMAGE_NAME latest sim_id 1 hour ago"
                ;;
            *"ls -1"*) 
                echo "Simulation: would list directory contents"
                ;;
            *) 
                echo "Simulation: would execute command"
                ;;
        esac
        return 0
    else
        ssh $ssh_options "$SSH_USER@$TARGET_HOST" "$command"
    fi
}

validate_remote_connection() {
    log_step "Validating SSH connection to remote server..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Skipping SSH validation"
        return 0
    fi
    
    # Check if SSH key is available
    REAL_SSH_KEY="$SSH_KEY"
    if [[ "$SSH_KEY" == ~* ]]; then
        REAL_SSH_KEY="${SSH_KEY/#\~/$HOME}"
    fi
    
    if [ ! -f "$REAL_SSH_KEY" ]; then
        log_error "SSH key not found: $REAL_SSH_KEY"
        exit 1
    fi
    
    log_info "Using SSH key: $REAL_SSH_KEY"
    
    # Test connectivity
    if ssh_cmd "echo 'Connection successful'"; then
        log_success "SSH connection to $SSH_USER@$TARGET_HOST established"
        
        # Show some basic system info
        uptime=$(ssh_cmd "uptime" 2>/dev/null || echo "N/A")
        log_info "Remote system uptime: $uptime"
        
        return 0
    else
        log_error "Could not connect to remote server $SSH_USER@$TARGET_HOST"
        exit 1
    fi
}

get_git_commit() {
    if [ "$DRY_RUN" = true ]; then
        echo "abcd123"
        return 0
    fi
    
    git rev-parse --short HEAD 2>/dev/null || echo "latest"
}

prepare_remote_server() {
    log_step "Preparing remote server for deployment..."
    
    # Check that the remote directory exists
    local remote_project_dir="${REMOTE_DIR:-/root/eggo-pocketbase}"
    
    log_info "Remote project directory: $remote_project_dir"
    
    if ! ssh_cmd "test -d $remote_project_dir"; then
        log_error "Remote project directory not found: $remote_project_dir"
        log_info "Please ensure the project is properly deployed before running this script"
        exit 1
    fi
    
    # Change to the project directory
    if ssh_cmd "cd $remote_project_dir" 2>/dev/null; then
        log_success "Changed to remote directory: $remote_project_dir"
    else
        log_error "Could not change to directory: $remote_project_dir"
        exit 1
    fi
    
    # Load environment variables from .env files if they exist
    log_info "Checking for environment files..."
    if ssh_cmd "[ -f $remote_project_dir/.env ]"; then
        log_info "Found .env file on remote"
    else
        log_warn ".env file not found on remote"
    fi
    
    # Check for docker-compose file if needed
    if ssh_cmd "[ -f $remote_project_dir/docker-compose.yml ]"; then
        log_success "docker-compose.yml found on remote"
    else
        log_error "docker-compose.yml not found on remote: $remote_project_dir"
        exit 1
    fi
}

pull_latest_images() {
    log_step "Pulling latest Docker images on remote server..."
    
    # Get git commit for version tag
    local git_commit
    git_commit=$(get_git_commit)
    
    log_info "Pulling Docker images from $REGISTRY"
    log_info "Using git commit tag: $git_commit"
    
    # List of images to pull
    local -a image_tags
    image_tags+=("${REGISTRY}/${IMAGE_NAME}:latest")
    if [ "$git_commit" != "latest" ]; then
        image_tags+=("${REGISTRY}/${IMAGE_NAME}:${git_commit}")
    fi
    
    # Pull each image tag
    for image_tag in "${image_tags[@]}"; do
        log_info "Pulling $image_tag"
        
        if ssh_cmd "docker pull $image_tag"; then
            log_success "Successfully pulled: $image_tag"
        else
            log_error "Failed to pull: $image_tag"
            log_info "Verify the image exists in the registry and credentials are valid"
            exit 1
        fi
    done
    
    log_info "Checking pulled images..."
    if ssh_cmd "docker images | grep $IMAGE_NAME"; then
        log_success "New images pulled successfully"
    else
        log_error "Pulled images but couldn't confirm they exist"
        exit 1
    fi
}

stop_current_containers() {
    log_step "Stopping current containers..."
    
    # Try to gracefully stop the PocketBase container first
    log_info "Finding and stopping current containers..."
    
    # Get list of existing containers before shutdown
    local existing_containers
    existing_containers=$(ssh_cmd "docker ps -q -f name=eggo-")
    
    if [ -z "$existing_containers" ]; then
        log_warn "No existing Eggo containers found to stop"
    else
        log_info "Found existing containers to stop:"
        ssh_cmd "docker ps -f name=eggo-"
        
        # Stop eggo-pb (PocketBase) container
        if ssh_cmd "docker ps -q -f name=eggo-pb" | grep -q .; then
            log_info "Stopping eggo-pb container..."
            ssh_cmd "docker stop eggo-pb" 2>/dev/null || {
                log_warn "Could not stop eggo-pb container (may not be running)"
            }
            
            # Check status after attempting to stop
            sleep 2
            if ssh_cmd "docker ps -q -f name=eggo-pb" | grep -q .; then
                log_warn "eggo-pb container still running, forcing stop..."
                ssh_cmd "docker kill eggo-pb" 2>/dev/null || true
            else
                log_success "eggo-pb container stopped"
            fi
        fi
        
        # Stop wallet-api container if it exists
        if ssh_cmd "docker ps -q -f name=eggo-wallet-api" | grep -q .; then
            log_info "Stopping eggo-wallet-api container..."
            ssh_cmd "docker stop eggo-wallet-api" 2>/dev/null || {
                log_warn "Could not stop eggo-wallet-api container (may not be running)"
            }
            
            # Check status after attempting to stop
            sleep 2
            if ssh_cmd "docker ps -q -f name=eggo-wallet-api" | grep -q .; then
                log_warn "eggo-wallet-api container still running, forcing stop..."
                ssh_cmd "docker kill eggo-wallet-api" 2>/dev/null || true
            else
                log_success "eggo-wallet-api container stopped"
            fi
        fi
        
        # Verify containers are definitely stopped
        if ssh_cmd "docker ps -f name=eggo- --format '{{.Names}} {{.Status}}'"; then
            local running_containers
            running_containers=$(ssh_cmd "docker ps -q -f name=eggo-" 2>/dev/null)
            
            if [ -n "$running_containers" ]; then
                log_warn "Some Eggo containers may still be running:"
                ssh_cmd "docker ps -f name=eggo-"
            fi
        else
            log_warn "Could not check container status after stopping"
        fi
    fi
    
    log_success "Finished attempting to stop containers"
}

start_new_containers() {
    log_step "Starting new containers with new images..."
    
    local remote_project_dir="${REMOTE_DIR:-/root/eggo-pocketbase}"
    
    log_info "Changing to project directory: $remote_project_dir"
    
    if ssh_cmd "cd $remote_project_dir"; then
        log_success "Changed to project directory"
    else
        log_error "Failed to change to project directory: $remote_project_dir"
        exit 1
    fi
    
    # First, verify the docker-compose file is valid
    log_info "Verifying docker-compose file..."
    if ssh_cmd "docker-compose config --quiet"; then
        log_success "docker-compose file valid"
    else
        log_error "docker-compose file has invalid syntax"
        exit 1
    fi
    
    # Now start services using the updated images
    log_info "Starting services with updated images..."
    
    if ssh_cmd "docker-compose up -d --force-recreate pocketbase wallet-api"; then
        log_success "Services started successfully"
        
        # Wait a moment for services to start properly
        log_info "Waiting for services to initialize... (10 seconds)"
        if [ "$DRY_RUN" = false ]; then
            sleep 10
        else
            log_info "DRY RUN: Sleeping for service startup simulation"
        fi
    else
        log_error "Failed to start services"
        log_info "Logs for troubleshooting - PocketBase service:"
        if ssh_cmd "docker-compose logs pocketbase"; then
            log_info "Logs for troubleshooting - Wallet API service:"
            ssh_cmd "docker-compose logs wallet-api" 2>/dev/null || echo "No wallet-api logs"
        fi
        exit 1
    fi
    
    # Check container statuses
    log_info "Checking container status after startup..."
    
    # Get the pocketbase container ID
    CONTAINER_EXISTS=$(ssh_cmd "docker ps -q -f name=eggo-pb" 2>/dev/null)
    
    if [ -z "$CONTAINER_EXISTS" ]; then
        log_error "eggo-pb container failed to start"
        
        # Get logs to show what happened
        START_LOGS=$(ssh_cmd "docker logs --tail 20 eggo-pb 2>&1 || docker-compose logs --tail=20 pocketbase 2>&1" 2>/dev/null || echo "Could not retrieve logs")
        log_error "Last few startup logs:"
        echo "$START_LOGS"
        
        exit 1
    else
        log_info "PocketBase container is running (ID: $CONTAINER_EXISTS)"
    fi
    
    # Verify containers are healthy
    if [ "$DRY_RUN" = false ]; then
        echo "Waiting additional time for full startup...";
        sleep 15
    fi
    
    # Check health with Docker's native health check if available
    if ssh_cmd "docker ps --filter name=eggo-pb --format '{{.Status}}' 2>/dev/null | grep healthy"; then
        log_success "PocketBase container is healthy"
    else
        log_warn "PocketBase container status not definitively healthy, checking logs..."
        ssh_cmd "docker ps --filter name=eggo-pb --format '{{.Status}}'" 2>/dev/null || log_info "Docker status check unavailable"
    fi
    
    log_success "New containers started with updated images"
}

verify_new_containers() {
    log_step "Verifying new containers are running properly..."
    
    # Check for PocketBase container
    log_info "Checking eggo-pb container status..."
    local pb_container_status
    pb_container_status=$(ssh_cmd "docker ps -f name=eggo-pb --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null)
    
    if [ -n "$pb_container_status" ] && ! echo "$pb_container_status" | grep -q "NAMES"; then
        log_info "PocketBase container details:"
        echo "$pb_container_status"
        
        # Extract image name to verify it's using the updated images
        local current_image
        current_image=$(echo "$pb_container_status" | awk 'NR>1 {print $2}' | head -n 1)
        
        if [[ "$current_image" == *"$REGISTRY/$IMAGE_NAME"* ]]; then
            log_success "PocketBase is running updated image: $current_image"
        else
            log_warn "PocketBase may not be running the updated image: $current_image"
        fi
    else
        log_error "Could not inspect eggo-pb container"
        ssh_cmd "docker ps -a | grep eggo" 2>/dev/null || echo "No Eggo containers found"
        exit 1
    fi
    
    # Check for wallet-api container
    log_info "Checking eggo-wallet-api container status..."
    local wallet_container_status
    wallet_container_status=$(ssh_cmd "docker ps -f name=eggo-wallet-api --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null)
    
    if [ -n "$wallet_container_status" ] && ! echo "$wallet_container_status" | grep -q "NAMES"; then
        log_info "Wallet API container details:"
        echo "$wallet_container_status"
        
        # Extract image name to verify it's using the updated images
        local wallet_image
        wallet_image=$(echo "$wallet_container_status" | awk 'NR>1 {print $2}' | head -n 1)
        
        if [[ "$wallet_image" == *"$REGISTRY/$IMAGE_NAME"* ]]; then
            log_success "Wallet API is running updated image: $wallet_image"
        else
            log_warn "Wallet API may not be running the updated image: $wallet_image"
        fi
    else
        log_warn "Could not find eggo-wallet-api container (this may be normal depending on setup)"
    fi
    
    # Verify expected services are listening on expected ports
    log_info "Checking if services are listening on expected ports..."
    
    # Check if PocketBase is responding
    local pb_responding
    pb_responding=$(ssh_cmd "docker exec -i eggo-pb lsof -i :8090 2>/dev/null | grep LISTEN" 2>/dev/null || echo "Could not check PocketBase port")
    
    if [[ "$pb_responding" == *"LISTEN"* ]]; then
        log_success "PocketBase is listening on port 8090"
    else
        log_warn "PocketBase not confirmed to be listening on port 8090: $pb_responding"
    fi
    
    log_success "Container verification completed"
}

main() {
    log_step "Starting deployment stage"
    
    parse_args "$@"
    
    log_info "Target environment: $TARGET_ENV"
    log_info "Target host: $TARGET_HOST"
    log_info "Registry: $REGISTRY"
    log_info "Image name: $IMAGE_NAME"
    log_info "Dry run: $DRY_RUN"
    
    # Execute deployment steps
    validate_remote_connection
    prepare_remote_server
    pull_latest_images
    stop_current_containers
    start_new_containers
    verify_new_containers
    
    echo ""
    log_success "Deployment stage completed successfully!"
    log_info "New Docker images deployed and services started"
    echo ""
}

main "$@"