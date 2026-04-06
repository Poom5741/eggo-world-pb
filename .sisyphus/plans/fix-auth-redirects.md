# Fix Inconsistent Auth Redirects

## TL;DR
> Fix navigation links (TopNav, SideNav, landing page) to redirect unauthenticated users to `/join` instead of protected routes that stall. Authenticated users go directly to their destination.

**Deliverables:**
- Auth-aware Link component (`components/auth/AuthLink.tsx`)
- Updated TopNav, SideNav, header.tsx with auth-aware links
- Landing page buttons updated
- Hook for auth state (`hooks/use-auth-redirect.ts`)

**Estimated Effort:** Medium (3-4 tasks)  
**Parallel Execution:** YES

---

## Context

### Current Problem
1. **Landing page** "Join the EggoWorld" → `/join` ✓ (works)
2. **Landing page** "View Marketplace" → `/marketplace` → stalls if not logged in ✗
3. **TopNav** "Dashboard" → `/dashboard` → stalls ✗
4. **TopNav** "Marketplace" → `/marketplace` → stalls ✗
5. **SideNav** items → protected routes → stalls ✗

### Root Cause
- Navigation links use plain `<Link href="/dashboard">` without auth checks
- Protected pages redirect to `/auth/login`, but navbar links bypass this logic
- No consistent "auth-aware" navigation pattern

### Desired Behavior
| User State | Click Dashboard | Click Marketplace | Click Join |
|------------|-----------------|-------------------|------------|
| **Not authenticated** | `/join` | `/join` | `/join` |
| **Authenticated** | `/dashboard` | `/marketplace` | `/dashboard` (bypass join) |

---

## Work Objectives

### Core Objective
Create a consistent auth-aware navigation system where:
1. Unauthenticated users clicking protected nav items go to `/join`
2. Authenticated users go directly to the destination
3. All navigation components use the same pattern

### Concrete Deliverables
- [ ] `AuthLink` component - wraps Link with auth redirect logic
- [ ] `useAuthRedirect` hook - reusable auth navigation logic  
- [ ] Updated TopNav.tsx - uses AuthLink
- [ ] Updated SideNav.tsx - uses AuthLink
- [ ] Updated header.tsx - uses AuthLink
- [ ] Updated landing page (page.tsx) - Join/Marketplace buttons use auth logic

### Definition of Done
- [ ] Unauthenticated user clicks "Dashboard" in TopNav → goes to `/join`
- [ ] Authenticated user clicks "Dashboard" → goes to `/dashboard`
- [ ] Same behavior for Marketplace, Eggs, Animals links
- [ ] Landing page "Join" button bypasses `/join` if already authenticated
- [ ] No visual regression in nav styling

### Must Have
- Auth-aware navigation for all nav items
- Consistent behavior across TopNav, SideNav, header
- Proper TypeScript types

### Must NOT Have
- Breaking changes to existing auth flow
- Changes to middleware or protected page logic
- Visual redesign of navigation

---

## Verification Strategy

### Test Decision
- **Infrastructure exists:** YES (Next.js, React, PocketBase)
- **Automated tests:** NO (manual QA only)
- **Agent-Executed QA:** YES - Each task includes verification steps

### QA Policy
Every task includes agent-executable QA scenarios using Playwright or manual verification steps.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - Independent):
├── Task 1: Create useAuthRedirect hook (new file)
└── Task 2: Create AuthLink component (new file)

Wave 2 (Integration - Depends on Wave 1):
├── Task 3: Update TopNav.tsx (uses AuthLink)
├── Task 4: Update SideNav.tsx (uses AuthLink)
├── Task 5: Update header.tsx (uses AuthLink)
└── Task 6: Update landing page buttons

