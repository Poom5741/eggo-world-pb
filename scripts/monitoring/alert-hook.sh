#!/bin/bash
# Alert Hook for PocketBase deployment
# Sends alerts via Slack/webhook/email
#
# Usage: ./alert-hook.sh [OPTIONS]
#
# Options:
#   --message="<text>"      Alert message to send (required)
#   --severity=<level>      Alert severity: warning, error, critical (default: error)
#   --title="<title>"       Alert title (default: based on severity)
#   --channel=<channel>     Slack channel override (default: from config)
#   --dry-run               Print alert payload without sending
#   --verbose               Enable verbose output
#   -h, --help              Show help message
#
# Environment Variables:
#   ALERT_WEBHOOK_URL       Primary webhook URL (required for generic webhooks)
#   SLACK_WEBHOOK_URL       Slack webhook URL (optional)
#   SLACK_CHANNEL           Slack channel override (optional)
#   ALERT_EMAIL             Email address for email alerts (optional)
#   SMTP_HOST               SMTP server for email (optional)
#   ALERT_THRESHOLD         Number of failures before alerting (optional)
#
# Supports:
# - Slack webhook
# - Generic webhook
# - Email (optional, requires SMTP config)
# - Severity levels with different channels

set -e

# Default configuration
MESSAGE=""
SEVERITY="error"
TITLE=""
CHANNEL=""
DRY_RUN=false
VERBOSE=false

# Configuration file
CONFIG_FILE="${HOME}/.eggo-alert-config"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Severity helper functions
get_severity_color() {
    case "$1" in
        warning) echo "$YELLOW" ;;
        error) echo "$RED" ;;
        critical) echo "$RED" ;;
        *) echo "$NC" ;;
    esac
}

get_severity_emoji() {
    case "$1" in
        warning) echo "⚠️" ;;
        error) echo "❌" ;;
        critical) echo "🚨" ;;
        *) echo "❗" ;;
    esac
}

get_severity_channel() {
    case "$1" in
        warning) echo "#alerts-warning" ;;
        error) echo "#alerts-error" ;;
        critical) echo "#alerts-critical" ;;
        *) echo "#alerts-error" ;;
    esac
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --message=*)
                MESSAGE="${1#*=}"
                shift
                ;;
            --severity=*)
                SEVERITY="${1#*=}"
                shift
                ;;
            --title=*)
                TITLE="${1#*=}"
                shift
                ;;
            --channel=*)
                CHANNEL="${1#*=}"
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
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
PocketBase Alert Hook

Usage: $0 [OPTIONS]

Required:
  --message="<text>"     Alert message to send

Options:
  --severity=<level>     Alert severity: warning, error, critical (default: error)
  --title="<title>"      Alert title (default: based on severity)
  --channel=<channel>    Slack channel override (default: based on severity)
  --dry-run              Print alert payload without sending
  --verbose              Enable verbose output
  -h, --help             Show this help message

Environment Variables:
  ALERT_WEBHOOK_URL      Primary webhook URL (required for generic webhooks)
  SLACK_WEBHOOK_URL      Slack webhook URL (optional)
  SLACK_CHANNEL          Slack channel override (optional)
  ALERT_EMAIL            Email for alerts (optional)
  SMTP_HOST              SMTP server (optional)
  ALERT_THRESHOLD        Failures before alerting (optional)

Examples:
  $0 --message="PocketBase is down" --severity=critical
  $0 --message="High memory usage" --severity=warning --channel=#ops
  $0 --message="Test alert" --dry-run

Severity Levels:
  warning   - Non-critical issues (yellow)
  error     - Service errors (red)
  critical  - Complete service outage (red, urgent)

EOF
}

# Logging functions
log_info() {
    if [ "$VERBOSE" = true ] || [ "$DRY_RUN" = true ]; then
        echo -e "${BLUE}INFO${NC}: $1" >&2
    fi
}

log_success() {
    echo -e "${GREEN}✓${NC} $1" >&2
}

