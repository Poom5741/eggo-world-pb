#!/bin/bash
# DEPOSIT FEATURE - PRODUCTION DEPLOYMENT SCRIPT
# Run this to deploy deposit tracking to pb.eggoworld.io

set -e

SSH_HOST="204.168.144.14"
SSH_USER="root"
REMOTE_PATH="/root/eggo-world-pb/apps/backend"

echo "===== DEPOSIT FEATURE DEPLOYMENT ====="
echo ""

# Check files exist locally
echo "1. Checking local files..."
if [ ! -f "apps/backend/pb_hooks/13-track-deposit.pb.js" ]; then
    echo "❌ ERROR: Hook file not found!"
    exit 1
fi
if [ ! -f "apps/backend/collections/deposits.json" ]; then
    echo "❌ ERROR: Collection file not found!"
    exit 1
fi
echo "✓ All files present"
echo ""

# Upload hook
echo "2. Uploading backend hook..."
scp -o StrictHostKeyChecking=no \
    apps/backend/pb_hooks/13-track-deposit.pb.js \
    ${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/pb_hooks/
echo "✓ Hook uploaded"
echo ""

# Upload collection
echo "3. Uploading deposits collection..."
scp -o StrictHostKeyChecking=no \
    apps/backend/collections/deposits.json \
    ${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/collections/
echo "✓ Collection uploaded"
echo ""

# Restart PocketBase
echo "4. Restarting PocketBase..."
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} "
    echo '  - Stopping PocketBase...'
    pkill -f 'pocketbase serve' || true
    sleep 3
    echo '  - Starting from ${REMOTE_PATH}...'
    cd ${REMOTE_PATH}
    ./pocketbase serve --http=0.0.0.0:8090 > /tmp/pocketbase.log 2>&1 &
    sleep 2
    echo '  - Checking status...'
    ps aux | grep 'pocketbase serve' | grep -v grep
"
echo "✓ PocketBase restarted"
echo ""

# Verify endpoint
echo "5. Verifying deployment..."
echo ""
echo "Test with curl (replace TOKEN with actual auth token):"
echo "---"
echo 'curl -X POST https://pb.eggoworld.io/api/v2/deposit/poll \'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '\''{"user_address":"0x742d35Cc6634C0532925a3b844Bc454e4438f44e"}'\'''
echo "---"
echo ""
echo "Expected response: {\"success\":true,\"data\":{\"deposits\":[],\"new_balance\":0}}"
echo ""
echo "Check logs:"
echo "ssh root@204.168.144.14 'tail -20 /tmp/pocketbase.log | grep -E deposit|endpoint'"
echo ""
echo "===== DEPLOYMENT COMPLETE ====="
