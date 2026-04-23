# Phase 27: Egg Rarity Upgrade System - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement egg rarity upgrade system allowing users to feed additional food NFTs beyond the 10 minimum to improve hatch rarity probability. Includes smart contract update (increase max food limit, add tier guaranteed minimums), frontend UI (upgrade dialog, probability display), and backend validation hook.

**In scope:**

- Smart contract update: Increase MAX_UPGRADE_FOOD from 10 to 490, implement tier guaranteed minimums (50→Rare, 200→Epic, 500→Legendary), remove upgrade fee
- Frontend UI: RarityUpgradeDialog component with food selection grid and probability bars
- Backend hook: New 27-upgrade-egg-rarity.pb.js with ownership and food availability validation
- Contract integration: Wire frontend to updated contract via wallet-api
- Visual indicators: Rarity probability display on egg cards

**Out of scope:**

- New API endpoints (use existing wallet-api pattern)
- Breeding mechanics (Phase 21)
- Secondary market (Phase 23)
- Tier rewards (Phase 22)
  </domain>

<decisions>
## Implementation Decisions

### Contract Mechanics

- **D-01:** Follow spec thresholds — Contract must support 500 max food items (10 base + 490 upgrade), not current 20 limit
- **D-02:** Hybrid rarity mechanics — Keep +2% bonus per extra food item AND add tier guaranteed minimums:
  - 10 items: No guarantee (standard roll)
  - 50 items: Guaranteed minimum Rare (cannot roll Common)
  - 200 items: Guaranteed minimum Epic (cannot roll Common/Rare)
  - 500 items: Guaranteed minimum Legendary (100% Legendary)
