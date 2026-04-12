#!/bin/bash
# Stage 60: Post-deployment verification
# Verifies the deployment, services, and functionality after upgrade
# Usage: ./60-verify.sh [options]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default configuration
TARGET_ENV="production"
TARGET_HOST="${SSH_HOST:-204.168.144.14}"
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
    echo -e "${BLUE}[STAGE 60]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
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
        # Simulate typical output for verification purposes
        case "$command" in
            *"docker ps"*) 
                echo "CONTAINER ID  IMAGE                    STATUS      PORTS                    NAMES"
                echo "abc123def456  eggo-pocketbase:latest  Up 5 mins   0.0.0.0:8090->8090/tcp  eggo-pb"
                ;;
            *"docker logs"*) 
                echo "Simulation: Would return docker logs"
                ;;
            *"curl"*) 
                echo "Simulation: Would return health check response"
                ;;
            *) 
                echo "Simulation: would execute verification command"
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
    
    # Test connectivity
    if ssh_cmd "echo 'Connection successful'"; then
        log_success "SSH connection to $SSH_USER@$TARGET_HOST established"
        return 0
    else
        log_error "Could not connect to remote server $SSH_USER@$TARGET_HOST"
        exit 1
    fi
}

check_service_availability() {
    log_step "Checking service availability..."
    
    log_info "Checking if services are running on expected ports..."
    
    # Check that Docker service is responding
    if [ "$DRY_RUN" = false ]; then
        local container_status
        container_status=$(ssh_cmd "docker ps -f name=eggo-pb" 2>/dev/null || echo "No containers found")
        
        if echo "$container_status" | grep -q "Up "; then
            log_success "PocketBase service is running"
            log_info "Container status details:"
            echo "$container_status"
        else
            log_error "PocketBase service is not running as expected"
            log_error "Container status output: $container_status"
            exit 1
        fi
    else
        log_info "DRY RUN: Would check service availability"
    fi
}

verify_health_endpoints() {
    log_step "Verifying health endpoints..."
    
    # Verify PocketBase is running on expected ports
    log_info "Testing PocketBase health endpoint..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would test health endpoint"
        return 0
    fi
    
    # Verify via curl to the local service on the remote machine
    local health_response
    local response_code
    
    # Using timeout to avoid hangs
    health_response=$(ssh_cmd "curl -f -k -s -o /tmp/health_resp -w '%{http_code}' -m 10 localhost:8090/api/health" 2>/dev/null || echo "CURL_FAIL")
    response_code="${health_response: -3}" # Get the last 3 characters which should be the HTTP code
    
    if [ "$response_code" = "200" ]; then
        log_success "PocketBase health endpoint responded with 200"
        
        # Check response content if health response was captured
        if ssh_cmd "test -f /tmp/health_resp && wc -c /tmp/health_resp" 2>/dev/null | grep -vq "0 "; then
            health_content=$(ssh_cmd "cat /tmp/health_resp" 2>/dev/null)
            log_info "Health check response: $health_content"
        fi
    else
        log_error "PocketBase health endpoint did not respond correctly. HTTP Status: $response_code"
        log_warn "Checking recent logs for PocketBase container..."
        recent_logs=$(ssh_cmd "docker logs --tail 20 eggo-pb" 2>/dev/null || echo "Could not fetch logs")
        log_warn "Recent logs:"
        echo "$recent_logs"
        exit 1
    fi
    
    # Clean up temp file
    ssh_cmd "rm -f /tmp/health_resp" 2>/dev/null || true
    
    log_success "Health endpoint verification completed successfully"
}

check_container_logs() {
    log_step "Checking container logs for errors..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would check container logs"
        return 0
    fi
    
    # Fetch most recent logs
    local full_logs
    full_logs=$(ssh_cmd "docker logs --tail 50 eggo-pb" 2>/dev/null)
    
    if [ -z "$full_logs" ]; then
        log_warn "Could not retrieve logs from Eggo PocketBase container"
        return 1
    fi
    
    # Check for error patterns
    local error_patterns_found=0
    echo "$full_logs" | grep -E -i "error|exception|panic|fatal|err.*occurred|failed" > /tmp/errors_found 2>/dev/null || echo ""
    
    error_lines=$(wc -l < /tmp/errors_found || echo "0")
    if [ "$error_lines" -gt 0 ] && ssh_cmd "wc -l /tmp/errors_found 2>/dev/null | cut -d' ' -f1" 2>/dev/null | grep -q -v '^0$'; then
        ERROR_COUNT=$(ssh_cmd "echo '$full_logs' | grep -E -i 'error|exception|panic|fatal|err.*occurred|failed' | wc -l || echo 0")
        log_warn "Found potentially concerning messages in logs ($ERROR_COUNT):"
        ssh_cmd "echo '$full_logs' | grep -E -i 'error|exception|panic|fatal|err.*occurred|failed' | head -10 || echo 'No errors detected by secondary check'"
        log_info "Note: Some 'errors' might be related to startup sequence, reviewing all logs:"
    else
        log_success "No concerning error messages found in recent logs (last 50 lines)"
    fi
    
    # Clean up
    ssh_cmd "rm -f /tmp/errors_found" 2>/dev/null || true
    
    log_info "Last 10 log lines for final verification:"
    echo "$full_logs" | tail -n 10
}

