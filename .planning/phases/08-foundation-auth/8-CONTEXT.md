# Phase 8 Context: Foundation & Auth

**Phase:** 8  
**Milestone:** v0.0.6 Frontend Migration & Integration  
**Date:** 2026-04-05  
**Status:** Context defined, ready for research & planning

---

## Phase Goal

Users can access the new claymorphism UI and authenticate via LINE OAuth.

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06

**Success Criteria:**

1. Landing page renders hero section, NFT showcase, and how-to steps with claymorphism styling
2. User can click Join/Login button and initiate LINE OAuth with single click
3. User is redirected to dashboard after successful OAuth callback
4. Navigation components (TopNav, SideNav, BottomNav) render correctly on all device sizes
5. Material Symbols icons load and display consistently across all pages
6. LayoutWrapper provides consistent page structure throughout the application

---

## Implementation Decisions (Locked)

### 1. Migration Strategy: Hybrid Approach

**Decision:** Keep existing `apps/web/app/layout.tsx` as root, adopt new page components from Jules design.

**Rationale:** Existing layout.tsx has critical setup (Press Start 2P font, Geist font, Vercel Analytics) that should be preserved. New design pages will be migrated one-by-one.

**Downstream Impact:**

- **Researcher:** Investigate how to integrate Material Symbols with existing font setup
- **Planner:** Plan page-by-page migration order, ensure layout.tsx compatibility

**What stays:**

- Root `layout.tsx` (fonts, analytics, metadata)
- Existing `globals.css` base (with claymorphism extensions)
- PocketBase client setup

**What changes:**

- All page components (`page.tsx` files)
- Navigation structure (TopNav, SideNav, BottomNav)
- Icon system (Lucide → Material Symbols)

---

### 2. Styling: Full Material Symbols Adoption

**Decision:** Replace Lucide icons with Material Symbols throughout the application.

**Rationale:** Jules design is built around Material Symbols. Consistency matters more than preserving Lucide icons.

**Downstream Impact:**

- **Researcher:** Find Material Symbols Next.js integration pattern, verify CDN vs self-hosted
- **Planner:** Include icon replacement tasks for each page migration

**Implementation Notes:**

- Add Material Symbols font to layout.tsx
- Update all icon references: `<LucideIcon />` → `<span className="material-symbols-outlined">icon_name</span>`
- Maintain consistent icon sizes with CSS classes

**Existing Pattern (from Jules design):**

```tsx
<span className="material-symbols-outlined text-4xl text-on-primary-container">egg</span>
```

---

### 3. Navigation: Adopt Exactly as Designed

**Decision:** Implement TopNav, SideNav, and BottomNav exactly as designed in Jules files.

**Rationale:** Navigation is core to the new UX. Partial adoption would break the cohesive feel.

**Downstream Impact:**

- **Researcher:** Analyze responsive breakpoint logic in SideNav/BottomNav
- **Planner:** Navigation components must be built first (Phase 8 foundation)

**Component Source:**

- `TopNav.tsx` — Desktop top navigation bar
- `SideNav.tsx` — Desktop side navigation (collapses on mobile)
- `BottomNavMobile.tsx` — Mobile bottom navigation (visible <768px)

**Responsive Behavior:**

- Desktop (>768px): TopNav + SideNav visible, BottomNav hidden
- Mobile (<768px): TopNav visible, SideNav hidden, BottomNav visible

**Auth Integration:**

- TopNav shows wallet connect button when not authenticated
- TopNav shows user avatar dropdown when authenticated (preserve existing pattern)

---

### 4. OAuth Entry: /join Page

**Decision:** "Join EggoWorld" CTA on landing page redirects to `/join` page, which has LINE OAuth button.

**Rationale:** Follows new design flow. `/join` page serves as entry point with clear value proposition before OAuth initiation.

**Downstream Impact:**

- **Researcher:** Review `/join` page content from Jules design
- **Planner:** Create `/join` page before migrating other auth pages

**Flow:**

```
Landing Page (/) → Click "Join EggoWorld" → /join page → Click LINE button → LINE OAuth → Callback → /dashboard
```

**Existing Auth Logic Preserved:**

- Single-click LINE OAuth initiation (no double-click issue)
- sessionStorage for redirectTo tracking
- Direct `/auth/line` callback handler (silent processing)

