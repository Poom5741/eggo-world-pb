# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Service-oriented monorepo with clean separation between frontend (Next.js), backend (PocketBase), wallet service (Express), and blockchain layer (Foundry).

**Key Characteristics:**
- Next.js 16 App Router with static export for edge deployment
- PocketBase backend with numbered JavaScript event hooks (00-99)
- Express.js wallet service for EVM wallet generation with dacc-js
- Foundry smart contracts for NFT game mechanics on BSC
- LINE OAuth 2.0 authentication with PKCE flow
- Sequential hook execution order ensures deterministic behavior

## Layers

**Frontend Layer (`apps/web/`):**
- Purpose: User interface and client-side interactions
- Location: `apps/web/`
- Contains: React 19 components, Next.js pages, shadcn/ui primitives, custom hooks
- Depends on: PocketBase JS SDK, Tailwind CSS 4, ethers v6
- Used by: End users via browser (Cloudflare Pages deployment)

**Backend Layer (`apps/backend/`):**
- Purpose: Authentication, user data management, business logic orchestration
- Location: `apps/backend/`
- Contains: PocketBase instance, 20+ JavaScript hooks, SQLite database, collection schemas
- Depends on: Wallet service (`wallet-api`), LINE OAuth API, BSC RPC
- Used by: Frontend via PocketBase SDK, smart contracts via wallet service

**Wallet Service Layer (`wallet-api/`):**
- Purpose: EVM wallet generation and blockchain transaction signing
- Location: `wallet-api/`
- Contains: Express.js server, ethers v6 integration, encryption utilities
- Depends on: BSC/Ethereum RPC endpoints, PocketBase admin API
- Used by: PocketBase hooks (auto-wallet creation on user signup)

**Blockchain Layer (`contracts/`):**
- Purpose: NFT minting, breeding, feeding, upgrade mechanics, commission distribution
- Location: `contracts/`
- Contains: 5 Solidity contracts (EggNFT, AnimalNFT, FoodNFT, CommissionDistribution, MockUSDT), Foundry tests, deployment scripts
- Depends on: OpenZeppelin contracts v0.8.24
- Used by: Wallet service via blockchain RPC calls

**Infrastructure Layer (`nginx/`):**
- Purpose: Reverse proxy, SSL termination, rate limiting
- Location: `nginx/`
- Contains: Nginx configuration files, SSL certificate paths
- Depends on: Backend services (PocketBase, wallet-api)
- Used by: All external traffic

## Data Flow

**User Registration with LINE OAuth:**

1. User clicks "Login with LINE" at `/auth/line`
2. Frontend redirects to LINE authorization URL with PKCE code verifier
3. User authenticates on LINE platform
4. LINE redirects to `/auth/callback` with authorization code
5. Frontend calls PocketBase `authWithOAuth2Code()` with code + verifier
6. PocketBase hook `05-auth-token.pb.js` exchanges code for LINE tokens
7. LINE returns user profile (externalId, name, avatar, email)
8. PocketBase creates/updates user record in `users` collection
9. Hook `01-create-wallet.pb.js` triggers on `onRecordCreate("users")`
10. Hook calls `POST http://wallet-api:3001/api/wallet/create`
11. Wallet API generates EVM wallet using `ethers.Wallet.createRandom()`
12. Wallet API encrypts private key with XOR (demo, upgrade to AES)
13. Wallet address + public key returned to hook
14. Hook sets `wallet`, `daccPublickey`, `pin` fields on user record
15. User authenticated, redirect to `/dashboard`

**Egg NFT Minting Flow:**

1. User initiates mint from dashboard `/eggs`
2. Frontend validates user has sufficient USDT balance (25 USDT)
3. Frontend calls PocketBase hook `13-mint-egg-nft.pb.js`
4. Hook validates user balance ≥ mint price
5. Hook builds referral chain (up to 4 levels from `referrals` collection)
6. Hook calls wallet-api to sign + broadcast transaction
7. Wallet-api calls `EggNFT.mintWithReferrer()` on BSC testnet/mainnet
8. Contract mints ERC721 NFT, emits `EggMinted` event
9. Contract calls `CommissionDistribution.distributeCommission()`
10. USDT split among referrers per tier percentages (4% platform fee)
11. Transaction hash returned to hook
12. Hook stores tx hash in `egg_nfts` collection
13. Frontend polls for confirmation, updates UI

**Commission Distribution Flow:**

