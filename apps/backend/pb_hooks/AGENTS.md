# apps/backend/pb_hooks - PocketBase Event Handlers

**Generated:** 2026-03-29
**Parent:** See `apps/backend/AGENTS.md`

## OVERVIEW

Event handlers for PocketBase. Numbered sequentially for execution order. Handles Google OAuth, wallet creation, NFT minting, and more.

## STRUCTURE

```
pb_hooks/
├── 00-config.pb.js            # Configuration and constants
├── 01-create-wallet.pb.js     # Auto-wallet on user signup
├── 02-legacy-api-compat.pb.js # Legacy API compatibility layer
├── 03-wallet-api-endpoint.pb.js # Wallet API endpoint
├── 04-debug-request.pb.js     # Request debugging
├── 07-register-user.pb.js     # User registration
├── 08-wallet-balance.pb.js    # Wallet balance queries
├── 09-withdraw-usdt.pb.js     # USDT withdrawal
├── 10-spend-usdt.pb.js        # USDT spending
├── 11-transfer-usdt.pb.js     # USDT transfer
├── 12-update-tier.pb.js       # Tier updates
├── 13-mint-egg-nft.pb.js      # Egg NFT minting
├── 14-claim-commission.pb.js  # Commission claims
├── 15-mint-food-nft.pb.js     # Food NFT minting
├── 16-feed-egg.pb.js          # Feed egg mechanic
├── 17-upgrade-egg-rarity.pb.js # Egg rarity upgrades
├── 18-breed-animals.pb.js     # Animal breeding
├── 19-hatch-egg.pb.js         # Egg hatching
└── 99-debug.pb.js             # General debug utilities
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new hook | `pb_hooks/NN-{feature}.pb.js` | Choose NN for sequence |
| Modify wallet creation | `01-create-wallet.pb.js` | onRecordCreate for users |

| Add debug logging | `99-debug.pb.js` | Debug utilities |
| Configure globals | `00-config.pb.js` | Constants, API URLs |
| NFT operations | `13-mint-egg-nft.pb.js`, `15-mint-food-nft.pb.js` | NFT minting hooks |
| USDT operations | `09-withdraw-usdt.pb.js`, `10-spend-usdt.pb.js`, `11-transfer-usdt.pb.js` | USDT transfers |

## CONVENTIONS

**File Naming:**
```
NN-{feature}.pb.js
# NN = execution order (00-99)
# Use 00 for config, 99 for debug
```

**Authentication (REQUIRED):**
```javascript
// ALWAYS require authentication
const { users } = e.requireAuth()
```

**Response Format:**
```javascript
// Success
e.json(200, { success: true, data: { ... } })

// Error
e.json(400, { success: false, error: { message, code } })
```

**Error Handling:**
```javascript
try {
  // Operation
} catch (error) {
  console.error("Operation failed:", error)
  e.json(500, {
    success: false,
    error: { message: error.message, code: "OPERATION_FAILED" }
  })
}
```

## ANTI-PATTERNS

**DO NOT:**
- Create hooks without `$apis.requireAuth(e)`
- Return non-JSON responses
- Log sensitive data (private keys, PINs)
- Skip input validation
- Use hardcoded API URLs

**NEVER:**
- Expose wallet credentials
- Commit `.env` with real secrets
- Use synchronous blockchain calls

## UNIQUE STYLES

**Wallet Creation Hook:**
```javascript
onRecordCreate("users", (e) => {
  const record = e.record
  const walletData = await createWallet()
  record.set("wallet", walletData.address)
  record.set("daccPublickey", walletData.publicKey)
  record.set("pin", encrypt(walletData.pin))
  return next()
})
```

**Endpoint Hook:**
```javascript
routerAdd("POST", "/api/v2/balance-native", (e) => {
  const { users } = e.requireAuth()
  const { chainid } = e.parseBody()
  const balance = await getBalance(chainid, users.wallet)
  e.json(200, { success: true, data: { balance } })
}, { "requestTimeout": 30000 })
```

**Retry Pattern:**
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      return await response.json()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
}
```

## COMMANDS

```bash
# View hook logs
docker-compose logs -f

# Test endpoint
curl -X POST http://localhost:8090/api/v2/endpoint \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": "value"}'

# Reload hooks (restart PocketBase)
docker-compose restart
```

## NOTES

**Reference:** `resources/mvp-foodcourt/pb_hooks/` has 20+ hook examples

**Chain IDs:** BSC Testnet (97), BSC Mainnet (56), Ethereum (1), Polygon (137)

**API URL:** `https://wallet-api.tk9.us/api/v1`

**Encryption:** Use `WALLET_MASTER_KEY` from `.env`
