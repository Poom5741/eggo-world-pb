# Deploy Deposit Feature to Production pb.eggoworld.io

The 404 errors show the backend hook and collection are NOT deployed to production yet.

## Deploy Steps

### 1. Upload Backend Hook
```bash
scp -o StrictHostKeyChecking=no apps/backend/pb_hooks/13-track-deposit.pb.js \
  root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/
```

### 2. Upload Collection Schema
```bash
scp -o StrictHostKeyChecking=no apps/backend/collections/deposits.json \
  root@204.168.144.14:/root/eggo-world-pb/apps/backend/collections/
```

### 3. Restart PocketBase
```bash
ssh -o StrictHostKeyChecking=no root@204.168.144.14 "
  pkill -f 'pocketbase serve' &&
  sleep 3 &&
  cd /root/eggo-world-pb/apps/backend &&
  ./pocketbase serve --http=0.0.0.0:8090 > /tmp/pocketbase.log 2>&1 &
"
```

### 4. Verify Deployment
```bash
# Get your token from browser dev tools
TOKEN="your-auth-token"

curl -X POST https://pb.eggoworld.io/api/v2/deposit/poll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0xYOUR_WALLET"}'
```

Expected: `{"success":true,"data":{"deposits":[],"new_balance":0}}`

### 5. Check Logs
```bash
ssh -o StrictHostKeyChecking=no root@204.168.144.14 "
  tail -20 /tmp/pocketbase.log | grep -E 'endpoint|deposit'
"
```

Should see: "endpoint registered" messages

## Issues Found

1. **Endpoint 404** - Hook not deployed
2. **Collection 404** - deposits.json not deployed
3. **Empty wallet** - User has no wallet address

Frontend now handles these gracefully with error messages.
