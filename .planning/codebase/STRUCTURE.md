# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```
eggo-pocketbase/
├── apps/
│   ├── web/                    # Next.js 16 frontend (Bun runtime)
│   └── backend/                # PocketBase backend (LINE OAuth, hooks)
├── wallet-api/                 # Express.js wallet generation (legacy)
├── wallet-srv/                 # Express.js wallet service (dacc-js, TypeScript)
├── contracts/                  # Foundry smart contracts (Solidity 0.8.24)
├── nginx/                      # Nginx reverse proxy configuration
├── resources/mvp-foodcourt/    # Reference implementation (Thai language)
├── docs/                       # Documentation files
├── .planning/                  # AI planning and codebase analysis
├── docker-compose.yml          # Docker orchestration
├── Makefile                    # Make commands for common tasks
└── package.json                # Root package (workspace config)
```

## Directory Purposes

**apps/web/:**
- Purpose: User-facing web application
- Contains: Next.js pages, React components, hooks, utilities
- Key files: `app/page.tsx`, `middleware.ts`, `lib/pocketbase/client.ts`

**apps/backend/:**
- Purpose: Backend API and database
- Contains: PocketBase binary config, hooks, migrations, collections
- Key files: `pb_hooks/01-create-wallet.pb.js`, `collections/users.json`

**wallet-srv/:**
- Purpose: EVM wallet generation and blockchain operations
- Contains: TypeScript Express server with dacc-js integration
- Key files: `src/index.ts`, `src/routes/createWallet.ts`

**wallet-api/:**
- Purpose: Legacy wallet service (ethers v6, JavaScript)
- Contains: Simple wallet generation endpoint
- Key files: `server.js`

**contracts/:**
- Purpose: Smart contracts for NFT game mechanics
- Contains: Solidity sources, Foundry tests, deployment scripts
- Key files: `src/EggNFT.sol`, `test/EggNFT.t.sol`, `script/DeployEggNFT.s.sol`

**nginx/:**
- Purpose: Reverse proxy and SSL configuration
- Contains: Nginx config files, SSL certificate paths
- Key files: `nginx.conf`, `conf.d/pocketbase.conf`

**resources/mvp-foodcourt/:**
- Purpose: Reference implementation for patterns
- Contains: Complete MVP with 20+ hook examples
- Key files: `pb_hooks/`, `app/`, `CLAUDE.md`

## Key File Locations

**Entry Points:**
- `apps/web/app/page.tsx`: Landing page and auth state check
- `apps/web/middleware.ts`: Edge auth middleware for route protection
- `wallet-srv/src/index.ts`: Wallet service Express server
- `contracts/script/DeployEggNFT.s.sol`: Contract deployment script

**Configuration:**
- `apps/web/next.config.mjs`: Next.js build config (static export)
- `apps/web/tsconfig.json`: TypeScript config with path aliases
- `apps/backend/.env`: LINE OAuth credentials, wallet API URL
- `wallet-srv/.env`: Master encryption key, CORS config
- `contracts/foundry.toml`: Foundry config, RPC endpoints
- `nginx/nginx.conf`: Nginx main config, rate limiting zones

**Core Logic:**
- `apps/backend/pb_hooks/01-create-wallet.pb.js`: Auto-wallet on signup
- `apps/backend/pb_hooks/05-auth-token.pb.js`: LINE OAuth token exchange
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js`: Egg NFT minting
- `wallet-srv/src/routes/createWallet.ts`: Wallet generation endpoint
- `contracts/src/EggNFT.sol`: Egg NFT contract with breeding logic

**Testing:**
- `apps/web/*.test.tsx`: Colocated component tests (Bun test)
- `apps/backend/wallet.test.js`: Hook integration tests
- `wallet-api/health.test.js`: Health check tests
- `contracts/test/*.t.sol`: Foundry contract tests

## Naming Conventions

**Files:**
- React components: PascalCase (`Dashboard.tsx`, `EggNftCard.tsx`)
- Hooks: `use*` prefix (`use-mobile.ts`, `use-toast.ts`)
- Pages: `page.tsx` in directory matching route
- PocketBase hooks: `NN-feature.pb.js` (NN = execution order 00-99)
- Contract tests: `*.t.sol` (`EggNFT.t.sol`)
- Deployment scripts: `Deploy*.s.sol` (`DeployEggNFT.s.sol`)