log_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

log_dry_run() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}DRY-RUN${NC}: $1" >&2
    fi
}

# Load configuration
load_config() {
    # Load from config file if exists
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
        log_info "Loaded config from $CONFIG_FILE"
    fi
    
    # Set defaults
    export ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
    export SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
    export SLACK_CHANNEL="${SLACK_CHANNEL:-}"
    export ALERT_EMAIL="${ALERT_EMAIL:-}"
}

# Validate severity
validate_severity() {
    case $SEVERITY in
        warning|error|critical)
            return 0
            ;;
        *)
            log_error "Invalid severity: $SEVERITY (must be warning, error, or critical)"
            exit 1
            ;;
    esac
}

# Build alert title
build_title() {
    if [ -n "$TITLE" ]; then
        echo "$TITLE"
        return
    fi
    
    local prefix
    prefix=$(get_severity_emoji "$SEVERITY")
    local env="[Production]"
    
    if [ "${MODE:-local}" = "local" ]; then
        env="[Development]"
    fi
    
    case $SEVERITY in
        warning)
            echo "$prefix $env Warning"
            ;;
        error)
            echo "$prefix $env Error"
            ;;
        critical)
            echo "$prefix $env CRITICAL ALERT"
            ;;
    esac
}

# Build Slack message payload
build_slack_payload() {
    local title
    title=$(build_title)
    local color
    
    case $SEVERITY in
        warning)
            color="warning"
            ;;
        error)
            color="danger"
            ;;
        critical)
            color="danger"
            ;;
    esac
    
    local timestamp
    timestamp=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    
    cat << EOF
{
  "attachments": [
    {
      "color": "$color",
      "title": "$title",
      "text": "$MESSAGE",
      "fields": [
        {
          "title": "Severity",
          "value": "$(get_severity_emoji "$SEVERITY") $(echo "$SEVERITY" | tr '[:lower:]' '[:upper:]')",
          "short": true
        },
        {
          "title": "Environment",
          "value": "$env",
          "short": true
        }
      ],
      "footer": "PocketBase Alert System",
      "ts": $(date +%s)
    }
  ]
}
EOF
}

# Build generic webhook payload
build_generic_payload() {
    local title
    title=$(build_title)
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    cat << EOF
{
  "title": "$title",
  "message": "$MESSAGE",
  "severity": "$SEVERITY",
  "timestamp": "$timestamp",
  "source": "PocketBase Alert System",
  "environment": "${MODE:-production}"
}
EOF
}

# Send to Slack webhook
send_slack() {
    local webhook_url="${SLACK_WEBHOOK_URL:-$ALERT_WEBHOOK_URL}"
    
    if [ -z "$webhook_url" ]; then
        log_error "Slack webhook URL not configured"
        return 1
    fi
    
    local target_channel="${CHANNEL:-$SLACK_CHANNEL}"
    
    local payload
    payload=$(build_slack_payload)
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Slack webhook: $webhook_url"
        log_dry_run "Payload:"
        echo "$payload" | jq . >&2
        return 0
    fi
    
    log_info "Sending alert to Slack..."
    
    local response
    response=$(curl -sS -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        -w "\n%{http_code}")
    
    local http_code
    http_code=$(echo "$response" | tail -n1)
    response=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        log_success "Alert sent to Slack"
        return 0
    else
        log_error "Failed to send to Slack (HTTP $http_code): $response"
        return 1
    fi
}

# Send to generic webhook
send_generic_webhook() {
    local webhook_url="$ALERT_WEBHOOK_URL"
    
    if [ -z "$webhook_url" ]; then
        log_error "Generic webhook URL not configured"
        return 1
    fi
    
    local payload
    payload=$(build_generic_payload)
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Generic webhook: $webhook_url"
        log_dry_run "Payload:"
        echo "$payload" | jq . >&2
        return 0
    fi
    
    log_info "Sending alert to webhook..."
    
    local response
    response=$(curl -sS -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        -w "\n%{http_code}")
    
    local http_code
    http_code=$(echo "$response" | tail -n1)
    response=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        log_success "Alert sent to webhook"
        return 0
    else
        log_error "Failed to send to webhook (HTTP $http_code): $response"
        return 1
    fi
}

