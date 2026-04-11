# EggoWorld - Project Context for AI

## Quick Overview
EggoWorld is a gamified NFT Marketplace with a 4-level MLM referral system built on BNB SmartChain. Users buy Egg NFTs, collect Food NFTs, hatch them into Animal NFTs, and earn commissions through referral chains.

## Architecture Pattern
**Microservices Architecture** with:
- PocketBase Go backend (BaaS)
- Next.js 16 frontend with App Router
- Express.js wallet API
- Foundry smart contracts on BSC

## Tech Stack Summary
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Bun
- **Backend**: PocketBase (Go), SQLite, custom JS hooks
- **Wallet API**: Express.js, ethers.js
- **Contracts**: Foundry, Solidity, BNB SmartChain
- **Auth**: Email/Password + LINE OAuth
- **Blockchain**: USDT (BEP-20), EVM wallets

## Project Structure
```
eggo-pocketbase/
├── apps/backend/          # PocketBase backend
│   ├── pb_hooks/         # Business logic hooks (JS)
│   ├── pb_migrations/    # Database schema
│   └── pb_public/        # Static files
├── apps/web/             # Next.js frontend
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   └── lib/             # Utilities & PB client
├── wallet-api/          # Express wallet service
├── contracts/           # Foundry smart contracts
├── nginx/              # Reverse proxy config
└── docs/               # Documentation
```

## Key Conventions

### Backend (PocketBase)
- **Hook Pattern**: Business logic in `pb_hooks/*.pb.js` files
- **Naming**: Hooks numbered for execution order (01-*, 02-*, etc.)
- **Collections**: `users`, `referrals`, `user_wallets`
- **Migration**: Use PocketBase migrations, never manual schema changes

### Frontend (Next.js)
- **App Router**: All routes in `apps/web/app/`
- **Components**: Reusable UI in `components/`
- **State**: React Context for global state, React Hook Form + Zod for forms
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Package Manager**: Bun (NOT npm/yarn)

### Smart Contracts
- **Framework**: Foundry (NOT Hardhat)
- **Language**: Solidity
- **Network**: BNB SmartChain (testnet/mainnet)
- **Token**: USDT (BEP-20)

### Testing
- **Backend**: PocketBase test framework
- **Frontend**: React Testing Library + Jest
- **Contracts**: Foundry test framework

## Important Files

### Backend Core Logic
- `apps/backend/pb_hooks/05-referral-chain.pb.js` - 4-level MLM system
- `apps/backend/pb_hooks/06-register-user.pb.js` - User registration
- `apps/backend/pb_hooks/01-create-wallet.pb.js` - Wallet creation

### Frontend Core
- `apps/web/app/page.tsx` - Landing page
- `apps/web/lib/pocketbase.ts` - PB client configuration
- `apps/web/components/` - Reusable UI components

### Configuration
- `apps/backend/.env` - Backend environment variables
- `apps/web/.env.local` - Frontend environment variables
- `nginx/nginx.conf` - Reverse proxy configuration

## Domain Logic

### MLM Referral System (4 Levels)
- **G1**: Direct referrer (25% commission)
- **G2**: 2nd level (15% commission)
- **G3**: 3rd level (10% commission)
- **G4**: 4th level (5% commission)
- Platform address fills gaps in referral chain

### NFT Game Loop
1. User buys Egg NFT ($25) → Gets 2 Food NFTs
2. User can buy more Food NFTs ($0.50 each)
3. Collect 10 Food NFTs → Hatch into Animal NFT
4. Commissions distributed on sales through referral chain

### User Registration Flow
1. LINE OAuth → PocketBase authentication
2. Auto-create EVM wallet
3. Generate 4-level referral chain
4. Initialize USDT balance

## Current Work
Based on recent commits:
- ✅ Foundry support with smart contracts and tests
- ✅ LINE OAuth referrer capture
- ✅ MLM referral chain implementation
- ✅ Backend unit tests for referral system

## Gotchas & Anti-Patterns to Avoid

### Critical Security
- **NEVER** commit `WALLET_MASTER_KEY` - encrypts all wallet private keys
- **NEVER** expose LINE OAuth secrets
- **ALWAYS** use environment variables for secrets

### Common Pitfalls
- **Don't use npm/yarn** - This project uses Bun
- **Don't modify DB directly** - Use PocketBase migrations
- **Don't skip hook execution order** - Numbered hooks matter
- **Don't forget referral chain** - Every user needs 4-level chain

### Blockchain Gotchas
- **Always** check BNB SmartChain network (not Ethereum)
- **USDT is BEP-20** (not ERC-20)
- **Wallet encryption** uses XOR with master key

### Frontend Gotchas
- **App Router only** - No Pages Router
- **Server Components** - Use client components for interactivity
- **shadcn/ui** - Import from `@/components/ui/*`

## Environment Variables

### Required (Backend)
```bash
WALLET_MASTER_KEY=your_encryption_key
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
```

### Required (Frontend)
```bash
PB_URL=http://localhost:8090  # or production URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Workflow

### Local Development
```bash
# Start backend
cd apps/backend && ./pocketbase serve

# Start frontend (new terminal)
cd apps/web && bun run dev

# Start wallet API (new terminal)
cd wallet-api && bun run dev
```

### Running Tests
```bash
# Backend tests
cd apps/backend && bun test

# Frontend tests
cd apps/web && bun test

# Contract tests
cd contracts && forge test
```

### Database Migrations
```bash
cd apps/backend
./pocketbase migrate up
./pocketbase migrate down
```

## AI Collaboration Tips

When working on this codebase:
1. **Read existing hooks first** - Patterns are well-established
2. **Follow numbered hook convention** - Execution order matters
3. **Test referral logic carefully** - 4-level chain is complex
4. **Check environment variables** - Many things depend on them
5. **Use Bun, not npm** - Package manager consistency
6. **Read module docs in /docs/modules/** - Detailed logic documented there

## Related Documentation
- `/docs/00-architecture.md` - System architecture deep dive
- `/docs/01-domain-model.md` - Business entities and relationships
- `/docs/02-decisions.md` - Architecture Decision Records (ADRs)
- `/docs/modules/` - Detailed module documentation
- `/docs/guides/` - Setup and development guides

<!-- autoskills:start -->

Summary generated by `autoskills`. Check the full files inside `.claude/skills`.

## Accessibility (a11y)

Audit and improve web accessibility following WCAG 2.2 guidelines. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance", "screen reader support", "keyboard navigation", or "make accessible".

- `.claude/skills/accessibility/SKILL.md`
- `.claude/skills/accessibility/references/A11Y-PATTERNS.md`: Practical, copy-paste-ready patterns for common accessibility requirements. Each pattern is self-contained and linked from the main [SKILL.md](../SKILL.md).
- `.claude/skills/accessibility/references/WCAG.md`

## Bun Skill Reference

Use when building, testing, or deploying JavaScript/TypeScript applications. Reach for Bun when you need to run scripts, install packages, bundle code, or test applications — it's a drop-in replacement for Node.js with integrated package manager, test runner, and bundler.

- `.claude/skills/bun/SKILL.md`

## Design Thinking

Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beaut...

- `.claude/skills/frontend-design/SKILL.md`

## SEO optimization

Optimize for search engine visibility and ranking. Use when asked to "improve SEO", "optimize for search", "fix meta tags", "add structured data", "sitemap optimization", or "search engine optimization".

- `.claude/skills/seo/SKILL.md`

<!-- autoskills:end -->
