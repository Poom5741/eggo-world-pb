# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- **TypeScript** 5.7.3 - Frontend application (`apps/web/`), Wallet API (`wallet-api/`)
- **JavaScript** (ES Modules) - PocketBase hooks (`apps/backend/pb_hooks/`)
- **Solidity** 0.8.24 - Smart contracts (`contracts/src/`)

**Secondary:**
- **HTML/CSS** - UI templates and styling

## Runtime

**Environment:**
- **Bun** - Primary runtime for frontend and wallet API (configured via `bunfig.toml`)
- **Node.js** - Compatible runtime (fallback for wallet-api)
- **PocketBase** v0.25.2+ - Backend server with embedded Go runtime

**Package Manager:**
- **Bun** - Used for `apps/web`, `wallet-api`, and backend tests
- Lockfile: `bun.lock` present in `apps/backend/`

## Frameworks

**Core:**
- **Next.js** 16.1.6 - Frontend framework with App Router (`apps/web/`)
- **React** 19.2.4 - UI library
- **PocketBase** - Backend-as-a-Service with real-time subscriptions
- **Express.js** 4.18.2 - Wallet API server (`wallet-api/src/index.ts`)
- **Foundry** - Smart contract development framework (`contracts/`)

**Testing:**
- **Bun Test** - Native test runner (`bun test`)
- **Testing Library** 16.3.2 - React component testing
- **Happy DOM** 20.8.9 - DOM simulation for tests
- **JSDOM** 29.0.1 - Alternative DOM environment

**Build/Dev:**
- **Next.js Compiler** - Production builds (`next build`)
- **TypeScript** 5.7.3 - Type checking
- **ESLint** 10.1.0 - Code linting
- **Prettier** 3.8.1 - Code formatting
- **Husky** 9.1.7 - Git hooks
- **lint-staged** 16.4.0 - Pre-commit linting

## Key Dependencies

**Frontend (`apps/web/package.json`):**
- **shadcn/ui** - Component library (Radix UI primitives)
  - `@radix-ui/react-*` - 20+ UI components (dialog, dropdown, modal, etc.)
  - `class-variance-authority` 0.7.1 - Component variants
  - `tailwind-merge` 3.3.1 - Tailwind class merging
- **Tailwind CSS** 4.2.0 - Utility-first styling
- **Lucide React** 0.564.0 - Icon library
- **ethers** 6.16.0 - Blockchain interactions
- **PocketBase SDK** 0.25.2 - Backend client
- **react-hook-form** 7.54.1 - Form management
- **@hookform/resolvers** 3.9.1 - Form validation
- **zod** 3.24.1 - Schema validation
- **next-themes** 0.4.6 - Dark/light mode
- **sonner** 1.7.1 - Toast notifications
- **recharts** 2.15.0 - Data visualization
- **date-fns** 4.1.0 - Date utilities
- **qrcode.react** 4.2.0 - QR code generation
- **@marsidev/react-turnstile** 0.3.0 - CAPTCHA integration
- **@vercel/analytics** 1.6.1 - Analytics

**Wallet API (`wallet-api/package.json`):**
- **dacc-js** 0.0.5 - DACC blockchain SDK
- **ethers** 6.9.0 - EVM interactions
- **helmet** 7.1.0 - Security headers
- **cors** 2.8.5 - CORS handling
- **dotenv** 16.3.1 - Environment variables
- **zod** 4.3.6 - Runtime validation

**Backend (`apps/backend/package.json`):**
- **PocketBase SDK** 0.26.8 - Testing and migrations

**Smart Contracts (`contracts/`):**
- **OpenZeppelin Contracts** 5.6.1 - Secure contract templates
  - ERC721, ERC1155, ERC20 implementations
  - Access control, ownable patterns
- **forge-std** - Foundry standard library
- **ds-test** - Testing framework

## Configuration

**Environment:**
- `.env.example` - Development template
- `.env.production.example` - Production template
- `.env.local` - Local overrides (not committed)
- Environment variables loaded via `dotenv` in wallet-api

**Build:**
- `next.config.mjs` - Next.js configuration (static export mode)
- `tsconfig.json` - TypeScript paths (`@/*` → `./`)
- `foundry.toml` - Solidity compiler settings
- `bunfig.toml` - Bun runtime configuration
- `.prettierrc.json` - Code formatting rules
- `lint-staged.config.json` - Pre-commit checks

**PocketBase:**
- `pb_migrations/` - Database schema migrations
- `pb_hooks/` - Server-side JavaScript hooks (numbered `NN-*.pb.js`)
- `collections/` - Collection JSON definitions
- `pb_data/` - Runtime data (Docker volume)

## Platform Requirements

**Development:**
- **Bun** (latest) - Install via `curl -fsSL https://bun.sh/install | bash`
- **Docker** + **Docker Compose** - PocketBase, wallet-api, nginx
- **Foundry** - Smart contract tooling (`curl -L https://foundry.paradigm.xyz | bash`)
- **Node.js** 20+ (optional, Bun-compatible)

**Production:**
- **Linux** server (tested on Ubuntu/Debian)
- **2GB RAM minimum** (PocketBase + wallet-api ~500MB)
- **Docker** 20.10+ for containerized deployment
- **SSL certificates** (Let's Encrypt via nginx)

**Smart Contracts:**
- **Solidity** 0.8.24+ (configured via Foundry)
- **Forge** for testing and deployment
- RPC access to:
  - BSC Mainnet (`https://bsc-dataseed.binance.org`)
  - BSC Testnet (`https://data-seed-prebsc-1-s1.binance.org:8545`)
  - 0xL3 Chain (`https://rpc.0xl3.com`)

## Platform Targets

**Hosting:**
- **Frontend**: Static export for Cloudflare Pages, Vercel, or nginx
- **Backend**: Self-hosted PocketBase (Docker or binary)
- **Wallet API**: Docker container or standalone Bun process
- **Smart Contracts**: Deployed to BSC (56) or BSC Testnet (97)

**Deployment:**
- Frontend: `next build` → static assets
- Backend: PocketBase binary or Docker image
- Wallet API: `bun build` → dist/ or Docker
- Contracts: `forge script` → on-chain deployment

---

*Stack analysis: 2026-04-15*
