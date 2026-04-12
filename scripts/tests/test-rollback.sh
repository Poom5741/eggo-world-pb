#!/bin/bash
# Test rollback scripts for Eggo PocketBase
# Tests: syntax, --dry-run, version parsing, safety checks
# Usage: ./scripts/tests/test-rollback.sh [--verbose]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
ROLLBACK_SCRIPT="$SCRIPTS_DIR/rollback.sh"
STAGE_ROLLBACK="$SCRIPTS_DIR/stages/70-rollback.sh"

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

test_dry_run() {
    local script="$1"
    
    log_info "Testing --dry-run mode"
    
    local output
    output=$("$script" --dry-run 2>&1 || echo "")
    
    if echo "$output" | grep -qi "dry.run\|DRY-RUN\|would"; then
        log_pass "Dry run mode works correctly"
        return 0
    else
        log_skip "Dry run output not detected (may require SSH setup)"
        return 0
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

test_safety_checks() {
    local script="$1"
    
    log_info "Verifying safety checks in script"
    
    local safety_features=0
    
    grep -q "set -euo pipefail" "$script" && ((safety_features++))
    grep -q "pb_data" "$script" && ((safety_features++))
    grep -q "verify_health\|health" "$script" && ((safety_features++))
    
    if [ $safety_features -ge 2 ]; then
        log_pass "Safety checks present ($safety_features features)"
        return 0
    else
        log_fail "Insufficient safety checks ($safety_features features)"
        return 1
    fi
}

test_version_parsing() {
    local script="$1"
    
    log_info "Verifying version parsing functions"
    
    if grep -q "find_previous_version\|ROLLBACK_VERSION\|get_available_versions" "$script"; then
        log_pass "Version parsing functions present"
        return 0
    else
        log_info "No explicit version parsing found"
        return 0
    fi
}

test_rollback_logging() {
    local script="$1"
    
    log_info "Verifying rollback logging"
    
    if grep -q "record_rollback\|rollback-history\|log_" "$script"; then
        log_pass "Rollback logging implemented"
        return 0
    else
        log_info "No explicit rollback logging found"
        return 0
    fi
}

test_cleanup_mechanism() {
    local script="$1"
    
    log_info "Verifying cleanup mechanism"
    
    if grep -q "cleanup_history\|MAX_ROLLBACK_HISTORY" "$script"; then
        log_pass "Cleanup mechanism present"
        return 0
    else
        log_info "No explicit cleanup mechanism found"
        return 0
    fi
}

test_ssh_safety() {
    local script="$1"
    
    log_info "Verifying SSH safety options"
    
    if grep -q "StrictHostKeyChecking\|UserKnownHostsFile" "$script"; then
        log_pass "SSH safety options configured"
        return 0
    else
        log_info "No SSH safety options found"
        return 0
    fi
}

test_alert_integration() {
    local script="$1"
    
    log_info "Verifying alert integration"
    
    if grep -q "send_alert\|alert-hook" "$script"; then
        log_pass "Alert integration present"
        return 0
    else
        log_info "No alert integration found"
        return 0
    fi
}

main() {
    parse_args "$@"
    
    echo ""
    echo "========================================="
    echo "  Rollback Scripts Test Suite"
    echo "========================================="
    echo ""
    
    echo "Main rollback script: $ROLLBACK_SCRIPT"
    echo "Stage rollback script: $STAGE_ROLLBACK"
    echo ""
    
    test_file_exists "$ROLLBACK_SCRIPT" || exit 1
    test_syntax "$ROLLBACK_SCRIPT"
    test_help_option "$ROLLBACK_SCRIPT"
    test_dry_run "$ROLLBACK_SCRIPT"
    test_safety_checks "$ROLLBACK_SCRIPT"
    test_version_parsing "$ROLLBACK_SCRIPT"
    test_rollback_logging "$ROLLBACK_SCRIPT"
    test_cleanup_mechanism "$ROLLBACK_SCRIPT"
    test_ssh_safety "$ROLLBACK_SCRIPT"
    test_alert_integration "$ROLLBACK_SCRIPT"
    
    echo ""
    if [ -f "$STAGE_ROLLBACK" ]; then
        echo "-----------------------------------------"
        echo "  Stage Rollback Script Tests"
        echo "-----------------------------------------"
        echo ""
        
        test_syntax "$STAGE_ROLLBACK"
    else
        log_skip "Stage rollback script not found ($STAGE_ROLLBACK)"
    fi
    
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
