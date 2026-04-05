---
phase: 08-foundation-auth
plan: 01
type: tdd
wave: 1
depends_on: []
files_modified:
  - apps/web/app/layout.tsx
  - apps/web/app/globals.css
  - apps/web/components/LayoutWrapper.tsx
  - apps/web/components/LayoutWrapper.test.tsx
autonomous: true
requirements:
  - FOUND-05
  - FOUND-06
must_haves:
  truths:
    - Material Symbols icons render correctly when used in components
    - LayoutWrapper wraps page content with navigation structure
    - Design tokens from Jules design are available via CSS variables
  artifacts:
    - path: apps/web/app/layout.tsx
      provides: Root layout with Material Symbols CDN + fonts
      contains: Material+Symbols+Outlined
    - path: apps/web/app/globals.css
      provides: Design tokens and Material Symbols CSS
      contains: .material-symbols-outlined
    - path: apps/web/components/LayoutWrapper.tsx
      provides: Navigation wrapper component
      exports: default LayoutWrapper
  key_links:
    - from: apps/web/components/LayoutWrapper.tsx
      to: apps/web/app/globals.css
      via: CSS class imports
      pattern: clay-|surface-|primary-
---

<objective>
Setup foundation: Material Symbols integration, design tokens, and LayoutWrapper structure

Purpose: Establish the visual foundation that all subsequent pages will build upon. Material Symbols (FOUND-05) and LayoutWrapper (FOUND-06) are prerequisites for all other components.

Output: Working layout with icon font, design tokens, and wrapper component with passing tests
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/08-foundation-auth/08-CONTEXT.md
@.planning/phases/08-foundation-auth/08-RESEARCH.md
@.planning/ROADMAP.md
@apps/web/app/layout.tsx
@apps/web/app/globals.css
@resources/eggo-world-uxui-jules/src/app/layout.tsx
@resources/eggo-world-uxui-jules/src/components/LayoutWrapper.tsx
</context>

<feature>
  <name>Material Symbols + LayoutWrapper Foundation</name>
  <files>apps/web/app/layout.tsx, apps/web/app/globals.css, apps/web/components/LayoutWrapper.tsx</files>
  <behavior>
    - Layout.tsx includes Material Symbols CDN link in <head>
    - globals.css defines .material-symbols-outlined CSS class with font-variation-settings
    - LayoutWrapper renders with TopNav, SideNav, BottomNav placeholders
    - LayoutWrapper children prop renders page content correctly
    - Design tokens (surface, primary, secondary, etc.) are accessible via CSS variables
  </behavior>
  <implementation>
    1. Merge Jules font imports with existing Press_Start_2P + Geist
    2. Add Material Symbols CDN link to layout.tsx <head>
    3. Add Material Symbols CSS to globals.css
    4. Create LayoutWrapper component from Jules design
    5. Write tests for each artifact
  </implementation>
</feature>

<tasks>

<task type="auto" tdd="true">
  <name>task 1: TDD - Material Symbols integration in layout.tsx</name>
  <files>apps/web/app/layout.tsx, apps/web/app/layout.test.tsx</files>
  <action>
    RED PHASE:
    1. Create layout.test.tsx with test: "includes Material Symbols CDN link"
    2. Test assertion: layout.tsx content includes 'Material+Symbols+Outlined'
    3. Run test (should FAIL)
    
    GREEN PHASE:
    4. Update layout.tsx: Add to <head>:
       <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    5. Preserve existing: Press_Start_2P, Geist, Vercel Analytics, metadata
    6. Run test (should PASS)
    
    REFACTOR PHASE:
    7. Verify no linting errors
    8. Commit atomic changes
  </action>
  <verify>
    <automated>bun test apps/web/app/layout.test.tsx - run</automated>
  </verify>
  <done>Test passes: layout.tsx includes Material Symbols CDN link, existing fonts preserved</done>
</task>

