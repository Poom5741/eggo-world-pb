#!/bin/bash
# Test OAuth Wallet Creation Flow (Phase 18)
# Simulates LINE OAuth user creation and verifies wallet is auto-created

set -e

PB_URL="${PB_URL:-http://localhost:8090}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-oauth-${TIMESTAMP}@line.eggo"
TEST_USERNAME="line_test_${TIMESTAMP}"
TEST_PASSWORD="TestPass123!"

echo "=== Phase 18: OAuth Wallet Creation Test ==="
echo "PocketBase URL: $PB_URL"
echo "Test email: $TEST_EMAIL"
echo ""

# Step 1: Create user (simulates OAuth flow)
echo "Step 1: Creating test user..."
CREATE_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections/users/records" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test OAuth User\",
    \"email\": \"$TEST_EMAIL\",
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"$TEST_PASSWORD\",
    \"passwordConfirm\": \"$TEST_PASSWORD\",
    \"emailVisibility\": false
  }")

echo "Create response: $CREATE_RESPONSE"
echo ""

# Extract user ID
USER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "❌ FAILED: Could not extract user ID from response"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✓ User created: $USER_ID"
echo ""

# Step 2: Verify wallet fields
echo "Step 2: Verifying wallet fields..."
WALLET=$(echo "$CREATE_RESPONSE" | grep -o '"wallet":"[^"]*"' | head -1 | cut -d'"' -f4)
DACC_PUBLIC_KEY=$(echo "$CREATE_RESPONSE" | grep -o '"daccPublickey":"[^"]*"' | head -1 | cut -d'"' -f4)
PIN=$(echo "$CREATE_RESPONSE" | grep -o '"pin":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Wallet: ${WALLET:-MISSING}"
echo "daccPublickey: ${DACC_PUBLIC_KEY:-MISSING}"
echo "PIN: ${PIN:+SET (hidden)}${PIN:-MISSING}"
echo ""

# Validate wallet format
if [ -z "$WALLET" ]; then
  echo "❌ FAILED: Wallet field is empty"
  exit 1
fi

if [[ ! "$WALLET" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
  echo "❌ FAILED: Wallet format invalid (expected 0x...): $WALLET"
  exit 1
fi

echo "✓ Wallet format valid: $WALLET"

# Validate daccPublickey format
if [ -z "$DACC_PUBLIC_KEY" ]; then
  echo "❌ FAILED: daccPublickey field is empty"
  exit 1
fi

if [[ ! "$DACC_PUBLIC_KEY" =~ ^daccPublickey_ ]]; then
  echo "❌ FAILED: daccPublickey format invalid (expected daccPublickey_...): $DACC_PUBLIC_KEY"
  exit 1
fi

echo "✓ daccPublickey format valid: ${DACC_PUBLIC_KEY:0:30}..."
echo ""

# Step 3: Test authentication
echo "Step 3: Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections/users/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{
    \"identity\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

AUTH_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ FAILED: Authentication failed"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "✓ Authentication successful, token received"
echo ""

# Step 4: Fetch user record to verify all fields
echo "Step 4: Fetching user record..."
USER_RESPONSE=$(curl -s "$PB_URL/api/collections/users/records/$USER_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "User record fields:"
echo "$USER_RESPONSE" | grep -o '"wallet":"[^"]*"' || echo "  wallet: MISSING"
echo "$USER_RESPONSE" | grep -o '"daccPublickey":"[^"]*"' || echo "  daccPublickey: MISSING"
echo "$USER_RESPONSE" | grep -o '"usdt_balance":[0-9]*' || echo "  usdt_balance: MISSING"
echo ""

# Summary
echo "=== TEST SUMMARY ==="
echo "✓ User created: $USER_ID"
echo "✓ Wallet: $WALLET"
echo "✓ daccPublickey: ${DACC_PUBLIC_KEY:0:30}..."
echo "✓ Authentication: Successful"
echo ""
echo "✅ ALL TESTS PASSED - OAuth wallet creation working correctly"
