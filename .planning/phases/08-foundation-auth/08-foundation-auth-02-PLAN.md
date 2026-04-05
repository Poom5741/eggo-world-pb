---
phase: 08-foundation-auth
plan: 02
type: tdd
wave: 2
depends_on:
  - 08-foundation-auth-01
files_modified:
  - apps/web/components/TopNav.tsx
  - apps/web/components/TopNav.test.tsx
  - apps/web/components/SideNav.tsx
  - apps/web/components/SideNav.test.tsx
  - apps/web/components/BottomNavMobile.tsx
  - apps/web/components/BottomNavMobile.test.tsx
autonomous: true
requirements:
  - FOUND-04
  - FOUND-05
must_haves:
  truths:
    - TopNav displays EggoWorld logo and navigation links
    - SideNav shows on desktop (≥1024px) with navigation items
    - BottomNav shows on mobile (<1024px) with navigation items
    - Material Symbols icons render in all navigation components
    - Navigation responds correctly to viewport changes
  artifacts:
    - path: apps/web/components/TopNav.tsx
      provides: Desktop top navigation bar
      min_lines: 20
      contains: material-symbols-outlined
    - path: apps/web/components/SideNav.tsx
      provides: Desktop side navigation
      contains: hidden lg:block
    - path: apps/web/components/BottomNavMobile.tsx
      provides: Mobile bottom navigation
      contains: lg:hidden
  key_links:
    - from: apps/web/components/TopNav.tsx
      to: apps/web/app/globals.css
      via: Material Symbols CSS
      pattern: material-symbols-outlined
    - from: apps/web/components/SideNav.tsx
      to: apps/web/components/BottomNavMobile.tsx
      via: Responsive breakpoints
      pattern: hidden lg:block|lg:hidden
---

<objective>
Create navigation components: TopNav, SideNav, and BottomNavMobile with responsive behavior

Purpose: Implement the navigation structure (FOUND-04) that provides consistent wayfinding across all pages. Components use Material Symbols icons (FOUND-05) as established in Plan 01.

Output: Three tested navigation components with correct responsive breakpoints
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/08-foundation-auth/08-CONTEXT.md
@.planning/phases/08-foundation-auth/08-RESEARCH.md
@resources/eggo-world-uxui-jules/src/components/TopNav.tsx
@resources/eggo-world-uxui-jules/src/components/SideNav.tsx
@resources/eggo-world-uxui-jules/src/components/BottomNavMobile.tsx
@apps/web/components/LayoutWrapper.tsx
</context>

<tasks>

<task type="auto" tdd="true">
  <name>task 1: TDD - TopNav component with Material Symbols</name>
  <files>apps/web/components/TopNav.tsx, apps/web/components/TopNav.test.tsx</files>
  <action>
    RED PHASE:
    1. Create TopNav.test.tsx with tests:
       - "renders EggoWorld logo as link to /"
       - "displays Dashboard navigation link"
       - "displays Marketplace navigation link"
       - "includes Material Symbols icons (account_balance_wallet, notifications)"
       - "has Connect Wallet button with clay-button class"
    2. Run test (should FAIL)
    
    GREEN PHASE:
    3. Create TopNav.tsx from Jules design with these key elements:
       - Fixed position: className="fixed top-0 w-full z-50"
       - Height: h-20
       - Logo: Link href="/" with text "EggoWorld" (text-2xl font-black italic text-yellow-800)
       - Desktop links: Dashboard, Marketplace (hidden md:flex)
       - Icons: account_balance_wallet, notifications (Material Symbols)
       - Connect Wallet button with clay-button class
       - Accessibility: aria-label on icon buttons
    4. Run test (should PASS)
    
    REFACTOR PHASE:
    5. Extract navigation items to constant array if repeated
    6. Verify TypeScript types for Link href
    7. Commit atomic changes
  </action>
  <verify>
    <automated>bun test apps/web/components/TopNav.test.tsx - run</automated>
  </verify>
  <done>TopNav renders with logo, navigation links, Material Symbols icons, and responsive behavior</done>
</task>

