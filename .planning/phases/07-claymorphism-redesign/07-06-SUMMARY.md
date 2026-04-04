---
phase: 07-claymorphism-redesign
plan: 06
subsystem: frontend
tags: [claymorphism, ui-redesign, pages, responsive]
dependency_graph:
  requires: ["07-02", "07-03", "07-04", "07-05"]
  provides: ["07-07", "07-08"]
  affects: ["apps/web/app/*"]
tech_stack:
  added: []
  patterns: ["claymorphism-design-tokens", "component-reuse", "hybrid-aesthetic"]
key_files:
  created: []
  modified:
    - "apps/web/app/page.tsx"
    - "apps/web/app/dashboard/page.tsx"
    - "apps/web/app/auth/login/page.tsx"
    - "apps/web/app/auth/sign-up/page.tsx"
    - "apps/web/app/auth/callback/page.tsx"
    - "apps/web/app/auth/error/page.tsx"
    - "apps/web/app/dashboard/eggs/page.tsx"
    - "apps/web/app/dashboard/referrals/page.tsx"
    - "apps/web/app/wallet/page.tsx"
decisions:
  - "Used clay-lg variant for auth forms to provide depth without overwhelming"
  - "Applied clay-xl variant with clay-2xl shadow for balance cards (financial prominence)"
  - "Maintained pixel art icons within clay containers for hybrid aesthetic"
  - "Used gap-clay-xl for consistent spacing across all grid layouts"
metrics:
  duration_minutes: 45
  completed: "2026-04-05"
---

# Phase 07 Plan 06: Pages Wave 1 - Redesigning Core Pages with Claymorphism Aesthetics

## One-Liner

Six core pages redesigned with claymorphism: landing page with clay hero/CTA, dashboard with clay stat widgets, auth pages with clay-lg forms, eggs page with clay layout, referrals page with clay hierarchy, and wallet page with clay-xl balance card.

---

## Pages Redesigned

### 1. Landing Page (`apps/web/app/page.tsx`)

**Clay Elements:**

- Hero logo: `rounded-clay-xl` + `shadow-clay-2xl` in clay frame with gradient background
- How-it-works: `Card variant="clay-lg"` container with structured content
- CTA buttons: Custom clay styling with `rounded-clay-lg` + `shadow-clay-xl`
- Background: Clay gradient orbs for depth (primary/accent blur effects)

**Commit:** `adf221c`

---

### 2. Dashboard Main Page (`apps/web/app/dashboard/page.tsx`)

**Clay Elements:**

- Balance card: `Card variant="clay-xl"` with gradient background + `shadow-clay-2xl`
- Stats grid: 4x `Card variant="clay"` with `shadow-clay-lg`
- Grid spacing: `gap-clay-xl` for consistent spacing
- Quick actions: `Card variant="clay-lg"` with `shadow-clay-xl`
- Action buttons: `Button variant="clay" size="clay-md"`

**Commit:** `dab4d4d`

---

### 3. Auth Pages (4 files)

**Files:**

- `apps/web/app/auth/login/page.tsx`
- `apps/web/app/auth/sign-up/page.tsx`
- `apps/web/app/auth/callback/page.tsx`
- `apps/web/app/auth/error/page.tsx`

**Clay Elements:**

- Form containers: `Card variant="clay-lg"` with `shadow-clay-xl`
- Logo displays: Clay containers with `rounded-clay-lg` + `shadow-clay-md`
- Submit buttons: `Button variant="clay" size="clay-lg"`
- Referrer display (sign-up): Clay badge with `rounded-clay-sm` + `shadow-clay-sm`
- Error card: Clay variant with accent border for visual distinction

**Commit:** `74b4b16`

---

### 4. Eggs Dashboard Page (`apps/web/app/dashboard/eggs/page.tsx`)

**Clay Elements:**

- Page header: Clay container with `rounded-clay-lg` + `shadow-clay-lg` + `p-clay-xl`
- Stats cards: 4x `Card variant="clay"` with `shadow-clay-lg`
- Grid spacing: `gap-clay-xl` for egg grid
- Empty state: `Card variant="clay"` with `py-clay-2xl`
- Mint button: `Button variant="clay" size="clay-md"`

**Commit:** `4fa4f0e`

---

### 5. Referrals Page (`apps/web/app/dashboard/referrals/page.tsx`)

**Clay Elements:**

- Summary cards: 3x `Card variant="clay"` with `shadow-clay-lg`
- Grid spacing: `gap-clay-xl` for card grid
- Referral link card: `Card variant="clay-lg"` with `shadow-clay-xl`
- Copy button: `Button variant="clay/clay-secondary"` based on state
- Downline table: `Card variant="clay-lg"` with `shadow-clay-xl`
- Table badges: Added `shadow-clay-sm` for depth

**Commit:** `a609420`

---

### 6. Wallet Page (`apps/web/app/wallet/page.tsx`)

**Clay Elements:**

- Balance card: `Card variant="clay-xl"` with gradient + `shadow-clay-2xl` (maximum depth)
- Sync button: `Button variant="clay" size="clay-md"`
- Error alert: `Card variant="clay"` with destructive border

**Commit:** `9e0ad95`

---

## Clay Variant Usage Patterns

