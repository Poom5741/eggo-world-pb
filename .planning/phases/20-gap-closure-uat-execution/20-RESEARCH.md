# Phase 20: Gap Closure & UAT Execution — Research

**Researched:** 2026-04-22
**Domain:** UAT execution, frontend bug fixes, backend validation, operator documentation
**Confidence:** HIGH

## Summary

Phase 20 is a **closure phase** — no new features, only fixing known gaps and executing deferred UAT. The work divides cleanly into four tracks:

1. **Code fixes** (low risk, high certainty): Empty-state CTA routing and FeaturedEggHero FEED ME wiring are one-line changes with existing component reuse.
2. **Backend validation** (medium risk): Adding a `foodCount < 10` fast-fail check in the PocketBase `16-feed-egg.pb.js` hook before it calls the wallet-api. The wallet-api already has an on-chain safety net (`server.js:939`), but the hook layer lacks this check, meaning users could pay gas for an already-full egg.
3. **UAT execution** (high risk — time-bound): 16 manual scenarios across feed, hatch, polling, empty state, wallet check, Buy Now, dashboard polling, and foodCount validation. These require a running local stack (PocketBase + wallet-api + Anvil) or production environment.
4. **Documentation** (low risk): Deriving an operator runbook for gas sponsorship from existing `resources/pkbase-wallet/` reference docs.

**Primary recommendation:** Execute code fixes first (they unblock UAT scenarios), then run UAT in dependency order using Anvil for local blockchain testing, and document gas sponsorship last.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Automation split — Playwright/Cypress browser tests for repeatable scenarios; manual execution for visual/animation tests
- **D-02:** Test data — Dedicated test account with seeded data on Anvil (local dev node) for local testing; live network for production validation
- **D-03:** Execution order — Dependency order: auth → wallet → mint → feed → hatch → marketplace → polling → edge cases
- **D-04:** Documentation — Markdown checklists in phase directory (`20-UAT.md`) with pass/fail status and notes
- **D-05:** Sign-off criteria — All 16 scenarios must pass; no known gaps remain
- **D-06:** Environments — Both local (Anvil) and production (`https://pb.eggoworld.io`)
- **D-07:** Empty state CTA — "Get Your First Egg" button on `/eggs` page routes to `/marketplace` (currently routes to `/eggs`, a bug)
- **D-08:** FeaturedEggHero FEED ME — Wire the button to open `FeedDialog` (currently only `console.log` stub from Phase 15)
- **D-09:** Dual-layer validation — Backend PocketBase hook performs fast-fail check before calling wallet-api; wallet-api validates against on-chain state as safety net
- **D-10:** UX pattern — Disable/hide FEED ME button when `foodCount >= 10`; show "HATCH!" button instead
- **D-11:** Backend error — If validation fails at hook layer, return HTTP 400 with message: "Cannot feed this egg — it is full and ready to hatch"
- **D-12:** Scope — Operator runbook covering relayer wallet funding, monitoring, key rotation, gas limits, and cost tracking
- **D-13:** Detail level — 100% derived from `resources/pkbase-wallet` reference patterns
- **D-14:** Location — Standalone `docs/GAS_SPONSORSHIP.md`

### Claude's Discretion

- Exact Playwright vs Cypress choice (both acceptable, use project standard)
- Anvil test network configuration details
- Exact wording and styling of error messages
- Specific Anvil block time and fork configuration
- Loading states during UAT test execution

### Deferred Ideas (OUT OF SCOPE)