**Directories:**
- kebab-case for routes (`auth/sign-up/`, `dashboard/eggs/`)
- PascalCase for component types (`components/ui/`)
- snake_case for backend migrations (`1774772600_updated_users.js`)

## Import/Export Patterns

**Frontend Imports:**
```typescript
// Path aliases
import { createClient } from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

// External packages
import PocketBase from 'pocketbase'
import { useRouter } from 'next/navigation'

// React
import { useEffect, useState } from 'react'
```

**Backend Hook Pattern:**
```javascript
// onRecordCreate hook
onRecordCreate("users", (e) => {
  const record = e.record
  // Logic here
  e.next()
})

// routerAdd endpoint
routerAdd("POST", "/api/v2/endpoint", (e) => {
  const { users } = e.requireAuth()
  const body = e.parseBody()
  e.json(200, { success: true, data: result })
})
```

**Contract Imports:**
```solidity
// OpenZeppelin
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Local contracts
import {CommissionDistribution} from "./CommissionDistribution.sol";
import {FoodNFT, FoodType} from "./FoodNFT.sol";
```

## Code Ownership Boundaries

**Frontend Team:**
- `apps/web/app/` - All pages and layouts
- `apps/web/components/` - React components
- `apps/web/hooks/` - Custom React hooks
- `apps/web/lib/` - Client utilities
- `apps/web/styles/` - Global styles

**Backend Team:**
- `apps/backend/pb_hooks/` - Business logic hooks
- `apps/backend/collections/` - Database schemas
- `apps/backend/pb_migrations/` - Schema migrations

**Blockchain Team:**
- `contracts/src/` - Smart contract implementation
- `contracts/test/` - Foundry tests
- `contracts/script/` - Deployment scripts

**Infrastructure Team:**
- `nginx/` - Reverse proxy configuration
- `docker-compose.yml` - Service orchestration
- `wallet-srv/` - Wallet generation service

## Where to Add New Code

**New Feature Page:**
- Primary code: `apps/web/app/{feature}/page.tsx`
- Components: `apps/web/components/{feature}/`
- Hooks: `apps/web/hooks/use-{feature}.ts`

**New API Endpoint:**
- Implementation: `apps/backend/pb_hooks/NN-{feature}.pb.js`
- Next sequence number after existing hooks
- Use `routerAdd()` with `$apis.requireAuth(e)`

**New Blockchain Operation:**
- Contract change: `contracts/src/{Contract}.sol`
- Test: `contracts/test/{Contract}.t.sol`
- Wallet service route: `wallet-srv/src/routes/{feature}.ts`

**New Database Collection:**
- Schema: `apps/backend/collections/{name}.json`
- Migration: `apps/backend/pb_migrations/{timestamp}_{action}_{name}.js`
- Hook integration: `apps/backend/pb_hooks/`

**New Utility/Hook:**
- Frontend utility: `apps/web/lib/{name}.ts`
- React hook: `apps/web/hooks/use-{name}.ts`
- Shared constants: Add to `apps/backend/pb_hooks/00-config.pb.js`

## Special Directories

**apps/web/.next/:**
- Purpose: Next.js build output
- Generated: Yes (by `next build`)
- Committed: No (should be in .gitignore but currently present)

**apps/backend/pb_data/:**
- Purpose: PocketBase runtime data (SQLite, uploads)
- Generated: Yes (by PocketBase)
- Committed: No (gitignored)

**contracts/cache/:**
- Purpose: Foundry build cache
- Generated: Yes (by `forge build`)
- Committed: No (gitignored)

**contracts/out/:**
- Purpose: Compiled contract artifacts
- Generated: Yes (by Foundry)
- Committed: No (gitignored)

**resources/mvp-foodcourt/:**
- Purpose: Reference implementation for patterns
- Generated: No (submodule or reference code)
- Committed: Yes (as documentation)
- Note: Contains 20+ hook examples in Thai language

**wallet-srv/node_modules/:**
- Purpose: TypeScript/Express dependencies
- Generated: Yes (by `bun install`)
- Committed: No (gitignored)

## File Structure Reference

