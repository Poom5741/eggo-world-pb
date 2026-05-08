# Phase 14: Mobile Responsive Polish - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning
**Depends on:** Nothing (independent — can run parallel)

<domain>
## Phase Boundary

**This phase delivers:** Mobile responsive polish across all breakpoints (320px–1440px) with WCAG 2.2 compliant touch targets, updated bottom nav, and iOS zoom fix.

**Scope:**

- Update bottom nav items to: Dashboard, Eggs, Market, Wallet, Profile
- Verify and fix all touch targets ≥ 44×44px (WCAG 2.2)
- Test at 5 breakpoints: 320px, 375px, 768px, 1024px, 1440px
- Fix iOS input zoom (16px minimum font-size)
- Migrate 3 pages still using old `header.tsx` to `LayoutWithoutNav`

**Out of scope:**

- Feature changes (Feed/Play — Phase 15-16)
- USDT deposit tracking (Phase 13)
- Blockchain contract changes

</domain>

<decisions>
## Implementation Decisions

### Nav Items: Replace with user's 5

Replace existing NAV_ITEMS (Dashboard, Eggs, Animals, Marketplace, Referrals) with:
Dashboard, Eggs, Market, Wallet, Profile

Rationale: Matches user preference, reduces clutter on mobile, adds Wallet (core feature) and Profile (account access).

### Responsive Method: Tailwind breakpoints

Use existing Tailwind 4 responsive utilities (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).
Matches existing codebase convention. No separate CSS needed.

### Testing: Manual browser DevTools

Check at 5 breakpoints in browser DevTools. Document results.

</decisions>

<existing_artifacts>

## Existing Implementation

### BottomNavMobile.tsx (already exists)

- Location: `apps/web/components/BottomNavMobile.tsx`
- 27 lines, functional bottom nav with iOS safe area
- Uses `NAV_ITEMS` from SideNav.tsx
- Currently: Dashboard, Eggs, Animals, Marketplace, Referrals
- Need: Dashboard, Eggs, Market, Wallet, Profile

### LayoutWithoutNav.tsx (already exists)

- Location: `apps/web/components/LayoutWithoutNav.tsx`
- Composes SideNav (desktop) + BottomNavMobile (mobile)
- Used by most protected pages

### header.tsx (old, needs migration)

- Location: `apps/web/components/header.tsx`
- Used by 3 pages: wallet, eggs/[id]/hatch, dashboard/commissions
- Needs to be replaced with LayoutWithoutNav

### SideNav.tsx (needs nav update)

- Location: `apps/web/components/SideNav.tsx`
- Desktop sidebar
- NAV_ITEMS need updating

### Pages using old header.tsx

- `app/wallet/page.tsx`
- `app/eggs/[id]/hatch/page.tsx`
- `app/dashboard/commissions/page.tsx`

</existing_artifacts>

<requirements>
## Requirements

- **QUAL-03**: Bottom tab bar with 5 items, replaces hamburger on < 640px
- **QUAL-04**: 44×44px touch targets, WCAG 2.2
- **QUAL-05**: 5 breakpoints, no horizontal scroll
- **QUAL-06**: 16px font on inputs, iOS zoom prevention

</requirements>