1. Egg minted with referral chain (referrer, grand-referrer, etc.)
2. `EggNFT.sol` constructor calls `CommissionDistribution.distributeCommission()`
3. USDT transferred from minter to commission contract
4. Commission split: 40% direct, 20% level2, 10% level3, 6% level4 (80% total)
5. 4% platform fee to `platformAddress`
6. Contract emits `CommissionDistributed` event per recipient
7. PocketBase hook `14-claim-commission.pb.js` listens for claims
8. User claims accumulated commission via frontend
9. Transfer USDT from contract to user wallet

**Egg Hatching Flow:**

1. User selects egg to hatch from `/eggs` dashboard
2. User must feed egg with ≥2 Food NFTs (max 10)
3. Frontend calls hook `19-hatch-egg.pb.js`
4. Hook validates egg ownership + food requirements met
5. Hook calls wallet-api to invoke `EggNFT.hatch(eggId, foodTokenIds)`
6. Contract burns Food NFTs, calculates rarity from food types + seed
7. Contract mints AnimalNFT with rarity (Common, Rare, Epic, Legendary)
8. Contract sets `animal_token_id` on egg, marks `is_hatched = true`
9. AnimalNFT stored in user wallet, egg remains as parent record

## State Management

**Client-Side (Frontend):**
- PocketBase auth store synced with localStorage + `pb_auth` cookie
- React Context for theme (next-themes), toast notifications (sonner)
- Custom hooks (`useEggNft`, `useFoodNft`, `useAnimalNft`) for blockchain state
- Hydration safety via `useIsHydrated()` pattern to avoid SSR mismatches

**Server-Side (PocketBase):**
- SQLite database for all persistent data (users, NFTs, referrals, transactions)
- In-memory config object in hook `00-config.pb.js` (LINE OAuth, blockchain RPC)
- Wallet encryption keys from environment variables (`WALLET_MASTER_KEY`)
- Hook execution order guaranteed by filename prefix (00 → 99)

**Blockchain (On-Chain):**
- ERC721 NFTs: EggNFT (egg properties), AnimalNFT (hatched animals), FoodNFT (food items)
- ERC20 USDT: Payment currency for minting, fees, commissions
- CommissionDistribution: Multi-sig-style commission split logic
- State transitions: Egg → Animal (hatch), Food → burned (feed)

## Key Abstractions

**PocketBase Hooks:**
- Purpose: Event-driven business logic layer
- Examples: `apps/backend/pb_hooks/01-create-wallet.pb.js`, `13-mint-egg-nft.pb.js`
- Pattern: `onRecordCreate("users", (e) => { ... })` or `routerAdd("POST", "/api/v2/endpoint", (e) => { ... })`

**Wallet Creation Abstraction:**
- Purpose: Decouple wallet generation from user record creation
- Location: `wallet-api/server.js`
- Pattern: `POST /api/wallet/create` → `{ address, publicKey, encryptedPrivateKey }`

**NFT Metadata:**
- Purpose: Store NFT properties off-chain (PocketBase) with on-proof ownership (blockchain)
- Examples: `apps/backend/collections/egg_nfts.json`, `animal_nfts.json`
- Pattern: `tokenId` (blockchain) ↔ `record.id` (PocketBase)

**Referral Chain:**
- Purpose: Track multi-level referral relationships for commission distribution
- Location: `apps/backend/collections/referrals.json`, hook `06-referral-chain.pb.js`
- Pattern: `upline_id` → `upline.upline_id` → recursive chain (max 4 levels)

## Entry Points

**Frontend Entry (Landing):**
- Location: `apps/web/app/page.tsx`
- Triggers: Browser navigation to `/`
- Responsibilities: Auth state check, redirect to dashboard or show landing content

**Frontend Entry (Dashboard):**
- Location: `apps/web/app/dashboard/page.tsx`
- Triggers: Authenticated user navigation
- Responsibilities: Fetch user data, render egg/food/commission stats

**Backend Entry (PocketBase):**
- Location: `apps/backend/pb_hooks/00-config.pb.js` (first loaded by alphabetical order)
- Triggers: PocketBase server startup
- Responsibilities: Validate env vars, set global config object, register LINE OAuth URLs

**Wallet Service Entry:**
- Location: `wallet-api/server.js`
- Triggers: `bun run dev` or Docker container start
- Responsibilities: Start Express server on port 3001, register routes

**Contract Deployment:**
- Location: `contracts/script/DeployEggNFT.s.sol`
- Triggers: `forge script script/DeployEggNFT.s.sol --broadcast --rpc-url ...`
- Responsibilities: Deploy EggNFT, AnimalNFT, FoodNFT, CommissionDistribution, verify on BSCScan

