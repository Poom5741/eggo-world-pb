# PRODUCTION DEPLOYMENT LESSONS LEARNED

**Last Updated:** 2026-04-13
**Author:** Deployment Post-Mortem

---

## CRITICAL MISTAKES TO AVOID

### 1. WRONG PROJECT DIRECTORY

**Mistake:** Tried to deploy to `/root/eggo-pocketbase`

**Reality:** Production is at `/root/eggo-world-pb`

**Fix:**
```bash
# ALWAYS verify the actual production directory
ssh root@204.168.144.14 "find /root -name 'pb_hooks' -type d"
# Returns: /root/eggo-world-pb/apps/backend/pb_hooks
```

**Lesson:** Never assume directory names. Always verify with `find` or `ls` first.

---

### 2. POCKETBASE RESTART METHOD

**Mistake:** Tried to use `docker-compose restart pocketbase`

**Reality:** Production runs PocketBase as direct process, NOT in Docker

**Fix:**
```bash
# Find PocketBase process
ps aux | grep 'pocketbase serve' | grep -v grep

# Find PID (e.g., 1709666)
# Kill and restart
pkill -f 'pocketbase serve'
cd /root/eggo-world-pb/apps/backend
./pocketbase serve --http=0.0.0.0:8090 > /tmp/pocketbase.log 2>&1 &
```

**Lesson:** Check how PocketBase is actually running before trying to restart it.

---

### 3. PROCESS WORKING DIRECTORY

**Mistake:** Restarted PocketBase from wrong directory

**Reality:** Hooks are loaded relative to the current working directory

**Fix:**
```bash
# MUST cd to apps/backend before starting
cd /root/eggo-world-pb/apps/backend
./pocketbase serve --http=0.0.0.0:8090 &

# NOT from /root or project root!
```

**Lesson:** PocketBase loads `pb_hooks/` from current directory. Always start from `apps/backend/`.

---

### 4. SSH CONFIGURATION

**Mistake:** Missing SSH_USER, SSH_KEY, REGISTRY environment variables

**Fix:**
```bash
export SSH_USER="root"
export SSH_KEY="~/.ssh/id_rsa"
export REGISTRY="ghcr.io"
export SSH_HOST="204.168.144.14"

# Then run deployment
./scripts/deploy-phase02.sh --env=production
```

**Lesson:** Set SSH environment variables BEFORE running deployment scripts.

---

### 5. HOOK LOADING VERIFICATION

**Mistake:** No verification that hooks actually loaded

**Fix:**
```bash
# After restart, check logs for hook registration
ssh root@204.168.144.14 "tail -50 /tmp/pocketbase.log | grep -E 'hot-wallet|hot wallet'"

# Should see:
# "Setting up hot wallet balance endpoint..."
# "Hot wallet balance endpoint registered"
```

**Lesson:** Always verify hooks loaded by checking logs after restart.

---

### 6. ENDPOINT TESTING WITHOUT AUTH

**Mistake:** Tested endpoint and saw 400/404 errors, thought deployment failed

**Reality:** Endpoints require authentication (uses `$apis.requireAuth()`)

**Fix:**
```bash
# Test WITHOUT auth = 400 (CORRECT!)
curl -X POST https://pb.eggoworld.io/api/v2/hot-wallet/balance \
  -H "Content-Type: application/json"

# Test WITH auth token
TOKEN="your-pocketbase-auth-token"
curl -X POST https://pb.eggoworld.io/api/v2/hot-wallet/balance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x..."}'
```

**Lesson:** 400/401/403 errors are normal for unauthenticated requests. Test with auth token.

---

### 7. FILE TRANSFER VERIFICATION

**Mistake:** Uploaded files but didn't verify content matches

**Fix:**
```bash
# After scp, verify file exists and has content
ssh root@204.168.144.14 "head -5 /root/eggo-world-pb/apps/backend/pb_hooks/12-hot-wallet-balance.pb.js"

# Should show actual code, not empty file
```

**Lesson:** Always verify uploaded files are correct after scp.

---

### 8. CONTAINER VS PROCESS CONFUSION

**Mistake:** Tried `docker ps | grep pocketbase` - no container found

**Reality:** Production runs PocketBase binary directly, not in Docker

**Fix:**
```bash
# Check for process, not container
ps aux | grep 'pocketbase serve'

# Check for Docker (if it exists)
docker ps --format '{{.Names}}' | grep pocket
```

**Lesson:** Verify deployment method (Docker vs binary) before managing services.

---

### 9. LOG FILE LOCATION

**Mistake:** Looked for logs in `/tmp/pocketbase.log` but process wasn't logging there

**Fix:**
```bash
# Find what PocketBase process is running
ps aux | grep pocketbase

# Check if it has log redirection
# Look at process command line

# If no log file, restart with logging
cd /root/eggo-world-pb/apps/backend
./pocketbase serve --http=0.0.0.0:8090 > /root/pocketbase.log 2>&1 &
```

