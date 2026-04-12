#!/bin/bash
# Main Deployment Orchestration Script for Eggo PocketBase
# Usage: ./deploy-phase02.sh [options]
# Phased deployment with pre-deployment checks, build, backup, deploy, and verification

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGES_DIR="$SCRIPT_DIR/stages"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Exit codes
EXIT_SUCCESS=0
EXIT_FAILURE=1
EXIT_ROLLBACK=2

# Default configuration
DRY_RUN=false
TARGET_STAGE=""
TARGET_ENV="production"
TARGET_HOST="${SSH_HOST:-204.168.144.14}"

# Define stages as an array of strings in format "number:filename"
STAGES=(
    "00:00-pre-deploy.sh"
    "10:10-build.sh"
    "20:20-push.sh"
    "30:30-backup.sh"
    "40:40-deploy.sh"
    "50:50-migrate.sh"
    "60:60-verify.sh"
)

# Function to get stage filename from number
get_stage_filename() {
    local number="$1"
    for stage in "${STAGES[@]}"; do
        local stage_num="${stage%%:*}"
        local stage_file="${stage#*:}"
        if [ "$stage_num" = "$number" ]; then
            echo "$stage_file"
            return 0
        fi
    done
    return 1
}

# Function to check if stage exists
stage_exists() {
    local number="$1"
    for stage in "${STAGES[@]}"; do
        local stage_num="${stage%%:*}"
        if [ "$stage_num" = "$number" ]; then
            return 0
        fi
    done
    return 1
}

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
    echo -e "${BLUE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dry-run                 Run through the deployment without making changes"
    echo "  --stage=<name|number>     Run only a specific stage (e.g., --stage=40 or --stage=40-deploy.sh)"
    echo "  --env=<environment>       Target environment (default: production)"
    echo "  --host=<hostname>         Target host (default: $TARGET_HOST)"
    echo "  --help                    Show this help message"
    echo ""
    echo "Available stages:"
    echo "  00 - Pre-deployment checks"
    echo "  10 - Build application"
    echo "  20 - Push Docker image" 
    echo "  30 - Backup current deployment"
    echo "  40 - Deploy to production"
    echo "  50 - Run migrations"
    echo "  60 - Verify deployment"
    echo ""
    echo "Examples:"
    echo "  $0                                # Run all stages"
    echo "  $0 --dry-run                     # Simulate full deployment"
    echo "  $0 --stage=40                    # Run only deploy stage"
    echo "  $0 --env=staging --host=staging.example.com"
    echo ""
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                log_info "Dry run mode enabled"
                shift
                ;;
            --stage=*)
                TARGET_STAGE="${1#*=}"
                log_info "Target stage: $TARGET_STAGE"
                shift
                ;;
            --env=*)
                TARGET_ENV="${1#*=}"
                log_info "Target environment: $TARGET_ENV"
                shift
                ;;
            --host=*)
                TARGET_HOST="${1#*=}"
                log_info "Target host: $TARGET_HOST"
                shift
                ;;
            --help|-h)
                usage
                exit $EXIT_SUCCESS
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit $EXIT_FAILURE
                ;;
        esac
    done
}

validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        log_error "docker-compose.yml not found in project root: $PROJECT_ROOT"
        exit $EXIT_FAILURE
    fi
    
    # Check Docker availability
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit $EXIT_FAILURE
    fi
    
    # Check if Docker daemon is running
    if ! docker ps >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit $EXIT_FAILURE
    fi
    
    # Check SSH availability if not in dry run
    if [ "$DRY_RUN" = false ]; then
        if ! command -v ssh &> /dev/null; then
            log_error "SSH is not installed or not in PATH"
            exit $EXIT_FAILURE
        fi
    fi
    
    log_success "Prerequisites validated"
}

