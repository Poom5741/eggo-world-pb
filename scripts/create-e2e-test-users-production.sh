#!/bin/bash
# Create E2E test users in production PocketBase
# Run from production server: bash create-e2e-test-users.sh

POCKETBASE_URL="http://localhost:8090"
ADMIN_EMAIL="admin@eggoworld.io"
ADMIN_PASSWORD="admin_password_here"  # You'll need to set this

echo "🚀 Creating E2E test users in production PocketBase"
echo "📍 URL: $POCKETBASE_URL"
echo ""

# First, authenticate as admin
echo "🔐 Authenticating as admin..."
ADMIN_TOKEN=$(curl -s -X POST "$POCKETBASE_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Admin authentication failed!"
  echo "Please update ADMIN_EMAIL and ADMIN_PASSWORD in this script"
  exit 1
fi

echo "✅ Admin authenticated"
echo ""

# Test users to create
declare -a EMAILS=(
  "test_buyer@e2e.eggoworld.io"
  "test_seller@e2e.eggoworld.io"
  "test_referrer@e2e.eggoworld.io"
  "test_admin@e2e.eggoworld.io"
  "test_buyer_poor@e2e.eggoworld.io"
)

declare -a PASSWORDS=(
  "test_buyer_e2e_test_password"
  "test_seller_e2e_test_password"
  "test_referrer_e2e_test_password"
  "test_admin_e2e_test_password"
  "test_buyer_poor_e2e_test_password"
)

declare -a USERNAMES=(
  "test_buyer"
  "test_seller"
  "test_referrer"
  "test_admin"
  "test_buyer_poor"
)

declare -a WALLETS=(
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  "0x15d34AAf54267DB7D7c367839Aaf71A00a2C6A65"
)

# Create or update each test user
for i in "${!EMAILS[@]}"; do
  EMAIL="${EMAILS[$i]}"
  PASSWORD="${PASSWORDS[$i]}"
  USERNAME="${USERNAMES[$i]}"
  WALLET="${WALLETS[$i]}"
  
  echo "📝 Processing: $EMAIL"
  
  # Check if user already exists
  EXISTING_ID=$(curl -s "$POCKETBASE_URL/api/collections/users/records?filter=(email='$EMAIL')" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$EXISTING_ID" ]; then
    echo "  ⚠️  User exists (ID: $EXISTING_ID), updating..."
    
    # Update existing user
    RESPONSE=$(curl -s -X PATCH "$POCKETBASE_URL/api/collections/users/records/$EXISTING_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"password\": \"$PASSWORD\",
        \"passwordConfirm\": \"$PASSWORD\",
        \"wallet\": \"$WALLET\"
      }")
    
    if echo "$RESPONSE" | grep -q '"id"'; then
      echo "  ✅ Updated: $EMAIL"
    else
      echo "  ❌ Failed to update: $RESPONSE"
    fi
  else
    echo "  ➕ Creating new user..."
    
    # Create new user
    RESPONSE=$(curl -s -X POST "$POCKETBASE_URL/api/collections/users/records" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\",
        \"passwordConfirm\": \"$PASSWORD\",
        \"username\": \"$USERNAME\",
        \"wallet\": \"$WALLET\",
        \"emailVisibility\": true
      }")
    
    if echo "$RESPONSE" | grep -q '"id"'; then
      echo "  ✅ Created: $EMAIL"
    else
      echo "  ❌ Failed to create: $RESPONSE"
    fi
  fi
  
  echo ""
done

echo "🎉 Test user creation complete!"
echo ""
echo "📋 Test User Summary:"
echo "┌─────────────────────────────────────────────────────────────────┐"
for i in "${!EMAILS[@]}"; do
  echo "│ Email:    ${EMAILS[$i]}" | awk '{printf "│ %-63s│\n", $0}' | sed 's/^│ Email:    /│ Email:    /'
  echo "│ Password: ${PASSWORDS[$i]}" | awk '{printf "│ %-63s│\n", $0}' | sed 's/^│ Password: /│ Password: /'
  echo "│ Wallet:   ${WALLETS[$i]}" | awk '{printf "│ %-63s│\n", $0}' | sed 's/^│ Wallet:   /│ Wallet:   /'
  echo "├─────────────────────────────────────────────────────────────────┤"
done
echo "└─────────────────────────────────────────────────────────────────┘"
