# Phase 16: Play Feature + Test Infrastructure - Context

**Gathered:** 2026-04-19  
**Status:** Ready for planning

<domain>
## Phase Boundary

**This phase delivers:** Daily check-in reward system with streak tracking, wallet balance detail modal, and test suite improvements (fix vi.mock failures, increase coverage to 80%+).

**Scope:**

- Play button on egg cards triggers state-based actions (care tips for unhatched, check-in for hatched)
- Daily check-in modal with countdown timer, streak display, and claim button
- Streak tracking with bonus rewards at 7-day and 30-day milestones
- Wallet balance detail modal showing full breakdown and transaction history
- Fix all 9 vi.mock test failures
- Increase test coverage from 70% to 80%+ with tests for new features

**Out of scope:**

- Complex mini-games (deferred to v0.0.8)
- Swipe-to-refresh on egg list (deferred to v0.0.8)
- Batch feeding multiple eggs (deferred to v0.0.8)

</domain>

<decisions>
## Implementation Decisions

### Play Feature UX & Behavior

- **D-01:** Play button lives on egg card - shows care tips for unhatched eggs, daily check-in for hatched animals (FEAT-05)
- **D-02:** Daily check-in UI appears as modal dialog (not separate page or inline expansion)
- **D-03:** Streak counter displayed on both dashboard and egg/animal card for visibility at a glance (FEAT-07)
- **D-04:** Streak counter uses compact format with fire emoji (e.g., "14d 🔥") with color intensity based on streak length

### Test Infrastructure Strategy

- **D-05:** Fix all 9 vi.mock failures FIRST, verify test suite runs clean, THEN add new tests for Phase 16 features
- **D-06:** Prioritize new tests for Phase 16 features (Play, check-in, balance modal) to reach 80% coverage
- **D-07:** Use integration tests for critical paths (check-in flow, balance polling) rather than pure unit mocks
- **D-08:** Test files colocated with source files (component.test.tsx next to component.tsx) - matches existing pattern
- **D-09:** Write component + hook tests for Play feature (check-in flow, countdown timer, streak display)
- **D-10:** Check test coverage after each batch of fixes (quick feedback loop during development)

### Wallet Balance Modal

- **D-11:** Users trigger balance detail modal by tapping the balance display in header/dashboard (FEAT-09)
- **D-12:** Modal shows full breakdown: USDT balance, pending deposits, NFT value, and transaction history
- **D-13:** Transaction history displays last 10 transactions with type icon, amount, status badge, timestamp, and BSCScan links
- **D-14:** Balance auto-refresh already implemented (exponential backoff 30s→5min from v0.0.6) - just needs modal UI

### Daily Check-in Backend Design

- **D-15:** Check-in data stored in user_stats collection (check_in_streak, last_check_in, check_in_count fields)
- **D-16:** Daily check-in implemented as PocketBase hook (17-claim-checkin.pb.js) following existing hook pattern
- **D-17:** Daily reward mints 1 Food NFT via wallet-api (real blockchain transaction, matches economy)
- **D-18:** Streak bonus rewards: 7-day = 2 Food NFTs, 30-day = 5 Food NFTs + special badge
- **D-19:** 24-hour cooldown between claims enforced by hook (validates last_check_in timestamp)
- **D-20:** Streak resets if user misses a day (checked on each claim attempt)

### Claude's Discretion

The following decisions are left to Claude (researcher/planner can decide):

- Exact visual style for Play button icon and placement on egg card
- Color scheme and animation for streak counter fire emoji
- Modal animation timing and entrance/exit transitions
- Exact layout of transaction history items in balance modal
- Error message wording for check-in cooldown violations

### Folded Todos

None — no pending todos were folded into this phase's scope.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements (MANDATORY)

- `.planning/REQUIREMENTS.md` §FEAT-05 to FEAT-09 (Play feature, check-in, wallet balance requirements)
- `.planning/REQUIREMENTS.md` §QUAL-01 to QUAL-02 (Test infrastructure requirements)
- `.planning/ROADMAP.md` §Phase 16 (Phase goal and success criteria)

### Existing Implementation

- `apps/web/components/eggs/egg-card.tsx` — EggCard component (add Play button)
- `apps/web/components/header.tsx` — Header with balance display (add tap handler)
- `apps/web/hooks/use-wallet-balance.ts` — Wallet balance hook (exponential backoff already implemented)
- `apps/backend/pb_hooks/` — Existing PocketBase hooks (reference pattern for new check-in hook)
- `wallet-api/server.js` — Wallet API endpoints (reference for Food NFT minting)

### Test Infrastructure

- `apps/web/` — Test files (_.test.ts, _.test.tsx) — 410 test files currently, 9 with vi.mock failures
- `apps/web/vitest.config.ts` — Vitest configuration (check mock setup patterns)

### UI System

- `apps/web/components/ui/dialog.tsx` — Dialog component (reuse for check-in modal and balance modal)
- `apps/web/components/ui/button.tsx` — Button component (clay variants)
- `.planning/phases/15-feed-feature/15-CONTEXT.md` — Prior phase context (modal patterns, claymorphism UI)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **EggCard** (`components/eggs/egg-card.tsx`): Displays egg/animal info with progress bar — add Play button
- **Dialog** (`components/ui/dialog.tsx`): Claymorphism dialog component — reuse for check-in and balance modals
- **use-wallet-balance hook**: Already implements exponential backoff polling (30s→5min) — no changes needed
- **PocketBase hooks**: Existing pattern in `apps/backend/pb_hooks/NN-*.pb.js` — follow for check-in hook

### Established Patterns

- **Claymorphism UI**: All dialogs, buttons, cards use `variant="clay"` or `variant="clay-secondary"` (Phases 12-15)
- **Material Symbols icons**: Use `className="material-symbols-outlined"` for icons (not Lucide)
- **PocketBase hooks**: Named `NN-feature.pb.js` where NN = execution order, use `$apis.requireAuth()`
- **Test file location**: Colocated with source (component.test.tsx next to component.tsx)
- **Mobile-first responsive**: Breakpoints at 320px, 375px, 768px, 1024px, 1440px (Phase 14)

### Integration Points

- Play button on EggCard triggers state-based modal (unhatched → care tips, hatched → check-in)
- Check-in modal calls PocketBase `/api/v2/check-in` endpoint (new hook)
- Hook validates cooldown, mints Food NFT via wallet-api, updates user_stats
- Balance modal triggered by tapping balance display in header
- Transaction history fetched from PocketBase transactions collection (last 10 records)

</code_context>

<specifics>
## Specific Ideas

- Play button should be visible on ALL egg cards (both hatched and unhatched) but trigger different actions
- Check-in modal shows countdown timer: "Next check-in in: HH:MM:SS"
- Streak counter format: "14d 🔥" with increasingly intense color/glow for longer streaks
- Balance modal shows: USDT balance, pending deposits count, estimated NFT value, last 10 transactions
- Each transaction in history shows: type icon (mint/transfer/claim), amount (+/-), status badge (confirmed/pending), timestamp, BSCScan link
- Test suite must run WITHOUT errors before adding new tests (fix 9 vi.mock failures first)
- Integration tests preferred for critical paths (more realistic than pure mocks)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

### Reviewed Todos (not folded)

No pending todos were reviewed for this phase.

</deferred>

---

_Phase: 16-play-feature-test-infrastructure_  
_Context gathered: 2026-04-19_
