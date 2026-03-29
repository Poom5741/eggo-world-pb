# apps/backend - PocketBase Backend

**Generated:** 2026-03-29
**Parent:** See root `AGENTS.md`

## OVERVIEW

PocketBase backend with LINE OAuth integration, EVM wallet hooks, and SQLite database. Runs on port 8090.

## STRUCTURE

```
apps/backend/
├── collections/         # Collection schemas (JSON)
├── pb_hooks/            # JavaScript event handlers
├── pb_migrations/       # Database migrations
├── pb_public/           # Static files (fallback pages)
├── pb_data/             # Runtime data (gitignored)
├── docker-compose.yml   # Docker setup
├── Dockerfile           # Container build
└── .env                 # LINE credentials, wallet keys
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add hook | `pb_hooks/NN-feature.pb.js` | NN = sequence number |
| Add collection | `collections/` | Update migrations after |
| Modify schema | `pb_migrations/` | Timestamp prefix |
| Configure LINE OAuth | `.env` | LINE_CHANNEL_ID, SECRET |
| Add static file | `pb_public/` | Served at root |
| Modify wallet logic | `pb_hooks/01-create-wallet.pb.js` | Auto-wallet on signup |

## CONVENTIONS

**Hook File Naming:**
```
NN-feature.pb.js
# Examples:
00-config.pb.js         # Configuration
01-create-wallet.pb.js  # Auto-wallet creation
02-wallet-endpoint.pb.js
03-debug-request.pb.js
04-auth-token.pb.js     # LINE OAuth
99-debug.pb.js          # Debug utilities
```

**Hook Response Format:**
```javascript
// Success
e.json(200, { 
  success: true, 
  data: { ... } 
})

// Error
e.json(400, { 
  success: false, 
  error: { message: "...", code: "..." } 
})
```

**Authentication:**
```javascript
// ALWAYS require auth in hooks
const { users } = e.requireAuth()
```

**Blockchain API Pattern:**
```javascript
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})

// Retry 3 times with exponential backoff
```

## ANTI-PATTERNS (THIS PROJECT)

**DO NOT:**
- Create hooks without `$apis.requireAuth(e)`
- Log private keys or sensitive data
- Commit `pb_data/` directory
- Commit PocketBase binary (32MB)
- Use hardcoded secrets in code
- Skip input validation

**NEVER:**
- Return plaintext errors (always JSON)
- Expose wallet private keys
- Use synchronous operations in hooks

## UNIQUE STYLES

**Hook Structure:**
```javascript
routerAdd("POST", "/api/v2/your-endpoint", (e) => {
  const { users } = e.requireAuth()
  const body = e.parseBody()
  
  try {
    if (!body.field) {
      return e.json(400, { success: false, error: { message: "Field required", code: "VALIDATION_ERROR" } })
    }
    
    const result = await doSomething(body.field)
    e.json(200, { success: true, data: result })
  } catch (error) {
    console.error("Error:", error)
    e.json(500, { success: false, error: { message: error.message, code: "OPERATION_FAILED" } })
  }
}, { "requestTimeout": 30000 })
```

**Record Create Hook:**
```javascript
onRecordCreate("users", (e) => {
  const record = e.record
  const walletData = await createWallet()
  record.set("wallet", walletData.address)
  record.set("daccPublickey", walletData.publicKey)
  return next()
})
```

## COMMANDS

```bash
# Start PocketBase (Docker)
cd apps/backend
docker-compose up -d

# Stop PocketBase
docker-compose down

# View logs
docker-compose logs -f

# Start local (manual)
./pocketbase serve

# Test hook
curl -X POST http://localhost:8090/api/v2/endpoint \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": "value"}'
```

## NOTES

**PocketBase Version:** Check `Dockerfile` for version

**LINE OAuth:** Configured in `.env` and PocketBase Admin UI

**Wallet Fields:** `wallet`, `daccPublickey`, `pin` (auto-created by hook `01`)

**Error Codes:** `AUTH_REQUIRED`, `WALLET_NOT_FOUND`, `BALANCE_NATIVE_FAILED`, `NETWORK_ERROR`

**Production URL:** `https://pb.eggoworld.io`

**Admin UI:** `https://pb.eggoworld.io/_/`