- New features (breeding, tier rewards, secondary market)
- Smart contract changes
- Wallet architecture changes
- UI redesign
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID      | Description                                                     | Research Support                                                                                                                          |
| ------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| GAPS-01 | Feed-egg endpoint validates foodCount < 10 before processing    | Dual-layer validation pattern (hook fast-fail + wallet-api safety net) documented. Hook `16-feed-egg.pb.js` currently missing this check. |
| GAPS-02 | Complete 10 UAT scenarios for feed/hatch/polling/empty state    | 10 scenarios defined in `10-UAT.md`, execution order (D-03) and environments (D-06) locked.                                               |
| GAPS-03 | Document gas sponsorship system with 5 human verification tests | Gas sponsorship logs exist in `wallet-api/server.js`. Reference docs in `resources/pkbase-wallet/` provide operator patterns.             |
| GAPS-04 | Implement empty state UI for /eggs page when user has no eggs   | Empty state UI already implemented (`apps/web/app/eggs/page.tsx:158-197`) — only CTA route needs fixing from `/eggs` to `/marketplace`.   |
| GAPS-05 | Execute Phase 17 UAT re-verification (6 manual scenarios)       | 6 scenarios defined in `17-UAT.md` covering Buy Now, dashboard polling, foodCount validation.                                             |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability                     | Primary Tier                    | Secondary Tier             | Rationale                                                      |
| ------------------------------ | ------------------------------- | -------------------------- | -------------------------------------------------------------- |
| UAT scenario execution         | Browser / Client                | API / Backend              | Manual tests verify end-to-end UX; backend validation supports |
| foodCount fast-fail            | API / Backend (PocketBase hook) | API / Backend (wallet-api) | Hook prevents unnecessary gas spend; wallet-api is safety net  |
| Empty state CTA fix            | Browser / Client                | —                          | Pure routing change in Next.js page component                  |
| FeaturedEggHero FEED ME wiring | Browser / Client                | —                          | Component prop wiring to existing FeedDialog                   |
| Gas sponsorship docs           | CDN / Static (documentation)    | —                          | Operator runbook, no runtime behavior                          |

---

## Standard Stack

### Core

| Library                | Version         | Purpose                               | Why Standard                                                                     |
| ---------------------- | --------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| Bun                    | 1.3.11          | Runtime, test runner, package manager | Project standard; `bun:test` used for all unit tests [VERIFIED: `bun --version`] |
| Next.js                | 16.1.6          | Frontend framework                    | Already installed, project standard [VERIFIED: `apps/web/package.json`]          |
| PocketBase             | 0.25.2 (JS SDK) | Backend / database                    | Project standard [VERIFIED: `apps/web/package.json`]                             |
| ethers.js              | 6.16.0          | Blockchain interaction                | Locked decision from Phase 12 [VERIFIED: `apps/web/package.json`]                |
| happy-dom              | 20.8.9          | DOM environment for tests             | Used in `test-setup.ts` for Bun tests [VERIFIED: `apps/web/package.json`]        |
| @testing-library/react | 16.3.2          | React component testing               | Used across existing test suite [VERIFIED: `apps/web/package.json`]              |

### Supporting

| Library                 | Version      | Purpose                               | When to Use                                                                      |
| ----------------------- | ------------ | ------------------------------------- | -------------------------------------------------------------------------------- |
| Anvil                   | 1.5.1-stable | Local EVM node for UAT                | Local blockchain testing without testnet gas costs [VERIFIED: `anvil --version`] |
| Foundry                 | 1.5.1-stable | Contract deployment/verification      | If contracts need redeploy for test seeding [VERIFIED: `forge --version`]        |
| Playwright (to install) | latest       | Browser automation for repeatable UAT | Automating auth, navigation, form submission scenarios [ASSUMED]                 |

### Installation

```bash
# If choosing Playwright for browser automation
cd apps/web && bun add -d @playwright/test
npx playwright install chromium
```

**Version verification:**

- Bun 1.3.11 [VERIFIED: local install]
- Node 24.13.1 [VERIFIED: local install]
- Anvil 1.5.1-stable [VERIFIED: local install]
- Playwright: not yet installed — planner must include install step if automated browser tests are in scope

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UAT Execution Flow                              │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   Anvil      │     │  PocketBase  │     │  Wallet API  │
  │  (local EVM) │◄────┤  (localhost) │◄────┤  (localhost) │
  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
         │                    │                    │
         │    ┌───────────────┘                    │
         │    │                                    │
         │    ▼                                    │
         │  ┌──────────────────────────────────────────────┐
         └──┤        Next.js Frontend (localhost:3000)      │
            │  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │
            │  │ /eggs   │  │ /market  │  │ /dashboard  │  │
            │  │  page   │  │  place   │  │  commissions│  │
            │  └────┬────┘  └────┬─────┘  └──────┬──────┘  │
            │       │            │               │         │
            │  ┌────▼────┐  ┌────▼─────┐  ┌──────▼──────┐  │
            │  │EggCard  │  │BuyFlow   │  │Polling      │  │
            │  │Featured │  │          │  │(30s interval)│  │
            │  │EggHero  │  │          │  │              │  │
            │  └────┬────┘  └────┬─────┘  └──────┬──────┘  │
            │       │            │               │         │
            │  ┌────▼────────────▼───────────────▼──────┐  │
            │  │          FeedDialog / HatchRevealModal   │  │
            │  └──────────────────────────────────────────┘  │
            └──────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Manual UAT Tester  │
                    │  (human execution)  │
                    └─────────────────────┘
