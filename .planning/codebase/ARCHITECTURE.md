# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** Service-oriented monorepo with clear separation of concerns across frontend, backend, blockchain, and infrastructure layers.

**Key Characteristics:**
- Next.js 16 App Router with static export for CDN deployment
- PocketBase backend with JavaScript event hooks for business logic
- Dedicated wallet service (Express.js) for EVM wallet generation
- Foundry-based smart contracts for NFT mechanics
- Nginx reverse proxy for SSL termination and rate limiting

## Services

**Frontend (`apps/web/`):**
- Purpose: User interface and client-side interactions
- Location: `apps/web/`
- Contains: React 19 components, Next.js pages, shadcn/ui primitives
- Depends on: PocketBase SDK, Tailwind CSS 4
- Used by: End users via browser

**Backend (`apps/backend/`):**
- Purpose: Authentication, user data, business logic orchestration
- Location: `apps/backend/`
- Contains: PocketBase instance, 20 JavaScript hooks, SQLite database
- Depends on: Wallet service, LINE OAuth API
- Used by: Frontend, smart contracts (via wallet service)

**Wallet Service (`wallet-srv/`):**
- Purpose: EVM wallet generation and blockchain interactions
- Location: `wallet-srv/`
- Contains: Express.js server, dacc-js integration, ethers/viem
- Depends on: BSC/Ethereum RPC endpoints
- Used by: PocketBase hooks (auto-wallet on signup)

**Smart Contracts (`contracts/`):**
- Purpose: NFT minting, breeding, feeding, commission distribution
- Location: `contracts/`
- Contains: 5 Solidity contracts, Foundry tests, deployment scripts
- Depends on: OpenZeppelin contracts
- Used by: Wallet service (via blockchain RPC)

**Infrastructure (`nginx/`):**
- Purpose: Reverse proxy, SSL termination, rate limiting
- Location: `nginx/`
- Contains: Nginx configuration, SSL certificates
- Depends on: Backend services
- Used by: All external traffic

## Data Flow

**User Registration Flow:**

1. User submits signup form at `/auth/sign-up`
2. Frontend calls PocketBase `users` collection create endpoint
3. Hook `01-create-wallet.pb.js` triggers on record creation
4. Hook calls wallet-srv `POST /api/v1/wallet/create`
5. Wallet-srv generates EVM wallet using dacc-js
6. Wallet address, public key, and encrypted PIN saved to user record
7. User authenticated and redirected to dashboard

**LINE OAuth Flow:**

1. User clicks "Login with LINE" at `/auth/line`
2. Frontend redirects to LINE authorization URL
3. LINE redirects back to `/auth/callback` with auth code
4. Hook `05-auth-token.pb.js` exchanges code for tokens
5. User record fetched/created by email
6. Frontend authenticates with PocketBase using returned credentials

**Egg NFT Minting Flow:**

1. User initiates mint from dashboard
2. Frontend calls PocketBase hook `13-mint-egg-nft.pb.js`
3. Hook validates user has sufficient USDT balance
4. Hook calls wallet-srv to sign and broadcast transaction
5. Wallet-srv interacts with `EggNFT.sol` contract on BSC
6. Transaction hash returned and stored in PocketBase
7. NFT ownership reflected in user dashboard

**Commission Distribution Flow:**

1. Egg minted with referral chain (up to 4 levels)
2. `EggNFT.sol` calls `CommissionDistribution.distributeCommission()`
3. USDT split among referrers according to tier percentages
4. Commission records stored in PocketBase `commission_records` collection
5. Users can claim accumulated commissions via hook `14-claim-commission.pb.js`

## State Management

**Client-Side:**
- PocketBase auth store synced with localStorage
- React Context for theme, toast notifications
- Custom hooks (`useEggNft`, `useFoodNft`) for blockchain state

**Server-Side:**
- PocketBase SQLite database for all persistent data
- In-memory config in hook `00-config.pb.js`
- Wallet encryption keys in environment variables

**Blockchain:**
- ERC721 NFTs (EggNFT, AnimalNFT, FoodNFT)
- ERC20 USDT for payments
- CommissionDistribution contract for referral rewards

## Entry Points

**Frontend Entry:**
- Location: `apps/web/app/page.tsx`
- Triggers: Browser navigation
- Responsibilities: Landing page, auth state check, dashboard render

**Backend Entry:**
- Location: `apps/backend/pb_hooks/00-config.pb.js` (first loaded)
- Triggers: PocketBase startup
- Responsibilities: Configuration validation, global settings

**Wallet Service Entry:**
- Location: `wallet-srv/src/index.ts`
- Triggers: Docker container start
- Responsibilities: Express server initialization, route registration

**Contract Deployment:**
- Location: `contracts/script/DeployEggNFT.s.sol`
- Triggers: `forge script` command
- Responsibilities: Deploy contracts, verify on BSCScan

## Error Handling

**Strategy:** Layered error handling with consistent response format across services.

**Patterns:**
- Frontend: Try-catch with toast notifications via `use-toast.ts`
- Backend: JSON error responses `{ success: false, error: { message, code } }`
- Wallet Service: Express error middleware with structured logging
- Contracts: Require statements with revert messages

**Error Codes (Backend):**
- `AUTH_REQUIRED`: Missing or invalid authentication
- `WALLET_NOT_FOUND`: User has no associated wallet
- `BALANCE_NATIVE_FAILED`: Blockchain balance query failed
- `INSUFFICIENT_BALANCE`: User balance too low
- `NETWORK_ERROR`: RPC or network failure

## Cross-Cutting Concerns

**Logging:**
- Frontend: Console.log with hydration checks
- Backend: PocketBase console output (visible in Docker logs)
- Wallet Service: Express console.log with request tracing
- Contracts: Foundry test logs, event emissions

**Validation:**
- Frontend: Zod schemas in form components
- Backend: Body parsing with required field checks in hooks
- Wallet Service: Input validation in route handlers
- Contracts: Require statements with descriptive messages

**Authentication:**
- LINE OAuth 2.0 flow with PKCE
- PocketBase token-based auth (JWT)
- Middleware at `apps/web/middleware.ts` for route protection
- Hook authentication via `$apis.requireAuth(e)`

**Rate Limiting:**
- Nginx: 10 requests/second for API, 5/minute for login
- Cloudflare: Additional layer in production
- Blockchain: Gas limits and transaction nonce management

## Component Relationships

```
┌─────────────────┐         ┌─────────────────┐
│   Cloudflare    │────────▶│      Nginx      │
│      CDN        │         │  (SSL/Reverse)  │
└─────────────────┘         └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │  Next.js     │ │  PocketBase  │ │  Wallet-srv  │
           │  (Static)    │ │  (SQLite)    │ │  (Express)   │
           │  apps/web/   │ │ apps/backend/│ │  wallet-srv/ │
           └──────────────┘ └──────┬───────┘ └──────┬───────┘
                                   │                │
                                   │                │
                                   ▼                ▼
                          ┌─────────────────────────────────┐
                          │      BSC/Ethereum Blockchain    │
                          │  ┌───────────────────────────┐  │
                          │  │  EggNFT.sol               │  │
                          │  │  AnimalNFT.sol            │  │
                          │  │  FoodNFT.sol              │  │
                          │  │  CommissionDistribution   │  │
                          │  └───────────────────────────┘  │
                          └─────────────────────────────────┘
```

---

*Architecture analysis: 2026-04-02*