<task type="auto" tdd="true">
  <name>task 2: TDD - SideNav component for desktop navigation</name>
  <files>apps/web/components/SideNav.tsx, apps/web/components/SideNav.test.tsx</files>
  <action>
    RED PHASE:
    1. Create SideNav.test.tsx with tests:
       - "hidden on mobile (has hidden class)"
       - "visible on desktop (has lg:block class)"
       - "renders navigation items with Material Symbols icons"
       - "includes: Dashboard, Eggs, Marketplace, Referrals links"
       - "fixed position on left side (left-0, w-64)"
    2. Run test (should FAIL)
    
    GREEN PHASE:
    3. Create SideNav.tsx from Jules design:
       - Responsive: className="hidden lg:block fixed left-0 top-20 h-[calc(100vh-5rem)] w-64"
       - Navigation items array with: {icon, label, href}
       - Material Symbols for each item (dashboard, egg, storefront, people)
       - Active link styling support (active-nav-link class)
       - Accessibility: aria-current for active links
    4. Run test (should PASS)
    
    REFACTOR PHASE:
    5. Extract navigation items to shared constant (can be imported by BottomNav)
    6. Verify z-index doesn't conflict with TopNav (z-50)
    7. Commit atomic changes
  </action>
  <verify>
    <automated>bun test apps/web/components/SideNav.test.tsx - run</automated>
  </verify>
  <done>SideNav renders on desktop only (≥1024px) with navigation items and Material Symbols icons</done>
</task>

<task type="auto" tdd="true">
  <name>task 3: TDD - BottomNavMobile component for mobile navigation</name>
  <files>apps/web/components/BottomNavMobile.tsx, apps/web/components/BottomNavMobile.test.tsx</files>
  <action>
    RED PHASE:
    1. Create BottomNavMobile.test.tsx with tests:
       - "visible on mobile (no hidden class)"
       - "hidden on desktop (has lg:hidden class)"
       - "renders 4-5 navigation items with Material Symbols icons"
       - "fixed position at bottom (bottom-0, h-20)"
       - "includes safe area padding for iOS (pb-safe or equivalent)"
    2. Run test (should FAIL)
    
    GREEN PHASE:
    3. Create BottomNavMobile.tsx from Jules design:
       - Responsive: className="lg:hidden fixed bottom-0 left-0 right-0 h-20"
       - iOS safe area: style={{paddingBottom: 'env(safe-area-inset-bottom)'}}
       - Navigation items (same as SideNav): Dashboard, Eggs, Marketplace, Referrals
       - Material Symbols icons with labels
       - Active state styling
       - Flexbox layout for even distribution
    4. Run test (should PASS)
    
    REFACTOR PHASE:
    5. Import navigation items from shared constant (same as SideNav)
    6. Verify z-index below TopNav content but above page content
    7. Commit atomic changes
  </action>
  <verify>
    <automated>bun test apps/web/components/BottomNavMobile.test.tsx - run</automated>
  </verify>
  <done>BottomNavMobile renders on mobile only (<1024px) with navigation items and iOS safe area support</done>
</task>

</tasks>

<verification>
- [ ] bun test apps/web/components/TopNav.test.tsx passes
- [ ] bun test apps/web/components/SideNav.test.tsx passes
- [ ] bun test apps/web/components/BottomNavMobile.test.tsx passes
- [ ] bun run build completes without errors
- [ ] Responsive behavior verified: SideNav hidden <1024px, BottomNav hidden ≥1024px
- [ ] Material Symbols icons render correctly in all components
</verification>

<success_criteria>

- TopNav renders with EggoWorld logo, navigation links, icon buttons
- SideNav visible on desktop (≥1024px), hidden on mobile
- BottomNavMobile visible on mobile (<1024px), hidden on desktop
- All navigation components use Material Symbols icons consistently
- Breakpoint at 1024px (lg) for SideNav/BottomNav toggle
- All 3 TDD tests passing with RED→GREEN→REFACTOR commits
- Navigation items shared between SideNav and BottomNavMobile
  </success_criteria>

<output>
After completion, create `.planning/phases/08-foundation-auth/08-foundation-auth-02-SUMMARY.md` with:
- Navigation components implemented (TopNav, SideNav, BottomNavMobile)
- Responsive breakpoint strategy (1024px lg breakpoint)
- Test coverage summary
- Any deviations from Jules design
- Ready for Plan 03 (page implementations)
</output>
