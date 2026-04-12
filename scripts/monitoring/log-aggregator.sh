#!/bin/bash
# Log Aggregator for PocketBase deployment
# Collects logs from all containers and system
#
# Usage: ./log-aggregator.sh [OPTIONS]
#
# Options:
#   --since=<time>       Collect logs since specified time (e.g., 1h, 30m, 2024-01-01)
#   --output=<file>      Write aggregated logs to file
#   --tail=<lines>       Show last N lines per container (default: 100)
#   --follow             Follow logs in real-time (Ctrl+C to stop)
#   --format=<format>    Output format: text (default), json, combined
#   --containers=<list>  Comma-separated list of containers (default: all)
#   -h, --help           Show help message
#
# Aggregates logs from:
# - pocketbase container (eggo-pb)
# - wallet-api container (eggo-wallet-api)
# - nginx container (eggo-nginx)
# - System logs (optional)

set -e

# Default configuration
SINCE="24h"
OUTPUT_FILE=""
TAIL_LINES=100
FOLLOW_MODE=false
FORMAT="text"
CONTAINERS="all"
INCLUDE_SYSTEM=false
TIMESTAMP=true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Container names
POCKETBASE_CONTAINER="eggo-pb"
WALLET_API_CONTAINER="eggo-wallet-api"
NGINX_CONTAINER="eggo-nginx"

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --since=*)
                SINCE="${1#*=}"
                shift
                ;;
            --output=*)
                OUTPUT_FILE="${1#*=}"
                shift
                ;;
            --tail=*)
                TAIL_LINES="${1#*=}"
                shift
                ;;
            --follow)
                FOLLOW_MODE=true
                shift
                ;;
            --format=*)
                FORMAT="${1#*=}"
                shift
                ;;
            --containers=*)
                CONTAINERS="${1#*=}"
                shift
                ;;
            --system)
                INCLUDE_SYSTEM=true
                shift
                ;;
            --no-timestamp)
                TIMESTAMP=false
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
PocketBase Log Aggregator

Usage: $0 [OPTIONS]

Options:
  --since=<time>       Collect logs since specified time (e.g., 1h, 30m, 24h, 2024-01-01)
  --output=<file>      Write aggregated logs to file (default: stdout)
  --tail=<lines>       Show last N lines per container (default: 100)
  --follow             Follow logs in real-time (Ctrl+C to stop)
  --format=<format>    Output format: text (default), json, combined
  --containers=<list>  Comma-separated list of containers (default: all)
  --system             Include system logs
  --no-timestamp       Remove timestamps from output
  -h, --help           Show this help message

Examples:
  $0 --since=1h --output=logs.txt
  $0 --follow --containers=eggo-pb,eggo-wallet-api
  $0 --format=json --tail=500
  $0 --since=2024-01-01 --system

Container Names:
  - eggo-pb (PocketBase backend)
  - eggo-wallet-api (Wallet API service)
  - eggo-nginx (Nginx reverse proxy)

EOF
}

# Logging functions
log_info() {
    echo -e "${BLUE}INFO${NC}: $1" >&2
}

log_error() {
    echo -e "${RED}ERROR${NC}: $1" >&2
}

log_success() {
    echo -e "${GREEN}✓${NC} $1" >&2
}

# Check if container is running
check_container_running() {
    local container="$1"
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        return 0
    else
        return 1
    fi
}

# Get container logs
get_container_logs() {
    local container="$1"
    local since="$2"
    local tail="$3"
    
    if ! check_container_running "$container"; then
        log_info "Container '$container' not running, skipping"
        return 0
    fi
    
    local args=()
    
    if [ "$FOLLOW_MODE" = true ]; then
        args+=("-f")
    fi
    
    args+=("--tail" "$tail")
    
    if [[ "$since" =~ ^[0-9]+[hms]$ ]]; then
        args+=("--since" "$since")
    fi
    
    docker logs "${args[@]}" "$container" 2>&1
}

# Format logs as JSON
format_logs_json() {
    local container="$1"
    local logs="$2"
    
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    cat << EOF
{
  "container": "$container",
  "timestamp": "$timestamp",
  "since": "$SINCE",
  "tail": $TAIL_LINES,
  "logs": $(echo "$logs" | jq -Rs 'split("\n") | map(select(length > 0))')
}
EOF
}

# Aggregate logs from specific container
aggregate_container_logs() {
    local container="$1"
    local label="$2"
    
    if ! check_container_running "$container"; then
        log_info "Skipping $container (not running)"
        return 0
    fi
    
    log_info "Collecting logs from $container"
    
    local logs
    logs=$(get_container_logs "$container" "$SINCE" "$TAIL_LINES")
    
    if [ "$FORMAT" = "json" ]; then
        format_logs_json "$label" "$logs"
    elif [ "$FORMAT" = "combined" ]; then
        echo "=== $label ($container) ==="
        echo "$logs"
        echo ""
    else
        if [ "$TIMESTAMP" = true ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] === $label ($container) ==="
        else
            echo "=== $label ($container) ==="
        fi
        echo "$logs"
        echo ""
    fi
}

# Aggregate logs from a single container
aggregate_single_container() {
    local container="$1"
    
    check_container_running "$container" || {
        log_error "Container '$container' not found"
        return 1
    }
    
    aggregate_container_logs "$container" "$container"
}

