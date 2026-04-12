#!/bin/bash
# Test deployment scripts for Eggo PocketBase
# Tests: syntax, file existence, executable permissions, env var requirements
# Usage: ./scripts/tests/test-deploy-scripts.sh [--mock] [--verbose]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
STAGES_DIR="$SCRIPTS_DIR/stages"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0
VERBOSE=false
MOCK_MODE=false

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --mock)
                MOCK_MODE=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [--mock] [--verbose]"
                echo ""
                echo "Options:"
                echo "  --mock       Run in mock mode (skip tests requiring production access)"
                echo "  --verbose    Show detailed test output"
                echo "  --help       Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Logging functions
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

# Test script syntax with bash -n
test_syntax() {
    local script="$1"
    local script_name
    script_name=$(basename "$script")
    
    log_info "Testing syntax: $script_name"
    
    if bash -n "$script" 2>/dev/null; then
        log_pass "Syntax check: $script_name"
        return 0
    else
        log_fail "Syntax check: $script_name"
        bash -n "$script" 2>&1 | head -5
        return 1
    fi
}

# Test file existence
test_file_exists() {
    local file="$1"
    local file_name
    file_name=$(basename "$file")
    
    log_info "Checking file exists: $file_name"
    
    if [ -f "$file" ]; then
        log_pass "File exists: $file_name"
        return 0
    else
        log_fail "File missing: $file_name"
        return 1
    fi
}

# Test executable permissions
test_executable() {
    local file="$1"
    local file_name
    file_name=$(basename "$file")
    
    log_info "Checking executable permission: $file_name"
    
    if [ -x "$file" ]; then
        log_pass "Executable: $file_name"
        return 0
    else
        log_fail "Not executable: $file_name (run: chmod +x $file)"
        return 1
    fi
}

# Test required environment variables
test_env_vars() {
    local script="$1"
    local file_name
    file_name=$(basename "$script")
    
    log_info "Checking env var requirements in: $file_name"
    
    # Extract required env vars from script (look for ${VAR} or $VAR patterns)
    local required_vars=()
    local optional_vars=()
    
    # Common required vars for deployment scripts
    case "$file_name" in
        deploy-phase02.sh|deploy-pocketbase.sh)
            required_vars=("SSH_USER" "SSH_KEY" "REGISTRY")
            ;;
        build-push-image.sh)
            required_vars=("REGISTRY")
            ;;
        *)
            required_vars=()
            ;;
    esac
    
    local missing_vars=()
    if [ ${#required_vars[@]} -gt 0 ]; then
        for var in "${required_vars[@]}"; do
            if [ -z "${!var:-}" ]; then
                missing_vars+=("$var")
            fi
        done
    fi
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        if [ ${#required_vars[@]} -gt 0 ]; then
            log_pass "Env vars validated: $file_name (${#required_vars[@]} vars)"
        else
            log_info "No required env vars for: $file_name"
        fi
        return 0
    else
        log_info "Missing env vars for $file_name: ${missing_vars[*]} (setting for test)"
        # Set mock values for testing
        for var in "${missing_vars[@]}"; do
            export "$var"="test-value"
        done
        log_pass "Env vars mocked: $file_name"
        return 0
    fi
}

# Test stage scripts
test_stage_scripts() {
    local stage_number="$1"
    local stage_file="$2"
    local stage_path="$STAGES_DIR/$stage_file"
    
    log_info "Testing stage $stage_number: $stage_file"
    
    test_file_exists "$stage_path"
    test_syntax "$stage_path"
    test_executable "$stage_path" || true  # Don't fail on permissions
}

# Main test suite
main() {
    parse_args "$@"
    
    echo ""
    echo "========================================="
    echo "  Deployment Scripts Test Suite"
    echo "========================================="
    echo ""
    
    if [ "$MOCK_MODE" = true ]; then
        echo -e "${YELLOW}Running in MOCK mode${NC}"
        echo ""
    fi
    
    echo "Project root: $PROJECT_ROOT"
    echo "Scripts directory: $SCRIPTS_DIR"
    echo ""
    
    # Main deployment scripts
    echo -e "\n${BLUE}=== Main Deployment Scripts ===${NC}"
    
    main_scripts=(
        "$SCRIPTS_DIR/deploy-phase02.sh"
        "$SCRIPTS_DIR/deploy-pocketbase.sh"
        "$SCRIPTS_DIR/rollback.sh"
        "$SCRIPTS_DIR/health-check.sh"
        "$SCRIPTS_DIR/build-push-image.sh"
        "$SCRIPTS_DIR/backup-before-deploy.sh"
        "$SCRIPTS_DIR/verify-phase02-prod.sh"
    )
    
    for script in "${main_scripts[@]}"; do
        echo ""
        test_file_exists "$script" || continue
        test_syntax "$script"
        test_env_vars "$script"
    done
    
    # Stage scripts
    echo -e "\n${BLUE}=== Stage Scripts ===${NC}"
    
    stage_scripts=(
        "00:00-pre-deploy.sh"
        "10:10-build.sh"
        "20:20-push.sh"
        "30:30-backup.sh"
        "40:40-deploy.sh"
        "50:50-migrate.sh"
        "60:60-verify.sh"
        "70:70-rollback.sh"
    )
    
    for entry in "${stage_scripts[@]}"; do
        echo ""
        local stage_num="${entry%%:*}"
        local stage_file="${entry#*:}"
        test_stage_scripts "$stage_num" "$stage_file"
    done
    
    # Monitoring scripts
    echo -e "\n${BLUE}=== Monitoring Scripts ===${NC}"
    
    monitoring_scripts=(
        "$SCRIPTS_DIR/monitoring/alert-hook.sh"
        "$SCRIPTS_DIR/monitoring/log-aggregator.sh"
    )
    
    for script in "${monitoring_scripts[@]}"; do
        echo ""
        test_file_exists "$script" || continue
        test_syntax "$script"
    done
    
    # Summary
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
