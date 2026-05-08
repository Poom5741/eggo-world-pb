# Phase 22: Tier Rewards & Badges - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement tier rewards system with Seedling/Grower/Farmer progression based on lifetime food items consumed. Users receive USDT rewards and soulbound badge NFTs upon reaching tier thresholds. System tracks progress, validates tier eligibility, and distributes rewards through backend hook endpoint.

**In scope:**

- Tier Badge smart contract (ERC-5192 soulbound NFT)
- Backend hook for tier validation and reward distribution (`checkAndGrantTierReward`)
- User profile tier display with progress indicators
- Tier reward notification/claim UI
- Integration with existing `lifetime_food_items` tracking
- USDT reward distribution ($5/$50/$500 per tier)

**Out of scope:**

- Tier system beyond Farmer (1,000+ items) — future phases
- Cosmetic in-game benefits from badges — Phase 24+
- Tier downgrade logic — tiers are permanent
- Mobile-specific tier UI — responsive web only

</domain>

<decisions>
## Implementation Decisions

### Smart Contract Design

- **D-01:** Single TierBadge contract with ERC-5192 soulbound standard — non-transferable badges that permanently mark user achievements
- **D-02:** Three badge tiers with sequential minting: Seedling (tokenId 1), Grower (tokenId 2), Farmer (tokenId 3) — users must claim in order
- **D-03:** Contract stores badge metadata on-chain (tier name, threshold, reward amount) — no external URI dependency for core data
- **D-04:** Badge minting restricted to authorized backend wallet — prevents direct user minting, ensures validation through backend

### Backend Hook & Reward Distribution

- **D-05:** Hook endpoint `/api/v2/check-tier-reward` validates `lifetime_food_items` against thresholds before calling wallet-api
- **D-06:** Multi-layer validation: hook checks PocketBase `lifetime_food_items` → wallet-api double-checks → contract enforces — defense in depth pattern from Phase 20
- **D-07:** USDT rewards sent from CoinStor reserve — not minted, transferred from platform treasury
- **D-08:** Idempotent reward claims — hook checks if tier already claimed (via `highest_tier_reached` field) before processing
- **D-09:** Failed transactions logged with error details but don't rollback PocketBase state — consistent with Phase 12/19 error handling

### Tier Thresholds & Rewards

- **D-10:** Fixed thresholds: Seedling (10 items), Grower (100 items), Farmer (1,000 items) — based on REQUIREMENTS.md TIER-02
- **D-11:** Fixed USDT rewards: $5 (Seedling), $50 (Grower), $500 (Farmer) — total $555 per user at full progression
- **D-12:** Rewards cumulative — reaching Farmer means user received all three rewards ($5 + $50 + $500)

### User Profile Integration

- **D-13:** Tier badge display in user profile/dashboard — shows current tier, progress to next tier, and claimed rewards
- **D-14:** Progress bar showing "X of Y items to next tier" — visual feedback for progression
- **D-15:** Claim notification appears when threshold reached — similar to commission claim pattern in dashboard
- **D-16:** Badge visual: claymorphism card with tier icon (sprout/plant/farm), tier name, and "Soulbound" indicator

### Data Model

- **D-17:** Use existing `users.lifetime_food_items` field — incremented by `16-feed-egg.pb.js` hook
- **D-18:** Use existing `users.highest_tier_reached` field — stores "seedling" | "grower" | "farmer" | null
- **D-19:** New `tier_claims` collection — tracks claim history (user, tier, usdt_amount, tx_hash, claimed_at)
- **D-20:** New `tier_badges` collection — mirrors on-chain badge ownership for quick queries

### Frontend Patterns

- **D-21:** Reuse commission claim pattern from dashboard — notification badge + claim button + success modal
- **D-22:** Reuse progress bar component from egg feeding — visual indicator with percentage
- **D-23:** Badge display in profile page — new section alongside existing stats

### Claude's Discretion

- Exact badge SVG/icon design (use Material Symbols: sprout, potted_plant, agriculture)
- Exact progress bar color scheme (use primary/secondary from design system)
- Claim modal wording and animation style
- Tier badge card layout specifics (follow claymorphism patterns)
- Error message wording for insufficient food items

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tier Requirements

- `.planning/REQUIREMENTS.md` §Phase 22 — TIER-01 through TIER-06 requirements (lifetime tracking, thresholds, USDT rewards, soulbound NFTs)
- `docs/NFT_Marketplace_Functional_Spec.md` §9.1 — Wallet structure with `lifetime_food_items` and `highest_tier_reached` fields

