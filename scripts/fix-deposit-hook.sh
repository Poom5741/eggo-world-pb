#!/bin/bash
# DEPOSIT HOOK - EMERGENCY PRODUCTION FIX
# Problem: Hook file exists but not loaded by PocketBase
# Root cause: File not uploaded OR PocketBase not restarted after upload
# Solution: Upload file + restart PocketBase from correct directory

set -e

SSH_HOST="204.168.144.14"
SSH_USER="root"
REMOTE_BASE="/root/eggo-world-pb/apps/backend"

echo "=========================================="
echo "  DEPOSIT HOOK - PRODUCTION FIX"
echo "=========================================="
echo ""

# Step 1: Verify local file exists
echo "1. Verifying local files..."
LOCAL_HOOK_FILE="apps/backend/pb_hooks/13-track-deposit.pb.js"
if [ ! -f "$LOCAL_HOOK_FILE" ]; then
    echo "   ❌ ERROR: Hook file not found locally!"
    echo "   Expected: $LOCAL_HOOK_FILE"
    exit 1
fi
echo "   ✓ Hook file exists locally: $LOCAL_HOOK_FILE"
echo ""

# Step 2: Upload hook file
echo "2. Uploading hook file to production..."
scp -o StrictHostKeyChecking=no \
    apps/backend/pb_hooks/13-track-deposit.pb.js \
    ${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/pb_hooks/
echo "   ✓ Hook file uploaded to: ${REMOTE_BASE}/pb_hooks/13-track-deposit.pb.js"
echo ""

# Step 3: Verify upload
echo "3. Verifying upload..."
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} "
    if [ -f ${REMOTE_BASE}/pb_hooks/13-track-deposit.pb.js ]; then
        echo '   ✓ File exists on server'
        echo '   File size:'
        ls -lh ${REMOTE_BASE}/pb_hooks/13-track-deposit.pb.js
        echo '   First 3 lines:'
        head -3 ${REMOTE_BASE}/pb_hooks/13-track-deposit.pb.js
    else
        echo '   ❌ File NOT found on server!'
        exit 1
    fi
"
echo ""

# Step 4: Restart PocketBase from CORRECT directory
echo "4. Restarting PocketBase..."
echo "   - Stopping existing process..."
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} "
    pkill -f 'pocketbase serve' || true
    sleep 2
"
echo "   - Starting PocketBase from ${REMOTE_BASE}..."
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} "
    cd ${REMOTE_BASE} &&
    ./pocketbase serve --http=0.0.0.0:8090 > /tmp/pocketbase.log 2>&1 &
    sleep 3
"
echo "   ✓ PocketBase restarting..."
echo ""

# Step 5: Verify hook loaded
echo "5. Checking if deposit hook loaded..."
ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} "
    echo '   Waiting 5 seconds for hooks to load...'
    sleep 5
    echo '   Checking logs for deposit endpoint registration:'
    tail -50 /tmp/pocketbase.log | grep -i 'deposit\|endpoint' | tail -10
    echo ''
    echo '   Counting registered hooks:'
    grep -c 'registered' /tmp/pocketbase.log | tail -1
"
echo ""

# Step 6: Health check
echo "6. Testing endpoint..."
sleep 3
curl -s -o /dev/null -w "   HTTP Status: %{http_code}\n" https://pb.eggoworld.io/api/health || echo "   ⚠️  Health check failed - service may still be starting"
echo ""

echo "=========================================="
echo "  FIX COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Check logs: ssh root@204.168.144.14 'tail -100 /tmp/pocketbase.log | grep deposit'"
echo "  2. Test endpoint with auth token:"
echo "     curl -X POST https://pb.eggoworld.io/api/v2/deposit/poll \\"
echo "       -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"user_address\":\"0xYourWalletAddress\"}'"
echo ""
echo "  Expected: {\"success\":true,\"data\":{\"deposits\":[],\"new_balance\":0}}"
echo ""
