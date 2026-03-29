# wallet-api - Express.js Wallet Service

**Generated:** 2026-03-29
**Parent:** See root `AGENTS.md`

## OVERVIEW

Express.js service for EVM wallet generation using ethers v6. Provides wallet creation endpoint with encrypted credentials.

## STRUCTURE

```
wallet-api/
├── server.js            # Express server + wallet endpoint
├── package.json         # Dependencies (Bun runtime)
├── Dockerfile           # Container build
├── health.test.js       # Health check test
└── .env                 # Master encryption key
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Modify wallet creation | `server.js` | POST `/api/v1/wallet/create` |
| Add endpoint | `server.js` | Add new route |
| Change encryption | `server.js` | XOR (demo) → AES (production) |
| Add tests | `{name}.test.js` | Bun test |
| Deploy | `Dockerfile` | Node 18 base image |

## CONVENTIONS

**Endpoint Pattern:**
```javascript
app.post("/api/v1/wallet/create", async (req, res) => {
  try {
    const { /* params */ } = req.body
    
    // Generate wallet
    const wallet = ethers.Wallet.createRandom()
    
    // Encrypt credentials
    const encrypted = encrypt(wallet.privateKey)
    
    res.json({
      success: true,
      data: {
        address: wallet.address,
        publicKey: wallet.publicKey,
        encrypted: encrypted
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    })
  }
})
```

**Response Format:**
```javascript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: { message: "..." } }
```

**Encryption (CRITICAL):**
```javascript
// Current: XOR (demo only)
// TODO: Replace with AES-256-GCM for production
function encrypt(data) {
  // XOR with master key (NOT SECURE)
  return data.split('').map((char, i) => {
    return String.fromCharCode(
      char.charCodeAt(0) ^ masterKey.charCodeAt(i % masterKey.length)
    )
  }).join('')
}
```

## ANTI-PATTERNS

**DO NOT:**
- Use XOR encryption in production
- Log private keys or mnemonics
- Expose `WALLET_MASTER_KEY` in responses
- Skip input validation
- Return plaintext errors

**NEVER:**
- Commit `.env` with real master key
- Hardcode encryption keys in `server.js`
- Deploy without HTTPS

## UNIQUE STYLES

**Wallet Generation:**
```javascript
const wallet = ethers.Wallet.createRandom()
const address = wallet.address
const publicKey = wallet.publicKey
const privateKey = wallet.privateKey
```

**Health Check:**
```javascript
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() })
})
```

**CORS Configuration:**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}))
```

## COMMANDS

```bash
# Start dev server
cd wallet-api
bun run dev

# Run tests
bun test

# Build Docker image
docker build -t wallet-api .

# Run container
docker run -p 3001:3001 --env-file .env wallet-api
```

## NOTES

**Port:** 3001 (default)

**Health Check:** `GET /health`

**Chain Support:** EVM-compatible (BSC, Ethereum, Polygon)

**Security:** Upgrade XOR → AES-256-GCM before production

**Integration:** Called by PocketBase hook `01-create-wallet.pb.js`