Wave 3 (Verification - After Wave 2):
├── Task 7: Test all navigation flows
└── Task 8: Build verification
```

**Critical Path:** Task 1 → Task 2 → Tasks 3-6 (parallel) → Task 7 → Task 8

---

## TODOs

### Wave 1: Foundation

- [ ] **1. Create useAuthRedirect hook**

  **What to do:**
  Create `apps/web/hooks/use-auth-redirect.ts` that provides:
  - `isAuthenticated` boolean
  - `getRedirectPath(targetPath: string)` function
    - If authenticated → return targetPath
    - If not authenticated → return '/join'
  - Uses existing `isAuthenticated()` from client.ts
  - Handles hydration properly

  **Pattern to follow:** Similar to `use-wallet-poll.ts` structure

  **Recommended Agent Profile:**
  - **Category:** `quick`
  - **Skills:** []

  **Parallelization:**
  - **Can Run In Parallel:** YES (with Task 2)
  - **Blocks:** Tasks 3-6
  - **Blocked By:** None

  **References:**
  - `apps/web/lib/pocketbase/client.ts:34-41` - `isAuthenticated()` function
  - `apps/web/hooks/use-wallet-poll.ts` - Hook pattern example

  **Acceptance Criteria:**
  - [ ] Hook exports `useAuthRedirect()`
  - [ ] Returns `{ isAuthenticated: boolean, getRedirectPath: (path: string) => string }`
  - [ ] `getRedirectPath('/dashboard')` returns '/join' when not authenticated
  - [ ] `getRedirectPath('/dashboard')` returns '/dashboard' when authenticated
  - [ ] Handles hydration (returns safe defaults during SSR)

  **QA Scenarios:**
  ```
  Scenario: Hook returns correct redirect for authenticated user
    Tool: Bash (manual test)
    Preconditions: User is logged in (pb.authStore.token exists)
    Steps:
      1. Import hook in a test page
      2. Call getRedirectPath('/dashboard')
    Expected Result: Returns '/dashboard'
  
  Scenario: Hook returns /join for unauthenticated user
    Tool: Bash (manual test)
    Preconditions: User is not logged in (pb.authStore.token is null)
    Steps:
      1. Import hook in a test page
      2. Call getRedirectPath('/dashboard')
    Expected Result: Returns '/join'
  ```

  **Commit:** YES
  - Message: `feat: add useAuthRedirect hook for auth-aware navigation`
  - Files: `apps/web/hooks/use-auth-redirect.ts`

- [ ] **2. Create AuthLink component**

  **What to do:**
  Create `apps/web/components/auth/AuthLink.tsx` that:
  - Wraps Next.js `<Link>`
  - Accepts `href` and `fallbackHref` props
  - Uses `useAuthRedirect` to determine actual destination
  - Falls back to `/join` if not authenticated
  - Forwards all other Link props
  - Maintains styling (className, etc.)

  **Component signature:**
  ```typescript
  interface AuthLinkProps {
    href: string
    fallbackHref?: string  // default: '/join'
    children: React.ReactNode
    className?: string
    // ... other Link props
  }
  ```

  **Recommended Agent Profile:**
  - **Category:** `quick`
  - **Skills:** []

  **Parallelization:**
  - **Can Run In Parallel:** YES (with Task 1)
  - **Blocks:** Tasks 3-6
  - **Blocked By:** None

  **References:**
  - `apps/web/components/` - Existing component patterns
  - Next.js Link component API

  **Acceptance Criteria:**
  - [ ] Component accepts all Link props
  - [ ] Uses useAuthRedirect internally
  - [ ] Renders Next.js Link with computed href
  - [ ] TypeScript types exported
  - [ ] No visual changes to link appearance

  **QA Scenarios:**
  ```
  Scenario: AuthLink renders correct href for authenticated user
    Tool: Browser DevTools
    Preconditions: User logged in
    Steps:
      1. Render <AuthLink href="/dashboard">Dashboard</AuthLink>
      2. Inspect element
    Expected Result: <a href="/dashboard">
  
  Scenario: AuthLink renders /join for unauthenticated user
    Tool: Browser DevTools
    Preconditions: User not logged in
    Steps:
      1. Render <AuthLink href="/dashboard">Dashboard</AuthLink>
      2. Inspect element
    Expected Result: <a href="/join">
  ```

  **Commit:** YES
  - Message: `feat: add AuthLink component for auth-aware navigation`
  - Files: `apps/web/components/auth/AuthLink.tsx`

### Wave 2: Integration

- [ ] **3. Update TopNav.tsx**

  **What to do:**
  Replace static `<Link href="/dashboard">` and `<Link href="/marketplace">` with `<AuthLink>`

  **File:** `apps/web/components/TopNav.tsx`

  **Changes needed:**
  - Line 16: Change `<Link href="/dashboard">` to `<AuthLink href="/dashboard">`
  - Line 19: Change `<Link href="/marketplace">` to `<AuthLink href="/marketplace">`
  - Import AuthLink at top of file

  **Must NOT do:**
  - Change styling or className
  - Change button structure
  - Break responsive layout

  **Recommended Agent Profile:**
  - **Category:** `quick`
  - **Skills:** []

  **Parallelization:**
  - **Can Run In Parallel:** YES (with Tasks 4, 5, 6)
  - **Blocks:** None
  - **Blocked By:** Tasks 1, 2

  **Acceptance Criteria:**
  - [ ] TopNav Dashboard link uses AuthLink
  - [ ] TopNav Marketplace link uses AuthLink
  - [ ] Styling unchanged
  - [ ] No TypeScript errors

  **QA Scenarios:**
  ```
  Scenario: Unauthenticated user clicks Dashboard in TopNav
    Tool: Playwright / Browser
    Preconditions: User not logged in, on landing page
    Steps:
      1. Click "Dashboard" link in TopNav
      2. Observe navigation
    Expected Result: Navigates to /join page
    Evidence: URL shows /join
  
  Scenario: Authenticated user clicks Dashboard in TopNav
    Tool: Playwright / Browser
    Preconditions: User logged in, on landing page
    Steps:
      1. Click "Dashboard" link in TopNav
      2. Observe navigation
    Expected Result: Navigates to /dashboard
  ```

  **Commit:** YES (group with Tasks 4-6)

- [ ] **4. Update SideNav.tsx**

  **What to do:**
  Replace all `<Link href="...">` in NAV_ITEMS with AuthLink

  **File:** `apps/web/components/SideNav.tsx`

  **Changes needed:**
  - Import AuthLink
  - Replace Link with AuthLink in navItems.map (line 40)
  - Update Settings and Support links too (lines 52, 56)

  **Must NOT do:**
  - Change NAV_ITEMS data structure
  - Change styling
  - Change icon rendering

  **Recommended Agent Profile:**
  - **Category:** `quick`
  - **Skills:** []

  **Parallelization:**
  - **Can Run In Parallel:** YES (with Tasks 3, 5, 6)
  - **Blocks:** None
  - **Blocked By:** Tasks 1, 2

  **Acceptance Criteria:**
  - [ ] All NAV_ITEMS use AuthLink
  - [ ] Dashboard, Eggs, Animals, Marketplace, Referrals links updated
  - [ ] Styling unchanged

  **QA Scenarios:**
  ```
  Scenario: Unauthenticated user clicks Marketplace in SideNav
    Tool: Playwright
    Preconditions: User not logged in
    Steps:
      1. Open SideNav
      2. Click "Marketplace"
    Expected Result: Goes to /join
  ```

  **Commit:** YES (group with Tasks 3, 5, 6)

- [ ] **5. Update header.tsx**

  **What to do:**
  Update navItems in header to use AuthLink for non-logged-in state

  **File:** `apps/web/components/header.tsx`

  **Changes needed:**
  - Import AuthLink
  - Lines 106-117: navItems.map currently only renders when loggedIn
  - For logged out state (lines 202-218), update Login/Sign Up to use AuthLink
  - Actually, header.tsx already handles logged out differently - shows Login/Sign Up buttons
  - May not need changes if we want to keep Login/Sign Up buttons
  - BUT navItems (Dashboard, Marketplace, etc.) should use AuthLink when shown

  **Decision:** Keep Login/Sign Up buttons for logged-out users (they go to auth pages)
  Only update navItems mapping to use AuthLink

  **Recommended Agent Profile:**
  - **Category:** `quick`
  - **Skills:** []

  **Parallelization:**
  - **Can Run In Parallel:** YES (with Tasks 3, 4, 6)
  - **Blocks:** None
  - **Blocked By:** Tasks 1, 2

  **Acceptance Criteria:**
  - [ ] Nav items in header use AuthLink
  - [ ] Login/Sign Up buttons unchanged (go to auth pages)

  **QA Scenarios:**
  ```
  Scenario: Logged in user sees working nav in header
    Tool: Browser
    Preconditions: User logged in
    Steps:
      1. View header
      2. Click nav items
    Expected Result: Goes to correct pages
  ```

  **Commit:** YES (group with Tasks 3, 4, 6)

- [ ] **6. Update landing page (page.tsx)**

  **What to do:**
  Update "Join the EggoWorld" and "View Marketplace" buttons to use auth-aware logic

  **File:** `apps/web/app/page.tsx`

  **Changes needed:**
  - Line 31-32: "Join the EggoWorld" button currently always goes to `/join`
    - Should go to `/dashboard` if already authenticated
  - Line 34-36: "View Marketplace" button goes directly to `/marketplace`
    - Should go to `/join` if not authenticated
  - Import useAuthRedirect or AuthLink
  - Change buttons to use computed href

  **Must NOT do:**
  - Change button styling
  - Change section layout

  **Recommended Agent Profile:**
  - **Category:** `quick`
  - **Skills:** []

  **Parallelization:**
  - **Can Run In Parallel:** YES (with Tasks 3, 4, 5)
  - **Blocks:** None
  - **Blocked By:** Tasks 1, 2

  **Acceptance Criteria:**
  - [ ] "Join the EggoWorld" button:
    - Not authenticated → `/join`
    - Authenticated → `/dashboard`
  - [ ] "View Marketplace" button:
    - Not authenticated → `/join`
    - Authenticated → `/marketplace`

  **QA Scenarios:**
  ```
  Scenario: Unauthenticated user clicks Join on landing page
    Tool: Playwright
    Preconditions: User not logged in, on landing page
    Steps:
      1. Click "Join the EggoWorld" button
    Expected Result: Navigates to /join
  
  Scenario: Authenticated user clicks Join on landing page
    Tool: Playwright
    Preconditions: User logged in, on landing page
    Steps:
      1. Click "Join the EggoWorld" button
    Expected Result: Navigates to /dashboard (bypasses /join)
  
  Scenario: Unauthenticated user clicks View Marketplace
    Tool: Playwright
    Preconditions: User not logged in
    Steps:
      1. Click "View Marketplace"
    Expected Result: Navigates to /join
  ```

  **Commit:** YES (group with Tasks 3-5)

### Wave 3: Verification

- [ ] **7. Test all navigation flows**

  **What to do:**
  Manually test all navigation scenarios:
  1. Unauthenticated → TopNav Dashboard → /join ✓
  2. Unauthenticated → TopNav Marketplace → /join ✓
  3. Unauthenticated → SideNav Dashboard → /join ✓
  4. Unauthenticated → SideNav Marketplace → /join ✓
  5. Unauthenticated → Landing "Join" → /join ✓
  6. Unauthenticated → Landing "View Marketplace" → /join ✓
  7. Authenticated → TopNav Dashboard → /dashboard ✓
  8. Authenticated → TopNav Marketplace → /marketplace ✓
  9. Authenticated → Landing "Join" → /dashboard ✓
  10. Authenticated → Landing "View Marketplace" → /marketplace ✓

  **Recommended Agent Profile:**
  - **Category:** `unspecified-high`
  - **Skills:** []

  **Parallelization:**
  - **Can Run In Parallel:** NO (sequential testing)
  - **Blocks:** Task 8
  - **Blocked By:** Tasks 3-6

  **Acceptance Criteria:**
  - [ ] All 10 scenarios pass
  - [ ] No console errors
  - [ ] No hydration mismatches

  **QA Scenarios:**
  See individual test cases above.

  **Evidence to Capture:**
  - Screenshots of each flow
  - Console output showing no errors

- [ ] **8. Build verification**

  **What to do:**
  Run `bun run build` and verify no errors

  **Recommended Agent Profile:**
  - **Category:** `quick`
  - **Skills:** []

  **Acceptance Criteria:**
  - [ ] Build completes successfully
  - [ ] No TypeScript errors
  - [ ] No lint errors

---

## Final Verification Wave

- [ ] **F1. Code quality review**
  - Check for proper TypeScript types
  - Verify no console.log statements left
  - Confirm consistent code style

- [ ] **F2. UX review**
  - Navigation feels seamless
  - No jarring redirects
  - Maintains visual consistency

---

## Commit Strategy

### Commit Grouping

**Commit 1:** Foundation (Tasks 1-2)
```
feat: add auth-aware navigation utilities

- Add useAuthRedirect hook
- Add AuthLink component
```

**Commit 2:** Integration (Tasks 3-6)
```
feat: update navigation components for auth-aware redirects

- Update TopNav with AuthLink
- Update SideNav with AuthLink
- Update header with AuthLink
- Update landing page buttons
```

**Commit 3:** Verification (Tasks 7-8)
```
test: verify auth redirect flows

- Test all navigation scenarios
- Build verification
```

---

## Success Criteria

### Verification Commands
```bash
# Build check
cd apps/web && bun run build

# Manual test checklist (see Task 7)
```

### Final Checklist
- [ ] Unauthenticated users clicking Dashboard go to /join
- [ ] Unauthenticated users clicking Marketplace go to /join
- [ ] Authenticated users go directly to destination
- [ ] Landing page "Join" button bypasses /join if authenticated
- [ ] No visual regressions
- [ ] Build passes
- [ ] No console errors
