# Phase 21: Breeding System - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete end-to-end breeding system: frontend UI for animal selection and breeding flow, backend validation improvements, breeding egg display in existing egg list, and PocketBase record creation. Smart contracts and backend hook (18-breed-animals.pb.js) already exist with breeding logic, 48-hour cooldown, rarity calculation, and commission distribution.

**In scope:**

- Breeding dialog UI with two animal selection slots
- Cooldown countdown display and validation UX
- Breeding egg display in /eggs page with special badge
- Backend hook refinement (cooldown validation, error handling)
- PocketBase egg record creation for breeding eggs
- Success animation and confirmation flow
- Animal card action menu integration

**Out of scope:**

- Smart contract changes (breeding logic already deployed)
- New API endpoints (use existing /api/v2/breed-animals)
- Breeding marketplace or trading (Phase 23)
- Advanced genetics or mutation systems
  </domain>

<decisions>
## Implementation Decisions

### Breeding UI & Animal Selection

- **D-01:** Dialog-based breeding flow — modal/dialog with two animal slots, opens from animal card action menu (reuse FeedDialog pattern for consistency)
- **D-02:** Full animal details in selection — species icon, rarity badge, generation (Gen 0/1/2), last bred timestamp, cooldown remaining (reuse existing AnimalCard component patterns)
- **D-03:** Confirmation modal before breeding — shows 5 USDT fee, predicted offspring generation, rarity probability table (70% max, 20% +1 tier, 10% -1 tier), cooldown reminder (matches mint flow confirmation pattern)

### Cooldown & Validation UX

- **D-04:** Visual countdown timer — show "Available in 12h 34m" on animal cards, disable breeding button with tooltip, gray out unavailable animals in selection (matches existing disabled button patterns)
- **D-05:** Multi-layer validation — frontend filters animals on cooldown before dialog opens, backend hook validates again (defense in depth), smart contract enforces as final check (follows Phase 20 pattern: hook fast-fail + wallet-api safety net)

### Breeding Egg Handling & Feedback

- **D-06:** Breeding eggs mixed in /eggs page — show in existing egg list with special badge (e.g., "Breeding Egg - Gen 1"), same feed/hatch flow as normal eggs, shows parent info on hover/tooltip (reuse EggCard component with conditional breeding badge)
- **D-07:** Success animation + egg details — animated confirmation (similar to 12-second hatch animation), display egg details with parent animals, "View Egg" button routes to /eggs page (reuse hatch animation pattern)

### Navigation & Entry Points

- **D-08:** Action menu on animal card — add 'Breed' button to animal card's action menu (alongside 'Feed', 'Sell', etc.), opens breeding dialog (follows EggCard action menu pattern)
- **D-09:** No dedicated route — breeding accessed from animal cards, not separate page or tab (keeps navigation simple, reuses existing /eggs and /dashboard routes)

### Backend Improvements

