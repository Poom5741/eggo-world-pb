# Phase 9: Dashboard & Wallet - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard with real-time wallet balance, referral tracking, and activity feed. Users can view their USDT balance, see their 4-level referral chain, access quick actions, and view recent transactions.

**Requirements:** FOUND-07, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05

**Success Criteria:**

1. Dashboard displays user's USDT balance fetched from PocketBase
2. Wallet balance auto-polls every 30 seconds with "Updating..." indicator during refresh
3. Referral chain displays 4 levels (G1-G4) with correct commission percentages (20%/10%/10%/10%)
4. Quick action buttons (Feed All, Hatch Ready, Buy Food) trigger correct navigation flows
5. Recent activity shows last 10 transactions from PocketBase
6. Active eggs count displays correctly with egg preview avatars

</domain>

<decisions>
## Implementation Decisions

### Icon System

- **D-01:** Full Material Symbols adoption — replace all Lucide icons with Material Symbols to match Jules design
- **D-02:** Use Jules design icon names: `payments`, `egg`, `groups`, `account_balance_wallet`, `trending_up`, `restaurant`, `auto_fix_high`, `shopping_basket`, `egg_alt`, `shopping_cart`, `group`
- **D-03:** Add Material Symbols font to layout.tsx (preserve existing font setup from Phase 8)

### Referral Display (Buddy Chain)

- **D-04:** Adopt Jules "Buddy Chain" card visualization with 4 cards (L1-L4)
- **D-05:** Each level card shows: percentage fill visualization, level count, buddy count
- **D-06:** Percentage fill bars use level colors: L1=primary, L2=secondary, L3=tertiary, L4=on-surface-variant
- **D-07:** Card layout: square aspect ratio cards with percentage overlay, level label below, buddy count at bottom

### Quick Actions

- **D-08:** Replace current 4-button grid with Jules 3 action cards
- **D-09:** Action cards: "Feed All Eggs", "Hatch Ready Eggs", "Buy Food Bundle"
- **D-10:** Card design: colored containers (primary/secondary/tertiary), icon on left, text description, chevron on right
- **D-11:** Hover/active states: scale-[1.02] on hover, scale-[0.98] on active with transition-transform

### Recent Activity Feed

- **D-12:** Match Jules styling — colored circular icons, slide animation on hover
- **D-13:** Transaction card structure: icon circle (left), title + timestamp (center), amount (right)
- **D-14:** Color coding by transaction type: tertiary=hatch, secondary=purchase, primary=commission
- **D-15:** "View All History" button in header (links to future transaction history page)
- **D-16:** Show last 10 transactions from PocketBase (per DASH-04)

### Balance Display & Polling

- **D-17:** Keep "Updating..." badge during polling with pulse animation
- **D-18:** Badge position: top-right of balance card header
- **D-19:** Polling interval: 30 seconds (existing useWalletPoll hook)
- **D-20:** Balance card uses gradient background (from-primary/20 via-primary/10 to-transparent) with shadow-clay-2xl

### Error & Empty States (OpenCode Discretion)

- **D-21:** Empty state (0 eggs): friendly illustration + "Get your first egg" CTA button linking to mint page
- **D-22:** Error state (wallet API fails): show error message with retry button
- **D-23:** After 3 failed polling attempts: show "Wallet unavailable" with manual refresh option
- **D-24:** Polling retry strategy: exponential backoff (30s → 60s → 120s → 5min), reset to 30s on success
- **D-25:** Transaction categorization mapping:
  - `hatch` → "Hatched Egg" + egg_alt icon
  - `mint_egg` → "Minted Egg" + egg icon
  - `mint_food` → "Bought Food" + shopping_cart icon
  - `commission` → "Referral Commission" + group icon
  - `sale` → "NFT Sale" + payments icon

### OpenCode's Discretion

