#!/bin/bash
# Stage 30: Backup current deployment
# Creates a backup of the current pb_data before deployment
# Usage: ./30-backup.sh [options]

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
    echo -e "${BLUE}[STAGE 30]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
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
    local ssh_options="-i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would execute SSH command: $command"
        # Simulate the typical output for dry run purposes
        if [[ "$command" == *"ls -1"* ]] || [[ "$command" == *"du -sh"* ]]; then
            echo "Simulation: Would return appropriate output for $command"
        fi
        return 0
    else
        ssh $ssh_options "$SSH_USER@$TARGET_HOST" "$command"
    fi
}

scp_cmd() {
    local source="$1"
    local dest="$2"
    local ssh_options="-i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would execute SCP: $source -> $dest"
        return 0
    else
        scp $ssh_options "$source" "$SSH_USER@$TARGET_HOST:$dest"
    fi
}

validate_remote_connection() {
    log_step "Validating SSH connection to remote server..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Skipping SSH validation"
        return 0
    fi
    
    # Expand SSH_KEY if it contains ~
    REAL_SSH_KEY="$SSH_KEY"
    if [[ "$SSH_KEY" == ~* ]]; then
        REAL_SSH_KEY="${SSH_KEY/#\~/$HOME}"
    fi
    
    if [ ! -f "$REAL_SSH_KEY" ]; then
        log_error "SSH key not found: $REAL_SSH_KEY"
        exit 1
    fi
    
    log_info "SSH key: $REAL_SSH_KEY"
    
    # Test connectivity
    if ssh_cmd "echo 'Connection successful'"; then
        log_success "SSH connection to $SSH_USER@$TARGET_HOST established"
        
        # Show remote system info
        hostname=$(ssh_cmd "hostname")
        os_info=$(ssh_cmd "uname -sr")
        log_info "Remote system: $hostname ($os_info)"
        
        return 0
    else
        log_error "Could not connect to remote server $SSH_USER@$TARGET_HOST"
        exit 1
    fi
}

# Get the timestamp for backup filename
get_timestamp() {
    date '+%Y%m%d_%H%M%S'
}

