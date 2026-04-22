# Phase 20: Gap Closure & UAT Execution - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Close deferred validation gaps from Phases 10, 12, 17, and 19. Execute 16 UAT scenarios (10 from Phase 10 + 6 from Phase 17), fix known bugs, validate foodCount enforcement, and document the gas sponsorship system for operators.

**In scope:**

- UAT execution: 10 Phase 10 scenarios + 6 Phase 17 scenarios
- foodCount validation: backend hook fast-fail + wallet-api safety net
- Bug fixes: empty state CTA routing, FeaturedEggHero FEED ME stub
- Gas sponsorship documentation: operator runbook

**Out of scope:**

- New features (breeding, tier rewards, secondary market)
- Smart contract changes
- Wallet architecture changes
- UI redesign
  </domain>

<decisions>
## Implementation Decisions

### UAT Execution Strategy

- **D-01:** Automation split — Playwright/Cypress browser tests for repeatable scenarios; manual execution for visual/animation tests
- **D-02:** Test data — Dedicated test account with seeded data on Anvil (local dev node) for local testing; live network for production validation
- **D-03:** Execution order — Dependency order: auth → wallet → mint → feed → hatch → marketplace → polling → edge cases
- **D-04:** Documentation — Markdown checklists in phase directory (`20-UAT.md`) with pass/fail status and notes
- **D-05:** Sign-off criteria — All 16 scenarios must pass; no known gaps remain
- **D-06:** Environments — Both local (Anvil) and production (`https://pb.eggoworld.io`)

### Bug Fix Scope

- **D-07:** Empty state CTA — "Get Your First Egg" button on `/eggs` page routes to `/marketplace` (currently routes to `/eggs`, a bug)
- **D-08:** FeaturedEggHero FEED ME — Wire the button to open `FeedDialog` (currently only `console.log` stub from Phase 15)

### foodCount Validation

- **D-09:** Dual-layer validation — Backend PocketBase hook performs fast-fail check before calling wallet-api; wallet-api validates against on-chain state as safety net
- **D-10:** UX pattern — Disable/hide FEED ME button when `foodCount >= 10`; show "HATCH!" button instead
- **D-11:** Backend error — If validation fails at hook layer, return HTTP 400 with message: "Cannot feed this egg — it is full and ready to hatch"

### Gas Sponsorship Documentation

- **D-12:** Scope — Operator runbook covering relayer wallet funding, monitoring, key rotation, gas limits, and cost tracking
- **D-13:** Detail level — 100% derived from `resources/pkbase-wallet` reference patterns
- **D-14:** Location — Standalone `docs/GAS_SPONSORSHIP.md`

### Claude's Discretion

- Exact Playwright vs Cypress choice (both acceptable, use project standard)
- Anvil test network configuration details
- Exact wording and styling of error messages
- Specific Anvil block time and fork configuration
- Loading states during UAT test execution
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UAT Scenarios

- `.planning/phases/10-egg-management/10-UAT.md` — 10 deferred UAT scenarios (egg display, feed flow, hatch flow, polling, error boundary, empty state, wallet check)
- `.planning/phases/17-uat-verification-gap-closure/17-UAT.md` — 6 UAT scenarios for Buy Now flow, dashboard polling, foodCount validation
- `tests/e2e/PHASE-19-VERIFICATION.md` — Phase 19 verification checklist with gas sponsorship checks

### Gas Sponsorship Reference

- `resources/pkbase-wallet/wallet-srv/README-payment-flow.md` — Complete payment flow with gas sponsorship, EIP-712 authorizations
- `resources/pkbase-wallet/SKILL.md` — Tokenine Wallet System API reference
- `resources/pkbase-wallet/AGENTS.md` — Deployment rules and SSH restrictions

### Existing Validation Code

- `wallet-api/server.js:939` — Existing on-chain foodCount check in feed-egg endpoint
- `apps/backend/pb_hooks/19-hatch-egg.pb.js:87` — Existing hatch-egg hook with food_count check pattern
- `apps/web/app/eggs/page.tsx:158-197` — Current empty state UI (with buggy CTA routing)
- `apps/web/app/dashboard/commissions/page.tsx:35-42` — Auto-polling pattern reference

### Prior Phase Contexts

- `.planning/phases/17-uat-verification-gap-closure/17-CONTEXT.md` — Phase 17 decisions on hybrid testing, dual-layer validation, auto-polling
- `.planning/phases/19-real-nft-mint-flow-marketplace-integration/19-CONTEXT.md` — Phase 19 decisions on gas sponsorship, mint flow, error handling
  </canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Empty state UI** (`apps/web/app/eggs/page.tsx:158-197`) — Already implemented with clay-card styling, Material Symbols icon, and refresh button. Only the CTA route needs fixing.
- **FeedDialog** (`apps/web/components/egg/FeedDialog.tsx` or similar) — Existing dialog used by EggCard's "Manage Egg" button. Reuse for FeaturedEggHero.
- **Auto-polling pattern** (`app/dashboard/commissions/page.tsx:35-42`) — 30-second interval with "Updating..." indicator. Reference for any polling-related UAT scenarios.
- **E2E test suite** (`tests/e2e/`) — Existing Node.js test infrastructure. Extend with Playwright/Cypress for browser automation.

### Established Patterns

- **PocketBase hook validation** — Hooks validate before calling blockchain (e.g., `19-hatch-egg.pb.js`). Follow same pattern for foodCount fast-fail.
- **PocketBase hook response format** — `e.json(200, { success: true, data: {...} })` for success, `e.json(400, { success: false, error: { message, code } })` for errors
- **Claymorphism design system** — All UI fixes should use existing clay variants and Material Symbols icons

### Integration Points

- **Empty state CTA** → `app/eggs/page.tsx:180` — Change `router.push('/eggs')` to `router.push('/marketplace')`
- **FeaturedEggHero FEED ME** → Wire to existing feed dialog handler used by EggCard
- **Backend hook validation** → Add check in feed-egg hook before calling wallet-api
- **Gas sponsorship docs** → Reference `resources/pkbase-wallet/` for all operator procedures

### Known Issues

- `apps/web/app/eggs/page.tsx:180` — CTA button routes to `/eggs` (itself) instead of marketplace
- FeaturedEggHero "FEED ME" button is a TODO stub (`console.log` only) — blocks proper feed UX from hero section
  </code_context>

<specifics>
## Specific Ideas

- "Use Anvil for local blockchain testing — real integration without testnet gas costs"
- "Follow pkbase-wallet patterns exactly for gas sponsorship docs — don't reinvent"
- "Empty state should feel inviting, not dead-end — marketplace link is the right CTA"
- "Disable FEED ME rather than error toast — prevention is better than apology"
  </specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 20 scope.

### Reviewed Todos (not folded)

No pending todos were reviewed for this phase.
</deferred>

---

_Phase: 20-gap-closure-uat-execution_
_Context gathered: 2026-04-22_