```
apps/web/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout with fonts
│   ├── globals.css                 # Tailwind 4 styles
│   ├── auth/
│   │   ├── login/page.tsx          # Login form
│   │   ├── sign-up/page.tsx        # Signup form
│   │   ├── callback/page.tsx       # OAuth callback handler
│   │   ├── line/page.tsx           # LINE OAuth redirect
│   │   └── error/page.tsx          # Error display
│   └── dashboard/
│       ├── eggs/                   # Egg NFT management
│       └── commissions/            # Commission tracking
├── components/
│   ├── dashboard.tsx               # Main dashboard component
│   ├── header.tsx                  # Navigation header
│   ├── logout-button.tsx           # Auth logout
│   ├── wallet-modal.tsx            # Wallet connection UI
│   ├── theme-provider.tsx          # Dark/light mode
│   ├── ui/                         # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ... (40+ components)
│   ├── egg-nft/                    # Egg NFT components
│   └── food-nft/                   # Food NFT components
├── hooks/
│   ├── use-mobile.ts               # Mobile detection
│   ├── use-toast.ts                # Toast notifications
│   ├── use-egg-nft.ts              # Egg NFT state/operations
│   └── use-food-nft.ts             # Food NFT state/operations
├── lib/
│   ├── utils.ts                    # General utilities
│   └── pocketbase/
│       └── client.ts               # PocketBase SDK wrapper
├── middleware.ts                   # Edge auth middleware
├── next.config.mjs                 # Next.js configuration
├── tsconfig.json                   # TypeScript with path aliases
└── package.json                    # Dependencies (Bun)

apps/backend/
├── pb_hooks/
│   ├── 00-config.pb.js             # Global configuration
│   ├── 01-create-wallet.pb.js      # Auto-wallet on user signup
│   ├── 05-auth-token.pb.js         # LINE OAuth token exchange
│   ├── 06-referral-chain.pb.js     # Referral tracking
│   ├── 13-mint-egg-nft.pb.js       # Egg NFT minting
│   ├── 14-claim-commission.pb.js   # Commission claims
│   ├── 15-mint-food-nft.pb.js      # Food NFT minting
│   ├── 16-feed-egg.pb.js           # Egg feeding mechanic
│   ├── 17-upgrade-egg-rarity.pb.js # Rarity upgrades
│   ├── 18-breed-animals.pb.js      # Animal breeding
│   ├── 19-hatch-egg.pb.js          # Egg hatching
│   └── 99-debug.pb.js              # Debug utilities
├── collections/
│   ├── users.json                  # User schema
│   ├── user_wallets.json           # Wallet metadata
│   ├── referrals.json              # Referral relationships
│   ├── egg_nfts.json               # Egg NFT tracking
│   ├── food_nfts.json              # Food NFT tracking
│   ├── animal_nfts.json            # Animal NFT tracking
│   ├── commission_records.json     # Commission distribution
│   └── wallet_configs.json         # Wallet configuration
├── pb_migrations/
│   ├── 1774280543_updated_users.js
│   ├── 1774772600_updated_users.js
│   ├── 1774772601_create_user_wallets.js
│   └── ... (timestamped migrations)
└── docker-compose.yml              # PocketBase container config

contracts/
├── src/
│   ├── EggNFT.sol                  # Main Egg NFT contract
│   ├── AnimalNFT.sol               # Animal NFT (hatched from eggs)
│   ├── FoodNFT.sol                 # Food NFT (for feeding)
│   ├── CommissionDistribution.sol  # Referral commission logic
│   └── Counter.sol                 # Simple counter (example)
├── test/
│   ├── EggNFT.t.sol                # EggNFT tests
│   ├── AnimalNFT.t.sol             # AnimalNFT tests
│   ├── FoodNFT.t.sol               # FoodNFT tests
│   ├── EggHatching.t.sol           # Hatching logic tests
│   ├── EggFeeding.t.sol            # Feeding logic tests
│   ├── EggUpgrading.t.sol          # Rarity upgrade tests
│   ├── AnimalBreeding.t.sol        # Breeding tests
│   └── MockUSDT.sol                # Mock USDT for testing
├── script/
│   ├── DeployEggNFT.s.sol          # Deployment script
│   └── TestEggHatching.s.sol       # Hatching test script
├── foundry.toml                    # Foundry configuration
└── remappings.txt                  # Solidity import remappings
```

---

*Structure analysis: 2026-04-02*