- Loading skeleton design for balance card
- Exact spacing and typography within cards
- Animation duration/timing functions (use Tailwind defaults)
- Exact color opacity values for percentage fills
- Fallback avatar image source

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dashboard & Wallet

- `resources/eggo-world-uxui-jules/src/app/dashboard/page.tsx` — Jules dashboard design reference (layout, cards, Buddy Chain visualization, activity feed styling)
- `resources/eggo-world-uxui-jules/src/components/LayoutWrapper.tsx` — Navigation wrapper pattern
- `apps/web/hooks/use-wallet-poll.ts` — Existing auto-polling hook (30s interval, already implemented)
- `.planning/REQUIREMENTS.md` — DASH-01 through DASH-05, FOUND-07 requirements

### Design System

- `apps/web/components/ui/card.tsx` — Card component with clay variants (clay, clay-lg, clay-xl)
- `apps/web/components/ui/badge.tsx` — Badge component for "Updating..." indicator
- `apps/web/components/ui/button.tsx` — Button component with clay variants
- `.planning/phases/08-foundation-auth/8-CONTEXT.md` — Material Symbols adoption decision, claymorphism styling patterns

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **useWalletPoll hook** (`apps/web/hooks/use-wallet-poll.ts`): Auto-polling for wallet balance, 30s interval, already handles loading/error states — can be used directly
- **LayoutWrapper** (`apps/web/components/LayoutWrapper.tsx`): Navigation wrapper with TopNav, SideNav, BottomNav — wrap dashboard page
- **Card variants** (`apps/web/components/ui/card.tsx`): clay, clay-lg, clay-xl, clay-card shadow classes — use for all dashboard cards
- **PocketBase client** (`apps/web/lib/pocketbase/client.ts`): `createClient`, `getUser`, `isAuthenticated` — auth and data fetching
- **Header component** (`apps/web/components/header.tsx`): Existing header — check if compatible with Jules design or needs migration

### Established Patterns

- **Hydration safety**: Always use `useIsHydrated()` hook before accessing `pb.authStore.record` or browser APIs
- **Auth redirects**: Use `router.push('/auth/login')` when user not authenticated (preserve existing pattern)
- **Data fetching**: Fetch in `useEffect` after hydration, use `Promise.all` for parallel queries
- **Thai comments**: All new code should have Thai comments (per project conventions)
- **TDD workflow**: Red (test) → Green (implement) → Refactor commits for all features

### Integration Points

- **PocketBase collections**: `users` (profile data), `egg_nfts` (egg count/status), `commission_records` (referral earnings), transaction history collection
- **Wallet API**: `/api/wallet/{address}/balance` endpoint for USDT balance (existing endpoint)
- **Navigation**: Dashboard is protected route — middleware redirects unauthenticated users
- **Icon migration**: Replace Lucide imports with Material Symbols span elements throughout dashboard

</code_context>

<specifics>
## Specific Ideas

- "I like how the Buddy Chain cards show percentage progress — makes it feel like a game"
- "Quick actions should jump directly into the flow — no intermediate screens"
- "Activity feed should feel alive with subtle animations, but not distracting"
- Balance card should be the most prominent element on the page (clay-xl variant with gradient)
- Egg preview avatars in "Active Eggs" card: show 3 actual egg icons + "+9" overflow indicator

</specifics>

<deferred>
## Deferred Ideas

These ideas were mentioned but are OUT OF SCOPE for Phase 9:

- **Transaction detail modal** — Click transaction to see full details (future phase)
- **Export transaction history** — CSV/PDF export feature (backlog)
- **Custom date range filter** — Filter activity by date range (future phase)
- **Real-time notifications** — Push notifications for transactions (future milestone)
- **Multi-wallet support** — Connect multiple wallets (out of scope)

### Reviewed Todos (not folded)

None — no pending todos were reviewed for this phase.

</deferred>

---

_Phase: 09-dashboard-wallet_
_Context gathered: 2026-04-05_
