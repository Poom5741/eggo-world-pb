# Phase 3: Frontend Marketplace - Context

**Gathered:** 2026-04-02  
**Status:** 60% complete — 6 pages built, 6 pages pending

<domain>
## Phase Boundary

User-facing UI for all core NFT marketplace actions including authentication, NFT minting, egg feeding, hatching, wallet management, and referral tracking.

**Scope anchor:** Complete MVP user flow: Buy Egg → Buy Food → Feed → Hatch → View Wallet → Claim Commissions

</domain>

<decisions>
## Implementation Decisions

### Frontend Status

- **D-01:** Phase 3 marked as "60% complete" — 6 critical pages built, 6 nice-to-have pages pending
- **D-02:** 11 total pages exist: auth (5), mint (1), dashboard (2), marketplace (2), mint food (1)
- **D-03:** 58 shadcn/ui components available for rapid development
- **D-04:** LINE OAuth integration complete and tested

### Missing Pages Priority

- **D-05:** **HIGH priority (MVP critical):**
  - Hatch Egg page — simple rarity/species reveal after feeding 10 food
  - My Wallet page — USDT balance, earnings, withdraw functionality

- **D-06:** **MEDIUM priority (better UX):**
  - Product detail page — NFT details, metadata, history
  - Referral dashboard — downline visualization (simple list first, tree later)

- **D-07:** **LOW priority (can defer):**
  - Buy Food standalone page — already available in marketplace
  - List for sale interface — secondary market feature

### Animation Decisions

- **D-08:** Hatch Egg uses **simple reveal** — show rarity/species after hatching completes
- **D-09:** No elaborate animations for MVP — egg shaking, cracking sequences deferred
- **D-10:** Focus on functional flow over visual polish for initial launch

### Integration Decisions

- **D-11:** **Auto-polling** for blockchain data updates — check balance/NFTs every 30 seconds
- **D-12:** Manual refresh buttons as fallback — "Sync Wallet" button on dashboard
- **D-13:** Poll via Wallet API endpoints, not direct blockchain queries
- **D-14:** Loading states and "Updating..." indicators during polls

### Architecture Decisions (Already Made from Phase 1-2)

- **D-15:** Next.js 16 with App Router, static export for Cloudflare Pages
- **D-16:** shadcn/ui components with Tailwind CSS 4
- **D-17:** Ethers v6 for wallet interactions
- **D-18:** PocketBase client for auth and real-time subscriptions
- **D-19:** Hydration-safe patterns (`useIsHydrated()` hook)
- **D-20:** Mobile-first responsive design

### OpenCode's Discretion

- Exact polling interval (30s recommended, can adjust based on performance)
- Error handling UX for failed polls/transactions
- Specific component design for missing pages
- Loading skeleton designs
- Color scheme and visual polish level

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Frontend Architecture

- `apps/web/AGENTS.md` — Frontend conventions, component patterns, testing
- `docs/00-architecture.md` — System architecture (§1: Frontend Layer)
- `docs/02-decisions.md` — ADR-003 (Next.js 16 with App Router)

### Existing Implementation

- `apps/web/app/` — All 11 existing pages
- `apps/web/app/auth/` — LINE OAuth flow (login, signup, callback, error, line)
- `apps/web/app/mint/page.tsx` — Buy Egg page (25 USDT, referrer input, bonus food)
- `apps/web/app/dashboard/eggs/page.tsx` — Egg inventory with feeding
- `apps/web/app/dashboard/commissions/page.tsx` — Commission tracking
- `apps/web/app/marketplace/food/` — Food NFT marketplace
- `apps/web/components/` — All React components (58 UI components + custom)

### Design System

- `apps/web/components/ui/` — 58 shadcn/ui components
- `apps/web/components/dashboard.tsx` — Dashboard layout pattern
- `apps/web/components/header.tsx` — Header/navigation pattern
- `apps/web/components/wallet-modal.tsx` — Wallet connection modal

### Backend Integration

- `.planning/phases/02-backend-integration/02-CONTEXT.md` — Wallet API endpoints, PocketBase collections
- `wallet-api/server.js` — Wallet API endpoints (create, balance, transfer)
- `apps/backend/collections/` — PocketBase schema for users, NFTs, commissions

### Smart Contract Events

- `.planning/phases/01-smart-contracts-foundation/01-CONTEXT.md` — Contract events to listen for
- `contracts/src/EggNFT.sol` — EggMinted, EggHatched, EggFed events
- `contracts/src/FoodNFT.sol` — FoodMinted event
- `contracts/src/AnimalNFT.sol` — AnimalMinted event

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Auth flow**: Complete LINE OAuth integration with PocketBase — reuse for all protected routes
- **Mint page**: Template for NFT purchase flows — USDT approval, transaction handling, success states
- **Dashboard layout**: Reusable structure for eggs, commissions, future pages
- **Wallet modal**: Wallet connection, balance display, transaction signing
- **58 UI components**: Buttons, cards, inputs, alerts, progress bars, dialogs — everything needed

