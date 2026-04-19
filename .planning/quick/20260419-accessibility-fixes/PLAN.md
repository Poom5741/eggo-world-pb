---
task: accessibility-fixes
date: 2026-04-19
type: quick
status: in-progress
description: Fix critical accessibility issues in Phase 14 mobile responsive implementation
---

# Quick Task: Accessibility Fixes for Phase 14

## Objective

Fix all critical accessibility issues identified in code review of Phase 14 mobile responsive implementation to achieve WCAG 2.2 AA compliance.

## Issues to Fix

### Critical (MUST FIX)

1. **Color Contrast Failure** - Navigation labels at 10px fail WCAG 2.2 AA (2.83:1 vs required 4.5:1)
   - Fix: increase to text-xs (12px) and use --on-surface color
   
2. **Missing Screen Reader Labels** - No aria-label or aria-current on navigation links
   - Fix: add aria-label and aria-current="page" to all BottomNavMobile links
   
3. **Active State Uses Color Only** - Colorblind users can't distinguish active tabs
   - Fix: add non-color indicator (font-weight or scale transform)

### Warnings (SHOULD FIX)

4. **No Focus Visible Styles** - Keyboard users can't see focused nav item
   - Fix: add focus-visible:outline-2 focus-visible:outline-[var(--primary)]
   
5. **Missing Viewport Meta Tag** - Next.js layout.tsx needs viewport config
   - Fix: add viewport export with proper mobile configuration
   
6. **Nav Element Missing Label** - Screen readers can't differentiate nav elements
   - Fix: add aria-label="Mobile navigation" to BottomNavMobile nav element

## Files to Modify

- apps/web/components/BottomNavMobile.tsx
- apps/web/app/layout.tsx

## Acceptance Criteria

- [ ] All navigation labels meet WCAG 2.2 AA 4.5:1 contrast ratio
- [ ] Screen readers announce active page state correctly
- [ ] Keyboard focus is visible on navigation items
- [ ] Viewport meta tag prevents unwanted zoom behavior
- [ ] Build succeeds: bun run build