**Lesson:** Always redirect output to log file when starting PocketBase manually.

---

### 10. HOOK FILE NAMING ORDER

**Mistake:** Named hook `hot-wallet-balance.pb.js` without number prefix

**Reality:** Hooks load in alphabetical/numerical order

**Fix:**
```bash
# ALWAYS use NN-prefix for hooks
12-hot-wallet-balance.pb.js  # NOT "hot-wallet-balance.pb.js"

# This ensures hooks load in correct order
```

**Lesson:** Always use sequential numbering (00-99) for hook filenames.

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Verify production directory: `ssh root@host "find /root -name 'pb_hooks'"`
- [ ] Check how PocketBase runs: `ssh root@host "ps aux | grep pocketbase"`
- [ ] Set SSH environment variables
- [ ] Backup current hooks: `ssh root@host "cp -r pb_hooks pb_hooks.backup"`

### During Deployment

- [ ] Upload files with `scp`
- [ ] Verify files uploaded: `ssh root@host "ls -la pb_hooks/"`
- [ ] Verify file content: `ssh root@host "head -5 pb_hooks/12-*.pb.js"`
- [ ] Kill existing PocketBase: `ssh root@host "pkill -f 'pocketbase serve'"`
- [ ] Restart from correct directory: `cd apps/backend && ./pocketbase serve...`

### Post-Deployment

- [ ] Health check: `curl https://pb.eggoworld.io/api/health`
- [ ] Check logs: `ssh root@host "tail -50 /tmp/pocketbase.log"`
- [ ] Verify hook loaded: Look for "endpoint registered" in logs
- [ ] Test with auth: Test endpoint with valid auth token
- [ ] Test frontend: Verify button works in UI

---

## QUICK REFERENCE COMMANDS

### SSH Access
```bash
ssh -o StrictHostKeyChecking=no root@204.168.144.14
```

### Upload Hook File
```bash
scp -o StrictHostKeyChecking=no apps/backend/pb_hooks/12-*.pb.js root@204.168.144.14:/root/eggo-world-pb/apps/backend/pb_hooks/
```

### Upload Collection
```bash
scp -o StrictHostKeyChecking=no apps/backend/collections/*.json root@204.168.144.14:/root/eggo-world-pb/apps/backend/collections/
```

### Restart PocketBase
```bash
ssh root@204.168.144.14 "
  pkill -f 'pocketbase serve' &&
  sleep 3 &&
  cd /root/eggo-world-pb/apps/backend &&
  ./pocketbase serve --http=0.0.0.0:8090 > /tmp/pocketbase.log 2>&1 &
"
```

### Check Logs
```bash
ssh root@204.168.144.14 "tail -50 /tmp/pocketbase.log | grep -E 'endpoint|hook|registered'"
```

### Health Check
```bash
curl -s https://pb.eggoworld.io/api/health
```

### Test Endpoint (with auth)
```bash
TOKEN="your-auth-token"
curl -X POST https://pb.eggoworld.io/api/v2/hot-wallet/balance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x..."}'
```

---

## COMMON ERRORS & SOLUTIONS

### Error: `address already in use`
**Cause:** PocketBase already running  
**Solution:** `pkill -f 'pocketbase serve'` then restart

### Error: `No such container`
**Cause:** Trying to use Docker when PocketBase runs as process  
**Solution:** Use `ps aux | grep pocketbase` instead of `docker ps`

### Error: `pb_hooks: No such file or directory`
**Cause:** Wrong directory path  
**Solution:** `ssh root@host "find /root -name 'pb_hooks' -type d"`

### Error: 404 on endpoint
**Cause:** Hook not loaded or wrong URL  
**Solution:** Check logs for "endpoint registered", verify URL path

### Error: 400/401/403 on endpoint
**Cause:** Missing authentication  
**Solution:** Add `Authorization: Bearer <token>` header

### Error: Hooks not loading
**Cause:** Started PocketBase from wrong directory  
**Solution:** `cd apps/backend` before starting PocketBase

---

## ENVIRONMENT VARIABLES REQUIRED

```bash
# For deployment scripts
export SSH_USER="root"
export SSH_KEY="~/.ssh/id_rsa"
export REGISTRY="ghcr.io"
export SSH_HOST="204.168.144.14"

# For frontend (apps/web/.env.local)
NEXT_PUBLIC_POCKETBASE_URL=https://pb.eggoworld.io

# For backend (apps/backend/.env)
LINE_CHANNEL_ID=your-id
LINE_CHANNEL_SECRET=your-secret
WALLET_MASTER_KEY=your-key
PRIVATE_KEY=your-deploy-key
COINSTOR_RESERVE_ADDRESS=0x...
```

---

**REMEMBER:** Always verify, never assume. Test deployment on staging first if possible.
