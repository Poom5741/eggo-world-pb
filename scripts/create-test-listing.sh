#!/bin/bash

PB_URL="https://pb.eggoworld.io"
ADMIN_EMAIL="admin@eggo.local"
ADMIN_PASSWORD="admin123"

# Step 1: Get admin auth token
echo "Authenticating as admin..."
AUTH_RESPONSE=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to authenticate. Response: $AUTH_RESPONSE"
  exit 1
fi

echo "Admin token obtained: ${ADMIN_TOKEN:0:20}..."

# Step 2: Get first user ID to use as seller
echo "Getting first user..."
USERS_RESPONSE=$(curl -s "$PB_URL/api/collections/users/records?page=1&perPage=1" \
  -H "Authorization: $ADMIN_TOKEN")

USER_ID=$(echo $USERS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "No users found. Creating test listing with placeholder user ID..."
  USER_ID="test_user_id"
fi

echo "Using user ID: $USER_ID"

# Step 3: Create test listing
echo "Creating test listing..."
LISTING_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections/marketplace_listings/records" \
  -H "Authorization: $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"nft_id\": \"test_egg_001\",
    \"nft_type\": \"Egg\",
    \"name\": \"Test Golden Egg #1\",
    \"description\": \"Test listing for Buy Now flow verification\",
    \"rarity\": \"Legendary\",
    \"price\": 25.00,
    \"price_symbol\": \"USDT\",
    \"seller\": \"$USER_ID\",
    \"seller_name\": \"Test Seller\",
    \"image_url\": \"https://via.placeholder.com/300x300/FFD700/000000?text=Golden+Egg\",
    \"status\": \"active\"
  }")

echo "Listing created:"
echo $LISTING_RESPONSE | python3 -m json.tool 2>/dev/null || echo $LISTING_RESPONSE

# Extract listing ID
LISTING_ID=$(echo $LISTING_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo ""
echo "=========================================="
echo "Test Listing ID: $LISTING_ID"
echo "=========================================="
echo ""
echo "Test the Buy Now endpoint with:"
echo "curl -X POST $PB_URL/api/v2/marketplace/buy -H 'Content-Type: application/json' -d '{\"listing_id\":\"$LISTING_ID\"}'"
echo ""
