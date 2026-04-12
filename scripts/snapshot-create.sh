#!/bin/bash
set -euo pipefail

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

BACKUP_DIR="${REMOTE_DIR}/backups"
SNAPSHOT_TAG=""
DRY_RUN=false
VERBOSE=false

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
    echo -e "${BLUE}[SNAPSHOT]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
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

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --tag=*)
                SNAPSHOT_TAG="${1#*=}"
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
PocketBase Pre-Deployment Snapshot

Usage: $0 [OPTIONS]

Options:
  --tag=<name>        Custom tag name for snapshot (default: pre-deploy-<timestamp>)
  --dry-run           Show what would be done without executing
  --verbose           Enable verbose output
  -h, --help          Show this help message

Examples:
  $0                              # Create snapshot with auto-generated tag
  $0 --tag=pre-release-v1.2       # Create snapshot with custom tag
  $0 --dry-run                    # Test snapshot creation

Snapshot Contents:
  - Docker image tagged with snapshot name
  - Metadata JSON file with deployment info
  - Integration with rollback system

EOF
}

validate_prerequisites() {
    log_step "Validating prerequisites"
    
    if [ ! -f "$SSH_KEY" ] && [ "$DRY_RUN" = false ]; then
        log_error "SSH key not found: $SSH_KEY"
        exit 1
    fi
    
    if [ "$DRY_RUN" = false ]; then
        if ! ssh_cmd "echo 'Connection successful'" > /dev/null 2>&1; then
            log_error "Cannot connect to remote server via SSH"
            exit 1
        fi
        log_success "SSH connection verified"
    fi
}

get_current_version() {
    local version
    version=$(ssh_cmd "docker inspect eggo-pb --format '{{.Config.Image}}' 2>/dev/null" || echo "")
    
    if [ -z "$version" ]; then
        log_warn "No running PocketBase container found, using 'latest'"
        echo "${FULL_IMAGE_NAME}:latest"
    else
        echo "$version"
    fi
}

get_git_commit() {
    local commit
    commit=$(cd "$PROJECT_ROOT" && git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo "$commit"
}

create_image_snapshot() {
    local snapshot_tag="$1"
    local current_image="$2"
    
    log_step "Creating Docker image snapshot: $snapshot_tag"
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Would tag $current_image as $snapshot_tag"
        log_dry_run "docker tag $current_image $snapshot_tag"
        return 0
    fi
    
    if ssh_cmd "docker tag $current_image $snapshot_tag"; then
        log_success "Image tagged: $snapshot_tag"
        return 0
    else
        log_error "Failed to tag image"
        return 1
    fi
}

create_metadata_file() {
    local snapshot_tag="$1"
    local current_image="$2"
    local git_commit
    git_commit=$(get_git_commit)
    local timestamp
    timestamp=$(date -Iseconds)
    local metadata_file="${BACKUP_DIR}/snapshot-$(date '+%Y%m%d_%H%M%S').json"
    
    log_step "Creating snapshot metadata file"
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Would create metadata file: $metadata_file"
        cat << EOF
{
  "timestamp": "$timestamp",
  "snapshot_tag": "$snapshot_tag",
  "image": "$current_image",
  "git_commit": "$git_commit",
  "created_by": "${USER:-unknown}",
  "purpose": "pre-deployment-backup"
}
EOF
        return 0
    fi
    
    ssh_cmd "mkdir -p ${BACKUP_DIR}"
    
    ssh_cmd "cat > ${metadata_file} << EOF
{
  \"timestamp\": \"$timestamp\",
  \"snapshot_tag\": \"$snapshot_tag\",
  \"image\": \"$current_image\",
  \"git_commit\": \"$git_commit\",
  \"created_by\": \"${USER:-unknown}\",
  \"purpose\": \"pre-deployment-backup\",
  \"host\": \"$SSH_HOST\",
  \"remote_dir\": \"$REMOTE_DIR\"
}
EOF
"
    
    log_success "Metadata file created: $metadata_file"
}

cleanup_old_snapshots() {
    local max_snapshots=10
    
    log_step "Cleaning up old snapshots (keeping last $max_snapshots)"
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Would remove snapshots older than $max_snapshots"
        return 0
    fi
    
    local snapshot_count
    snapshot_count=$(ssh_cmd "ls -1 ${BACKUP_DIR}/snapshot-*.json 2>/dev/null | wc -l" || echo "0")
    
    if [ "$snapshot_count" -gt "$max_snapshots" ]; then
        local remove_count=$((snapshot_count - max_snapshots))
        ssh_cmd "ls -t ${BACKUP_DIR}/snapshot-*.json | tail -n ${remove_count} | xargs rm -f"
        log_success "Removed $remove_count old snapshot metadata files"
    else
        log_info "No cleanup needed ($snapshot_count snapshots)"
    fi
}

print_snapshot_info() {
    local snapshot_tag="$1"
    local current_image="$2"
    local git_commit="$3"
    
    echo ""
    echo "=========================================="
    log_success "SNAPSHOT CREATED SUCCESSFULLY"
    echo "=========================================="
    echo ""
    echo "Snapshot details:"
    echo "  Tag: $snapshot_tag"
    echo "  Image: $current_image"
    echo "  Git commit: $git_commit"
    echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "To rollback to this snapshot:"
    echo "  ./rollback.sh --version=$snapshot_tag"
    echo ""
}

main() {
    echo ""
    echo "=========================================="
    echo "  PocketBase Pre-Deployment Snapshot"
    echo "=========================================="
    echo ""
    
    parse_args "$@"
    
    log_info "Target: $SSH_USER@$SSH_HOST"
    log_info "Dry Run: $DRY_RUN"
    [ -n "$SNAPSHOT_TAG" ] && log_info "Custom Tag: $SNAPSHOT_TAG"
    echo ""
    
    validate_prerequisites
    
    local current_image
    current_image=$(get_current_version)
    
    local git_commit
    git_commit=$(get_git_commit)
    
    if [ -z "$SNAPSHOT_TAG" ]; then
        local timestamp
        timestamp=$(date '+%Y%m%d_%H%M%S')
        SNAPSHOT_TAG="${FULL_IMAGE_NAME}:pre-deploy-${timestamp}"
    else
        SNAPSHOT_TAG="${FULL_IMAGE_NAME}:${SNAPSHOT_TAG}"
    fi
    
    log_info "Creating snapshot with tag: $SNAPSHOT_TAG"
    log_info "Current image: $current_image"
    log_info "Git commit: $git_commit"
    echo ""
    
    create_image_snapshot "$SNAPSHOT_TAG" "$current_image"
    create_metadata_file "$SNAPSHOT_TAG" "$current_image"
    cleanup_old_snapshots
    
    print_snapshot_info "$SNAPSHOT_TAG" "$current_image" "$git_commit"
}

main "$@"
