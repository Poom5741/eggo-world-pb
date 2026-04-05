# Phase 10: Egg Management - Context

**Gathered:** 2026-04-05  
**Status:** Ready for planning

<domain>
## Phase Boundary

Egg management interface where users can view their Egg NFTs, feed them (exactly 10 food items), and hatch them into Animal NFTs with rarity badges.

**Requirements:** EGG-01, EGG-02, EGG-03, EGG-04, EGG-05, EGG-06, EGG-07

**Success Criteria:**

1. My Eggs page lists all user's Egg NFTs with status badges (Ready/Feeding/Hatched)
2. Egg card displays feeding progress bar showing X/10 food items collected
3. Feed flow allows selecting one egg and exactly 10 food items from inventory
4. Feed transaction calls smart contract `feedEgg()` with correct parameters (eggId, foodIds)
5. Hatch flow triggers `EggNFT.hatchEgg(eggId)` transaction and waits for confirmation
6. Hatch reveal animation displays newly hatched Animal NFT with rarity badge (Common/Rare/Epic/Legendary)
7. Egg status updates automatically after blockchain confirmation

</domain>

<decisions>
## Implementation Decisions

### Egg Card Display

- **D-01:** Copy Jules design exactly from `resources/eggo-world-uxui-jules/src/app/eggs/page.tsx`
- **D-02:** Featured egg hero section at top (large card with highlighted egg)
- **D-03:** Grid layout: 3 columns on desktop, responsive (1 column mobile, 2 tablet)
- **D-04:** Each egg card contains: egg image (128px), name (#ID), rarity badge (Common/Rare/Epic/Legendary), element type, progress bar, "Manage Egg" button
- **D-05:** Claymorphism styling with hover animation (`hover:-translate-y-2`)
- **D-06:** Status badges: Ready (can feed), Feeding (in progress), Hatched (ready to hatch)

### Feed Flow UX

- **D-07:** Quick-fill auto-select: Click "FEED ME" → auto-select 10 food items from inventory → confirm → submit transaction
- **D-08:** No manual selection UI — system picks 10 food items automatically (first 10 from inventory)
- **D-09:** Confirmation dialog before transaction: "Feed [Egg Name] with 10 food items?"
- **D-10:** Success toast after transaction submitted

### Hatch Reveal Animation

- **D-11:** Full animation sequence (10-15 seconds total)
- **D-12:** Animation stages: egg cracks → shakes vigorously → bursts open with light effect → Animal emerges
- **D-13:** Particle effects during reveal (sparkles, glow)
- **D-14:** Rarity badge displays prominently after reveal (Common/Rare/Epic/Legendary with color coding)
- **D-15:** Animal NFT metadata shown: name, element type, rarity tier

### Status & Polling

- **D-16:** Reuse `useWalletPoll` hook pattern for egg status polling
- **D-17:** Poll interval: 30 seconds during feeding/hatching operations
- **D-18:** Show "Updating..." badge with pulse animation during polling (matches Phase 9 balance card)
- **D-19:** Progress indicator: "Feeding: 4/10 food items" or "Hatching: 2m 15s remaining"
- **D-20:** Exponential backoff on errors: 30s → 60s → 120s → 5min, reset on success

### Transaction Flow

- **D-21:** Feed transaction: Call `feedEgg(eggId, foodIds[])` with exactly 10 food item IDs
- **D-22:** Hatch transaction: Call `hatchEgg(eggId)` after egg has 10 food items
- **D-23:** Transaction confirmation: Wait for blockchain receipt before updating UI state
- **D-24:** Error handling: Show error message with retry button on transaction failure

### OpenCode's Discretion

- Exact particle effect implementation for hatch animation
- Loading skeleton design for egg cards
- Animation duration/timing functions (use Tailwind defaults unless specified)
- Exact color values for rarity badges (Common=gray, Rare=blue, Epic=purple, Legendary=yellow)
- Fallback images for egg/animal NFTs

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Eggs Page Design

- `resources/eggo-world-uxui-jules/src/app/eggs/page.tsx` — **MANDATORY**: Full eggs page layout (featured egg hero, grid cards, progress bars, button styling)
- `resources/eggo-world-uxui-jules/src/components/LayoutWrapper.tsx` — Navigation wrapper pattern

### Smart Contract Integration

- `contracts/src/EggNFT.sol` — `feedEgg(uint256 eggId, uint256[] foodIds)` function signature
- `contracts/src/EggNFT.sol` — `hatchEgg(uint256 eggId)` function signature
- `.planning/REQUIREMENTS.md` — EGG-01 through EGG-07 requirements

### Existing Patterns (Phase 8-9)

- `apps/web/hooks/use-wallet-poll.ts` — Polling pattern to reuse for egg status
- `apps/web/components/ui/card.tsx` — Claymorphism card variants (clay, clay-lg, clay-xl)
- `apps/web/components/ui/button.tsx` — Button variants for "FEED ME", "HATCH" buttons
- `apps/web/components/ui/badge.tsx` — Badge component for rarity badges, status badges
- `.planning/phases/08-foundation-auth/8-CONTEXT.md` — Material Symbols, hydration safety, TDD pattern
- `.planning/phases/09-dashboard-wallet/09-CONTEXT.md` — Polling pattern, transaction categorization, "Updating..." badge

### Design System

- `apps/web/components/ui/progress.tsx` — Progress bar for feeding progress (X/10)
- `apps/web/styles/claymorphism.ts` — Claymorphism shadow/effect utilities

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **useWalletPoll hook** (`apps/web/hooks/use-wallet-poll.ts`): Auto-polling pattern (30s interval, loading/error states) — adapt for egg status polling
- **LayoutWrapper** (`apps/web/components/LayoutWrapper.tsx`): Wrap eggs page with navigation
- **Card variants** (`apps/web/components/ui/card.tsx`): Use clay, clay-lg, clay-xl for egg cards
- **Badge component** (`apps/web/components/ui/badge.tsx`): Use for rarity badges (Common/Rare/Epic/Legendary) and status badges (Ready/Feeding/Hatched)
- **Progress bar** (`apps/web/components/ui/progress.tsx`): Use for feeding progress (X/10)
- **PocketBase client** (`apps/web/lib/pocketbase/client.ts`): Fetch user's egg NFTs from `egg_nfts` collection
- **Material Symbols** (Phase 8): Use for icons — `egg`, `restaurant`, `auto_fix_high`, `emoji_emotions`

### Established Patterns

- **Hydration safety**: Always use `useIsHydrated()` hook before accessing `pb.authStore.record` or browser APIs
- **Auth redirects**: Redirect unauthenticated users to `/auth/login`
- **Data fetching**: Fetch in `useEffect` after hydration, use `Promise.all` for parallel queries
- **Thai comments**: All new code should have Thai comments (per project conventions)
- **TDD workflow**: Red (test) → Green (implement) → Refactor commits for all features
- **Transaction flow**: Show confirmation → submit → wait for receipt → update UI (Phase 9 pattern)

### Integration Points

- **PocketBase collections**: `egg_nfts` (user's eggs with status, food count), `food_nfts` (user's food inventory), `animal_nfts` (hatched animals)
- **Smart contracts**: EggNFT contract for `feedEgg()` and `hatchEgg()` transactions
- **Wallet API**: Sign transactions via existing wallet connection
- **Navigation**: Eggs page is protected route — middleware redirects unauthenticated users

</code_context>

<specifics>
## Specific Ideas

- "Featured egg section should highlight the egg closest to hatching"
- "Progress bar should be visually prominent — users need to see X/10 at a glance"
- "Rarity badges should use distinct colors: Common=gray, Rare=blue, Epic=purple, Legendary=yellow/gold"
- "Hatch animation should feel rewarding — this is the payoff moment!"
- "Quick-fill should be truly one-click — no tedious item selection"

</specifics>

<deferred>
## Deferred Ideas

These ideas were mentioned but are OUT OF SCOPE for Phase 10:

- **Manual food selection** — User picks specific 10 food items (future phase)
- **Food type bonuses** — Different food types give different bonuses (backlog)
- **Egg trading/gifting** — Transfer eggs to other users (future milestone)
- **Breeding mechanics** — Breed two eggs to create rare variants (future milestone)
- **Egg statistics dashboard** — Detailed stats about user's egg collection (backlog)

### Reviewed Todos (not folded)

None — no pending todos were reviewed for this phase.

</deferred>

---

_Phase: 10-egg-management_  
_Context gathered: 2026-04-05_