# Send email alert (if configured)
send_email() {
    local email="$ALERT_EMAIL"
    
    if [ -z "$email" ]; then
        log_info "Email not configured, skipping"
        return 0
    fi
    
    local title
    title=$(build_title)
    
    if [ "$DRY_RUN" = true ]; then
        log_dry_run "Email to: $email"
        log_dry_run "Subject: $title"
        log_dry_run "Body: $MESSAGE"
        return 0
    fi
    
    # Check if mail command is available
    if command -v mail >/dev/null 2>&1; then
        log_info "Sending email alert..."
        echo "$MESSAGE" | mail -s "$title" "$email"
        log_success "Alert email sent to $email"
        return 0
    else
        log_info "Mail command not available, skipping email"
        return 0
    fi
}

# Determine where to send alert
send_alert() {
    local sent=false
    local failed=false
    
    # Try Slack if configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        if send_slack; then
            sent=true
        else
            failed=true
        fi
    fi
    
    # Try generic webhook if configured
    if [ -n "$ALERT_WEBHOOK_URL" ] && [ -z "$SLACK_WEBHOOK_URL" ]; then
        if send_generic_webhook; then
            sent=true
        else
            failed=true
        fi
    fi
    
    # Try email if configured
    if [ -n "$ALERT_EMAIL" ]; then
        if send_email; then
            sent=true
        else
            failed=true
        fi
    fi
    
    # Results
    if [ "$sent" = true ] && [ "$failed" = false ]; then
        log_success "All alerts sent successfully"
        return 0
    elif [ "$sent" = true ] && [ "$failed" = true ]; then
        log_error "Some alerts failed to send"
        return 1
    elif [ "$sent" = false ] && [ "$failed" = false ]; then
        log_error "No alert channels configured"
        echo ""
        echo "Configure one or more of the following:"
        echo "  - SLACK_WEBHOOK_URL for Slack alerts"
        echo "  - ALERT_WEBHOOK_URL for generic webhook alerts"
        echo "  - ALERT_EMAIL for email alerts"
        return 1
    else
        log_error "All alert channels failed"
        return 1
    fi
}

# Print alert summary (dry run)
print_dry_run_summary() {
    if [ "$DRY_RUN" = true ]; then
        echo ""
        echo "=== DRY RUN SUMMARY ===" >&2
        echo "Severity: $SEVERITY" >&2
        echo "Title: $(build_title)" >&2
        echo "Message: $MESSAGE" >&2
        echo ""
        echo "Configured channels:" >&2
        [ -n "$SLACK_WEBHOOK_URL" ] && echo "  - Slack: $SLACK_WEBHOOK_URL" >&2
        [ -n "$ALERT_WEBHOOK_URL" ] && echo "  - Webhook: $ALERT_WEBHOOK_URL" >&2
        [ -n "$ALERT_EMAIL" ] && echo "  - Email: $ALERT_EMAIL" >&2
        echo ""
    fi
}

# Main execution
main() {
    parse_args "$@"
    load_config
    
    # Validate message
    if [ -z "$MESSAGE" ]; then
        log_error "Message is required (--message=\"<text>\")"
        show_help
        exit 1
    fi
    
    # Validate severity
    validate_severity
    
    # Print alert details in verbose/dry-run mode
    if [ "$VERBOSE" = true ] || [ "$DRY_RUN" = true ]; then
        echo "=== Alert Details ===" >&2
        echo "Severity: $SEVERITY" >&2
        echo "Title: $(build_title)" >&2
        echo "Message: $MESSAGE" >&2
        echo "" >&2
    fi
    
    # Dry run summary
    print_dry_run_summary
    
    # Send alert
    send_alert
}

# Run main
main "$@"
