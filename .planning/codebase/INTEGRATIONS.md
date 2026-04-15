# External Integrations

**Analysis Date:** 2026-04-15

## APIs & External Services

**LINE OAuth:**
- **LINE Login** - Social authentication
  - SDK/Client: Custom implementation in `apps/backend/pb_hooks/05-auth-token.pb.js`
  - Auth: `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` (env vars)
  - Callback: `/api/oauth2-redirect` (configurable via `LINE_CALLBACK_URL`)
  - Flow: OAuth 2.0 authorization code exchange

**Blockchain RPC Endpoints:**
- **BSC Mainnet**: `https://bsc-dataseed.binance.org`
- **BSC Testnet**: `https://data-seed-prebsc-1-s1.binance.org:8545`
- **0xL3 Chain**: `https://rpc.0xl3.com`
  - Configured in `contracts/foundry.toml`
  - Used by ethers.js in `apps/web/` and `wallet-api/`

**Block Explorers (for contract verification):**
- **BSCScan**: `https://api.bscscan.com/api` (key: `BSCSCAN_API_KEY`)
- **0xL3 Blockscout**: `https://exp.0xl3.com/api` (key: `BLOCKSCOUT_API_KEY`)

**Cloudflare:**
- **Turnstile** - CAPTCHA/anti-bot protection
  - SDK: `@marsidev/react-turnstile` 0.3.0
  - Integration: `apps/web/` forms (login, signup)
- **Real IP** - nginx configured with Cloudflare IP ranges

**Vercel Analytics:**
- **@vercel/analytics** 1.6.1
- Integration: `apps/web/` layout
- Purpose: Usage tracking, performance metrics

## Data Storage

**Databases:**
- **PocketBase** - SQLite-based backend
  - Location: `apps/backend/pb_data/` (mounted Docker volume)
  - Client: PocketBase JS SDK 0.25.2
  - Collections: `users`, `user_wallets`, `deposits`, `transactions`, `egg_nfts`, `animal_nfts`, `food_nfts`, `marketplace_listings`, etc.
  - Migrations: `apps/backend/pb_migrations/` (auto-applied)
  - Hooks: `apps/backend/pb_hooks/` (40+ server-side functions)

**File Storage:**
- **Local filesystem** - NFT metadata, static assets
  - Location: `apps/backend/pb_public/`
  - Served via PocketBase `/api/files/` endpoint
- **Next.js static export** - Frontend assets in `apps/web/.next/`

**Caching:**
- **Browser cache** - Static assets via nginx gzip + cache headers
- **No external caching layer** (Redis/Memcached not used)

## Authentication & Identity

**Auth Provider:**
- **LINE Login** - Primary OAuth provider
  - Implementation: `apps/backend/pb_hooks/05-auth-token.pb.js`
  - Token exchange: POST to LINE token endpoint
  - User info: Fetch from LINE profile API
  - PocketBase session: Create/Update user record

**Session Management:**
- **PocketBase authStore** - Client-side token storage
  - Frontend: `pb.authStore.record` (React hydration-safe)
  - Backend: JWT tokens (PocketBase native)
  - Middleware: `apps/web/middleware.ts` (Edge auth check)

**DACC Blockchain Wallets:**
- **dacc-js** 0.0.5 - Wallet generation
  - Integration: `wallet-api/` service
  - Storage: Encrypted in `user_wallets` collection
  - Encryption: `WALLET_MASTER_KEY` (AES-256)

## Monitoring & Observability

**Error Tracking:**
- **Console logging** - Development (`console.log/error`)
- **PocketBase logs** - Backend errors (`tail -50 /tmp/pocketbase.log`)
- **Docker logs** - `docker-compose logs -f`

**Logs:**
- **nginx access/error logs**: `/var/log/nginx/`
- **PocketBase**: stdout → Docker logs
- **Wallet API**: stdout → Docker logs

**Health Checks:**
- **PocketBase**: `GET /api/health` (Docker healthcheck)
- **Wallet API**: `GET /health` (Express endpoint)
- **nginx**: Implicit via request routing