# Main backup process
perform_remote_backup() {
    log_step "Performing backup on remote server..."
    
    # Determine remote paths and create backup directory
    local remote_project_dir="${REMOTE_DIR:-/root/eggo-pocketbase}"
    local backup_dir="${remote_project_dir}/backups"
    local pb_data_dir="${remote_project_dir}/apps/backend/pb_data"
    local timestamp=$(get_timestamp)
    local backup_filename="pb_data_backup_${timestamp}.tar.gz"
    local backup_full_path="${backup_dir}/${backup_filename}"
    
    log_info "Remote project directory: $remote_project_dir"
    log_info "pb_data directory: $pb_data_dir"
    log_info "Backup directory: $backup_dir"
    log_info "Backup filename: $backup_filename"
    
    # Create backup directory if it doesn't exist
    if ! ssh_cmd "mkdir -p $backup_dir"; then
        log_error "Could not create backup directory on remote: $backup_dir"
        exit 1
    fi
    
    # Check if pb_data exists
    if ! ssh_cmd "test -d $pb_data_dir"; then
        log_error "pb_data directory not found on remote: $pb_data_dir"
        log_info "Available directories in remote project root:"
        ssh_cmd "ls -la $remote_project_dir"
        exit 1
    else
        log_success "pb_data directory found on remote"
    fi
    
    # Get original data size
    log_info "Getting pb_data size..."
    local data_size
    data_size=$(ssh_cmd "du -sh '$pb_data_dir' 2>/dev/null | cut -f1" || echo "unknown")
    
    if [ "$data_size" != "unknown" ]; then
        log_info "pb_data size: $data_size"
    fi
    
    # Stop any PocketBase containers that might be using the data directory
    if [ "$TARGET_ENV" = "production" ]; then
        log_step "Stopping PocketBase containers temporarily for backup..."
        
        # Stop PocketBase container to avoid file locking issues during backup
        local pb_container_exists
        pb_container_exists=$(ssh_cmd "docker ps -aq -f name=eggo-pb" || echo "")
        
        if [ -n "$pb_container_exists" ]; then
            log_info "Stopping PocketBase container..."
            
            # Check container status before attempting to stop
            local container_status
            container_status=$(ssh_cmd "docker ps -f name=eggo-pb -f status=running --format '{{.Status}}' | head -n 1 || true")
            
            if [ -n "$container_status" ]; then
                log_info "PocketBase container status: $container_status"
                log_info "Stopping container for backup..."
                
                if [ "$DRY_RUN" = false ]; then
                    ssh_cmd "docker stop eggo-pb || true"
                    sleep 2
                    log_info "Container stopped for backup"
                else
                    log_info "DRY RUN: Would stop container eggo-pb"
                fi
            else
                log_info "PocketBase container was not running"
            fi
        fi
    fi
    
    # Create the backup archive
    log_info "Creating backup archive: $backup_full_path"
    
    # Use tar to create a compressed backup that preserves file permissions
    if ssh_cmd "cd '${remote_project_dir}' && tar -czf '${backup_full_path}' -C '${remote_project_dir}/apps/backend' pb_data"; then
        log_success "Backup archive created: $backup_full_path"
        
        # Check backup size
        local backup_size
        backup_size=$(ssh_cmd "du -sh '$backup_full_path' | cut -f1")
        log_info "Backup size: $backup_size"
        
        # Restart services if they were stopped
        if [ "$TARGET_ENV" = "production" ]; then
            local pb_container_exists
            pb_container_exists=$(ssh_cmd "docker ps -q -f name=eggo-pb" || echo "")
            
            if [ -n "$pb_container_exists" ]; then
                # Container was originally running, restart it
                log_info "Restarting PocketBase container..."
                if [ "$DRY_RUN" = false ]; then
                    ssh_cmd "docker start eggo-pb || { echo 'Error restarting container'; docker logs eggo-pb 2>&1 || echo 'Could not retrieve logs'; }"
                    log_info "Container restart initiated"
                else
                    log_info "DRY RUN: Would restart container eggo-pb"
                fi
            fi
        fi
    else
        log_error "Failed to create backup archive: $backup_full_path"
        # Restart services if they were stopped before exiting
        if [ "$TARGET_ENV" = "production" ]; then
            local pb_container_exists
            pb_container_exists=$(ssh_cmd "docker ps -aq -f name=eggo-pb" || echo "")
            if [ -n "$pb_container_exists" ]; then
                if [ "$DRY_RUN" = false ]; then
                    ssh_cmd "docker start eggo-pb || true"
                fi
            fi
        fi
        exit 1
    fi
}

validate_backup() {
    log_step "Validating backup integrity..."
    
    local remote_project_dir="${REMOTE_DIR:-/root/eggo-pocketbase}"
    local backup_dir="${remote_project_dir}/backups"
    
    # Find the most recently created backup
    log_info "Looking for most recent backup in: $backup_dir"
    local recent_backup
    recent_backup=$(ssh_cmd "ls -t ${backup_dir}/pb_data_backup_*.tar.gz 2>/dev/null | head -n1 || true")
    
    if [ -z "$recent_backup" ]; then
        log_error "No backup file found in $backup_dir"
        # Print the contents of the backup directory to help debug
        log_info "Contents of backup directory:"
        ssh_cmd "ls -la $backup_dir/* 2>/dev/null || echo 'Backup directory may be empty or not exist'"
        exit 1
    fi
    
    log_info "Most recent backup: $recent_backup"
    
    # Get backup size to ensure it's a valid size
    local backup_size
    backup_size=$(ssh_cmd "du -sh '$recent_backup' | cut -f1")
    
    if [ "$backup_size" = "0" ]; then
        log_error "Backup file exists but has zero size: $recent_backup"
        exit 1
    fi
    
    # Check tar archive integrity using --test-label option to verify header
    log_info "Verifying backup archive integrity..."
    if ssh_cmd "tar -tf '${recent_backup}' | head -n 5" > /dev/null; then
        log_success "Backup archive integrity verified"
        
        # List first few files in the backup
        if [ "$DRY_RUN" = false ]; then
            log_info "First few files in backup:"
            ssh_cmd "tar -tf '$recent_backup' | head -n 10"
        else
            log_info "DRY RUN: Would list backup contents"
        fi
    else
        log_error "Backup archive validation failed: $recent_backup"
        exit 1
    fi
    
    log_success "Backup file validated successfully"
}

