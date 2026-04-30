#!/bin/bash
# =============================================================================
# Create E2E Test Users in PocketBase
# Phase 52: E2E Test Fixes (E2E-04)
#
# Creates test users needed for E2E journey tests.
# Password pattern: {username}_e2e_test_password
#
# Usage:
#   ./scripts/create-e2e-test-users.sh                # Default: localhost:8090
#   POCKETBASE_URL=https://pb.eggoworld.io ./scripts/create-e2e-test-users.sh
#   PB_ADMIN_EMAIL=admin@example.com ./scripts/create-e2e-test-users.sh
# =============================================================================

set -euo pipefail

POCKETBASE_URL="${POCKETBASE_URL:-http://localhost:8090}"
PB_ADMIN_EMAIL="${PB_ADMIN_EMAIL:-admin@example.com}"
PB_ADMIN_PASSWORD="${PB_ADMIN_PASSWORD:-}"
WALLET_API_URL="${WALLET_API_URL:-http://localhost:3001}"

if [ -z "$PB_ADMIN_PASSWORD" ]; then
  echo "Error: PB_ADMIN_PASSWORD environment variable is required"
  echo "Usage: PB_ADMIN_PASSWORD=your-password $0"
  exit 1
fi

echo "=== Creating E2E Test Users ==="
echo "PocketBase URL: $POCKETBASE_URL"
echo ""

# 1. Authenticate as admin
echo "[1/6] Authenticating as admin..."
ADMIN_RESPONSE=$(curl -s -X POST "$POCKETBASE_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$PB_ADMIN_EMAIL\",\"password\":\"$PB_ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token // empty')
if [ -z "$ADMIN_TOKEN" ]; then
  echo "Error: Failed to authenticate as admin"
  echo "Response: $ADMIN_RESPONSE"
  exit 1
fi
echo "  ✅ Authenticated successfully"

# 2. Define test users
declare -A USERS
USERS["test_buyer"]="Test Buyer User"
USERS["test_seller"]="Test Seller User"
USERS["test_referrer"]="Test Referrer User"
USERS["test_admin"]="Test Admin User"
USERS["test_buyer_poor"]="Test Buyer Poor (0 USDT)"

CREATED=0
EXISTING=0

echo ""
echo "[2/6] Creating/verifying test users..."

for USERNAME in "${!USERS[@]}"; do
  DISPLAY_NAME="${USERS[$USERNAME]}"
  PASSWORD="${USERNAME}_e2e_test_password"
  EMAIL="${USERNAME}@e2e.eggoworld.io"

  # Check if user already exists
  CHECK_RESPONSE=$(curl -s "$POCKETBASE_URL/api/collections/users/records?filter=(username='$USERNAME')" \
    -H "Authorization: $ADMIN_TOKEN")

  EXISTING_USER=$(echo "$CHECK_RESPONSE" | jq -r '.items[0].id // empty')

  if [ -n "$EXISTING_USER" ]; then
    echo "  ⏭️  $USERNAME ($DISPLAY_NAME) — already exists (ID: $EXISTING_USER)"
    EXISTING=$((EXISTING + 1))
    continue
  fi

  # Create user via PocketBase API
  CREATE_RESPONSE=$(curl -s -X POST "$POCKETBASE_URL/api/collections/users/records" \
    -H "Authorization: $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"$USERNAME\",
      \"email\": \"$EMAIL\",
      \"password\": \"$PASSWORD\",
      \"passwordConfirm\": \"$PASSWORD\",
      \"name\": \"$DISPLAY_NAME\",
      \"verified\": true
    }")

  USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id // empty')

  if [ -n "$USER_ID" ]; then
    echo "  ✅ $USERNAME ($DISPLAY_NAME) — created (ID: $USER_ID)"
    CREATED=$((CREATED + 1))
  else
    echo "  ❌ $USERNAME ($DISPLAY_NAME) — FAILED"
    echo "     Response: $CREATE_RESPONSE"
  fi
done

echo ""
echo "=== Summary ==="
echo "  Created: $CREATED users"
echo "  Existing: $EXISTING users"
echo "  Total: $((CREATED + EXISTING)) users"
echo ""

# 3. Create wallets for test users (via wallet-api)
echo "[3/6] Creating wallets for test users..."

for USERNAME in "${!USERS[@]}"; do
  # Get user ID
  USER_RESPONSE=$(curl -s "$POCKETBASE_URL/api/collections/users/records?filter=(username='$USERNAME')" \
    -H "Authorization: $ADMIN_TOKEN")

  USER_ID=$(echo "$USER_RESPONSE" | jq -r '.items[0].id // empty')
  USER_WALLET=$(echo "$USER_RESPONSE" | jq -r '.items[0].wallet // empty')

  if [ -z "$USER_ID" ]; then
    echo "  ⚠️  $USERNAME — not found, skipping wallet creation"
    continue
  fi

  if [ -n "$USER_WALLET" ] && [ "$USER_WALLET" != "null" ]; then
    echo "  ⏭️  $USERNAME — wallet already exists: $USER_WALLET"
    continue
  fi

  # Create wallet via wallet-api
  PASSWORD="${USERNAME}_e2e_test_password"
  WALLET_RESPONSE=$(curl -s -X POST "$WALLET_API_URL/api/v1/wallet/create" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$USER_ID\",\"passwordSecretkey\":\"$PASSWORD\",\"publicEncryption\":false}")

  WALLET_ADDRESS=$(echo "$WALLET_RESPONSE" | jq -r '.data.address // empty')

  if [ -n "$WALLET_ADDRESS" ]; then
    echo "  ✅ $USERNAME — wallet created: $WALLET_ADDRESS"
  else
    echo "  ❌ $USERNAME — wallet creation FAILED"
    echo "     Response: $WALLET_RESPONSE"
  fi
done

echo ""
echo "[4/6] Done! Test users are ready for E2E testing."
echo ""
echo "Connection details:"
echo "  PocketBase URL: $POCKETBASE_URL"
echo "  Password pattern: {username}_e2e_test_password"
echo ""
echo "Test users:"
for USERNAME in "${!USERS[@]}"; do
  echo "  - $USERNAME (${USERS[$USERNAME]})"
done
