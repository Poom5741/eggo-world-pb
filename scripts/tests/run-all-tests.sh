#!/bin/bash
# Run all verification tests for Eggo PocketBase deployment
# Usage: ./scripts/tests/run-all-tests.sh [--verbose] [--mock]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TEST_FILES=(
    "$SCRIPT_DIR/test-deploy-scripts.sh"
    "$SCRIPT_DIR/test-health-checks.sh"
    "$SCRIPT_DIR/test-rollback.sh"
)

RESULTS=()
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0
VERBOSE=false
MOCK_MODE=false

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
                echo "Usage: $0 [--verbose] [--mock]"
                echo ""
                echo "Options:"
                echo "  --verbose    Show detailed output from all tests"
                echo "  --mock       Run tests in mock mode (safe for CI)"
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

run_test_suite() {
    local test_file="$1"
    local test_name
    test_name=$(basename "$test_file" .sh)
    
    echo ""
    echo "========================================="
    echo "  Running: $test_name"
    echo "========================================="
    echo ""
    
    local args=()
    if [ "$VERBOSE" = true ]; then
        args+=("--verbose")
    fi
    if [ "$MOCK_MODE" = true ] && [[ "$test_file" == *"deploy-scripts"* ]]; then
        args+=("--mock")
    fi
    
    local exit_code=0
    local start_time
    start_time=$(date +%s)
    
    if "$test_file" "${args[@]+"${args[@]}"}" 2>&1; then
        exit_code=0
    else
        exit_code=$?
    fi
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        RESULTS+=("  ${GREEN}✓${NC} $test_name (${duration}s)")
        ((TOTAL_PASSED++))
        return 0
    elif [ $exit_code -eq 1 ]; then
        RESULTS+=("  ${RED}✗${NC} $test_name (${duration}s)")
        ((TOTAL_FAILED++))
        return 1
    else
        RESULTS+=("  ${YELLOW}⊘${NC} $test_name (${duration}s)")
        ((TOTAL_SKIPPED++))
        return 0
    fi
}

check_prerequisites() {
    local missing_tools=()
    
    for tool in bash curl grep find stat; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo -e "${RED}Missing required tools: ${missing_tools[*]}${NC}"
        return 1
    fi
    
    return 0
}

validate_test_files() {
    local missing_files=()
    
    for test_file in "${TEST_FILES[@]}"; do
        if [ ! -f "$test_file" ]; then
            missing_files+=("$test_file")
        elif [ ! -x "$test_file" ]; then
            echo -e "${YELLOW}Warning: Not executable: $test_file${NC}"
            echo -e "${YELLOW}Run: chmod +x $test_file${NC}"
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        echo -e "${RED}Missing test files:${NC}"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
    
    echo -e "${GREEN}✓ All test files found${NC}"
    return 0
}

main() {
    parse_args "$@"
    
    echo ""
    echo "========================================="
    echo "  Eggo PocketBase Test Suite Runner"
    echo "========================================="
    echo ""
    echo "Project: $PROJECT_ROOT"
    echo "Test directory: $SCRIPT_DIR"
    echo "Verbose: $VERBOSE"
    echo "Mock mode: $MOCK_MODE"
    echo ""
    
    echo -e "${BLUE}Checking prerequisites...${NC}"
    if ! check_prerequisites; then
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}Validating test files...${NC}"
    if ! validate_test_files; then
        echo ""
        echo -e "${RED}TEST SETUP FAILED${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}Running test suites...${NC}"
    
    for test_file in "${TEST_FILES[@]}"; do
        run_test_suite "$test_file" || true
    done
    
    echo ""
    echo "========================================="
    echo "  Final Results"
    echo "========================================="
    echo ""
    
    for result in "${RESULTS[@]}"; do
        echo -e "$result"
    done
    
    echo ""
    echo "-----------------------------------------"
    echo -e "  ${GREEN}Passed:${NC}   $TOTAL_PASSED"
    echo -e "  ${RED}Failed:${NC}   $TOTAL_FAILED"
    echo -e "  ${YELLOW}Skipped:${NC}  $TOTAL_SKIPPED"
    echo "-----------------------------------------"
    echo ""
    
    if [ $TOTAL_FAILED -gt 0 ]; then
        echo -e "${RED}❌ TESTS FAILED${NC}"
        echo ""
        echo "Failed test suites:"
        for result in "${RESULTS[@]}"; do
            if echo "$result" | grep -q "✗"; then
                echo "  $result"
            fi
        done
        echo ""
        echo "Review the output above for details."
        exit 1
    else
        echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
        echo ""
        echo "All deployment verification tests completed successfully."
        exit 0
    fi
}

main "$@"
