# Phase 14: Mobile Responsive Polish - Discussion Log

**Date:** 2026-05-06
**Participants:** User (Poom), AI Agent
**Result:** ✅ Discussed — ready for planning

---

## Questions & Decisions

### Q1: Bottom nav items?

- **User choice:** Dashboard, Eggs, Market, Wallet, Profile
- **Existing nav:** Dashboard, Eggs, Animals, Marketplace, Referrals
- **Decision:** Replace with user's 5 items
- **Action:** Update NAV_ITEMS in SideNav.tsx

### Q2: CSS approach?

- **Decision:** Tailwind breakpoints (recommended)
- **Rationale:** Matches existing codebase, no separate CSS needed

### Q3: Testing approach?

- **Decision:** Manual testing at 5 breakpoints
- **Rationale:** Faster, no Playwright overhead needed for visual checks

---

## Key Findings

1. **Bottom nav already exists** — `BottomNavMobile.tsx` is functional with iOS safe area support. Only need to update nav items and verify touch targets.

2. **Two navigation systems** — Most pages use `LayoutWithoutNav` (SideNav + BottomNavMobile), but 3 pages still use old `header.tsx`. Need migration.

3. **NAV_ITEMS shared** — Both SideNav and BottomNavMobile use the same `NAV_ITEMS` array from SideNav.tsx. One change updates both.