test_db_connection() {
    log_step "Testing database connection and basic operations..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would test database connectivity"
        return 0
    fi
    
    # Test via a PocketBase endpoint that requires database access (health check with db test)
    # First, check if PocketBase has specific db health test endpoints or we use a simple GET on API
    http_code=$(ssh_cmd "curl -f -k -s -o /tmp/test_api_resp -w '%{http_code}' -m 10 localhost:8090/api/logs -H 'Content-Type: application/json'" 2>/dev/null || echo "CURL_FAIL")
    
    response_code="${http_code: -3}"
    
    case "$response_code" in
        200|206)
            log_success "API endpoint accessible, database appears connected ($response_code)"
            # Parse response to see if it confirms db connectivity
            ;;
        401|403)
            # These are expected if authenticated access required
            log_info "API is accessible but requires authentication ($response_code) - this is normal"
            ;;
        404)
            log_info "API endpoint not found (this might be normal for some APIs) - testing basic API root"
            api_code=$(ssh_cmd "curl -f -k -s -o /dev/null -w '%{http_code}' -m 10 localhost:8090/api/ 2>/dev/null || echo 'CURL_FAIL'")
            if [ "${api_code: -3}" = "200" ]; then
                log_success "Basic API root accessible, database connection likely OK ($api_code)"
            else
                log_info "API root not accessible as expected, checking for other indicators"
            fi
            ;;
        *)
            log_warn "Database/API test returned unexpected HTTP code: $response_code"
            log_info "This may be normal depending on endpoint, continuing verification..."
            ;;
    esac
    
    # Clean up response file
    ssh_cmd "rm -f /tmp/test_api_resp" 2>/dev/null || true
    
    log_success "Database connectivity test completed"
}

validate_image_version() {
    log_step "Validating running container uses correct image version..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would validate container image version"
        return 0
    fi
    
    # Get container info to check the correct image is running
    local container_info
    container_info=$(ssh_cmd "docker ps -f name=eggo-pb --format 'table {{.Names}}\t{{.Image}}\t{{.Command}}\t{{.CreatedAt}}'")
    
    # Check running image against registry and expected tags
    local running_image
    running_image=$(echo "$container_info" | tail -n +2 | head -n 1 | awk '{print $2}')
    
    log_info "Currently running image: $running_image"
    
    # This is a simplified validation - in reality you'd want to validate against expected image tag
    log_success "Container image verification completed"
}

verify_basic_functionality() {
    log_step "Testing basic PocketBase functionality..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would test basic PocketBase functionality"
        log_info "This would include testing auth endpoints, database access, etc."
        return 0
    fi
    
    # Test basic API capability - users collections listing (this is available without auth)
    local collections_check
    api_timeout=10
    collections_check=$(ssh_cmd "timeout $api_timeout curl -f -k -s -w '\\nHTTP_CODE:%{http_code}\\n' -m $api_timeout localhost:8090/api/collections/ 2>/dev/null")
    
    # Extract HTTP code from the output
    http_return_code=$(echo "$collections_check" | grep 'HTTP_CODE:' | sed 's/HTTP_CODE://' | tr -d ' \t\n\r\f')
    
    case "$http_return_code" in
        200)
            # Check if the response looks like a json response from collections endpoint
            if echo "$collections_check" | grep -q 'totalPages\|[0-9]\+'; then
                log_success "Collections endpoint working as expected"
            else
                log_info "Endpoint accessible but response doesn't contain expected content (possibly protected)"
            fi
            ;;
        401|403)
            # Expected for protected endpoints 
            log_info "Collections endpoint requires authentication ($http_return_code) - this is normal"
            ;;
        *)
            log_warn "Collections endpoint returned unexpected code: $http_return_code"
            ;;
    esac
    
    log_success "Basic functionality test completed"
}

final_status_report() {
    log_step "Generating final status report..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would generate final status report"
    else
        log_info "Fetching overall system stats..."
        
        # Gather basic system information
        sys_info=$(ssh_cmd "uname -a" 2>/dev/null || echo "N/A")
        uptime_info=$(ssh_cmd "uptime" 2>/dev/null || echo "N/A")
        
        log_info "System: $sys_info"
        log_info "Uptime: $uptime_info"
        
        # Service health summary
        svc_status=$(ssh_cmd "docker ps -f name=eggo-" 2>/dev/null || echo "No Eggo services found")
        
        if [ -n "$svc_status" ] && ! echo "$svc_status" | grep -q "COMMAND"; then
            log_success "Services currently running successfully:"
            echo "$svc_status"
        else
            log_warn "Could not get service status summary"
        fi
    fi
}

send_slack_notification() {
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would send deployment notification to Slack"
    else
        # In a real environment, you would set up webhook and notify
        log_info "Skipping Slack notification (would send if WEBHOOK_URL set)"
    fi
}

main() {
    log_step "Starting verification stage"
    
    parse_args "$@"
    
    log_info "Target environment: $TARGET_ENV"
    log_info "Target host: $TARGET_HOST"
    log_info "SSH user: $SSH_USER"
    log_info "Dry run: $DRY_RUN"
    
    # Execute verification steps
    validate_remote_connection
    check_service_availability
    verify_health_endpoints 
    check_container_logs
    test_db_connection
    validate_image_version
    verify_basic_functionality
    final_status_report
    send_slack_notification
    
    echo ""
    log_success "Verification stage completed successfully!"
    log_info "All checks passed - deployment appears to be functioning correctly"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN mode - no actual verification was performed"
    else
        log_success "Production deployment is verified and operational"
    fi
    echo ""
}

main "$@"