- **D-03:** No upgrade fee — Remove current $5/item fee, user only burns food NFTs (matches spec which doesn't mention fee)
- **D-04:** Single upgrade session — Max 490 extra food items in one session, no multiple partial upgrades

### UI & Entry Point

- **D-05:** Egg Card Action Menu — Add 'Upgrade Rarity' button to EggCard action menu (next to Feed/Hatch buttons)
- **D-06:** Show only on ready eggs — 'Upgrade Rarity' button appears only on eggs with food_count >= 10 (ready-to-hatch condition)
- **D-07:** Manual grid selection — Food selection grid like FeedDialog, user clicks items to select, counter shows "X items selected (Y% bonus, guaranteed: [tier])"
- **D-08:** Percentage bars per tier — Visual probability bars for Common/Rare/Epic/Legendary that update dynamically as food is selected

### Backend Hook

- **D-09:** New dedicated hook — Create 27-upgrade-egg-rarity.pb.js (not extend existing feed hook)
- **D-10:** Multi-layer validation — Hook validates: egg ownership, food_count >= 10, egg not hatched, user owns food items, max 490 items, then calls wallet-api

### Confirmation Flow

- **D-11:** Standard confirmation modal — "Burn X food NFTs for Y% rarity bonus (guaranteed minimum: [tier])?" with Confirm/Cancel buttons
- **D-12:** Success feedback — Toast notification + updated probability display on egg card, no redirect (stays on /eggs page)

### Claude's Discretion

- Exact percentage bar styling (use existing Progress component with tier colors)
- Animation for probability bar updates (smooth transition)
- Error message wording for validation failures
- Loading states during transaction (12-block confirmation wait per Phase 12)
- Exact dialog width/height (follow FeedDialog sizing)
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec Requirements

- `docs/NFT_Marketplace_Functional_Spec.md` §7.2 — Rarity Upgrade Paths (50→Rare, 200→Epic, 500→Legendary thresholds)
- `.planning/REQUIREMENTS.md` §Phase 27 — RARITY-01 through RARITY-05 requirements

### Smart Contract

- `contracts/src/EggNFT.sol` — Existing `upgradeEggRarity()` function (line 235-268), `_calculateRarity()` (line 444-448), constants `MAX_FOOD_COUNT`, `MAX_UPGRADE_FOOD`, `UPGRADE_FEE` (to be modified)
- `contracts/test/EggUpgrading.t.sol` — Existing upgrade tests (9 test cases, need update for new thresholds)
- `docs/plan/animal-nft-generation-breeding-plan.md` §2.2 — Rarity Upgrade Mechanic design (+2% bonus per food)

### Frontend Patterns

- `apps/web/components/eggs/feed-dialog.tsx` — Manual food selection grid pattern to reuse
- `apps/web/components/eggs/EggCard.tsx` — Egg card with action menu (add 'Upgrade Rarity' button)
- `apps/web/lib/contracts/eggNft.ts` — Frontend `upgradeEggRarity()` helper function (exists, needs update for new contract ABI)
- `apps/web/components/ui/progress.tsx` — Progress bar for probability display

### Backend Patterns

- `apps/backend/pb_hooks/16-feed-egg.pb.js` — Feed hook validation pattern (ownership, food availability)
- `apps/backend/pb_hooks/18-breed-animals.pb.js` — Multi-layer validation pattern
- `.planning/phases/20-gap-closure-uat-execution/20-CONTEXT.md` — Hook fast-fail pattern

### Prior Phase Context

- `.planning/phases/10-egg-management/10-CONTEXT.md` — Egg card design, hatch animation, status polling
- `.planning/phases/21-breeding-system/21-CONTEXT.md` — Dialog pattern reuse, action menu integration
  </canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **FeedDialog.tsx** — Manual food selection grid with 2-column layout, selected counter, scrollable area. Reuse structure for upgrade dialog.
- **EggCard.tsx** — Egg card with action menu. Add 'Upgrade Rarity' button conditional on food_count >= 10.
- **Progress.tsx** — Progress bar component. Use for tier probability bars (Common/Rare/Epic/Legendary).
- **upgradeEggRarity()** in eggNft.ts — Frontend helper already exists, needs ABI update for modified contract.
- **16-feed-egg.pb.js** — Validation pattern: ownership check, food availability, egg status. Reuse for upgrade validation.

### Established Patterns

- **PocketBase hook validation** — Hook validates before blockchain (e.g., `16-feed-egg.pb.js`). Follow same pattern for upgrade.
- **PocketBase hook response format** — `e.json(200, { success: true, data: {...} })` for success, `e.json(400, { success: false, error: { message, code } })` for errors
- **12-block confirmation wait** — Standard for BSC transactions (Phase 12 decision)
- **Dialog sizing** — FeedDialog uses `max-w-md max-h-[90vh]`. Follow same for upgrade dialog.
- **Material Symbols icons** — Use `upgrade`, `star` for rarity tiers, `restaurant` for food items

### Integration Points

- **Egg card action menu** → Add 'Upgrade Rarity' button (opens RarityUpgradeDialog)
- **RarityUpgradeDialog** → Food selection grid → confirmation → call `/api/v2/upgrade-egg-rarity`
- **Backend hook** → Validate → call wallet-api → return result to frontend
- **Wallet-api** → Sign transaction → call EggNFT.upgradeEggRarity() → wait 12 blocks → return tx hash
- **Egg card display** → Show updated probability bars after upgrade

### Known Gaps

- Contract MAX_UPGRADE_FOOD = 10 (need 490)
- Contract UPGRADE_FEE = 5 USDT (need 0)
- Contract rarity calculation lacks guaranteed minimums (need tier thresholds)
- No RarityUpgradeDialog component exists
- No backend hook for upgrade endpoint
  </code_context>

<specifics>
## Specific Ideas

- "Percentage bars should use tier colors: Common=gray, Rare=blue, Epic=purple, Legendary=gold"
- "Guaranteed tier should be prominently displayed: 'With 50 items, you CANNOT get Common'"
- "Upgrade button only shows on eggs ready to hatch — avoids confusing UX on partially-fed eggs"
- "Single session max 490 — user commits to full upgrade path, no piecemeal upgrades"
- "No fee makes upgrade accessible — users already paid for food NFTs ($0.50 each)"
  </specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 27 scope.

### Reviewed Todos (not folded)

No pending todos were reviewed for this phase.
</deferred>

---

_Phase: 27-egg-rarity-upgrade_
_Context gathered: 2026-04-23_
