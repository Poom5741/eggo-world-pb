#!/bin/bash
# Test LINE OAuth2 flow with PocketBase

# Configuration
POCKETBASE_URL="http://localhost:8090"
LINE_CLIENT_ID="2009441873"
LINE_CLIENT_SECRET="4ede94afa7d59b71ffda15a136ffddea"
REDIRECT_URI="http://localhost:8090/api/oauth2-redirect"

echo "=== LINE OAuth2 Flow Test ==="
echo ""

# Step 1: Get auth methods from PocketBase
echo "Step 1: Getting OAuth2 auth methods..."
AUTH_METHODS=$(curl -s "$POCKETBASE_URL/api/collections/users/auth-methods")
echo "$AUTH_METHODS" | python3 -m json.tool 2>/dev/null | head -30

# Extract the auth URL
AUTH_URL=$(echo "$AUTH_METHODS" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('authProviders', [{}])[0].get('authURL', ''))" 2>/dev/null)

echo ""
echo "Step 2: Authorization URL from PocketBase:"
echo "$AUTH_URL"
echo ""

# Check if redirect_uri is present
if [[ "$AUTH_URL" == *"redirect_uri="* ]]; then
    echo "✓ redirect_uri parameter found in URL"
    # Check if it has a value
    if [[ "$AUTH_URL" == *"redirect_uri=http"* ]]; then
        echo "✓ redirect_uri has a value"
    else
        echo "✗ redirect_uri is empty - this is the problem!"
        echo ""
        echo "The redirect_uri should be: $REDIRECT_URI"
        echo ""
        echo "This means PocketBase is not configured with the correct base URL."
        echo "Try these steps:"
        echo "1. In Admin UI, go to Settings"
        echo "2. Make sure 'App URL' is set to: $POCKETBASE_URL"
        echo "3. Save settings"
        echo "4. Try OAuth2 login again"
    fi
else
    echo "✗ redirect_uri parameter not found"
fi

echo ""
echo "Step 3: Testing LINE token endpoint directly..."
# Test with an invalid code to verify credentials
TOKEN_RESPONSE=$(curl -s -X POST "https://api.line.me/oauth2/v2.1/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=invalid_test_code" \
  -d "redirect_uri=$REDIRECT_URI" \
  -d "client_id=$LINE_CLIENT_ID" \
  -d "client_secret=$LINE_CLIENT_SECRET")

echo "Token response: $TOKEN_RESPONSE"

if echo "$TOKEN_RESPONSE" | grep -q "invalid_grant"; then
    echo "✓ LINE credentials are valid (got expected 'invalid_grant' error)"
elif echo "$TOKEN_RESPONSE" | grep -q "invalid_client"; then
    echo "✗ LINE credentials are invalid (got 'invalid_client' error)"
else
    echo "? Unexpected response"
fi

echo ""
echo "=== Test Complete ==="