### Established Patterns

- **Hydration safety**: `const isHydrated = useIsHydrated(); const user = isHydrated ? pb.authStore.record : null`
- **PocketBase client**: `createClient()`, `getUser()`, `isAuthenticated()`, `authStore.onChange()`
- **Transaction flow**: Loading state → API call → Success/error handling → User feedback
- **Component composition**: Card + Header + Content + Footer pattern
- **Error handling**: Alert components with AlertDescription for user-friendly messages

### Integration Points

- **Auth → Dashboard**: Protected routes via middleware, redirect to login if not authenticated
- **Frontend → PocketBase**: REST API for user data, NFT metadata, commissions
- **Frontend → Wallet API**: Wallet creation, balance queries, transaction signing
- **Frontend → Smart Contracts**: Ethers v6 for direct contract calls (future, after event sync)

### Existing Pages Breakdown

**Auth (5 pages — complete):**

- `/auth/login` — LINE OAuth login
- `/auth/sign-up` — LINE OAuth signup with referral input
- `/auth/callback` — OAuth callback handler
- `/auth/error` — Error display page
- `/auth/line` — LINE redirect handler

**Minting (2 pages — partial):**

- `/mint` — Buy Egg NFT (25 USDT, referrer, 2 bonus food) ✅
- `/mint/food` — Buy Food NFT (0.50 USDT each) ⏳ needs completion

**Dashboard (3 pages — partial):**

- `/dashboard` — Main dashboard skeleton
- `/dashboard/eggs` — Egg inventory with feed interface ✅
- `/dashboard/eggs/[id]` — Individual egg detail ✅
- `/dashboard/commissions` — Commission earnings ✅

**Marketplace (2 pages — partial):**

- `/marketplace` — Browse listings (skeleton)
- `/marketplace/food` — Food NFT browsing ✅

### What's Working

- ✅ LINE OAuth authentication
- ✅ Egg NFT minting flow
- ✅ Egg feeding interface
- ✅ Commission tracking display
- ✅ Food NFT browsing

### What Needs Work

- ⏳ Hatch Egg flow (trigger after 10 food, show reveal)
- ⏳ My Wallet page (balance, withdraw)
- ⏳ Product detail pages (NFT metadata)
- ⏳ Referral tree visualization
- ⏳ List for sale interface
- ⏳ Auto-polling integration

</code_context>

<specifics>
## Specific Ideas

### Hatch Egg Simple Reveal

```
User clicks "Hatch" →
Show loading (transaction processing) →
Display card with:
  - Animal NFT image (placeholder or generated)
  - Rarity badge (Common/Rare/Epic/Legendary with color)
  - Species name (Chicken/Dragon/Phoenix/etc.)
  - Stats: generation, food distribution
  - "Claim to Inventory" button
```

### My Wallet Page Structure

```
- Current USDT balance (large display)
- Total earnings (lifetime)
- Available to withdraw
- Withdraw button + input
- Transaction history (last 10)
- Deposit instructions (QR code, address)
```

### Auto-Polling Implementation

```typescript
// apps/web/hooks/useAutoPoll.ts
useEffect(() => {
  const pollInterval = setInterval(async () => {
    await fetchWalletBalance()
    await fetchUserNFTs()
    await fetchCommissions()
  }, 30000) // 30 seconds

  return () => clearInterval(pollInterval)
}, [user])
```

### MVP Page Priority

**Must have for launch:**

1. Hatch Egg — completes core game loop
2. My Wallet — users need to see/claim earnings

**Can launch without:** 3. Product detail — show basic info in marketplace cards 4. Referral tree — simple list of downline suffices 5. Buy Food standalone — marketplace already has it 6. List for sale — secondary market, post-MVP

</specifics>

<deferred>
## Deferred Ideas

**Out of scope for Phase 3 (MVP focus):**

- Elaborate hatch animations — simple reveal first, polish later
- Advanced marketplace features (offers, auctions) — basic buy/sell only
- Social features (profiles, following) — focus on core loop
- Mobile app — responsive web first
- Advanced analytics/charts — basic stats sufficient
- Multi-language support — Thai/English only if critical

### Post-MVP Pages

- Animal breeding interface
- Rarity upgrade UI (feed extra food)
- Advanced referral tree visualization
- NFT collection gallery view
- Leaderboards and achievements
- Admin dashboard

</deferred>

---

_Phase: 03-frontend-marketplace_  
_Context gathered: 2026-04-02_  
_Next: Phase 4 - Testing & Launch_
