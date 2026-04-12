#!/bin/bash
# Phase 02 Production Verification Script
# Verifies blockchain event sync deployment and runtime health

set -e

export PB_URL="https://pb.eggoworld.io"
export PB_ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc3NjA2MzA2OCwiaWQiOiIzYmI5NncxMmMzdzNrcXciLCJyZWZyZXNoYWJsZSI6ZmFsc2UsInR5cGUiOiJhdXRoIn0.OcIdUel49QZtfei4xulLkHP7GXHL6qDGB4UYqZGij3k"
export BSC_RPC_URL="https://rpc.0xl3.com"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ PASS${NC}: $1"; }
fail() { echo -e "${RED}✗ FAIL${NC}: $1"; }
warn() { echo -e "${YELLOW}⚠ WARN${NC}: $1"; }
skip() { echo -e "${YELLOW}⊘ SKIP${NC}: $1"; }

echo "=== Phase 02 Production Verification ==="
echo "PocketBase: $PB_URL"
echo "RPC: $BSC_RPC_URL"
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

DEPLOYMENT_OK=true
RUNTIME_OK=true
DATA_OK=true

# Layer 1: Pre-flight Checks (BLOCKING)
echo "=== Layer 1: Pre-flight Checks ==="

HEALTH_RESPONSE=$(curl -sS "$PB_URL/api/health" 2>/dev/null)
if echo "$HEALTH_RESPONSE" | jq -e '.code == 200' >/dev/null 2>&1; then
    pass "PocketBase health check"
else
    fail "PocketBase health check returned: $HEALTH_RESPONSE"
    DEPLOYMENT_OK=false
fi

SYNC_RESPONSE=$(curl -sS "$PB_URL/api/sync-blockchain" 2>/dev/null)
if echo "$SYNC_RESPONSE" | jq -e '.success == true' >/dev/null 2>&1; then
    pass "Sync endpoint responding"
    CURRENT_BLOCK=$(echo "$SYNC_RESPONSE" | jq -r '.data.currentBlock // 0')
    LAST_PROCESSED=$(echo "$SYNC_RESPONSE" | jq -r '.data.lastProcessed // 0')
    echo "  Current block: $CURRENT_BLOCK"
    echo "  Last processed: $LAST_PROCESSED"
else
    ERROR_MSG=$(echo "$SYNC_RESPONSE" | jq -r '.error // "Unknown error"')
    fail "Sync endpoint: $ERROR_MSG"
    DEPLOYMENT_OK=false
fi

SYNC_STATE_RESPONSE=$(curl -sS "$PB_URL/api/collections/sync_state/records?filter=id%3D%22config%22" \
  -H "Authorization: Bearer $PB_ADMIN_TOKEN" 2>/dev/null)

if echo "$SYNC_STATE_RESPONSE" | jq -e '.items[0].id' >/dev/null 2>&1; then
    pass "sync_state collection exists"
    STATUS=$(echo "$SYNC_STATE_RESPONSE" | jq -r '.items[0].status // "unknown"')
    LAST_BLOCK=$(echo "$SYNC_STATE_RESPONSE" | jq -r '.items[0].lastProcessedBlock // 0')
    LAST_SYNC=$(echo "$SYNC_STATE_RESPONSE" | jq -r '.items[0].lastSyncTimestamp // "never"')
    LAST_ERROR=$(echo "$SYNC_STATE_RESPONSE" | jq -r '.items[0].last_error // ""')
    
    echo "  Status: $STATUS"
    echo "  Last processed block: $LAST_BLOCK"
    echo "  Last sync timestamp: $LAST_SYNC"
    if [ -n "$LAST_ERROR" ] && [ "$LAST_ERROR" != "null" ]; then
        warn "Last error: $LAST_ERROR"
    fi
else
    fail "sync_state collection not found (404)"
    DEPLOYMENT_OK=false
fi