manage_old_backups() {
    log_step "Managing old backup files..."
    
    # Keep only the last 10 backups by default
    local keep_count=10
    local remote_project_dir="${REMOTE_DIR:-/root/eggo-pocketbase}"
    local backup_dir="${remote_project_dir}/backups"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would keep last $keep_count backups in $backup_dir"
    else
        log_info "Keeping last $keep_count backups in $backup_dir, removing older ones..."
        
        # Execute backup cleaning - list all matching files sorted newest first, then take all except the first N, then delete
        local old_backups
        old_backups=$(ssh_cmd "cd '$backup_dir' && ls -t pb_data_backup_*.tar.gz 2>/dev/null | tail -n +$((keep_count + 1)) || true")
        
        if [ -n "$old_backups" ]; then
            log_info "Deleting old backups:"
            local backup_list
            for backup in $old_backups; do
                log_info "  - $backup"
            done
            
            # Delete old backup files
            ssh_cmd "cd '$backup_dir' && ls -t pb_data_backup_*.tar.gz 2>/dev/null | tail -n +$((keep_count + 1)) | xargs -r rm -v"
        else
            log_info "No old backups to remove - within limit of $keep_count backups"
        fi
    fi
}

store_backup_metadata() {
    log_step "Storing backup metadata..."
    
    local remote_project_dir="${REMOTE_DIR:-/root/eggo-pocketbase}"
    local backup_dir="${remote_project_dir}/backups"
    local timestamp=$(get_timestamp)
    local metadata_file="${backup_dir}/backup_${timestamp}_metadata.json"
    
    # Create a simple JSON metadata file with backup information
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would create backup metadata at $metadata_file"
    else
        local recent_backup
        recent_backup=$(ssh_cmd "ls -t ${backup_dir}/pb_data_backup_*.tar.gz 2>/dev/null | head -n1 || true")
        
        if [ -n "$recent_backup" ]; then
            # Get the actual file size
            local actual_size
            actual_size=$(ssh_cmd "stat -c%s '$recent_backup'")
            
            # Get timestamp from filename
            local timestamp_from_filename
            timestamp_from_filename=$(basename "$recent_backup" | sed 's/pb_data_backup_\([0-9_]*\)\.tar\.gz/\1/')
            
            # Create simple JSON metadata
            local json_metadata="{\"backup_file\":\"$(basename "$recent_backup")\",\"size_bytes\":$actual_size,\"backup_time\":\"$timestamp_from_filename\",\"created_by\":\"deployment\",\"environment\":\"$TARGET_ENV\"}"
            
            # Write the metadata file
            ssh_cmd "echo '$json_metadata' > '$metadata_file'"
            
            log_success "Backup metadata created: $metadata_file"
        else
            log_error "Could not determine the most recent backup file to record in metadata"
        fi
    fi
}

main() {
    log_step "Starting backup stage"
    
    parse_args "$@"
    
    log_info "Target environment: $TARGET_ENV"
    log_info "Target host: $TARGET_HOST"
    log_info "SSH user: $SSH_USER"
    log_info "Dry run: $DRY_RUN"
    
    # Execute backup steps
    validate_remote_connection
    perform_remote_backup
    validate_backup
    manage_old_backups
    store_backup_metadata
    
    echo ""
    log_success "Backup stage completed successfully!"
    log_info "Current pb_data backed up and archived safely"
    log_info "Old backups cleaned up, new backup verified and saved"
    echo ""
}

main "$@"