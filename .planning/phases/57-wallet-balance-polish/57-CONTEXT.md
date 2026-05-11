# Phase 57: Wallet Balance Polish - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the wallet balance display on the `/wallet` page with improved UX states. Specifically: loading skeleton, error recovery, smooth transitions, and maintaining existing auto-polling behavior.

**Requirement:** WALLET-01

**In scope:**

- Loading skeleton card for initial balance fetch
- Smooth fade-in transition from skeleton to real balance
- Maintain existing "Updating..." badge during background polling
- Maintain existing error state with retry (Claude's discretion on refinement)
- Existing 30-second auto-polling with exponential backoff stays unchanged

**Out of scope:**

- Deposit/withdraw page changes
- Unified transaction history
- New blockchain or smart contract features
- Wallet page structural changes beyond balance card

</domain>

<decisions>
## Implementation Decisions

### Loading State Design

- **D-01:** Skeleton card matching the full balance card layout — shows card outline with pulsing placeholder blocks for header area, large balance number area, and description line
- **D-02:** Smooth fade-in transition (not quick swap) when balance loads — skeleton fades to real content
- **D-03:** Keep existing "Updating..." badge with pulse animation during background polling (unchanged behavior)

### Claude's Discretion

- Error state design and refinement (inline card or other approach)
- Empty/zero balance display
- Exact skeleton styling (colors, animation timing, opacity)
- Balance number display polish (formatting, USD conversion presentation)
- Any animation durations and easing functions
- Overall layout spacing adjustments within the balance card
- Whether to reuse the BalanceCard component from `components/dashboard/balance-card.tsx` or create inline on the wallet page

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Wallet Page & Balance

- `apps/web/app/wallet/page.tsx` — Current wallet page with inline balance display
- `apps/web/components/dashboard/balance-card.tsx` — Existing BalanceCard component (can reuse or adapt)
- `apps/web/hooks/use-wallet-poll.ts` — useWalletPoll hook with loading/error states and exponential backoff

### Prior Phase Decisions

- `.planning/phases/09-dashboard-wallet/09-CONTEXT.md` §D-17 to D-25 — Balance display, polling, error/empty state conventions
- `.planning/phases/25-ux-ui-consistency-fixes/25-CONTEXT.md` — UX/UI consistency patterns (claymorphism, typography)

### UI Patterns

- `apps/web/components/dashboard/buddy-chain.tsx` §87-98 — Loading skeleton pattern (existing codebase pattern)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **BalanceCard component** (`components/dashboard/balance-card.tsx`) — Already has claymorphism styling, error/retry state, and balance formatting. Consider reusing on wallet page.
- **useWalletPoll hook** (`hooks/use-wallet-poll.ts`) — Returns balance, loading, error, refresh. Already handles exponential backoff, wallet validation, 4xx errors.
- **BuddyChain loading skeleton** (`components/dashboard/buddy-chain.tsx`) — Uses `animate-pulse` pattern for loading state. Good reference for skeleton card implementation.

### Established Patterns

- Claymorphism design: `Card variant="clay-xl"`, gradient backgrounds `from-primary/20 via-primary/10 to-transparent`
- Loading states: `animate-pulse` Tailwind utility for skeleton placeholders
- Error states: `Alert variant="destructive"` or inline error message with `Button variant="outline"` retry
- Font: Pixel font (`font-[var(--font-pixel)]`) for headers, body font (`font-body`) for content
- Layout: `LayoutWithoutNav` wrapper with `space-y-6` spacing

### Integration Points

- Wallet page at `apps/web/app/wallet/page.tsx` — Add loading skeleton before the balance card
- Balance display section within the existing Card component — wrap with conditional rendering for loading vs loaded states

</code_context>

<specifics>

## Specific Ideas

- Skeleton should mirror the exact card layout: header title area + large number block + smaller description line
- Use existing `animate-pulse` utility (consistent with BuddyChain loading pattern)
- Smooth fade: use CSS transition `opacity` or `transition-all duration-500`

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 57-wallet-balance-polish_
_Context gathered: 2026-05-09_
