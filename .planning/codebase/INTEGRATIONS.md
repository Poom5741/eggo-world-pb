# External Integrations

**Analysis Date:** 2026-04-02

## APIs & External Services

**LINE OAuth:**
- LINE Login Channel - User authentication
  - Config: `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` in `apps/backend/.env`
  - Flow: Redirect to `/auth/line` → LINE consent → callback → token exchange
  - Hook: `apps/backend/pb_hooks/05-auth-token.pb.js` handles token exchange

**Blockchain RPC:**
- BSC Testnet: `https://data-seed-prebsc-1-s1.binance.org:8545` (Chain ID: 97)
- BSC Mainnet: `https://bsc-dataseed.binance.org` (Chain ID: 56)
- Config: `contracts/foundry.toml`
- Client: viem 2.47.6 in `wallet-srv/`

**BSCScan API:**
- Testnet: `https://api-testnet.bscscan.com/api`
- Mainnet: `https://api.bscscan.com/api`
- Used for: Contract verification, transaction lookup
- Config: `BSCSCAN_API_KEY` environment variable

## Data Storage

**Database:**
- PocketBase (SQLite embedded)
  - Connection: Local file in `apps/backend/pb_data/`
  - Client: PocketBase SDK 0.25.2 (`apps/web/lib/pocketbase/client.ts`)
  - Collections: users, user_wallets, referrals, egg_nfts, animal_nfts, food_nfts, commission_records, wallet_configs, egg_consumption_logs

**File Storage:**
- Local filesystem via PocketBase
  - Location: `apps/backend/pb_public/`
  - Used for: NFT metadata, images

**Caching:**
- None detected - Direct database queries

## Authentication & Identity

**Auth Provider:**
- LINE Login (OAuth 2.0)
  - Implementation: Custom PocketBase hooks
  - Hook: `05-auth-token.pb.js` - Token exchange and user lookup
  - Endpoint: `POST /api/auth/line-auth`
  - Session: PocketBase authStore (cookie-based)

**User Model:**
- PocketBase `users` collection with auth
- Fields: email, wallet, daccPublickey, pin (encrypted), referral_chain
- Auto-created wallet on signup via hook `01-create-wallet.pb.js`

## Blockchain Integration

**Smart Contracts:**
- EggNFT.sol - Main NFT contract (minting, breeding, feeding, upgrades)
- AnimalNFT.sol - Animal NFT management with rarity system
- FoodNFT.sol - Food item NFTs
- CommissionDistribution.sol - Referral commission logic

**Contract Addresses:**
- Deployed via Forge scripts in `contracts/script/`
- Target: BSC testnet/mainnet
- Config: `contracts/foundry.toml`

**Wallet Service:**
- `wallet-srv/` - Express.js service for wallet creation
  - Endpoint: `POST /api/v1/wallet/create`
  - Uses: dacc-js SDK for EVM wallet generation
  - Encryption: WALLET_MASTER_KEY encrypts private keys
  - Fields: address, daccPublickey, pin

**EIP-7702 Support:**
- Fields: `eip7702_enabled`, `eip7702_hash` in user_wallets
- Endpoint: `/api/v2/eip7702/*` in wallet-srv

## PocketBase Collections

**Core Collections:**
| Collection | File | Purpose |
|------------|------|---------|
| users | `users.json` | User accounts with LINE OAuth |
| user_wallets | `user_wallets.json` | EVM wallet addresses and keys |
| referrals | `referrals.json` | Referral relationship tracking |
| egg_nfts | `egg_nfts.json` | Egg NFT metadata and state |
| animal_nfts | `animal_nfts.json` | Animal NFTs (hatched from eggs) |
| food_nfts | `food_nfts.json` | Food items for feeding eggs |
| commission_records | `commission_records.json` | Referral commission tracking |
| wallet_configs | `wallet_configs.json` | Wallet configuration |
| egg_consumption_logs | `egg_consumption_logs.json` | Egg usage history |

## API Endpoints Between Services

**PocketBase Custom Endpoints (`apps/backend/pb_hooks/`):**
```
POST /api/auth/line-user    - Get user by email
POST /api/auth/line-auth    - LINE OAuth authentication
POST /api/wallet/create     - Create wallet (proxy to wallet-srv)
POST /api/wallet/balance    - Get wallet balance
POST /api/wallet/withdraw   - Withdraw USDT
POST /api/wallet/spend      - Spend USDT (NFT mint)
POST /api/wallet/transfer   - Transfer USDT
POST /api/nft/egg/mint      - Mint Egg NFT
POST /api/nft/egg/feed      - Feed egg
POST /api/nft/egg/upgrade   - Upgrade egg rarity
POST /api/nft/egg/breed     - Breed animals
POST /api/nft/egg/hatch     - Hatch egg to animal
POST /api/commission/claim  - Claim referral commission
```

**Wallet Service (`wallet-srv/`):**
```
GET  /health                - Health check
POST /api/v1/wallet/create  - Create new EVM wallet
GET  /api/v1/chain/*        - Chain info endpoints
POST /api/v2/eip7702/*      - EIP-7702 operations
```

**Frontend → Backend:**
- PocketBase SDK calls from `apps/web/lib/pocketbase/client.ts`
- Direct API calls to PocketBase custom endpoints

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Console.log in PocketBase hooks (visible in Docker logs)
- `docker-compose logs -f` for live logs
- Nginx access logs: `/var/log/nginx/access.log`

**Analytics:**
- @vercel/analytics 1.6.1 - Frontend analytics

## CI/CD & Deployment

**Hosting:**
- Docker Compose deployment
- Nginx reverse proxy (ports 80, 443)
- Cloudflare CDN (configured in nginx.conf)

**CI Pipeline:**
- None detected in repository

**Container Services:**
- `pocketbase` (eggo-pb) - port 8090
- `wallet-srv` (eggo-wallet-srv) - port 3001 (external)
- `nginx` (eggo-nginx) - ports 80, 443

## Environment Configuration

**Required env vars:**
```bash
# LINE OAuth
LINE_CHANNEL_ID=<channel_id>
LINE_CHANNEL_SECRET=<channel_secret>

# Wallet Encryption (CRITICAL)
WALLET_MASTER_KEY=<32+ character key>

# Service URLs
WALLET_SRV_URL=http://wallet-srv:3000
APP_URL=http://localhost:8090

# Runtime
NODE_ENV=development|production
PORT=3000
```

**Secrets location:**
- `apps/backend/.env` - LINE OAuth, wallet encryption
- `wallet-srv/.env` - Service configuration
- Never committed to git

## Webhooks & Callbacks

**Incoming:**
- LINE OAuth callback: `/auth/line/callback` (handled by frontend)
- PocketBase record hooks: `onRecordCreate`, `onRecordUpdate` in pb_hooks/

**Outgoing:**
- None detected - No external webhook notifications

## Rate Limiting

**Nginx Configuration:**
- API zone: 10 requests/second (burst: 20)
- Login zone: 5 requests/minute (burst: 5)
- Health endpoint: No rate limiting

**Cloudflare:**
- Real IP passthrough configured
- DDoS protection via Cloudflare network

## Network Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│    Nginx     │────▶│   PocketBase    │
│  (Browser)  │     │ (443/80)     │     │    (8090)       │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │                      │
                           │                      ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │ Cloudflare   │     │   wallet-srv    │
                    │     CDN      │     │     (3000)      │
                    └──────────────┘     └─────────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │   BSC Network   │
                                         │  (via viem)     │
                                         └─────────────────┘
```

---

*Integration audit: 2026-04-02*