```

### Recommended Project Structure

No new project structure needed — all changes fit within existing layout:

```
apps/web/app/eggs/page.tsx              # Fix empty-state CTA (line 180)
apps/web/components/eggs/featured-egg-hero.tsx  # Wire onFeed to FeedDialog
apps/backend/pb_hooks/16-feed-egg.pb.js  # Add foodCount fast-fail check
docs/GAS_SPONSORSHIP.md                  # New operator runbook
.planning/phases/20-gap-closure-uat-execution/20-UAT.md  # UAT checklist
```

### Pattern 1: Dual-Layer Validation

**What:** Hook performs fast database-level validation before calling the blockchain API; wallet-api performs on-chain validation as a safety net.
**When to use:** Any blockchain operation where gas costs are involved and state can be checked cheaply off-chain first.
**Example:**

```javascript
// Source: apps/backend/pb_hooks/19-hatch-egg.pb.js:86-97 (existing pattern)
const foodCount = egg.get("food_count") || 0
if (foodCount < MIN_FOOD_TO_HATCH) {
  return e.json(400, {
    success: false,
    error: {
      message: `Insufficient food to hatch. Required: ${MIN_FOOD_TO_HATCH}, Available: ${foodCount}`,
      code: "INSUFFICIENT_FOOD",
    },
  })
}
```

### Pattern 2: PocketBase Hook Response Format

**What:** Standardized JSON response format for all custom router hooks.
**When to use:** All custom PocketBase router endpoints.
**Example:**

```javascript
// Source: apps/backend/pb_hooks/19-hatch-egg.pb.js (established pattern)
// Success:
return e.json(200, { success: true, data: { ... } });
// Error:
return e.json(400, { success: false, error: { message: '...', code: '...' } });
```

### Pattern 3: Auto-Polling with Visual Indicator

**What:** 30-second interval fetch with `setUpdating(true)`/`setUpdating(false)` state and visual "Updating..." badge.
**When to use:** Pages that display blockchain state that may change externally.
**Example:**

```typescript
// Source: apps/web/app/dashboard/commissions/page.tsx:35-42
useEffect(() => {
  if (!user) return
  const pollInterval = setInterval(() => {
    setUpdating(true)
    fetchData(user.id).finally(() => setUpdating(false))
  }, 30000)
  return () => clearInterval(pollInterval)
}, [user])
```

### Anti-Patterns to Avoid

- **Don't call wallet-api before cheap validation:** The current `16-feed-egg.pb.js` calls the wallet-api (`fetch(WALLET_SRV_URL + '/api/wallet/feed-egg', ...)`) at line 172 BEFORE checking `foodCount + food_ids.length <= 10`. This means users pay gas for validation that could happen at the hook layer.
- **Don't leave TODO stubs in production:** `handleFeedEgg` in `apps/web/app/eggs/page.tsx:88-91` is a `console.log` stub that breaks the FeaturedEggHero FEED ME button UX.
- **Don't route CTAs to self:** `router.push('/eggs')` in the empty state (line 180) creates a dead-end UX.

---

## Don't Hand-Roll

| Problem                    | Don't Build               | Use Instead                                        | Why                                                                                                                                           |
| -------------------------- | ------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser automation for UAT | Custom puppeteer scripts  | Playwright                                         | Project already uses Node/Bun; Playwright is the modern standard with built-in trace viewer, screenshot-on-fail, and CI integration [ASSUMED] |
| Local EVM node             | Ganache / Hardhat network | Anvil                                              | Already installed (1.5.1), faster, better BSC fork support, matches Foundry stack                                                             |
| Test assertions            | Custom assertion helpers  | `bun:test` built-ins + `@testing-library/jest-dom` | Already configured in `test-setup.ts`                                                                                                         |
| Gas cost calculation       | Manual wei-to-BNB math    | `ethers.formatEther(gasCost)`                      | Already used in `wallet-api/server.js:76`                                                                                                     |
| DOM test environment       | jsdom (slower)            | happy-dom                                          | Already configured in `test-setup.ts` and `apps/web/package.json`                                                                             |

**Key insight:** The project already has Anvil, Bun test runner, happy-dom, and testing-library. Adding Playwright is the only new tool needed for browser automation, and it should be installed in the web app workspace.

---

## Runtime State Inventory

This phase involves **no rename, rebrand, or migration** — it is gap closure on existing functionality. However, the following runtime state should be noted for UAT execution:

| Category            | Items Found                                                  | Action Required                                    |
| ------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| Stored data         | `egg_nfts` records in PocketBase with `food_count` field     | None — UAT will create/read test records           |
| Live service config | Wallet-api `RELAYER_PRIVATE_KEY` env var for gas sponsorship | Verify funded before UAT (mint/buy tests need gas) |
| OS-registered state | None found                                                   | None                                               |
| Secrets/env vars    | `WALLET_SRV_URL`, `RELAYER_PRIVATE_KEY`, contract addresses  | Ensure `.env` has correct values for local testing |
| Build artifacts     | `.next/` build output may be stale                           | Rebuild web app before UAT if code changed         |

**Nothing found in category:** OS-registered state — verified by checking for systemd/launchd tasks, pm2 processes, or Task Scheduler entries related to this project.

---

## Common Pitfalls

### Pitfall 1: Anvil State Reset Between Sessions

**What goes wrong:** Anvil resets to a fresh state on restart. Test accounts, deployed contracts, and seeded data disappear.
**Why it happens:** Anvil is an in-memory node unless configured with `--fork-url` and `--state`.
**How to avoid:** Use `--state /path/to/anvil-state.json` to persist state across restarts, or script contract deployment + test data seeding as a pre-UAT step.
**Warning signs:** UAT scenarios fail with "contract not found" or "insufficient balance" after restarting Anvil.

### Pitfall 2: foodCount Hook Check vs On-Chain Drift

**What goes wrong:** PocketBase `egg_nfts.food_count` may drift from on-chain `eggContract.foodCount(tokenId)` if transactions succeed on-chain but the hook's database update fails (or vice versa).
**Why it happens:** Non-atomic dual-layer update — blockchain tx succeeds, then PocketBase record is updated separately.
**How to avoid:** The hook already updates `food_count` after wallet-api success (line 204-206 in `16-feed-egg.pb.js`). The new fast-fail check should use `egg.get('food_count')` (the DB value) and verify `currentFoodCount + food_ids.length <= 10` before calling the wallet-api. If drift is suspected, the wallet-api safety net catches it.
**Warning signs:** User sees FEED ME button but gets "EGG_HATCHED" error from wallet-api.

### Pitfall 3: Hydration Mismatch During UAT

**What goes wrong:** Next.js static export with client-side auth checks can cause hydration mismatches if tests assert on DOM before hydration completes.
**Why it happens:** `useIsHydrated()` hook gates auth state; server-rendered HTML differs from client-rendered.
**How to avoid:** In Playwright tests, wait for stable DOM state (e.g., `await page.waitForSelector('[data-testid="egg-grid"]')`) rather than asserting immediately on navigation.
**Warning signs:** Flaky tests that pass on retry; "Text content does not match" errors.

### Pitfall 4: Relayer Wallet Out of BNB

**What goes wrong:** Gas sponsorship tests fail because the relayer wallet has insufficient BNB.
**Why it happens:** Every mint, feed, and buy operation consumes BNB from the relayer. No automated refilling exists.
**How to avoid:** Check relayer balance before UAT execution. Document the check in the operator runbook.
**Warning signs:** Transactions hang or fail with "insufficient funds for gas" in wallet-api logs.

### Pitfall 5: Over-Engineering UAT Automation

**What goes wrong:** Spending excessive time automating visual/animation scenarios (hatch animation, rarity badge colors) that are better verified manually.
**Why it happens:** Playwright can screenshot but cannot "see" colors or animations the way a human does.
**How to avoid:** Follow D-01 — automate only repeatable scenarios (auth, navigation, form submission, API responses). Keep animation, visual polish, and color-coding as manual checks.
**Warning signs:** >2 hours spent on a single "verify badge color" test.

---

## Code Examples

### Adding foodCount Fast-Fail in PocketBase Hook

```javascript
// Source: pattern from apps/backend/pb_hooks/19-hatch-egg.pb.js:86-97
// Target: apps/backend/pb_hooks/16-feed-egg.pb.js, after line 101 (is_hatched check)

