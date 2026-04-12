#!/bin/bash
# Backup PocketBase pb_data before deployment
# Usage: ./backup-before-deploy.sh [backup-dir]
# Output: pb_data_backup_YYYYMMDD_HHMMSS.tar.gz

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${1:-./backups}"
PB_DATA_DIR="${PB_DATA_DIR:-./apps/backend/pb_data}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="pb_data_backup_${TIMESTAMP}.tar.gz"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Validate pb_data directory exists
if [ ! -d "$PB_DATA_DIR" ]; then
    log_error "pb_data directory not found: $PB_DATA_DIR"
    log_error "Set PB_DATA_DIR environment variable or ensure apps/backend/pb_data exists"
    exit 1
fi

log_info "Starting backup of pb_data"
log_info "Source: $PB_DATA_DIR"
log_info "Backup directory: $BACKUP_DIR"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Get size before backup
SIZE_BEFORE=$(du -sh "$PB_DATA_DIR" | cut -f1)
log_info "pb_data size: $SIZE_BEFORE"

# Create tarball (read-only, no modification)
log_info "Creating compressed backup..."
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
    --directory="$(dirname "$PB_DATA_DIR")" \
    "$(basename "$PB_DATA_DIR")"

# Verify backup was created
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    SIZE_AFTER=$(du -sh "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log_info "Backup created successfully: ${BACKUP_DIR}/${BACKUP_FILE}"
    log_info "Backup size: $SIZE_AFTER"
    
    # List backup contents for verification
    log_info "Backup contents:"
    tar -tzf "${BACKUP_DIR}/${BACKUP_FILE}" | head -20
    
    # Keep only last 10 backups (cleanup old backups)
    log_info "Cleaning up old backups (keeping last 10)..."
    cd "$BACKUP_DIR"
    ls -t pb_data_backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -v
    cd - > /dev/null
    
    log_info "Backup completed successfully"
    echo ""
    echo "Backup file: ${BACKUP_DIR}/${BACKUP_FILE}"
    echo ""
    echo "To restore:"
    echo "  tar -xzf ${BACKUP_DIR}/${BACKUP_FILE} -C ./apps/backend/"
    exit 0
else
    log_error "Backup failed - file not created"
    exit 1
fi