---

### 5. TDD Tests: Colocated Pattern

**Decision:** Continue existing test pattern — `*.test.tsx` files colocated with components.

**Rationale:** Existing pattern works well, team familiarity, no need to change.

**Downstream Impact:**

- **Researcher:** None (existing pattern)
- **Planner:** Include test file creation in each TDD cycle (red → green → refactor)

**File Structure:**

```
apps/web/
├── app/
│   ├── page.tsx
│   ├── page.test.tsx  ← Test file
│   └── join/
│       ├── page.tsx
│       └── page.test.tsx  ← Test file
└── components/
    ├── TopNav.tsx
    └── TopNav.test.tsx  ← Test file
```

**TDD Commit Pattern:**

1. `red: test spec for landing page hero renders (#ISSUE)`
2. `green: implement landing page hero section (#ISSUE)`
3. `refactor: extract hero to reusable component (#ISSUE)`

---

### 6. LayoutWrapper: Adopt for All Pages

**Decision:** Use `LayoutWrapper.tsx` component to wrap all page content, providing consistent navigation structure.

**Rationale:** Jules design includes LayoutWrapper for consistent structure. Adopting this pattern ensures uniformity.

**Downstream Impact:**

- **Researcher:** Analyze LayoutWrapper children prop pattern
- **Planner:** Wrap every migrated page with LayoutWrapper

**Usage Pattern:**

```tsx
import LayoutWrapper from "@/components/LayoutWrapper"

export default function Dashboard() {
  return <LayoutWrapper>{/* Page content here */}</LayoutWrapper>
}
```

**LayoutWrapper Responsibilities:**

- Render TopNav (always visible)
- Render SideNav (visible on desktop only)
- Render BottomNav (visible on mobile only)
- Provide main content area with correct padding

**Root layout.tsx Still Handles:**

- HTML structure
- Font loading
- Metadata
- Analytics

---

## Prior Context (Preserved from v0.0.5)

### Auth Flow (Do Not Break)

**Single-Click LINE OAuth:**

- User clicks "Login with LINE" → direct OAuth initiation
- No intermediate `/auth/line` page visible
- Callback handler processes silently and redirects

**sessionStorage Tracking:**

- `redirectTo` stored before OAuth initiation
- Restored after callback for post-auth navigation

**Hydration Safety:**

```tsx
const isHydrated = useIsHydrated()
const user = isHydrated ? pb.authStore.record : null
// Always check hydration before accessing browser APIs
```

### Backend Integration (Preserved)

**PocketBase Client:**

- URL: `https://pb.eggoworld.io` (production)
- Auto-wallet creation on signup
- LINE OAuth token exchange via hooks

**Wallet API:**

- TypeScript + dacc-js v0.0.5
- Endpoint: `POST /api/wallet/create`
- Health check: `GET /health`

---

## Deferred Ideas (Scope Creep Prevention)

These ideas were mentioned but are OUT OF SCOPE for Phase 8:

- **Social login options** (Google, Discord) — Future milestone
- **Email/password auth** — LINE OAuth only for now
- **Multi-language support** — Thai only initially
- **Dark mode toggle** — Single theme for Phase 8
- **PWA offline support** — Performance milestone

---

## Open Questions for Research

These questions are for the researcher to investigate:

1. What is the best way to load Material Symbols font in Next.js 16?
2. Are there any accessibility concerns with Material Symbols vs Lucide?
3. What is the optimal responsive breakpoint for SideNav → BottomNav transition?
4. Should Material Symbols be self-hosted or loaded from Google CDN?

---

## Next Steps

**For Researcher:**

- Investigate Material Symbols integration patterns for Next.js 16
- Analyze responsive behavior in Jules navigation components
- Review existing auth flow to ensure no breaking changes

**For Planner:**

- Create task breakdown for each page migration
- Sequence: LayoutWrapper → Navigation → Landing → Join → Auth callback
- Include TDD test file creation in each task

---

**Downstream Consumer:** This CONTEXT.md feeds into:

- `gsd-phase-researcher` — Use decisions to scope research topics
- `gsd-planner` — Use decisions to create task specifications
- `gsd-ui-phase` — Use decisions for UI implementation contracts

**Last Updated:** 2026-04-05  
**Discussion Complete:** ✅ All gray areas resolved