### Smart Contract Patterns

- `contracts/src/AnimalNFT.sol` — ERC-721 implementation pattern for reference
- `contracts/src/EggNFT.sol` — Multi-tier NFT pattern (egg types), minting authorization
- `contracts/lib/openzeppelin-contracts/contracts/token/ERC721/` — Base ERC-721 and ERC-5192 interfaces

### Backend Hook Patterns

- `apps/backend/pb_hooks/16-feed-egg.pb.js` — `lifetime_food_items` increment logic, validation patterns
- `apps/backend/pb_hooks/18-breed-animals.pb.js` — Multi-layer validation pattern (hook → wallet-api → contract)
- `apps/backend/pb_hooks/12-claim-commission.pb.js` — USDT transfer from CoinStor pattern
- `apps/backend/pb_hooks/20-gap-closure-uat-execution/` — Error handling patterns from Phase 20

### Frontend Patterns

- `apps/web/app/dashboard/page.tsx` — Dashboard layout, commission display pattern
- `apps/web/components/dashboard/balance-card.tsx` — Card component pattern for stats display
- `apps/web/app/commissions/page.tsx` — Claim button pattern, notification badge
- `apps/web/components/egg/FeedDialog.tsx` — Progress bar pattern (food count display)

### Database Schema

- `apps/backend/collections/users.json` — Existing `lifetime_food_items` (line 252-260), `highest_tier_reached` (line 289-298), `usdt_balance` fields
- `apps/backend/collections/commission_records.json` — Reference for claim tracking collection structure

### Prior Phase Context

- `.planning/phases/21-breeding-system/21-CONTEXT.md` — Multi-layer validation pattern, error handling approach
- `.planning/phases/20-gap-closure-uat-execution/20-CONTEXT.md` — Hook fast-fail pattern, defense in depth

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`16-feed-egg.pb.js`** — Already increments `lifetime_food_items` field on successful feeding. No changes needed.
- **`users` collection** — Has `lifetime_food_items` (number), `highest_tier_reached` (text), `usdt_balance` (number) fields ready
- **Commission claim pattern** — Dashboard shows unclaimed commissions with claim button. Reuse for tier rewards.
- **Progress bar** — FeedDialog shows food count progress (0-10). Reuse for tier progress visualization.
- **CoinStor integration** — Commission distribution already sends from platform wallet. Similar pattern for tier rewards.

### Established Patterns

- **PocketBase hook validation** — Hooks validate before calling blockchain (Phase 20 pattern). Apply to tier validation.
- **Soulbound NFTs** — No existing implementation. ERC-5192 is extension of ERC-721 with `locked` token state.
- **USDT transfers** — Commission distribution uses wallet-api for token transfers. Reuse for tier rewards.
- **Claymorphism design** — All cards use `clay-card`, `shadow-clay-*`, rounded corners. Apply to badge display.
- **Material Symbols** — Icons via `material-symbols-outlined` class. Use: `sprout`, `potted_plant`, `agriculture` for tiers.

### Integration Points

- **Feed egg hook** → Already updates `lifetime_food_items` — no changes needed
- **Dashboard** → Add tier section alongside balance/eggs/commissions cards
- **User profile** → Add tier badge display and progress section
- **New hook** → `22-check-tier-reward.pb.js` validates and triggers reward distribution
- **Wallet-api** → New endpoint `/tier-claim` for USDT transfer + badge minting
- **Smart contract** → New `TierBadge.sol` with ERC-5192 implementation

### Known Gaps

- No TierBadge smart contract exists — needs creation
- No `tier_claims` collection — needs creation
- No `tier_badges` collection — needs creation
- No frontend tier display components — needs creation
- No tier reward notification system — needs creation

</code_context>

<specifics>

## Specific Ideas

- "Reuse commission claim pattern — users understand 'claim reward' flow from dashboard"
- "Progress bar like egg feeding — visual continuity, users already understand 0-10 progression"
- "Soulbound badges should feel prestigious — claymorphism with gold accent for Farmer tier"
- "Tier thresholds should be achievable but meaningful — 10/100/1000 creates clear progression arc"
- "Claim notification on dashboard — similar to commission badge, keeps tier system visible"
- "Badge metadata on-chain — even if platform goes down, users keep their achievement record"

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within Phase 22 scope.

### Reviewed Todos (not folded)

No pending todos were reviewed for this phase.

</deferred>

---

_Phase: 22-tier-rewards-badges_
_Context gathered: 2026-04-22_