const currentFoodCount = egg.get("food_count") || 0
const requestedFoodCount = food_ids.length

if (currentFoodCount + requestedFoodCount > 10) {
  return e.json(400, {
    success: false,
    error: {
      message: "Cannot feed this egg — it is full and ready to hatch",
      code: "EGG_FULL",
    },
  })
}
```

### Fixing Empty State CTA Route

```typescript
// Source: apps/web/app/eggs/page.tsx:180
// BEFORE: onClick={() => router.push('/eggs')}
// AFTER:
<button
  onClick={() => router.push('/marketplace')}
  className="clay-button bg-primary text-on-primary py-4 px-8 rounded-xl font-black text-lg"
>
  Get Your First Egg
</button>
```

### Wiring FeaturedEggHero FEED ME to FeedDialog

```typescript
// Source: apps/web/app/eggs/page.tsx:88-91
// BEFORE:
const handleFeedEgg = (eggId: number) => {
  console.log("Feed egg:", eggId)
}

// AFTER (reuse the same pattern as handleManageEgg):
const handleFeedEgg = (eggId: number) => {
  const egg = eggs.find((e) => e.egg_id === eggId)
  if (egg) {
    setFeedingEgg(egg)
    setFeedDialogOpen(true)
  }
}
```

---

## State of the Art

| Old Approach               | Current Approach                       | When Changed | Impact                                          |
| -------------------------- | -------------------------------------- | ------------ | ----------------------------------------------- |
| Mock blockchain endpoints  | Real ethers.js contract calls          | Phase 12     | All endpoints return real tx hashes             |
| No gas sponsorship         | Relayer wallet pays gas for buy/mint   | Phase 19     | Users only need USDT, not BNB                   |
| No empty state             | Empty state with CTA (but buggy route) | Phase 10/17  | UX improved but CTA route is broken             |
| jsdom for tests            | happy-dom for tests                    | Phase 16     | Faster test execution                           |
| Manual food selection only | "Quick Fill" auto-select concept       | Phase 10 UAT | Not yet implemented — out of scope for Phase 20 |

**Deprecated/outdated:**

- `console.log` stubs for FEED ME/PLAY actions: Should be wired or removed before UAT.
- `router.push('/eggs')` in empty state: Creates dead-end UX.

---

## Assumptions Log

| #   | Claim                                                                                                   | Section         | Risk if Wrong                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Playwright is the preferred browser automation tool for this project                                    | Standard Stack  | If Cypress is preferred instead, install command and config differ slightly. Both work with Bun.                                          |
| A2  | Anvil state persistence (`--state` flag) works for BSC-like chain behavior                              | Common Pitfalls | If Anvil doesn't persist the specific state needed, UAT setup must include re-deployment script each session.                             |
| A3  | The `egg_nfts.food_count` PocketBase field is the authoritative off-chain source for the hook fast-fail | Code Examples   | If this field drifts from on-chain state, the fast-fail may incorrectly block or allow feeding. The wallet-api safety net mitigates this. |

---

## Open Questions (RESOLVED)

1. **RESOLVED — Is Playwright already chosen elsewhere in the project?**
   - What we know: No Playwright or Cypress is installed in `apps/web/node_modules`.
   - What's unclear: Whether the team has a preference.
   - Recommendation: Default to Playwright (Claude's discretion per D-01). If issues arise, Cypress is an acceptable fallback.

2. **RESOLVED — Does the test environment have seeded contract data?**
   - What we know: Anvil is installed, contracts are deployed on 0xl3 testnet.
   - What's unclear: Whether a local Anvil fork has the contracts and test accounts pre-configured.
   - Recommendation: Plan includes a "seed local Anvil" step if state is not persisted.

3. **RESOLVED — Should the FEED ME button be disabled or replaced when foodCount >= 10?**
   - What we know: D-10 says "Disable/hide FEED ME button... show HATCH! button instead."
   - What's unclear: Whether EggCard (not just FeaturedEggHero) also needs this update.
   - Recommendation: Check `EggCard` component during implementation; apply the same pattern if the button exists there.

---

## Environment Availability

| Dependency         | Required By             | Available | Version | Fallback                       |
| ------------------ | ----------------------- | --------- | ------- | ------------------------------ |
| Bun                | Test runner, dev server | ✓         | 1.3.11  | —                              |
| Node.js            | npx, tooling            | ✓         | 24.13.1 | —                              |
| Docker             | PocketBase container    | ✓         | 28.5.2  | Run PocketBase binary directly |
| Anvil              | Local EVM for UAT       | ✓         | 1.5.1   | Use 0xl3 testnet (costs gas)   |
| Forge              | Contract deployment     | ✓         | 1.5.1   | —                              |
| Playwright         | Browser automation      | ✗         | —       | Manual UAT execution only      |
| PocketBase backend | API for UAT             | ✓ (prod)  | —       | Local Docker instance          |
| Wallet API         | Blockchain ops for UAT  | ✓ (prod)  | —       | Local `bun run` instance       |

**Missing dependencies with no fallback:**

- Playwright — blocks automated browser UAT. Fallback is manual execution per D-01.

**Missing dependencies with fallback:**

- None — all critical tools are available.

---

## Validation Architecture

### Test Framework

| Property           | Value                                               |
| ------------------ | --------------------------------------------------- |
| Framework          | bun:test + @testing-library/react + happy-dom       |
| Config file        | `apps/web/bunfig.toml` (preload: `./test-setup.ts`) |
| Quick run command  | `cd apps/web && bun test`                           |
| Full suite command | `cd apps/web && bun test --coverage`                |

### Phase Requirements → Test Map

| Req ID  | Behavior                                       | Test Type    | Automated Command                                       | File Exists?                                    |
| ------- | ---------------------------------------------- | ------------ | ------------------------------------------------------- | ----------------------------------------------- |
| GAPS-01 | Hook rejects feed when foodCount >= 10         | unit (hook)  | `bun test apps/backend/pb_hooks/16-feed-egg.pb.test.js` | ❌ Wave 0 — needs creation                      |
| GAPS-01 | Wallet-api rejects feed when newFoodCount > 10 | unit (API)   | `bun test wallet-api/server.test.js`                    | ❌ Wave 0 — needs creation                      |
| GAPS-02 | UAT Scenario 2-6, 8 (manual)                   | manual       | N/A — human execution                                   | ❌ Wave 0 — checklist only                      |
| GAPS-02 | UAT Scenario 9 (empty state)                   | e2e / manual | Playwright or manual                                    | ❌ Wave 0 — needs Playwright install            |
| GAPS-03 | Gas sponsorship logs appear                    | manual       | Check wallet-api console                                | ✅ Reference exists in PHASE-19-VERIFICATION.md |
| GAPS-04 | Empty state CTA routes to /marketplace         | unit / e2e   | `bun test` or Playwright                                | ❌ Wave 0 — needs test                          |
| GAPS-04 | Empty state renders when eggs.length === 0     | unit         | `bun test apps/web/app/eggs/page.test.tsx`              | ❌ Wave 0 — needs creation                      |
| GAPS-05 | Phase 17 UAT scenarios (6 manual)              | manual       | N/A — human execution                                   | ✅ Checklist exists in 17-UAT.md                |

### Sampling Rate

- **Per task commit:** `cd apps/web && bun test`
- **Per wave merge:** `cd apps/web && bun test --coverage`
- **Phase gate:** Full manual UAT checklist signed off in `20-UAT.md`

### Wave 0 Gaps

- [ ] `apps/backend/pb_hooks/16-feed-egg.pb.test.js` — covers GAPS-01 hook validation
- [ ] `apps/web/app/eggs/page.test.tsx` — covers GAPS-04 empty state routing
- [ ] `apps/web/components/eggs/featured-egg-hero.test.tsx` — covers FEED ME wiring
- [ ] Playwright install: `cd apps/web && bun add -d @playwright/test && npx playwright install chromium`
- [ ] `docs/GAS_SPONSORSHIP.md` — operator runbook structure

_(If no gaps: "None — existing test infrastructure covers all phase requirements")_

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                           |
| --------------------- | ------- | -------------------------------------------------------------------------- |
| V2 Authentication     | yes     | LINE OAuth + PocketBase auth store                                         |
| V3 Session Management | yes     | PocketBase JWT tokens                                                      |
| V4 Access Control     | yes     | Ownership checks in hook (`owner.id = user.id`) and wallet-api (`ownerOf`) |
| V5 Input Validation   | yes     | `egg_token_id` and `food_ids` validation in hook; Zod on frontend forms    |
| V6 Cryptography       | yes     | `decryptPrivateKey` in wallet-api; never hand-roll crypto                  |

### Known Threat Patterns for Stack

| Pattern                            | STRIDE                 | Standard Mitigation                                                                   |
| ---------------------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| Unauthorized feeding (not owner)   | Elevation of Privilege | Hook checks `owner.id = user.id`; wallet-api checks `ownerOf` on-chain                |
| Feeding already-hatched egg        | Tampering              | Dual-layer: hook fast-fail + wallet-api on-chain check                                |
| Gas griefing (exhaust relayer BNB) | Denial of Service      | Hook fast-fail prevents unnecessary gas spend; rate limiting at API gateway [ASSUMED] |
| Replay of feed transaction         | Repudiation            | Unique tx hash per operation; nonces managed by blockchain                            |

---

## Sources

### Primary (HIGH confidence)

- `apps/web/app/eggs/page.tsx` — empty state UI, CTA routing bug, FeaturedEggHero usage
- `apps/web/components/eggs/featured-egg-hero.tsx` — FEED ME button implementation, HATCH NOW conditional
- `apps/web/components/eggs/feed-dialog.tsx` — FeedDialog component for reuse
- `apps/backend/pb_hooks/16-feed-egg.pb.js` — current feed-egg hook logic (missing foodCount check)
- `apps/backend/pb_hooks/19-hatch-egg.pb.js` — established validation pattern to follow
- `wallet-api/server.js:40-90, 690-720, 920-1005, 1007-1100` — gas sponsorship, feed endpoint, buy endpoint
- `apps/web/hooks/use-food-nft.ts` — feedEgg client-side API call
- `resources/pkbase-wallet/wallet-srv/README-payment-flow.md` — gas sponsorship patterns
- `apps/web/package.json` — installed dependencies and test scripts
- `apps/web/test-setup.ts` — test environment configuration
- `tests/e2e/PHASE-19-VERIFICATION.md` — Phase 19 verification checklist with gas sponsorship checks
- `10-UAT.md` and `17-UAT.md` — deferred UAT scenarios

### Secondary (MEDIUM confidence)

- `apps/web/app/dashboard/commissions/page.tsx:35-42` — auto-polling pattern reference
- `resources/pkbase-wallet/SKILL.md` — Tokenine Wallet System API reference for operator docs

### Tertiary (LOW confidence)

- Playwright as the recommended browser automation tool (not yet installed, but industry standard for 2026)

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all versions verified from local environment or package.json
- Architecture: HIGH — all patterns verified from existing codebase
- Pitfalls: HIGH — derived from direct code analysis and known project history
- UAT execution: MEDIUM — depends on Anvil state availability and manual test discipline

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (stable stack, but Playwright version may update)
