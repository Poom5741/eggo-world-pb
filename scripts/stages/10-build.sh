#!/bin/bash
# Stage 10: Build Docker image
# Builds the PocketBase Docker image with appropriate tags 
# Usage: ./10-build.sh [options]

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
    echo -e "${BLUE}[STAGE 10]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
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

validate_dockerfile() {
    log_step "Validating Dockerfile exists..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Skipping Dockerfile validation"
        return 0
    fi
    
    # Determine the path to Dockerfile based on the context
    local dockerfile_paths=(
        "./apps/backend/Dockerfile"
        "../backend/Dockerfile"
        "./Dockerfile"
    )
    
    local found_dockerfile=""
    for path in "${dockerfile_paths[@]}"; do
        if [ -f "$path" ]; then
            found_dockerfile="$path"
            break
        fi
    done
    
    if [ -z "$found_dockerfile" ]; then
        log_error "No Dockerfile found in expected locations: ${dockerfile_paths[*]}"
        exit 1
    fi
    
    log_info "Found Dockerfile: $found_dockerfile"
    
    # Basic validation: check if the file has content
    if [ ! -s "$found_dockerfile" ]; then
        log_error "Dockerfile is empty: $found_dockerfile"
        exit 1
    fi
    
    log_success "Dockerfile validated: $found_dockerfile"
}

get_build_context() {
    local context_dir="./"
    
    # Look for backend context - this is typically where PocketBase Dockerfile lives
    if [ -d "./apps/backend" ] && [ -f "./apps/backend/Dockerfile" ]; then
        context_dir="./apps/backend"
    elif [ -d "../backend" ] && [ -f "../backend/Dockerfile" ]; then
        context_dir="../backend"
    elif [ -f "./Dockerfile" ]; then
        context_dir="./"
    else
        log_error "Could not determine appropriate build context"
        exit 1
    fi
    
    echo "$context_dir"
}

get_git_commit_tag() {
    if [ "$DRY_RUN" = true ]; then
        # For dry run, return a test commit hash
        echo "abcd123"
        return 0
    fi
    
    local git_commit
    git_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
    
    if [ "$git_commit" = "latest" ]; then
        log_warn "Could not determine git commit, using 'latest' tag"
    else
        log_info "Using git commit: $git_commit for image tagging"
    fi
    
    echo "$git_commit"
}

build_images() {
    log_step "Starting Docker image build process..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would build Docker image from context"
        # Try to detect context for display
        local context=$(get_build_context)
        local tag=$(get_git_commit_tag)
        log_info "Would build from context: $context"
        log_info "Would tag as: $REGISTRY/$IMAGE_NAME:latest and $REGISTRY/$IMAGE_NAME:$tag"
        return 0
    fi
    
    local build_context
    build_context=$(get_build_context)
    log_info "Using build context: $build_context"
    
    # Get git commit for tagging
    local git_commit
    git_commit=$(get_git_commit_tag)
    
    # Build tags array
    declare -a tags
    tags+=("${REGISTRY}/${IMAGE_NAME}:latest")
    if [ "$git_commit" != "latest" ]; then
        tags+=("${REGISTRY}/${IMAGE_NAME}:${git_commit}")
    fi
    
    # Get optional version from a VERSION file or environment
    if [ -f "VERSION" ]; then
        version=$(cat VERSION 2>/dev/null | tr -d '\n')
        if [ -n "$version" ]; then
            tags+=("${REGISTRY}/${IMAGE_NAME}:${version}")
        fi
    elif [ -n "${APP_VERSION:-}" ]; then
        tags+=("${REGISTRY}/${IMAGE_NAME}:${APP_VERSION}")
    fi
    
    log_info "Will build and tag image with:"
    for tag in "${tags[@]}"; do
        echo "  - $tag"
    done
    
    # First check if Docker daemon is available
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Build the Docker image with multiple tags
    log_info "Starting build process (this may take several minutes)..."
    
    # Build with the primary tag first
    local primary_tag="${tags[0]}"
    log_info "Building image: $primary_tag"
    
    # Build command with proper error handling
    if docker build --platform linux/amd64 -t "$primary_tag" "$build_context"; then
        log_success "Primary image built successfully: $primary_tag"
        
        # Build with additional tags
        local additional_tags=("${tags[@]:1}")  # Skip the first element (already built)
        for additional_tag in "${additional_tags[@]}"; do
            log_info "Tagging additional tag: $additional_tag"
            if docker tag "$primary_tag" "$additional_tag"; then
                log_success "Tagged: $additional_tag"
            else
                log_error "Failed to tag: $additional_tag"
                exit 1
            fi
        done
        
        # Verify all tags exist after building
        for final_tag in "${tags[@]}"; do
            line="^$(echo "$final_tag" | sed 's/:/\\:')"
            if docker images --format '{{.Repository}}:{{.Tag}}' | grep -qF "$line"; then
                log_success "Verified $final_tag exists"
            else
                log_error "Expected tag $final_tag was not created"
                exit 1
            fi
        done
        
        return 0
    else
        log_error "Docker build failed for $primary_tag"
        log_error "Check Docker output above for error details"
        exit 1
    fi
}

validate_built_images() {
    log_step "Validating built images..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Skipping image validation"
        return 0
    fi
    
    local git_commit
    git_commit=$(get_git_commit_tag)
    
    declare -a validation_tags
    validation_tags+=("${REGISTRY}/${IMAGE_NAME}:latest")
    if [ "$git_commit" != "latest" ]; then
        validation_tags+=("${REGISTRY}/${IMAGE_NAME}:${git_commit}")
    fi
    
    # Add version tag if exists
    if [ -f "VERSION" ]; then
        version=$(cat VERSION 2>/dev/null | tr -d '\n')
        [ -n "$version" ] && validation_tags+=("${REGISTRY}/${IMAGE_NAME}:${version}")
    elif [ -n "${APP_VERSION:-}" ]; then
        validation_tags+=("${REGISTRY}/${IMAGE_NAME}:${APP_VERSION}")
    fi
    
    # Validate each tagged image exists
    for tag in "${validation_tags[@]}"; do
        if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$(echo "$tag" | sed 's/:/\\:/')"; then
            log_success "Image found: $tag"
        else
            log_error "Image not found: $tag"
            exit 1
        fi
    done
    
    # Check image size and basic info
    local latest_image="${REGISTRY}/${IMAGE_NAME}:latest"
    local img_size
    img_size=$(docker images --format '{{.Size}}' "$latest_image" 2>/dev/null || echo "unknown")
    log_info "Image size (latest): $img_size"
    
    # Test that the image is not corrupted (run a minimal test)
    log_info "Running minimal container check (will remove immediately)..."
    local test_container_name="build-validation-test-$$"
    
    local test_result=0
    if docker run --rm --name "$test_container_name" "$latest_image" ash -c "echo 'Build validation passed'" > /dev/null 2>&1; then
        log_success "Basic container validation passed"
    else
        log_warn "Could not run basic validation test on image (not necessarily an error)"
    fi
    
    log_success "Built images validated successfully"
}

main() {
    log_step "Starting build stage"
    
    parse_args "$@"
    
    log_info "Target environment: $TARGET_ENV"
    log_info "Registry: $REGISTRY"
    log_info "Image name: $IMAGE_NAME"
    log_info "Dry run: $DRY_RUN"
    
    # Execute build steps
    validate_dockerfile
    build_images
    validate_built_images
    
    echo ""
    log_success "Build stage completed successfully!"
    log_info "Created Docker images ready for deployment"
    echo ""
}

main "$@"