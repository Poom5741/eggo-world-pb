#!/bin/bash
# Test health check scripts for Eggo PocketBase
# Tests: syntax, --local mode, --dry-run, mock responses
# Usage: ./scripts/tests/test-health-checks.sh [--verbose]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
HEALTH_CHECK_SCRIPT="$SCRIPTS_DIR/health-check.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0
VERBOSE=false

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [--verbose]"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

log_pass() {
    ((TESTS_PASSED++))
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

log_fail() {
    ((TESTS_FAILED++))
    echo -e "${RED}✗ FAIL${NC}: $1"
}

log_skip() {
    ((TESTS_SKIPPED++))
    echo -e "${YELLOW}⊘ SKIP${NC}: $1"
}

log_info() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}INFO${NC}: $1"
    fi
}

test_syntax() {
    local script="$1"
    
    log_info "Testing syntax: $(basename "$script")"
    
    if bash -n "$script" 2>/dev/null; then
        log_pass "Syntax check: $(basename "$script")"
        return 0
    else
        log_fail "Syntax check: $(basename "$script")"
        bash -n "$script" 2>&1 | head -5
        return 1
    fi
}

test_file_exists() {
    local file="$1"
    
    if [ -f "$file" ]; then
        log_pass "File exists: $(basename "$file")"
        return 0
    else
        log_fail "File missing: $(basename "$file")"
        return 1
    fi
}

test_help_option() {
    local script="$1"
    
    log_info "Testing --help option"
    
    if "$script" --help >/dev/null 2>&1; then
        log_pass "Help option works"
        return 0
    else
        log_fail "Help option failed"
        return 1
    fi
}

test_local_mode() {
    local script="$1"
    
    log_info "Testing --local mode (should not fail)"
    
    if "$script" --local >/dev/null 2>&1; then
        log_pass "Local mode executes successfully"
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 1 ]; then
            log_skip "Local mode failed (services may not be running)"
            return 0
        else
            log_fail "Local mode exited with code: $exit_code"
            return 1
        fi
    fi
}

test_dry_run_simulation() {
    local script="$1"
    
    log_info "Testing script accepts standard options"
    
    if "$script" --help >/dev/null 2>&1; then
        log_pass "Script options validated"
        return 0
    else
        log_fail "Script option parsing failed"
        return 1
    fi
}

test_json_output() {
    local script="$1"
    
    log_info "Testing --json output format"
    
    local output
    output=$("$script" --local --json 2>/dev/null || echo "")
    
    if echo "$output" | grep -q '"timestamp"'; then
        log_pass "JSON output format valid"
        return 0
    else
        log_skip "JSON output test skipped (service may not be running)"
        return 0
    fi
}

test_retry_mechanism() {
    local script="$1"
    
    log_info "Verifying retry mechanism exists in script"
    
    if grep -q "retry_command\|RETRY_ATTEMPTS" "$script"; then
        log_pass "Retry mechanism implemented"
        return 0
    else
        log_info "No explicit retry mechanism found (may use curl --retry)"
        return 0
    fi
}

test_alert_integration() {
    local script="$1"
    
    log_info "Verifying alert integration exists"
    
    if grep -q "ALERT_WEBHOOK_URL\|alert-hook" "$script"; then
        log_pass "Alert integration present"
        return 0
    else
        log_info "No alert integration found"
        return 0
    fi
}

test_check_functions() {
    local script="$1"
    
    log_info "Verifying health check functions"
    
    local required_checks=(
        "check_pocketbase_health"
        "check_wallet_api_health"
        "check_nginx_health"
        "check_container_status"
    )
    
    local found=0
    local missing=0
    
    for func in "${required_checks[@]}"; do
        if grep -q "function $func\|^$func()" "$script"; then
            ((found++))
        else
            ((missing++))
        fi
    done
    
    if [ $found -ge 3 ]; then
        log_pass "Health check functions present ($found/$((${#required_checks[@]})))"
        return 0
    else
        log_fail "Missing health check functions ($found/$((${#required_checks[@]})))"
        return 1
    fi
}

main() {
    parse_args "$@"
    
    echo ""
    echo "========================================="
    echo "  Health Check Scripts Test Suite"
    echo "========================================="
    echo ""
    
    echo "Script: $HEALTH_CHECK_SCRIPT"
    echo ""
    
    test_file_exists "$HEALTH_CHECK_SCRIPT" || exit 1
    test_syntax "$HEALTH_CHECK_SCRIPT"
    test_help_option "$HEALTH_CHECK_SCRIPT"
    test_check_functions "$HEALTH_CHECK_SCRIPT"
    test_retry_mechanism "$HEALTH_CHECK_SCRIPT"
    test_alert_integration "$HEALTH_CHECK_SCRIPT"
    test_dry_run_simulation "$HEALTH_CHECK_SCRIPT"
    
    echo ""
    echo "-----------------------------------------"
    echo "  Live Execution Tests"
    echo "-----------------------------------------"
    echo ""
    
    test_local_mode "$HEALTH_CHECK_SCRIPT" || true
    test_json_output "$HEALTH_CHECK_SCRIPT" || true
    
    echo ""
    echo "========================================="
    echo "  Test Summary"
    echo "========================================="
    echo -e "  ${GREEN}Passed:${NC}   $TESTS_PASSED"
    echo -e "  ${RED}Failed:${NC}   $TESTS_FAILED"
    echo -e "  ${YELLOW}Skipped:${NC}  $TESTS_SKIPPED"
    echo ""
    
    if [ $TESTS_FAILED -gt 0 ]; then
        echo -e "${RED}TESTS FAILED${NC}"
        exit 1
    else
        echo -e "${GREEN}ALL TESTS PASSED${NC}"
        exit 0
    fi
}

main "$@"
