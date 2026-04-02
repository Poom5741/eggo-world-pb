# Technology Stack

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- TypeScript 5.7.3 - Frontend application (`apps/web/`)
- JavaScript (ESM) - PocketBase hooks (`apps/backend/pb_hooks/`)
- Solidity 0.8.24 - Smart contracts (`contracts/src/`)

**Secondary:**
- Go - PocketBase runtime (via Docker)

## Runtime

**Environment:**
- Bun 1.x - Frontend runtime and test runner
- Node.js 20.x - Wallet service runtime (via bun-types)
- Docker 20.10+ - Container runtime for backend services

**Package Manager:**
- Bun - Frontend package management (`apps/web/`)
- npm-compatible - Backend services

## Frameworks

**Core:**
- Next.js 16.1.6 - React framework (`apps/web/`)
- React 19.2.4 - UI library
- PocketBase 0.26.8 - Backend-as-a-Service (`apps/backend/`)
- Express.js 4.18.2 - Wallet API server (`wallet-srv/`)

**UI/Styling:**
- shadcn/ui - Component library (New York style)
- Tailwind CSS 4.2.0 - Utility-first CSS
- Radix UI primitives - Accessible components
- Lucide React 0.564.0 - Icon library

**Blockchain:**
- Foundry - Smart contract development toolkit
- ethers.js 6.9.0 - Ethereum library (wallet-api legacy)
- viem 2.47.6 - Modern Ethereum library (`wallet-srv/`)
- dacc-js 0.0.5 - DACC wallet SDK (`wallet-srv/`)

**Testing:**
- Bun test - Test runner (native)
- @testing-library/react 16.3.2 - React testing utilities
- @testing-library/jest-dom 6.9.1 - DOM matchers
- @testing-library/user-event 14.6.1 - User interaction testing

**Build/Dev:**
- TypeScript 5.7.3 - Type checking
- PostCSS 8.5 - CSS processing
- Autoprefixer 10.4.20 - CSS vendor prefixes
- next-themes 0.4.6 - Dark mode support

## Key Dependencies

**Critical:**
- pocketbase 0.25.2 (frontend SDK) / 0.26.8 (backend dev) - Database and auth
- zod 3.24.1 - Schema validation
- react-hook-form 7.54.1 - Form handling
- @hookform/resolvers 3.9.1 - Zod integration

**State Management:**
- React Context - Application state
- no external state library detected

**Infrastructure:**
- @vercel/analytics 1.6.1 - Analytics integration
- helmet 7.1.0 - Security headers (wallet-srv)
- cors 2.8.5 - CORS middleware
- dotenv 16.3.1 - Environment variables

**NFT/Gaming:**
- OpenZeppelin Contracts 5.x - ERC721, ERC20, ReentrancyGuard, Ownable
- Custom NFT contracts: EggNFT, AnimalNFT, FoodNFT, CommissionDistribution

## Configuration

**Environment:**
- `.env` files per service (not committed)
- LINE_CHANNEL_ID, LINE_CHANNEL_SECRET - OAuth
- WALLET_MASTER_KEY - Wallet encryption (32+ chars)
- NODE_ENV, APP_URL, PORT - Runtime config

**Build:**
- `next.config.mjs` - Next.js configuration (static export)
- `tsconfig.json` - TypeScript paths (`@/*` alias)
- `foundry.toml` - Solidity compiler config (via_ir enabled)
- `docker-compose.yml` - Service orchestration

**TypeScript:**
- strict: true
- moduleResolution: bundler
- jsx: react-jsx
- noEmit: true (Next.js handles compilation)

## Platform Requirements

**Development:**
- Docker Desktop or Docker Engine
- Bun runtime (frontend)
- Node.js 20+ (wallet services)
- Foundry (contracts)
- Make (optional, for convenience commands)

**Production:**
- Docker Compose deployment
- Nginx reverse proxy (SSL termination, rate limiting)
- Cloudflare DNS/CDN (configured in nginx)
- BSC network access (testnet: 97, mainnet: 56)

## Tooling

**Linting:**
- ESLint - Code quality (`bun run lint`)

**Contract Development:**
- Forge - Build, test, deploy
- solc 0.8.24 - Solidity compiler
- optimizer: true, runs: 200

**Database:**
- SQLite (embedded in PocketBase)
- pb_migrations/ - Schema migrations

---

*Stack analysis: 2026-04-02*