## Error Handling

**Strategy:** Layered error handling with consistent JSON response format across all services.

**Patterns:**
- Frontend: Try-catch with toast notifications via `use-toast.ts` hook
- Backend: `{ success: false, error: { message, code } }` JSON responses
- Wallet Service: Express error middleware with structured logging
- Contracts: `require()` statements with descriptive revert messages

**Error Codes (Backend Hooks):**
- `AUTH_REQUIRED`: Missing or invalid authentication token
- `WALLET_NOT_FOUND`: User record lacks wallet address
- `BALANCE_NATIVE_FAILED`: Blockchain balance query failed (RPC error)
- `INSUFFICIENT_BALANCE`: User USDT balance < required amount
- `NETWORK_ERROR`: RPC endpoint unreachable or timeout
- `VALIDATION_ERROR`: Input validation failed (missing fields, invalid format)
- `OPERATION_FAILED`: Generic catch-all for unexpected errors

**Frontend Error Display:**
- Toast notifications (sonner) with error.message
- Redirect to error page for critical failures (`/auth/error`)
- Retry logic with exponential backoff for transient network errors

## Cross-Cutting Concerns

**Logging:**
- Frontend: `console.log` with hydration checks (`if (!isHydrated) return`)
- Backend: PocketBase console output (visible via `docker-compose logs -f`)
- Wallet Service: Express `console.log` with request/response tracing
- Contracts: Foundry test logs (`console.log` in Solidity), event emissions (indexed params)

**Validation:**
- Frontend: Zod schemas in form components (react-hook-form + @hookform/resolvers)
- Backend: Body parsing with required field checks (`if (!body.field) return e.json(400, ...)`)
- Wallet Service: Input validation in route handlers (password length, address format)
- Contracts: Require statements with gas-efficient checks early in functions

**Authentication:**
- LINE OAuth 2.0 with PKCE (code verifier in localStorage)
- PocketBase token-based auth (JWT stored in cookie + localStorage)
- Middleware at `apps/web/middleware.ts` for route protection redirects
- Hook authentication via `$apis.requireAuth(e)` (throws on missing auth)
- Token refresh via `authRefresh()` when PocketBase token expires

**Rate Limiting:**
- Nginx: 10 requests/second for API endpoints, 5/minute for login attempts
- Cloudflare: Additional WAF + rate limiting layer in production
- Blockchain: Gas limits per transaction, nonce management to prevent frontrunning

**Configuration Management:**
- Frontend: Environment variables via `NEXT_PUBLIC_POCKETBASE_URL`
- Backend: `.env` file with LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, WALLET_SRV_URL
- Wallet Service: `WALLET_MASTER_KEY` for encryption, CORS_ORIGINS
- Contracts: Constructor parameters (commission address, USDT token address)

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                            │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare CDN / Pages                     │
│              (Static Next.js export, WAF, caching)           │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Reverse Proxy                     │
│           (SSL termination, rate limiting, routing)          │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               │                      │
               ▼                      ▼
    ┌────────────────────┐  ┌────────────────────┐
    │   PocketBase       │  │   Wallet API       │
    │   (Port 8090)      │  │   (Port 3001)      │
    │   - SQLite DB      │  │   - Express.js     │
    │   - 20+ hooks      │  │   - ethers v6      │
    │   - LINE OAuth     │  │   - Wallet gen     │
    └─────────┬──────────┘  └─────────┬──────────┘
              │                       │
              │                       │
              ▼                       ▼
    ┌──────────────────────────────────────────┐
    │         BSC / Ethereum Blockchain         │
    │  ┌────────────────────────────────────┐  │
    │  │  EggNFT.sol (ERC721)               │  │
    │  │  - Mint, Hatch, Feed, Upgrade      │  │
    │  │  - Referral chain tracking         │  │
    │  ├────────────────────────────────────┤  │
    │  │  AnimalNFT.sol (ERC721)            │  │
    │  │  - Breeding, rarity inheritance    │  │
    │  ├────────────────────────────────────┤  │
    │  │  FoodNFT.sol (ERC721)              │  │
    │  │  - Mint with USDT, burn on feed    │  │
    │  ├────────────────────────────────────┤  │
    │  │  CommissionDistribution.sol        │  │
    │  │  - 4-level referral split          │  │
    │  └────────────────────────────────────┘  │
    └──────────────────────────────────────────┘
```

---

*Architecture analysis: 2026-04-15*
