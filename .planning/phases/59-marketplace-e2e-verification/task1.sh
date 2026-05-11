#!/bin/bash
# Task 1: Environment setup for Phase 59

set -e

echo "=== Step 1: Get PB Admin Token ==="
PB_TOKEN=$(curl -s -X POST http://localhost:8090/api/admins/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@eggo.local","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token obtained: ${PB_TOKEN:0:20}..."

echo ""
echo "=== Users in PocketBase ==="
curl -s "http://localhost:8090/api/collections/users/records?page=1&perPage=20" \
  -H "Authorization: Bearer $PB_TOKEN" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for i in data.get('items',[]):
    print(f'  ID: {i[\"id\"][:20]:20} | Name: {i.get(\"name\",\"?\")}'  )
print(f'Total: {len(data.get(\"items\",[]))} users')
"

echo ""
echo "=== User Wallets ==="
curl -s "http://localhost:8090/api/collections/user_wallets/records?page=1&perPage=20" \
  -H "Authorization: Bearer $PB_TOKEN" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for i in data.get('items',[]):
    print(f'  User: {i.get(\"user_id\",\"?\")[:20]:20} | Wallet: {i.get(\"wallet_address\",\"no-wallet\"):42} | USDT: {i.get(\"usdt_balance\",0)}')
print(f'Total: {len(data.get(\"items\",[]))} wallets')
"

echo ""
echo "=== MOCK_BLOCKCHAIN check ==="
docker exec eggo-pocketbase-pb-1 sh -c 'echo "MOCK_BLOCKCHAIN=${MOCK_BLOCKCHAIN:-unset}"' 2>/dev/null || echo "Cannot check Docker env - check manually"

echo ""
echo "=== Task 1 Complete ==="
