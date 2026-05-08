# Phase 14: Mobile Responsive Polish — Specification

**Created:** 2026-04-19  
**Ambiguity score:** 0.18 (gate: ≤0.20) ✓  
**Requirements:** 4 locked

---

## Goal

Mobile users (< 1024px) see a 4-item bottom tab bar with optimized touch targets and responsive layout across 5 breakpoints.

---

## Background

Current state from codebase:

- BottomNavMobile exists but has 6 items (Dashboard, Eggs, Animals, Marketplace, Referrals + Settings/Support)
- SideNav is hidden on mobile, uses `lg:hidden` breakpoint
- globals.css has no explicit responsive breakpoints defined (only utility classes via Tailwind)
- Touch target sizes not verified against WCAG 44×44px requirement
- No iOS zoom prevention for inputs

Gap: Need to reduce navigation items, add explicit breakpoint support, verify touch targets meet accessibility standards.

---

## Requirements

1. **Bottom tab bar with 4 primary items**: Reduces from 6 items to 4 main navigation items on mobile bottom bar.
   - Current: BottomNavMobile has 6 items including Referrals, Settings, Support
   - Target: BottomNavMobile shows only 4 items: Dashboard, Eggs, Animals, Marketplace (Referrals hidden or moved)
   - Acceptance: Mobile view (< 1024px) shows exactly 4 navigation items in bottom bar; desktop view (≥ 1024px) shows full SideNav with all items

2. **Touch targets meet 44×44px minimum (WCAG 2.2)**: All interactive elements have adequate hit area.
   - Current: BottomNavMobile uses `h-24` (~96px total height) but individual nav item hit areas unclear; SideNav items use `py-3` (~12px + padding)
   - Target: All buttons, links, and nav items have minimum 44×44px touch target (using Tailwind's `min-h-[110px]` or equivalent for mobile items)
   - Acceptance: Accessibility audit tool reports all interactive elements pass 44×44px minimum; manual measurement confirms each nav item has ≥ 44px height/width

3. **Layout tested at 5 breakpoints**: No horizontal scroll, text readable, images scaled correctly.
   - Current: globals.css uses `@apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` but no explicit breakpoint definitions for 320px, 375px, 768px, 1024px, 1440px
   - Target: CSS defines responsive behavior at 5 breakpoints: 320px (smallest mobile), 375px (iPhone SE/Mini), 768px (iPad), 1024px (tablet/desktop boundary), 1440px (large desktop)
   - Acceptance: Visual regression shows no horizontal scroll at any breakpoint; text remains ≥ 16px on inputs at all breakpoints; images use `max-width: 100%` and scale correctly

4. **iOS zoom prevention on inputs**: All input fields prevent unwanted zoom-to-text behavior.
   - Current: No iOS-specific input styling exists in globals.css
   - Target: All input fields have `font-size: 16px` minimum (using Tailwind's `text-sm` which is ~14px, needs adjustment) or use `transform: scale()` for visual size reduction without actual font-size change
   - Acceptance: Testing on iOS device confirms no zoom when focusing inputs; all inputs display at readable size without triggering Safari's zoom behavior

---

## Boundaries

**In scope:**

- BottomNavMobile component modification (reduce to 4 items)
- SideNav mobile behavior (ensure it hides properly, transforms content appropriately)
- globals.css breakpoint definitions for 5 breakpoints
- Touch target sizing for all nav items and buttons
- iOS input zoom prevention styling
- Layout responsiveness at 5 breakpoints

**Out of scope:**

- Referrals page functionality — deferred to future phase if needed (can be accessed via icon-only with tooltip)
- Settings/Support pages — can remain accessible via SideNav on desktop or deferred to hamburger menu pattern
- Tablet landscape optimization — deferred to v0.0.8 (MVP focuses on portrait mobile and desktop)
- Dark mode specific breakpoints — uses existing dark mode CSS variables, no new breakpoint logic needed
- Custom responsive utility classes beyond standard Tailwind patterns

---

## Constraints

- Must use Tailwind CSS 4 syntax (`@apply`, `min-h-[...]`, etc.)
- Breakpoints: 320px, 375px, 768px, 1024px, 1440px (standard mobile-first breakpoints)
- Touch targets must meet WCAG 2.2 44×44px minimum on actual touch devices
- iOS inputs must use `font-size: 16px` minimum to prevent zoom (cannot use smaller font with scale transform alone)
- Must maintain existing Claymorphism design system (no major visual redesign)

---

## Acceptance Criteria

- [ ] BottomNavMobile displays exactly 4 navigation items on mobile (< 1024px)
- [ ] SideNav is hidden on mobile and content is accessible via bottom bar only
- [ ] All nav items in BottomNavMobile have minimum 44×44px touch target area
- [ ] All buttons and links meet 44×44px minimum touch target
- [ ] No horizontal scroll at any of the 5 breakpoints (320px, 375px, 768px, 1024px, 1440px)
- [ ] All input fields have font-size ≥ 16px on iOS devices (no zoom on focus)
- [ ] Text remains readable at all breakpoints (minimum 14px for body, 16px for inputs)
- [ ] Images scale correctly using `max-width: 100%` at all breakpoints
- [ ] Visual regression tests pass for all 5 breakpoints

---

## Ambiguity Report

| Dimension           | Score | Min   | Status | Notes                                      |
| ------------------- | ----- | ----- | ------ | ------------------------------------------ |
| Goal Clarity        | 0.90  | 0.75  | ✓      | Specific mobile navigation goal            |
| Boundary Clarity    | 0.95  | 0.70  | ✓      | Explicit in/out of scope list              |
| Constraint Clarity  | 0.80  | 0.65  | ✓      | Tailwind v4, WCAG, iOS constraints defined |
| Acceptance Criteria | 0.85  | 0.70  | ✓      | 9 pass/fail criteria                       |
| **Ambiguity**       | 0.18  | ≤0.20 | ✓      | Gate passed                                |

---

## Interview Log

| Round | Perspective     | Question summary                          | Decision locked                             |
| ----- | --------------- | ----------------------------------------- | ------------------------------------------- |
| 1     | Researcher      | What's current mobile nav implementation? | BottomNavMobile exists with 6 items         |
| 1     | Researcher      | Where are responsive breakpoints defined? | globals.css has no explicit breakpoints     |
| 2     | Simplifier      | Minimum viable mobile navigation?         | Reduce to 4 items, support 5 breakpoints    |
| 2     | Simplifier      | Major users don't use much on mobile?     | Support for best practice, not MVP priority |
| 3     | Boundary Keeper | What explicitly won't be done?            | Referrals hidden, tablet landscape deferred |

---

_Phase: 14-marketplace-complete_  
_Spec created: 2026-04-19_  
_Next step: /gsd-discuss-phase 14 — implementation decisions (component structure, breakpoint details, etc.)_
