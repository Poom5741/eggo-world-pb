# Phase 40: Frontend Components - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase implements 4 frontend components that wire up the backend APIs created in Phases 32-36:

1. **RecruitmentBonusCard.tsx** — Displays recruitment tier status and claim button
2. **Admin Game Config Page** (`/admin/game-config`) — Admin UI for game parameters
3. **BurnNFTDialog.tsx** — Confirmation dialog for burning NFTs
4. **KYCStatusBadge.tsx** — Shows user's KYC verification status

</domain>

<decisions>
## Implementation Decisions

### Component Patterns
- Use shadcn/ui components (Button, Dialog, Card, etc.)
- Lucide icons for visual indicators
- Hydration-safe with `useIsHydrated()` hook

### State Management
- React hooks for API calls
- Polling for async operations (VRF hatch status)
- Loading skeletons and error states

### Routing
- Admin pages under `/admin/` route group
- Components colocated with feature directories

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/components/ui/` — shadcn/ui components
- `apps/web/lib/hooks/use-is-hydrated.ts` — Hydration safety
- `apps/web/lib/pocketbase/client.ts` — PocketBase SDK wrapper
- Existing admin page structure

### Established Patterns
- Claymorphism UI style
- Tailwind CSS 4 for styling
- Next.js 16 App Router

### Integration Points
- Dashboard can embed RecruitmentBonusCard
- Admin nav links to `/admin/game-config`
- NFT cards can trigger BurnNFTDialog
- User profile shows KYCStatusBadge

</code_context>

<specifics>
## Specific Ideas

- RecruitmentBonusCard uses Trophy icon, tier labels
- Admin config page shows all parameters with update forms
- BurnNFTDialog shows warning with irreversible action message
- KYCStatusBadge uses Shield/ShieldCheck/ShieldX icons

</specifics>

<deferred>
## Deferred Ideas

- Animated tier progress visualization
- Config change history UI
- Burn NFT history log
- KYC document upload flow

</deferred>