| Page       | clay      | clay-lg         | clay-xl     | Purpose                 |
| ---------- | --------- | --------------- | ----------- | ----------------------- |
| Landing    | -         | ✓ (content)     | -           | Featured content depth  |
| Dashboard  | ✓ (stats) | ✓ (actions)     | ✓ (balance) | Hierarchy by importance |
| Auth pages | -         | ✓ (forms)       | -           | Consistent form depth   |
| Eggs       | ✓ (stats) | ✓ (header)      | -           | Layout structure        |
| Referrals  | ✓ (stats) | ✓ (link, table) | -           | Content grouping        |
| Wallet     | -         | -               | ✓ (balance) | Financial prominence    |

---

## Responsive Design Notes

All pages tested with responsive classes:

- `md:text-3xl` for larger headings on desktop
- `md:grid-cols-2 lg:grid-cols-4` for adaptive grids
- `sm:flex-row` for button stacks on mobile
- Clay shadows scale appropriately at all breakpoints

**Spacing consistency:** `gap-clay-xl` (32px) used throughout for visual rhythm.

---

## Visual Verification Results

### Completed Checklist

- [x] Landing page: Clay hero with xl button, clay-2xl shadow NFT frame, gradient depth
- [x] Dashboard: Clay-xl balance card (prominent), clay stat widgets, clay grid spacing
- [x] Auth pages: Clay-lg form containers, clay buttons, clay logo displays
- [x] Eggs page: Clay header container, clay stats, gap-clay-xl grid
- [x] Referrals page: Clay stats, clay-lg link/table cards, clay badges
- [x] Wallet page: Clay-xl balance with clay-2xl shadow (maximum depth)
- [x] All pages: Press Start 2P typography maintained for headings
- [x] All pages: Pixel art icons preserved in clay containers
- [x] No TypeScript errors
- [x] Build passes (17 routes verified)

### Hybrid Integrity

**Pixel art maintained:**

- Egg logo displays within clay frames
- Icons (Lucide) preserved in stat cards
- No pixel art replaced — clay elements complement existing aesthetic

---

## Files Modified

**Total:** 9 files across 6 pages

| File                           | Lines Changed | Clay Pattern                          |
| ------------------------------ | ------------- | ------------------------------------- |
| `page.tsx`                     | +62 -31       | Hero clay frame, clay-lg content card |
| `dashboard/page.tsx`           | +26 -18       | Clay-xl balance, clay stats grid      |
| `auth/login/page.tsx`          | +50 -25       | Clay-lg form, clay button             |
| `auth/sign-up/page.tsx`        | +55 -28       | Clay-lg form, clay referrer badge     |
| `auth/callback/page.tsx`       | +60 -30       | Clay feedback card                    |
| `auth/error/page.tsx`          | +55 -30       | Clay error card with accent border    |
| `dashboard/eggs/page.tsx`      | +48 -40       | Clay header, clay stats, clay grid    |
| `dashboard/referrals/page.tsx` | +95 -15       | Clay stats, clay-lg cards             |
| `wallet/page.tsx`              | +8 -5         | Clay-xl balance, clay button          |

**Total:** ~459 lines added, ~222 lines modified

---

## Commits Summary

| Commit    | Files | Description                                 |
| --------- | ----- | ------------------------------------------- |
| `adf221c` | 1     | Landing page claymorphism                   |
| `dab4d4d` | 1     | Dashboard main page                         |
| `74b4b16` | 4     | Auth pages (login, signup, callback, error) |
| `4fa4f0e` | 1     | Eggs dashboard page                         |
| `9e0ad95` | 1     | Wallet page                                 |
| `a609420` | 2     | Referrals page                              |

**Total:** 6 commits, 9 files modified

---

## Ready for Next Plan

**Status:** ✅ READY FOR PLAN 07-07 (Pages Wave 2)

All core pages have been successfully redesigned with claymorphism aesthetics. The hybrid approach (pixel art + clay containers) has been validated across all page types:

- Landing/conversion pages
- Dashboard/data displays
- Auth forms
- Collection grids
- Hierarchy displays
- Financial widgets

**Next wave can focus on:**

- Secondary pages (mint, marketplace, commissions)
- Modal/dialog clay styling
- Advanced clay animations
- Claymorphism for complex data visualizations

---

## Self-Check: PASSED

All created files verified:

- [x] `apps/web/app/page.tsx` - Landing page with clay hero
- [x] `apps/web/app/dashboard/page.tsx` - Dashboard with clay widgets
- [x] `apps/web/app/auth/login/page.tsx` - Clay login form
- [x] `apps/web/app/auth/sign-up/page.tsx` - Clay signup form
- [x] `apps/web/app/auth/callback/page.tsx` - Clay feedback
- [x] `apps/web/app/auth/error/page.tsx` - Clay error state
- [x] `apps/web/app/dashboard/eggs/page.tsx` - Clay egg layout
- [x] `apps/web/app/dashboard/referrals/page.tsx` - Clay hierarchy
- [x] `apps/web/app/wallet/page.tsx` - Clay financial widgets

All commits exist:

- [x] `adf221c` - Landing page
- [x] `dab4d4d` - Dashboard
- [x] `74b4b16` - Auth pages
- [x] `4fa4f0e` - Eggs page
- [x] `9e0ad95` - Wallet page
- [x] `a609420` - Referrals page

---

**Plan 07-06: COMPLETE** ✅

Six pages redesigned, hybrid aesthetic validated, ready for Wave 2.
