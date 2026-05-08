---
phase: "18"
plan: "02"
status: complete
completed: 2026-04-21T12:35:00.000Z
---

# Plan 18-02 Summary: Update OAuth Callback & Verification Script

## Objective

Verify LINE OAuth signup creates wallets end-to-end by testing the full flow: LINE OAuth → user creation → wallet hook → wallet fields populated → Buy Now flow works. Fix line-callback.html to handle wallet creation errors properly and log wallet status.

## What Was Built

### 1. Updated LINE OAuth Callback with Wallet Verification

**File**: `apps/backend/pb_public/line-callback.html`

**Changes**:

#### Added Wallet Verification (After user creation, before authentication)

- Added comprehensive wallet verification checks after user is created/fetched
- Logs wallet status: user ID, wallet address, daccPublickey
- Shows error to user if wallet is missing: "Wallet creation failed. Please contact support. (Error: WALLET_NOT_CREATED)"
- Shows error if daccPublickey is missing: "Wallet setup incomplete. Please contact support. (Error: DACC_KEY_MISSING)"
- Logs success: "✓ Wallet verified: {wallet}" and "✓ daccPublickey verified: {daccPublickey}"

#### Removed Fallback Wallet Creation

- Deleted entire fallback block (lines 236-256) that tried to call `/api/wallet/create`
- This fallback was using wrong endpoint and silently failing
- No longer needed because hook now creates wallets during user creation (Plan 18-01)

#### Updated Success Message

- Added wallet address display to success message
- Shows truncated wallet: `{first 10 chars}...` (e.g., "0x1234567890...")
- Helps users verify their wallet was created

**Why these changes**:

- The hook now creates wallets during user creation (onRecordBeforeCreate), so the fallback is redundant
- Adding verification ensures we catch any hook failures immediately
- Logging wallet status helps debug future issues
- Error messages inform users when wallet creation fails (instead of silent failure)

### 2. Verification Test Script

**File**: `apps/backend/scripts/test-oauth-wallet-flow.sh` (NEW)

**Features**:

- Shell script that tests the full OAuth wallet creation flow end-to-end
- Creates test user via PocketBase API (simulating OAuth flow)
- Verifies wallet fields are populated
- Tests authentication
- Validates wallet format (0x... Ethereum address)
- Validates daccPublickey format (daccPublickey\_...)
- Returns comprehensive test summary

**Test Steps**:

1. Create test user with unique email: `test-oauth-{timestamp}@line.eggo`
2. Verify wallet fields in response (wallet, daccPublickey, pin)
3. Validate wallet format matches `^0x[a-fA-F0-9]{40}$`
4. Validate daccPublickey format matches `^daccPublickey_`
5. Test authentication with auth-with-password endpoint
6. Fetch user record and verify all fields persist
7. Display test summary

**Usage**:

```bash
# Test against local PocketBase
cd apps/backend
./scripts/test-oauth-wallet-flow.sh

# Test against production
PB_URL=https://pb.eggoworld.io ./scripts/test-oauth-wallet-flow.sh
```

**⚠️ NOTE**: Script needs `chmod +x` to be executable. Run:

```bash
chmod +x apps/backend/scripts/test-oauth-wallet-flow.sh
```

## Key Files Created/Modified

| File                                             | Action   | Purpose                                                              |
| ------------------------------------------------ | -------- | -------------------------------------------------------------------- |
| `apps/backend/pb_public/line-callback.html`      | Modified | Added wallet verification, removed fallback, updated success message |
| `apps/backend/scripts/test-oauth-wallet-flow.sh` | Created  | End-to-end test script for OAuth wallet creation                     |

## Verification Results

### Callback Verification

```bash
✅ grep "VERIFY WALLET CREATION" → Line 198: console.log("=== VERIFY WALLET CREATION ===")
✅ grep "Wallet verified" → Line 218: console.log("✓ Wallet verified:", user.wallet)
✅ !grep "/api/wallet/create" → No matches (fallback removed successfully)
✅ grep "user.wallet.substring" → Success message shows truncated wallet
✅ grep "showError.*Wallet creation failed" → Error handling for missing wallet
✅ grep "showError.*DACC_KEY_MISSING" → Error handling for missing daccPublickey
```

### Test Script Verification

```bash
✅ File exists: apps/backend/scripts/test-oauth-wallet-flow.sh
✅ File contains #!/bin/bash (shebang line)
✅ grep "api/collections/users/records" → User creation API call
✅ grep "0x" → Wallet format validation with regex
✅ grep "daccPublickey_" → daccPublickey format validation
✅ grep "auth-with-password" → Authentication test
⚠️  Script not executable (needs chmod +x manually due to sandbox restriction)
```

## Self-Check: PASSED

All acceptance criteria verified:

- ✅ Callback contains "VERIFY WALLET CREATION" logging
- ✅ Callback contains wallet check after user creation
- ✅ Callback contains error handling with showError for missing wallet
- ✅ Callback does NOT contain '/api/wallet/create' (fallback removed)
- ✅ Callback contains user.wallet.substring in success message
- ✅ Callback contains success logging for wallet verification
- ✅ Test script file exists
- ✅ Test script contains shebang line
- ✅ Test script contains user creation API call
- ✅ Test script contains wallet format validation (0x regex)
- ✅ Test script contains daccPublickey format validation
- ✅ Test script contains auth-with-password test
- ⚠️ Test script needs chmod +x (manual action required)

## Commits

- **Hash**: e7c23cf
- **Message**: fix(18-02): add wallet verification to LINE OAuth callback, create test script

## Testing Instructions

### Local Testing

1. Start PocketBase locally:

   ```bash
   cd apps/backend && docker-compose up -d
   ```

2. Test debug endpoint from Plan 18-01:

   ```bash
   curl -X POST http://localhost:8090/api/v2/test-oauth-wallet \
     -H "Content-Type: application/json"
   ```

3. Run verification script:
   ```bash
   cd apps/backend
   chmod +x scripts/test-oauth-wallet-flow.sh
   ./scripts/test-oauth-wallet-flow.sh
   ```

### Production Testing

1. Upload fixed files to production:

   ```bash
   scp apps/backend/pb_hooks/01-create-wallet.pb.js root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/
   scp apps/backend/pb_hooks/18-test-oauth-wallet.pb.js root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/
   scp apps/backend/pb_public/line-callback.html root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_public/
   ```

2. Restart PocketBase:

   ```bash
   ssh root@204.168.144.14 "pkill -f 'pocketbase serve' && sleep 3 && cd /root/eggo-world-pb/apps/backend && nohup ./pocketbase serve --http=0.0.0.0:8090 >> /tmp/pocketbase.log 2>&1 &"
   ```

3. Verify hooks loaded:

   ```bash
   ssh root@204.168.144.14 "tail -50 /tmp/pocketbase.log | grep -E 'Create wallet hook|test OAuth wallet endpoint'"
   ```

4. Run test against production:
   ```bash
   PB_URL=https://pb.eggoworld.io ./scripts/test-oauth-wallet-flow.sh
   ```

### Manual LINE OAuth Flow Test

1. Open LINE login page
2. Complete OAuth flow
3. Verify user is created with wallet fields populated
4. Navigate to Buy Now flow
5. Verify no "User has no wallet" error

## Next Steps

- Deploy to production
- Run test script against production PocketBase
- Test LINE OAuth flow manually
- Test Buy Now flow for LINE OAuth users
- Consider removing debug endpoint (`18-test-oauth-wallet.pb.js`) after verification
