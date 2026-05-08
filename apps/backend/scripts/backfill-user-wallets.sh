#!/bin/bash
# Backfill user_wallets for existing users
# Run on server: bash backfill-user-wallets.sh

PB_URL="http://localhost:8090"
ADMIN_EMAIL="admin@eggo.local"
ADMIN_PASS="admin123"

echo "=== Backfill user_wallets records ==="
echo "PocketBase URL: $PB_URL"

# Login (PocketBase 0.23+)
echo "Logging in..."
AUTH_RESPONSE=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity":"'"$ADMIN_EMAIL"'","password":"'"$ADMIN_PASS"'"}')

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "✗ Login failed"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "✓ Admin authenticated"

# Get all users with wallets
echo ""
echo "Fetching users with wallets..."
USERS_RESPONSE=$(curl -s "$PB_URL/api/collections/users/records?perPage=500&filter=wallet%20!%3D%20%22%22" \
  -H "Authorization: $TOKEN")

TOTAL=$(echo "$USERS_RESPONSE" | grep -o '"totalItems":[0-9]*' | cut -d':' -f2)
echo "Found $TOTAL users with wallets"

# Extract user IDs and wallets
USER_IDS=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
USER_WALLETS=$(echo "$USERS_RESPONSE" | grep -o '"wallet":"[^"]*"' | cut -d'"' -f4)

CREATED=0
SKIPPED=0
ERRORS=0

# Process each user
paste <(echo "$USER_IDS") <(echo "$USER_WALLETS") | while IFS=$'\t' read -r USER_ID WALLET; do
  # Check if user_wallets already exists
  CHECK=$(curl -s "$PB_URL/api/collections/user_wallets/records?filter=user_id%3D%22$USER_ID%22" \
    -H "Authorization: $TOKEN")
  
  EXISTS=$(echo "$CHECK" | grep -o '"totalItems":[0-9]*' | cut -d':' -f2)
  
  if [ "$EXISTS" != "0" ] && [ -n "$EXISTS" ]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi
  
  # Create user_wallets record
  RESULT=$(curl -s -X POST "$PB_URL/api/collections/user_wallets/records" \
    -H "Authorization: $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"user_id\":\"$USER_ID\",\"wallet_address\":\"$WALLET\",\"usdt_balance\":0,\"total_earned\":0,\"total_spent\":0,\"total_withdrawn\":0}")
  
  if echo "$RESULT" | grep -q '"id"'; then
    CREATED=$((CREATED + 1))
    echo "✓ Created user_wallets for user ${USER_ID:0:8}..."
  else
    ERRORS=$((ERRORS + 1))
    echo "✗ Failed for user ${USER_ID:0:8}..."
  fi
done

echo ""
echo "=== Backfill Complete ==="
echo "Check logs above for counts"
