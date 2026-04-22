#!/bin/bash
# Quick fix: Check which users don't have user_wallets records
# This script queries PocketBase via its internal API

PB_URL="http://localhost:8090"

echo "=== Checking user_wallets status ==="

# Try to get users count
USERS=$(curl -s "$PB_URL/api/collections/users/records?perPage=1" 2>/dev/null)
if [ -n "$USERS" ]; then
  echo "✓ PocketBase is accessible"
  TOTAL_USERS=$(echo "$USERS" | grep -o '"totalItems":[0-9]*' | cut -d':' -f2)
  echo "Total users: ${TOTAL_USERS:-unknown}"
else
  echo "✗ Cannot reach PocketBase API"
  exit 1
fi

echo ""
echo "IMPORTANT: To backfill user_wallets records, you need to:"
echo "1. Open PocketBase Admin UI: http://localhost:8090/_/"
echo "2. Login with: admin@eggo.local / admin123"
echo "3. Go to 'users' collection"
echo "4. For each user with a 'wallet' field but no matching user_wallets record:"
echo "   - Create a new record in 'user_wallets' collection"
echo "   - Set user_id = user's ID"
echo "   - Set wallet_address = user's wallet field value"
echo "   - Set usdt_balance, total_earned = user's values or 0"
echo ""
echo "OR run this command for EACH user (replace IDs):"
echo "curl -X POST http://localhost:8090/api/collections/user_wallets/records \\"
echo "  -H 'Authorization: YOUR_ADMIN_TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"user_id\":\"USER_ID\",\"wallet_address\":\"WALLET_ADDR\",\"usdt_balance\":0,\"total_earned\":0,\"total_spent\":0,\"total_withdrawn\":0}'"