check_environment_vars() {
    log_info "Checking required environment variables..."
    
    required_vars=(
        "SSH_USER"
        "SSH_KEY"
        "REGISTRY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_info "Please set these variables before running deploy:"
        for var in "${missing_vars[@]}"; do
            echo "  export $var=value"
        done
        exit $EXIT_FAILURE
    fi
    
    log_success "Environment variables validated"
}

# Run individual stage
run_stage() {
    local stage_number=$1
    local stage_script=$(get_stage_filename "$stage_number")
    
    if [ -z "$stage_script" ]; then
        log_error "Stage not found: $stage_number"
        exit $EXIT_FAILURE
    fi
    
    local stage_path="$STAGES_DIR/$stage_script"
    
    if [ ! -f "$stage_path" ]; then
        log_error "Stage script not found: $stage_path"
        exit $EXIT_FAILURE
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would execute stage $stage_number: $stage_script"
        return $EXIT_SUCCESS
    fi
    
    log_step "Executing stage: $stage_number - $stage_script"
    
    chmod +x "$stage_path"
    
    if "$stage_path" --env="$TARGET_ENV" --host="$TARGET_HOST"; then
        log_success "Stage $stage_number completed successfully: $stage_script"
        return $EXIT_SUCCESS
    else
        local exit_code=$?
        log_error "Stage $stage_number failed: $stage_script (exit code: $exit_code)"
        
        # Trigger rollback only in production and non-dry-run
        if [ "$TARGET_ENV" = "production" ] && [ "$DRY_RUN" = false ]; then
            trigger_rollback
        fi
        
        exit $exit_code
    fi
}

trigger_rollback() {
    log_warn "Rollback triggered due to stage failure..."
    
    local rollback_script="$STAGES_DIR/70-rollback.sh"
    
    if [ -f "$rollback_script" ]; then
        log_info "Running rollback script: $rollback_script"
        chmod +x "$rollback_script"
        "$rollback_script" --env="$TARGET_ENV" --host="$TARGET_HOST"
        exit $EXIT_ROLLBACK
    else
        log_error "Rollback script not found: $rollback_script"
        exit $EXIT_FAILURE
    fi
}

run_all_stages() {
    log_info "Starting full deployment sequence..."
    
    for entry in "${STAGES[@]}"; do
        local stage_number="${entry%%:*}"
        run_stage "$stage_number"
    done
}

main() {
    echo ""
    echo "========================================="
    echo "  Eggo PocketBase Deployment Orchestration"
    echo "  Phase 02 - Full Deployment Pipeline"
    echo "========================================="
    echo ""
    log_info "Initializing deployment..."
    
    parse_args "$@"
    validate_prerequisites
    
    if [ "$DRY_RUN" = false ]; then
        check_environment_vars
    fi
    
    echo "Deployment parameters:"
    echo "  Environment: $TARGET_ENV"
    echo "  Target host: $TARGET_HOST"
    echo "  Dry run mode: $DRY_RUN"
    echo "  Project root: $PROJECT_ROOT"
    echo ""
    
    if [ -n "$TARGET_STAGE" ]; then
        # Run specific stage
        local stage_num=""
        local stage_pattern="$TARGET_STAGE"
        
        # If provided stage is just a number, lookup the corresponding script
        if [[ $TARGET_STAGE =~ ^[0-9]+$ ]]; then
            if stage_exists "$TARGET_STAGE"; then
                stage_num="$TARGET_STAGE"
            else
                log_error "Invalid stage number: $TARGET_STAGE"
                exit $EXIT_FAILURE
            fi
        else
            # Try to find the stage number from the script name
            for entry in "${STAGES[@]}"; do
                local num="${entry%%:*}"
                local name="${entry#*:}"
                if [ "$name" = "$stage_pattern" ]; then
                    stage_num="$num"
                    break
                elif [[ "$name" == "$stage_pattern"* ]]; then
                    stage_num="$num"
                    break
                fi
            done
            
            if [ -z "$stage_num" ]; then
                log_error "Stage not found: $stage_pattern"
                exit $EXIT_FAILURE
            fi
        fi
        
        local stage_name=$(get_stage_filename "$stage_num")
        log_info "Running specific stage: $stage_num ($stage_name)"
        run_stage "$stage_num"
    else
        # Run all stages
        if [ "$DRY_RUN" = true ]; then
            log_info "Starting dry run of full deployment (skipping confirmation)..."
        else
            read -rsp $'Press Ctrl+C to cancel, or Enter to continue: '
            echo
            log_warn "Starting production deployment. Press Ctrl+C to abort within 5 seconds."
            sleep 5
        fi
        
        run_all_stages
    fi
    
    echo ""
    echo "========================================="
    log_success "Deployment completed successfully!"
    echo "========================================="
    echo ""
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN COMPLETE - No changes were actually made"
    else
        log_info "Deployment to $TARGET_ENV on $TARGET_HOST completed successfully"
        log_info "Verify deployment with: ./scripts/verify-phase02-prod.sh"
    fi
}

main "$@"