# Aggregate all container logs
aggregate_all_logs() {
    local output=""
    
    if [ "$FORMAT" = "json" ]; then
        output="{\n  \"timestamp\": \"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\",\n  \"since\": \"$SINCE\",\n  \"containers\": {\n"
        
        local first=true
        
        # PocketBase logs
        if check_container_running "$POCKETBASE_CONTAINER"; then
            [ "$first" = false ] && output+=",\n"
            first=false
            local pb_logs
            pb_logs=$(get_container_logs "$POCKETBASE_CONTAINER" "$SINCE" "$TAIL_LINES")
            output+="    \"pocketbase\": $(echo "$pb_logs" | jq -Rs 'split("\n") | map(select(length > 0))')"
        fi
        
        # Wallet API logs
        if check_container_running "$WALLET_API_CONTAINER"; then
            [ "$first" = false ] && output+=",\n"
            first=false
            local wa_logs
            wa_logs=$(get_container_logs "$WALLET_API_CONTAINER" "$SINCE" "$TAIL_LINES")
            output+="    \"wallet_api\": $(echo "$wa_logs" | jq -Rs 'split("\n") | map(select(length > 0))')"
        fi
        
        # Nginx logs
        if check_container_running "$NGINX_CONTAINER"; then
            [ "$first" = false ] && output+=",\n"
            local nx_logs
            nx_logs=$(get_container_logs "$NGINX_CONTAINER" "$SINCE" "$TAIL_LINES")
            output+="    \"nginx\": $(echo "$nx_logs" | jq -Rs 'split("\n") | map(select(length > 0))')"
        fi
        
        output+="\n  }\n}"
        echo -e "$output"
        
    else
        # Text format with headers
        aggregate_container_logs "$POCKETBASE_CONTAINER" "PocketBase"
        aggregate_container_logs "$WALLET_API_CONTAINER" "Wallet API"
        aggregate_container_logs "$NGINX_CONTAINER" "Nginx"
    fi
}

# Follow logs in real-time
follow_logs() {
    log_info "Following logs in real-time (Ctrl+C to stop)"
    
    local containers_to_follow=()
    
    # Parse container list
    IFS=',' read -ra CONTAINER_ARRAY <<< "$CONTAINERS"
    
    for container in "${CONTAINER_ARRAY[@]}"; do
        container=$(echo "$container" | xargs) # Trim whitespace
        if check_container_running "$container"; then
            containers_to_follow+=("$container")
        else
            log_info "Skipping $container (not running)"
        fi
    done
    
    if [ ${#containers_to_follow[@]} -eq 0 ]; then
        log_error "No running containers found to follow"
        exit 1
    fi
    
    log_success "Following ${#containers_to_follow[@]} container(s): ${containers_to_follow[*]}"
    echo ""
    
    # Follow logs from all containers
    for container in "${containers_to_follow[@]}"; do
        if [ "${#containers_to_follow[@]}" -gt 1 ]; then
            echo -e "${CYAN}=== $container ===${NC}"
        fi
        docker logs -f --tail "$TAIL_LINES" "$container" 2>&1 &
    done
    
    # Wait for all background processes
    wait
}

# Collect system logs
collect_system_logs() {
    log_info "Collecting system logs"
    
    local system_logs_section="=== System Logs ==="
    
    if [ "$TIMESTAMP" = true ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $system_logs_section"
    else
        echo "$system_logs_section"
    fi
    
    # Check if systemd is available
    if command -v journalctl >/dev/null 2>&1; then
        echo "--- Docker service logs ---"
        journalctl -u docker.service --since "$SINCE" --no-pager -n "$TAIL_LINES" 2>/dev/null || true
        echo ""
    fi
    
    # Check docker info
    if docker info >/dev/null 2>&1; then
        echo "--- Docker info ---"
        docker info 2>/dev/null | head -20 || true
        echo ""
    fi
    
    # Disk usage
    if command -v df >/dev/null 2>&1; then
        echo "--- Disk usage (docker volumes) ---"
        df -h 2>/dev/null | grep -E '^/|Filesystem' || true
        echo ""
    fi
}

# Main execution
main() {
    parse_args "$@"
    
    # Validate format
    if [[ ! "$FORMAT" =~ ^(text|json|combined)$ ]]; then
        log_error "Invalid format: $FORMAT (must be text, json, or combined)"
        exit 1
    fi
    
    # Handle follow mode
    if [ "$FOLLOW_MODE" = true ]; then
        follow_logs
        exit 0
    fi
    
    # Redirect output if file specified
    local output_handler
    if [ -n "$OUTPUT_FILE" ]; then
        output_handler="tee \"$OUTPUT_FILE\""
        log_info "Writing logs to: $OUTPUT_FILE"
    else
        output_handler="cat"
    fi
    
    # Determine which containers to aggregate
    if [ "$CONTAINERS" = "all" ]; then
        if eval "aggregate_all_logs | $output_handler"; then
            log_success "Log aggregation complete"
        else
            log_error "Log aggregation failed"
            exit 1
        fi
    else
        # Specific containers
        IFS=',' read -ra CONTAINER_ARRAY <<< "$CONTAINERS"
        
        for container in "${CONTAINER_ARRAY[@]}"; do
            container=$(echo "$container" | xargs)
            if ! aggregate_single_container "$container" | eval "$output_handler"; then
                log_error "Failed to collect logs from $container"
                exit 1
            fi
        done
        
        log_success "Collected logs from ${#CONTAINER_ARRAY[@]} container(s)"
    fi
    
    # Include system logs if requested
    if [ "$INCLUDE_SYSTEM" = true ]; then
        collect_system_logs | eval "$output_handler"
    fi
    
    # Report output file size if written to file
    if [ -n "$OUTPUT_FILE" ] && [ -f "$OUTPUT_FILE" ]; then
        local file_size
        file_size=$(wc -c < "$OUTPUT_FILE" | tr -d ' ')
        log_success "Output file size: $(numfmt --to=iec-i --suffix=B "$file_size" 2>/dev/null || echo "${file_size} bytes")"
    fi
}

# Handle interrupt signal
trap 'log_info "Interrupted, exiting..."; exit 0' INT TERM

# Run main
main "$@"
