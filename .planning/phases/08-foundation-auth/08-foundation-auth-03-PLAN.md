---
phase: 08-foundation-auth
plan: 03
type: tdd
wave: 2
depends_on:
  - 08-foundation-auth-01
files_modified:
  - apps/web/app/page.tsx
  - apps/web/app/page.test.tsx
  - apps/web/app/join/page.tsx
  - apps/web/app/join/page.test.tsx
  - apps/web/app/auth/callback/page.tsx
  - apps/web/app/auth/callback/page.test.tsx
autonomous: true
requirements:
  - FOUND-01
  - FOUND-02
  - FOUND-03
must_haves:
  truths:
    - Landing page renders hero section with claymorphism styling
    - Landing page has "Join EggoWorld" CTA that links to /join
    - Join page displays LINE OAuth button
    - Clicking LINE OAuth initiates authentication flow
    - Auth callback processes OAuth response and redirects to dashboard
    - NFT showcase and how-to sections render on landing page
  artifacts:
    - path: apps/web/app/page.tsx
      provides: Landing page with hero, showcase, how-to sections
      min_lines: 100
      contains: clay-btn, material-symbols-outlined
    - path: apps/web/app/join/page.tsx
      provides: Join page with LINE OAuth button
      contains: Login with LINE
    - path: apps/web/app/auth/callback/page.tsx
      provides: OAuth callback handler
      contains: authWithOAuth2 or equivalent
  key_links:
    - from: apps/web/app/page.tsx
      to: apps/web/app/join/page.tsx
      via: Link href="/join"
      pattern: href="/join"
    - from: apps/web/app/join/page.tsx
      to: apps/backend
      via: LINE OAuth initiation
      pattern: /auth/line or OAuth2
    - from: apps/web/app/auth/callback/page.tsx
      to: apps/web/app/dashboard
      via: Post-auth redirect
      pattern: router.push.*dashboard
---

<objective>
Implement auth pages: Landing page, Join page, and OAuth callback handler

Purpose: Create the user-facing authentication flow (FOUND-01, FOUND-02, FOUND-03) that allows users to discover EggoWorld and authenticate via LINE OAuth.

Output: Three tested pages with claymorphism styling and working OAuth integration
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/08-foundation-auth/08-CONTEXT.md
@.planning/phases/08-foundation-auth/08-RESEARCH.md
@resources/eggo-world-uxui-jules/src/app/page.tsx
@resources/eggo-world-uxui-jules/src/app/join/page.tsx
@apps/web/app/auth/callback/page.tsx
@apps/web/lib/pocketbase/client.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>task 1: TDD - Landing page with hero and NFT showcase</name>
  <files>apps/web/app/page.tsx, apps/web/app/page.test.tsx</files>
  <action>
    RED PHASE:
    1. Create page.test.tsx with tests:
       - "renders hero section with headline 'HATCH YOUR DESTINY'"
       - "displays 'Join EggoWorld' button linking to /join"
       - "renders NFT showcase bento grid"
       - "includes 'How To Eggo' section with 4 steps"
       - "uses Material Symbols icons throughout"
       - "has claymorphism styling (clay-btn, clay-card classes)"
    2. Run test (should FAIL)
    
    GREEN PHASE:
    3. Create page.tsx from Jules design with sections:
       - Background orbs (absolute positioned, blur effects)
       - Hero section: "HATCH YOUR DESTINY" headline, CTA buttons
       - NFT Showcase: Bento grid with Egg + Food NFTs
       - How To Eggo: 4 steps (Buy Egg, Collect Food, Feed, Hatch)
       - Features & Community sections
       - Final CTA section
       - Footer with links
    4. Wrap with LayoutWrapper component
    5. Use Material Symbols for all icons
    6. Run test (should PASS)
    
    REFACTOR PHASE:
    7. Extract sections to reusable components if >200 lines
    8. Verify all images have alt text
    9. Check accessibility (aria-labels on buttons)
    10. Commit atomic changes
  </action>
  <verify>
    <automated>bun test apps/web/app/page.test.tsx - run</automated>
  </verify>
  <done>Landing page renders with all sections, claymorphism styling, and Material Symbols icons</done>
</task>

