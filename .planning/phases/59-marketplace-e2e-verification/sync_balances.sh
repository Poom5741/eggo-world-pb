#!/bin/bash
PB_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc3ODQ4Mzc3NiwiaWQiOiJuNjR3Yzdvc3dwa2wxeTkiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.jWw2CiYxMQDfiU3HRqsYQ1GcoYwUyUquFO4z8C-SvUQ"

echo "=== Getting user_wallet records ==="
curl -s "http://localhost:8090/api/collections/user_wallets/records?page=1&perPage=20" \
  -H "Authorization: Bearer $PB_TOKEN" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for i in data.get('items',[]):
    uid = i.get('user_id','')
    wa = i.get('wallet_address','')
    bal = i.get('usdt_balance',0)
    rid = i['id']
    print(f'{rid}: user={uid[:16]} wallet={wa[:20]}... bal={bal}')
"

echo ""
echo "=== Updating USDT balances ==="

# We need to update by record ID, not user_id
# Get all records and update the ones we need
python3 -c "
import json, urllib.request, sys

tok = '$PB_TOKEN'
base = 'http://localhost:8090/api/collections/user_wallets'

# Fetch all
req = urllib.request.Request(f'{base}/records?page=1&perPage=20')
req.add_header('Authorization', f'Bearer {tok}')
resp = urllib.request.urlopen(req)
data = json.load(resp)

# Map user_id to 100 USDT (minted 100 MockUSDT)
balance_map = {
    '2365hdkq6zo7x5y': 100,  # seller
    'p70qpe6e4fzxiv7': 100,  # buyer
    'h3u9435j9ib9hqg': 100,  # referrer
}

for item in data.get('items', []):
    uid = item.get('user_id', '')
    rid = item['id']
    if uid in balance_map:
        new_bal = balance_map[uid]
        # Update
        req2 = urllib.request.Request(f'{base}/records/{rid}', method='PATCH')
        req2.add_header('Content-Type', 'application/json')
        req2.add_header('Authorization', f'Bearer {tok}')
        body = json.dumps({'usdt_balance': new_bal}).encode()
        resp2 = urllib.request.urlopen(req2, data=body)
        result = json.load(resp2)
        print(f'Updated {uid[:16]} -> USDT: {result.get(\"usdt_balance\",\"FAIL\")}')
"