<task type="auto" tdd="true">
  <name>task 2: TDD - Material Symbols CSS in globals.css</name>
  <files>apps/web/app/globals.css, apps/web/app/globals.css.test.ts</files>
  <action>
    RED PHASE:
    1. Create globals.css.test.ts with tests:
       - ".material-symbols-outlined class exists"
       - "includes font-variation-settings with FILL, wght, GRAD, opsz"
    2. Test by reading globals.css file content
    3. Run tests (should FAIL)
    
    GREEN PHASE:
    4. Add to globals.css (after existing claymorphism tokens):
       ```css
       /* Material Symbols icon font */
       .material-symbols-outlined {
         font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
         font-size: 24px;
         line-height: 1;
         letter-spacing: normal;
         text-transform: none;
         display: inline-block;
         white-space: nowrap;
         word-wrap: normal;
         direction: ltr;
       }
       ```
    5. Run tests (should PASS)
    
    REFACTOR PHASE:
    6. Verify CSS syntax is valid (no build errors)
    7. Commit atomic changes
  </action>
  <verify>
    <automated>bun test apps/web/app/globals.css.test.ts - run</automated>
  </verify>
  <done>Tests pass: .material-symbols-outlined class defined with correct font-variation-settings</done>
</task>

<task type="auto" tdd="true">
  <name>task 3: TDD - LayoutWrapper component with navigation structure</name>
  <files>apps/web/components/LayoutWrapper.tsx, apps/web/components/LayoutWrapper.test.tsx</files>
  <action>
    RED PHASE:
    1. Create LayoutWrapper.test.tsx with tests:
       - "renders children prop content"
       - "includes TopNav component"
       - "includes SideNav component"
       - "includes BottomNavMobile component"
       - "main content has correct padding classes (pt-20, pb-32, lg:pb-8)"
    2. Run tests (should FAIL - components don't exist yet)
    
    GREEN PHASE:
    3. Create LayoutWrapper.tsx from Jules design:
       ```tsx
       import React from 'react'
       import TopNav from './TopNav'
       import SideNav from './SideNav'
       import BottomNavMobile from './BottomNavMobile'
       
       export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
         return (
           <div className="flex flex-col min-h-screen">
             <TopNav />
             <div className="flex flex-1 pt-20">
               <SideNav />
               <main className="flex-1 lg:ml-4 p-4 lg:p-8 pb-32 lg:pb-8 max-w-full overflow-hidden">
                 {children}
               </main>
             </div>
             <BottomNavMobile />
           </div>
         )
       }
       ```
    4. Create placeholder components (TopNav, SideNav, BottomNavMobile) that render simple divs
    5. Run tests (should PASS)
    
    REFACTOR PHASE:
    6. Verify TypeScript compiles without errors
    7. Commit atomic changes
  </action>
  <verify>
    <automated>bun test apps/web/components/LayoutWrapper.test.tsx - run</automated>
  </verify>
  <done>Tests pass: LayoutWrapper renders with navigation placeholders and correct padding</done>
</task>

</tasks>

<verification>
- [ ] bun test apps/web/app/layout.test.tsx passes
- [ ] bun test apps/web/app/globals.css.test.ts passes
- [ ] bun test apps/web/components/LayoutWrapper.test.tsx passes
- [ ] bun run build completes without errors
- [ ] Material Symbols icons render when used: <span className="material-symbols-outlined">egg</span>
</verification>

<success_criteria>

- Material Symbols CDN loaded in layout.tsx <head>
- .material-symbols-outlined CSS class available with correct font-variation-settings
- LayoutWrapper component created and exports default
- LayoutWrapper renders children with navigation structure
- All 3 TDD tests passing with RED→GREEN→REFACTOR commits
- Design tokens (surface, primary, etc.) accessible via CSS
  </success_criteria>

<output>
After completion, create `.planning/phases/08-foundation-auth/08-foundation-auth-01-SUMMARY.md` with:
- What was implemented (Material Symbols, LayoutWrapper)
- Test coverage summary
- Any deviations from plan
- Next phase dependencies (navigation components ready for Plan 02)
</output>