<task type="auto" tdd="true">
  <name>task 2: TDD - Join page with LINE OAuth button</name>
  <files>apps/web/app/join/page.tsx, apps/web/app/join/page.test.tsx</files>
  <action>
    RED PHASE:
    1. Create join/page.test.tsx with tests:
       - "renders 'Welcome Back!' headline"
       - "displays LINE OAuth button with SVG icon"
       - "LINE button is clickable and initiates OAuth"
       - "has username input field"
       - "has referral code input field (optional)"
       - "includes 'Start Hatching' CTA button"
    2. Run test (should FAIL)
    
    GREEN PHASE:
    3. Create join/page.tsx from Jules design:
       - Layout: Two-column grid (mascot left, form right on desktop)
       - Branding section with Eggo mascot image
       - LINE OAuth button with official LINE SVG icon
       - OAuth handler: onClick → window.location.href = '/auth/line'
       - Username input with person icon (Material Symbols)
       - Referral code input with confirmation_number icon
       - "Start Hatching" CTA (can link to /dashboard for now)
       - Bonus badges section (Bonus Egg, Community, Daily Rewards)
       - Help button (fixed bottom-right)
    4. Preserve existing OAuth flow: sessionStorage for redirectTo
    5. Run test (should PASS)
    
    REFACTOR PHASE:
    6. Extract form validation to hook if complex
    7. Verify LINE OAuth URL matches backend configuration
    8. Check hydration safety (useIsHydrated for browser APIs)
    9. Commit atomic changes
  </action>
  <verify>
    <automated>bun test apps/web/app/join/page.test.tsx - run</automated>
  </verify>
  <done>Join page renders with LINE OAuth button that initiates authentication flow</done>
</task>

<task type="auto" tdd="true">
  <name>task 3: TDD - Auth callback handler with redirect</name>
  <files>apps/web/app/auth/callback/page.tsx, apps/web/app/auth/callback/page.test.tsx</files>
  <action>
    RED PHASE:
    1. Create auth/callback/page.test.tsx with tests:
       - "processes OAuth code from URL params"
       - "calls PocketBase authWithOAuth2 method"
       - "redirects to dashboard on success"
       - "redirects to /auth/error on failure"
       - "respects redirectTo from sessionStorage"
       - "handles hydration correctly (waits for client-side)"
    2. Run test (should FAIL - mock PocketBase client)
    
    GREEN PHASE:
    3. Update auth/callback/page.tsx (preserve existing logic):
       - "use client" directive
       - useIsHydrated() check before processing
       - Extract code and state from URL searchParams
       - Call pb.collection('users').authWithOAuth2({ code, state })
       - On success: router.push(redirectTo || '/dashboard')
       - On error: router.push('/auth/error')
       - Cleanup: clear sessionStorage redirectTo
    4. Ensure single-click OAuth (no intermediate page visible)
    5. Run test (should PASS)
    
    REFACTOR PHASE:
    6. Extract OAuth handling to custom hook (useOAuthCallback)
    7. Add error handling for network failures
    8. Add loading state during auth processing
    9. Commit atomic changes
  </action>
  <verify>
    <automated>bun test apps/web/app/auth/callback/page.test.tsx - run</automated>
  </verify>
  <done>Auth callback processes LINE OAuth response and redirects to dashboard on success</done>
</task>

</tasks>

<verification>
- [ ] bun test apps/web/app/page.test.tsx passes
- [ ] bun test apps/web/app/join/page.test.tsx passes
- [ ] bun test apps/web/app/auth/callback/page.test.tsx passes
- [ ] bun run build completes without errors
- [ ] Landing → Join → OAuth → Dashboard flow works end-to-end
- [ ] Material Symbols icons render on all pages
- [ ] Claymorphism styling consistent with Jules design
</verification>

<success_criteria>

- Landing page renders with hero, NFT showcase, how-to sections (FOUND-01)
- Join page displays LINE OAuth button and initiates flow (FOUND-02)
- Auth callback handles OAuth response and redirects correctly (FOUND-03)
- All pages wrapped with LayoutWrapper for consistent navigation
- Material Symbols icons used consistently (FOUND-05)
- All 3 TDD tests passing with RED→GREEN→REFACTOR commits
- Existing PocketBase integration preserved (no breaking changes)
  </success_criteria>

<output>
After completion, create `.planning/phases/08-foundation-auth/08-foundation-auth-03-SUMMARY.md` with:
- Pages implemented (Landing, Join, Callback)
- OAuth flow verification (single-click, redirectTo tracking)
- Test coverage summary
- Any deviations from Jules design
- Phase 8 completion status (all 6 requirements addressed)
</output>