- **D-10:** Backend hook validates cooldown before calling wallet-api — fast-fail with HTTP 400 if animal on cooldown (message: "Animal is on breeding cooldown — available in X hours")
- **D-11:** PocketBase egg record created by hook with `is_breeding_egg: true`, `parent1_animal_id`, `parent2_animal_id`, `generation` fields (hook 18-breed-animals.pb.js already creates record — verify fields populated correctly)
- **D-12:** Error handling — if breeding fails at contract level, hook returns error with transaction hash for debugging (don't rollback PocketBase record if contract fails — log error)

### Claude's Discretion

- Exact animation duration and style for breeding success (use hatch animation as reference)
- Loading states during breeding transaction (12-block confirmation wait)
- Exact wording of cooldown error messages and tooltips
- Color/design of breeding egg badge (use claymorphism design system)
- Parent info tooltip design and interaction pattern
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Breeding Requirements

- `.planning/REQUIREMENTS.md` §Phase 21 — BREED-01 through BREED-07 requirements (animal selection, cooldown, fee, rarity, generation, locking, event emission)
- `docs/plan/animal-breeding-mechanics.md` — Breeding system design with cooldown implementation, rarity variance logic, technical details

### Smart Contracts

- `contracts/src/EggNFT.sol` — `breedAnimals()` function (line 261-304), `_calculateOffspringRarity()` (line 418-431), `BREEDING_FEE` constant
- `contracts/src/AnimalNFT.sol` — `canBreed()` function (line 178-182), `recordBreeding()` (line 184-187), `BREED_COOLDOWN` constant (48 hours)
- `contracts/test/AnimalBreeding.t.sol` — Comprehensive breeding tests (cooldown, rarity, generation, fee transfer, event emission)

### Backend Hook

- `apps/backend/pb_hooks/18-breed-animals.pb.js` — Existing breeding hook with ownership validation, fee deduction, commission records, egg creation
- `apps/backend/pb_hooks/16-feed-egg.pb.js` — Reference pattern for hook validation (foodCount fast-fail pattern to reuse for cooldown)

### Frontend Components

- `apps/web/components/egg/FeedDialog.tsx` — Dialog pattern to reuse for breeding dialog
- `apps/web/app/eggs/page.tsx` — Egg list display pattern, empty state, EggCard component usage
- `apps/web/lib/contracts/eggNft.ts` — EggNFT ABI with breeding function signatures

### Prior Phase Context

- `.planning/phases/20-gap-closure-uat-execution/20-CONTEXT.md` — Multi-layer validation pattern (hook fast-fail + wallet-api safety net), PocketBase hook response format
- `.planning/phases/19-real-nft-mint-flow-marketplace-integration/19-CONTEXT.md` — Mint flow confirmation modal pattern, success animation pattern, 12-block confirmation wait
  </canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **18-breed-animals.pb.js** — Complete breeding hook with ownership validation, fee deduction (5 USDT), commission records, egg creation. Needs cooldown validation fast-fail added.
- **FeedDialog.tsx** — Dialog component pattern for egg feeding. Reuse structure for breeding dialog (two-step flow: selection → confirmation).
- **EggCard component** — Display pattern for eggs in /eggs page. Add conditional breeding badge and parent info display.
- **AnimalCard component** (if exists) — Display pattern for owned animals with rarity/species badges. Add action menu with 'Breed' button.
- **Hatch animation** — 12-second animation pattern from Phase 10. Reuse for breeding success confirmation.
- **Confirmation modal** — Mint flow confirmation pattern from Phase 19. Reuse for breeding confirmation with fee/rarity/probability display.

### Established Patterns

- **PocketBase hook validation** — Hooks validate before calling blockchain (e.g., `16-feed-egg.pb.js` foodCount check). Follow same pattern for cooldown fast-fail.
- **PocketBase hook response format** — `e.json(200, { success: true, data: {...} })` for success, `e.json(400, { success: false, error: { message, code } })` for errors
- **Multi-layer validation** — Frontend filters → backend hook fast-fail → wallet-api safety net → smart contract enforcement (Phase 20 pattern)
- **Claymorphism design system** — All UI uses existing clay variants and Material Symbols icons
- **12-block confirmation wait** — Standard for BSC transactions (Phase 12 decision)

### Integration Points

- **Animal card action menu** → Add 'Breed' button alongside existing actions (Feed, Sell, etc.)
- **Breeding dialog** → Opens from animal card, uses FeedDialog pattern, calls `/api/v2/breed-animals` endpoint
- **Backend hook cooldown check** → Add validation in `18-breed-animals.pb.js` before calling wallet-api (check `AnimalNFT.canBreed()`)
- **Egg list display** → Breeding eggs appear in `/eggs` page with conditional badge (check `is_breeding_egg` field from contract)
- **Success flow** → After breeding completes, show animation → redirect to `/eggs` page where new egg appears

### Known Gaps

- No frontend breeding UI exists yet (dialog, animal selection, confirmation)
- Backend hook doesn't validate cooldown before calling wallet-api (relies on contract revert)
- Breeding eggs may not display correctly in /eggs page (need to verify `is_breeding_egg` field handling)
- No countdown timer component for cooldown display
  </code_context>

<specifics>
## Specific Ideas

- "Reuse FeedDialog pattern for breeding — two-step flow (select animals → confirm breeding) keeps UX consistent"
- "Show rarity probability table in confirmation — users should understand 70/20/10 odds before committing 5 USDT"
- "Breeding eggs should feel special but not confusing — badge + parent info makes it clear this is different from purchased eggs"
- "Multi-layer validation saves users from failed transactions — check cooldown in UI, hook, and contract (defense in depth)"
- "Countdown timer should be live-updating — show real-time remaining time, not static timestamp"
  </specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 21 scope.

### Reviewed Todos (not folded)

No pending todos were reviewed for this phase.
</deferred>

---

_Phase: 21-breeding-system_
_Context gathered: 2026-04-22_
