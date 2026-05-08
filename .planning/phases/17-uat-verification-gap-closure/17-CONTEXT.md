# Phase 17: UAT & Verification Gap Closure - Context

**Gathered:** 2026-04-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

Close all outstanding UAT and verification gaps from prior phases by implementing four key deliverables: (1) Execute Phase 10's 10 pending UAT scenarios with hybrid automation, (2) Complete USDT flow end-to-end with gas sponsorship following pkbase-wallet reference pattern, (3) Add auto-polling to all dashboard pages, and (4) Implement foodCount validation in both backend hook and wallet-api layers.

**Scope anchor:** This phase delivers verification gaps from phases 10, 03, and 12 — not new features. All implementation must follow patterns already established in prior phases and the pkbase-wallet reference at `/resources/pkbase-wallet/`.
</domain>

<decisions>
## Implementation Decisions

### UAT Test Execution Strategy (Phase 10 Gap)

- **D-01:** Hybrid testing approach — automate critical paths (feed flow, hatch flow), execute edge cases manually with documentation
- **D-02:** Critical paths are those affecting core game loop (eggs → food → hatch cycle)
- **D-03:** Manual execution documented in 17-UAT.md with screenshots and pass/fail status per scenario

### USDT Flow Implementation (Phase 03 Gap 1)

- **D-04:** Full end-to-end Buy Now flow following pkbase-wallet reference pattern — internal ledger transfers, NOT direct blockchain transactions
- **D-05:** Gas sponsorship via platform reserve covers all blockchain fees (users pay no gas)
- **D-06:** User's own wallet only performs deposits/withdrawals to/from external chain; marketplace operations use PocketBase balance transfers
- **D-07:** Reference implementation: `/resources/pkbase-wallet/wallet-srv/README-payment-flow.md` defines gas sponsorship flow with EIP-712 authorizations

### Dashboard Auto-Polling (Phase 03 Gap 2)

- **D-08:** All dashboard pages receive auto-polling at 30-second intervals matching existing pattern in commissions page
- **D-09:** Pages requiring polling: eggs, commissions, deposits, referrals — any page showing dynamic data that changes on-chain or via backend hooks
- **D-10:** "Updating..." indicator with pulse animation shown during polls (consistent with Phase 14 mobile polish)

### Food Count Validation (Phase 12 Gap)

- **D-11:** Dual-layer validation — backend hook (`pb_hooks`) performs fast-fail check on `food_count < 10` before calling wallet-api; wallet-api validates against real-time on-chain state as safety net
- **D-12:** Backend error: HTTP 400 with message "Cannot feed this egg — food count already meets maximum"
- **D-13:** Wallet-api error: Returns validation error caught by backend hook before transaction submission

### the agent's Discretion

- Exact animation timing for "Updating..." pulse indicator (use Tailwind defaults)
- Which specific UAT scenarios warrant automation vs manual testing (prioritize based on user impact)
- Loading skeleton designs for dashboard pages that currently have none

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### USDT Flow & Gas Sponsorship Pattern

- `resources/pkbase-wallet/wallet-srv/README-payment-flow.md` — Complete payment flow with gas sponsorship, EIP-712 authorizations, and ERC-20 transfers
- `resources/pkbase-wallet/SKILL.md` — Tokenine Wallet System API reference including balance checks, token transfers, and gasless payments
- `resources/pkbase-wallet/AGENTS.md` — Critical deployment rules and SSH key restrictions for pkbase-wallet server

### Existing Auto-Polling Pattern

- `apps/web/app/dashboard/commissions/page.tsx:35` — Working auto-polling implementation (30s interval with "Updating..." indicator) to use as reference pattern
- `apps/backend/pb_hooks/13-track-deposit.pb.js` — Backend deposit tracking hook showing polling logic pattern

### Food Count Validation Reference

- `wallet-api/server.js:819` — Existing feed-egg endpoint where foodCount validation should be added
- `apps/backend/pb_hooks/19-hatch-egg.pb.js:87` — Existing hatch-egg hook with food_count check as reference for backend validation pattern

### UAT Documentation

- `.planning/phases/10-egg-management/10-UAT.md` — 10 pending test scenarios that need execution and documentation
- `.planning/phases/10-egg-management/10-CONTEXT.md` — Phase 10 context with egg management decisions (D-01 through D-24)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `BuyFlow` component (`apps/web/components/marketplace/BuyFlow.tsx`) — Purchase flow UI already integrated into product detail page; needs backend integration for USDT ledger transfer
- `useMarketplaceSync` hook (`hooks/use-marketplace-sync.ts`) — Syncs marketplace listings with PocketBase; can be adapted for other resource types
- Commissions auto-polling pattern (`app/dashboard/commissions/page.tsx:35-42`) — 30-second polling loop with "Updating..." state management

### Established Patterns

- Gas sponsorship via platform reserve (from pkbase-wallet reference) — wallet-srv handles EIP-712 authorization signing and gasless transaction submission
- Auto-polling pattern: `setInterval` in `useEffect`, cleanup on unmount, "Updating..." indicator with pulse animation during fetches
- Backend hook validation: PocketBase hooks validate before calling blockchain (e.g., `19-hatch-egg.pb.js`)

### Integration Points

- BuyNow button → `BuyFlow.tsx:245` in product detail page (`marketplace/[id]/page.tsx`)
- Dashboard polling → All pages under `app/dashboard/` directory
- Food count validation → `wallet-api/server.js:feed-egg` endpoint and corresponding PocketBase hook

</code_context>

<specifics>
## Specific Ideas

- Reference implementation at `/resources/pkbase-wallet/wallet-srv/README-payment-flow.md` provides exact API contracts for gas-sponsored USDT transfers — downstream agents MUST read this before implementing Buy Now flow
- Phase 10 UAT scenarios reference specific URLs: `https://pb.eggoworld.io` for production backend testing
- All dashboard polling must use the same pattern as commissions page (30s interval, "Updating..." text with pulse animation)

</specifics>

<deferred>
## Deferred Ideas

None — all discussion stayed within Phase 17 scope. Future enhancements (e.g., real-time notifications for deposits, advanced egg hatch animations) are noted in prior phase contexts but out of scope here.

### Reviewed Todos (not folded)

No todos were reviewed or deferred during this discussion.

</deferred>

---

_Phase: 17-uat-verification-gap-closure_  
_Context gathered: 2026-04-21_