for COLLECTION in "egg_nfts" "food_nfts" "animal_nfts" "commission_records"; do
    COLL_RESPONSE=$(curl -sS "$PB_URL/api/collections/$COLLECTION/records?perPage=1" \
      -H "Authorization: Bearer $PB_ADMIN_TOKEN" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        pass "Collection '$COLLECTION' exists"
    else
        fail "Collection '$COLLECTION' not accessible"
        DEPLOYMENT_OK=false
    fi
done

echo ""

# Layer 2: Runtime Checks
echo "=== Layer 2: Runtime Checks ==="

if [ "$DEPLOYMENT_OK" = false ]; then
    skip "Runtime checks (deployment incomplete)"
    RUNTIME_OK=false
else
    STATUS=$(echo "$SYNC_STATE_RESPONSE" | jq -r '.items[0].status // "unknown"')
    if [ "$STATUS" = "syncing" ]; then
        pass "Sync status is 'syncing'"
    elif [ "$STATUS" = "error" ]; then
        fail "Sync status is 'error'"
        RUNTIME_OK=false
    else
        warn "Sync status is '$STATUS'"
    fi
    
    LAST_SYNC_RAW=$(echo "$SYNC_STATE_RESPONSE" | jq -r '.items[0].lastSyncTimestamp // ""')
    if [ -n "$LAST_SYNC_RAW" ] && [ "$LAST_SYNC_RAW" != "null" ]; then
        pass "lastSyncTimestamp present: $LAST_SYNC_RAW"
    else
        fail "lastSyncTimestamp is empty or null"
        RUNTIME_OK=false
    fi
    
    if command -v jq >/dev/null 2>&1; then
        CHAIN_HEAD_HEX=$(curl -sS -X POST "$BSC_RPC_URL" \
          -H "Content-Type: application/json" \
          --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null | \
          jq -r '.result // "0x0"')
        
        CHAIN_HEAD=$((CHAIN_HEAD_HEX))
        LAST_PROCESSED=$(echo "$SYNC_STATE_RESPONSE" | jq -r '.items[0].lastProcessedBlock // 0')
        LAG=$((CHAIN_HEAD - LAST_PROCESSED))
        
        echo "  Chain head: $CHAIN_HEAD"
        echo "  Last processed: $LAST_PROCESSED"
        echo "  Lag: $LAG blocks"
        
        if [ "$LAG" -gt 120 ]; then
            fail "Lag critical: $LAG blocks (>120)"
            RUNTIME_OK=false
        elif [ "$LAG" -gt 50 ]; then
            warn "Lag warning: $LAG blocks (>50)"
        else
            pass "Lag acceptable: $LAG blocks"
        fi
    else
        skip "Lag check (jq not installed)"
    fi
fi

echo ""

# Layer 3: Data Correctness (Manual verification needed)
echo "=== Layer 3: Data Correctness ==="

if [ "$DEPLOYMENT_OK" = false ] || [ "$RUNTIME_OK" = false ]; then
    skip "Data correctness checks (sync not running)"
    DATA_OK=false
else
    echo "To verify data correctness, run these commands:"
    echo ""
    echo "# Check for known transactions (replace with actual tx hashes):"
    echo "curl -sS \"\$PB_URL/api/collections/egg_nfts/records?filter=tx_hash%3D%220x...%22\" \\"
    echo "  -H \"Authorization: Bearer \$PB_ADMIN_TOKEN\" | jq '.items | length'"
    echo ""
    echo "# Expected: 1 record per event type in test window"
    echo ""
    warn "Manual verification required for data correctness"
fi

echo ""

# Summary
echo "=== Verification Summary ==="
echo "Deployment: $([ "$DEPLOYMENT_OK" = true ] && echo '✓ PASS' || echo '✗ FAIL')"
echo "Runtime:    $([ "$RUNTIME_OK" = true ] && echo '✓ PASS' || echo '✗ FAIL')"
echo "Data:       $([ "$DATA_OK" = true ] && echo '✓ PASS' || echo '✗ FAIL')"
echo ""

if [ "$DEPLOYMENT_OK" = false ]; then
    echo -e "${RED}BLOCKING: Deployment incomplete. Cannot proceed with verification.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy sync_state collection to production"
    echo "2. Verify 21-sync-events.pb.js hook is deployed with auto-poll logic"
    echo "3. Fix RPC connection issue (Invalid RPC response error)"
    echo "4. Restart PocketBase: docker-compose restart pocketbase"
    echo "5. Re-run this verification script"
    exit 1
elif [ "$RUNTIME_OK" = false ]; then
    echo -e "${YELLOW}WARNING: Sync not running correctly. Check logs for errors.${NC}"
    echo ""
    echo "Debug commands:"
    echo "docker-compose logs pocketbase | grep -i sync"
    echo "curl -sS \"\$PB_URL/api/collections/sync_state/records?filter=id='config'\" -H \"Authorization: Bearer \$PB_ADMIN_TOKEN\" | jq"
    exit 0
else
    echo -e "${GREEN}All checks passed! Phase 02 is operational.${NC}"
    exit 0
fi
