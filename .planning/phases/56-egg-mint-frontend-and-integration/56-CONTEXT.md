# Phase 56: Egg Mint Frontend & Integration - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Egg mint page with payment flow, status indicators, and transaction confirmation. This phase delivers the frontend UI for users to purchase egg NFTs — showing price, balance, confirm button, transaction status (pending/confirmed/failed), and minted egg details on success.
</domain>

<decisions>
## Implementation Decisions

### Success Result Display (D-01)

- **D-01:** Show minted egg details on success using a **modal overlay**
- Modal keeps context, allows user to see details before dismissing
- Continue redirecting to `/eggs?highlight={egg_id}` after 3 seconds OR user dismisses modal

### Egg Details to Display

- egg_id, token_id, rarity_seed, transaction hash
- Initial food count (2 Food NFTs)
- Referral chain (if applicable)

### Claude's Discretion

- Implementation details (component structure, modal styling, confirmation polling UX)
- Error message styling and retry UX
- Mobile responsive adjustments

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Key Implementation Files

- `apps/web/app/mint/page.tsx` — Existing mint page (Phase 56 builds on this)
- `apps/web/app/mint/error.tsx` — Error boundary for mint page
- `apps/backend/pb_hooks/13-mint-egg-nft.pb.js` — Backend mint endpoint (Phase 54)
- `apps/backend/pb_hooks/14-claim-commission.pb.js` — Commission claiming (Phase 55)

</canonical_refs>

<codebase_context>

## Existing Code Insights

### Reusable Assets

- `LayoutWithoutNav` component — Used for mint page layout
- `useIsHydrated()` hook — For hydration-safe auth checks
- `createClient()` from `@/lib/pocketbase/client` — PocketBase SDK
- shadcn/ui components: Button, Input, Label, Alert
- Lucide icons: Egg, Loader2, CheckCircle2, AlertCircle, ExternalLink

### Established Patterns

- Auth check with `restoreAuth()` and redirect to `/auth/login`
- Balance fetching from `user_wallets` collection
- Poll-based transaction confirmation (`pollForConfirmation`)
- Error handling with descriptive messages from backend
- Claymorphism styling with `clay-card`, `clay-button`, `clay-input` classes

### Integration Points

- Mint page at `/mint` calls `POST /api/v2/mint-egg` with auth token
- Status polling via `GET /api/v2/tx-status/{hash}`
- Redirect to `/eggs?highlight={id}` after successful mint

</codebase_context>

<specifics>
## Specific Ideas

- Modal should have claymorphism styling to match the app's design system
- Display "View on BSCScan" link for transaction verification
- Initial food count is 2 (display this in the egg details modal)
- Referral chain shown as badge or text if present

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 56-egg-mint-frontend-and-integration_
_Context gathered: 2026-05-08_
