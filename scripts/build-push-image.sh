#!/bin/bash
# Build and push PocketBase Docker image
# Usage: ./build-push-image.sh [registry] [tag]
# Tags: latest, git-commit-hash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REGISTRY="${1:-ghcr.io/tokenine}"
IMAGE_NAME="eggo-pocketbase"
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"

# Get git commit hash (first 7 characters)
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_TAG="${GIT_COMMIT}"

# Custom tag if provided
CUSTOM_TAG="${2:-}"

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

# Validate Dockerfile exists
DOCKERFILE_PATH="./apps/backend/Dockerfile"
if [ ! -f "$DOCKERFILE_PATH" ]; then
    log_error "Dockerfile not found: $DOCKERFILE_PATH"
    exit 1
fi

log_info "Building PocketBase Docker image"
log_info "Registry: $REGISTRY"
log_info "Image name: $IMAGE_NAME"
log_info "Full image name: $FULL_IMAGE_NAME"
log_info "Git commit: $GIT_COMMIT"

# Build context
BUILD_CONTEXT="./apps/backend"

# Tags to apply
TAGS=()
TAGS+=("latest")
TAGS+=("$GIT_TAG")

if [ -n "$CUSTOM_TAG" ]; then
    TAGS+=("$CUSTOM_TAG")
    log_info "Custom tag: $CUSTOM_TAG"
fi

# Build the image
log_info "Building Docker image with context: $BUILD_CONTEXT"
log_info "Tags to apply: ${TAGS[*]}"

# Build with all tags
DOCKER_BUILD_CMD="docker build -t $FULL_IMAGE_NAME $BUILD_CONTEXT"
for TAG in "${TAGS[@]}"; do
    DOCKER_BUILD_CMD="$DOCKER_BUILD_CMD -t ${FULL_IMAGE_NAME}:${TAG}"
done

log_info "Executing: $DOCKER_BUILD_CMD"
eval "$DOCKER_BUILD_CMD"

if [ $? -eq 0 ]; then
    log_success "Docker build completed successfully"
    
    # Display built images
    log_info "Built images:"
    for TAG in "${TAGS[@]}"; do
        echo "  - ${FULL_IMAGE_NAME}:${TAG}"
    done
    
    # Ask before pushing (safety check)
    echo ""
    read -p "Push images to registry? [y/N] " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Pushing images to $REGISTRY..."
        
        # Check if docker login is needed
        if ! docker info 2>/dev/null | grep -q "Username"; then
            log_warn "Not logged in to Docker registry. Please login first."
            log_warn "Run: docker login $REGISTRY"
            exit 1
        fi
        
        # Push all tags
        for TAG in "${TAGS[@]}"; do
            log_info "Pushing ${FULL_IMAGE_NAME}:${TAG}..."
            docker push "${FULL_IMAGE_NAME}:${TAG}"
        done
        
        log_success "All images pushed successfully"
        
        echo ""
        echo "Images pushed:"
        for TAG in "${TAGS[@]}"; do
            echo "  - ${FULL_IMAGE_NAME}:${TAG}"
        done
        
        echo ""
        echo "On remote server, pull with:"
        echo "  docker pull ${FULL_IMAGE_NAME}:latest"
        echo "  docker pull ${FULL_IMAGE_NAME}:${GIT_TAG}"
    else
        log_info "Push skipped. To push manually:"
        echo "  docker push ${FULL_IMAGE_NAME}:latest"
        for TAG in "${TAGS[@]}"; do
            echo "  docker push ${FULL_IMAGE_NAME}:${TAG}"
        done
    fi
    
    exit 0
else
    log_error "Docker build failed"
    exit 1
fi