## CI/CD & Deployment

**Version Control:**
- **GitHub** - Source code hosting
- **GitHub Actions** - CI workflows (`.github/workflows/`)

**Docker:**
- **PocketBase container**: `apps/backend/Dockerfile`
- **Wallet API container**: `wallet-api/Dockerfile`
- **nginx container**: Official `nginx:alpine`
- **Compose**: `docker-compose.yml`, `docker-compose.wallet-api.yml`

**Deployment Scripts:**
- `deploy-wallet-api.sh` - Wallet API deployment
- `Makefile` targets: `dev`, `backend`, `deploy`
- `nginx/setup-ssl.sh` - SSL certificate setup

## Smart Contract Integrations

**Deployed Contracts:**
- **EggNFT.sol** - Main NFT contract (ERC721)
- **AnimalNFT.sol** - Breeding NFTs (ERC721)
- **FoodNFT.sol** - Consumable items (ERC1155)
- **CommissionDistribution.sol** - Revenue sharing

**Contract Addresses:**
- Location: `contracts/deployment-addresses.json`
- Networks: BSC Testnet (97), BSC Mainnet (56), 0xL3

**Interaction Methods:**
- **ethers.js** 6.x - Frontend contract calls
- **PocketBase hooks** - Backend contract events (via wallet-api)

## Webhooks & Callbacks

**Incoming Webhooks:**
- **LINE OAuth callback**: `/api/oauth2-redirect` (handled by `05-auth-token.pb.js`)
- **PocketBase API endpoints**: Custom routes via hooks
  - `/api/v2/hot-wallet/balance` (`12-hot-wallet-balance.pb.js`)
  - `/api/v2/withdraw` (`09-withdraw-usdt.pb.js`)
  - `/api/v2/spend` (`10-spend-usdt.pb.js`)
  - `/api/v2/transfer` (`11-transfer-usdt.pb.js`)

**Outgoing Webhooks:**
- **LINE Token Exchange**: POST to `https://api.line.me/v2/oauth/accessToken`
- **LINE Profile Fetch**: GET to `https://api.line.me/v2/profile`
- **Blockchain RPC**: POST to BSC/0xL3 endpoints

## Environment Configuration

**Required env vars (Production):**

```bash
# LINE OAuth
LINE_CHANNEL_ID
LINE_CHANNEL_SECRET
LINE_CALLBACK_URL

# Wallet Encryption (CRITICAL)
WALLET_MASTER_KEY           # 32+ chars, hex
DACC_MNEMONIC               # BIP39 12-24 words

# PocketBase Admin
POCKETBASE_ADMIN_EMAIL
POCKETBASE_ADMIN_PASSWORD

# CORS
CORS_ORIGIN                 # Comma-separated domains

# Blockchain
BSC_MAINNET_RPC
BSC_TESTNET_RPC
BSCSCAN_API_KEY

# Deployment
DEPLOYER_PRIVATE_KEY        # NEVER commit
```

**Development defaults:**
- `POCKETBASE_URL=http://localhost:8090`
- `WALLET_API_URL=http://localhost:3001`
- `CORS_ORIGIN=http://localhost:3000`

**Secrets location:**
- **Development**: `.env.local` (gitignored)
- **Production**: GitHub Secrets, password manager, or secure vault
- **NEVER committed**: Private keys, mnemonics, channel secrets

## Security Integrations

**Helmet.js** (`wallet-api/`):
- Security headers: X-Frame-Options, CSP, HSTS
- Configured in `wallet-api/src/index.ts`

**CORS:**
- Configurable via `CORS_ORIGIN`
- Credentials: true (for auth cookies)
- Rate limiting: nginx `limit_req_zone`

**Input Validation:**
- **zod** - Schema validation (frontend + wallet-api)
- **react-hook-form** - Form validation
- **PocketBase validators** - Built-in schema rules

**Encryption:**
- **AES-256** - Wallet private keys (encrypted at rest)
- Key derivation: PBKDF2 from `WALLET_MASTER_KEY`

---

*Integration audit: 2026-04-15*
