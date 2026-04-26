# Phase 32: Marketplace Stats API - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers three API endpoints for marketplace and platform statistics:

1. GET `/api/v2/market-stats` — Public marketplace stats (floor price, 24h volume, active listings)
2. GET `/api/v2/platform-stats` — Admin-only platform stats (revenue, users, NFT counts)
3. GET `/api/v2/referral-stats` — User referral tree stats (downline, earnings, recruits)

All endpoints read from existing PocketBase collections (resale_listings, transaction_logs, users). No new collections or smart contract changes required.

</domain>

<decisions>
## Implementation Decisions

### API Design

- All stats endpoints return JSON with `success: true` and `data: { ... }` format
- Market stats endpoint is public (no auth required)
- Platform stats requires admin role
- Referral stats requires authentication (user sees own stats only)

### Data Aggregation

- Stats are computed on-demand from existing collections (no caching layer for MVP)
- Floor price = minimum price across all active listings
- 24h volume = sum of all sale transactions in last 24 hours
- Active listings = count of records with status = 'active'

### Frontend Integration

- React hooks with polling (30s default interval)
- Skeleton loading states
- Error boundaries for failed requests

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- `apps/web/lib/pocketbase/client.ts` — PocketBase SDK wrapper
- `apps/web/lib/hooks/use-is-hydrated.ts` — Hydration safety hook
- `apps/backend/pb_hooks/` — Existing hook patterns (32-market-stats.pb.js)
- shadcn/ui components for cards and stats display

### Established Patterns

- PocketBase hooks use `e.requestInfo().auth` for authentication
- Response format: `e.json(200, { success: true, data: { ... } })`
- Error format: `e.json(400, { success: false, error: { message, code } })`
- `$app.findRecordsByFilter()` for database queries

### Integration Points

- Marketplace page can display stats card
- Admin dashboard at `/admin/` for platform stats
- User dashboard for referral stats

</code_context>

<specifics>
## Specific Ideas

- Stats cards should use Lucide icons (TrendingDown, TrendingUp, Package)
- Grid layout: 3 columns on desktop, 1 column on mobile
- Numbers should be formatted with proper decimal places for USDT values

</specifics>

<deferred>
## Deferred Ideas

- Historical chart visualization (line charts for volume over time)
- Real-time WebSocket updates instead of polling
- Export stats as CSV for admin reporting

</deferred>
