# Implementation Guide: Fix Auth Redirects with TDG

## TDG Phase: RED (Write Tests First)

### Issue Number
**fix-auth-redirects** (no issue number - using descriptive identifier)

### Pre-Implementation Checklist
- [ ] Phase script returns "red" or "unknown"
- [ ] Testing dependencies installed (`@testing-library/react`, etc.)
- [ ] Current branch is clean or changes committed

---

## Wave 1: Foundation - RED Phase (Write Failing Tests)

### Task 1: Create useAuthRedirect Hook Test

**File:** `apps/web/hooks/use-auth-redirect.test.ts`

**Test Requirements:**
1. Test `isAuthenticated` returns true when user has token
2. Test `isAuthenticated` returns false when no token
3. Test `getRedirectPath('/dashboard')` returns '/dashboard' when authenticated
4. Test `getRedirectPath('/dashboard')` returns '/join' when not authenticated
5. Test SSR safety (no errors during server render)

**Commit Message:**
```
red: add test spec for useAuthRedirect hook (fix-auth-redirects)
```

**Expected Result:**
- Tests run with `bun test hooks/use-auth-redirect.test.ts`
- All tests fail (RED phase)
- Error: "useAuthRedirect is not defined" or similar

---

### Task 2: Create AuthLink Component Test

**File:** `apps/web/components/auth/AuthLink.test.tsx`

**Test Requirements:**
1. Test renders with correct href when authenticated
2. Test renders with '/join' href when not authenticated
3. Test forwards className prop
4. Test forwards other Link props
5. Test renders children correctly

**Commit Message:**
```
red: add test spec for AuthLink component (fix-auth-redirects)
```

**Expected Result:**
- Tests fail with "AuthLink is not defined"

---

## Wave 2: Foundation - GREEN Phase (Make Tests Pass)

### Task 3: Implement useAuthRedirect Hook

**File:** `apps/web/hooks/use-auth-redirect.ts`

**Implementation:**
```typescript
import { useState, useEffect } from 'react'
import { createClient, isAuthenticated } from '@/lib/pocketbase/client'

export function useAuthRedirect() {
  const [isAuth, setIsAuth] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    setIsAuth(isAuthenticated())
  }, [])

  const getRedirectPath = (targetPath: string): string => {
    if (!isHydrated) return '/join' // Safe default for SSR
    return isAuth ? targetPath : '/join'
  }

  return {
    isAuthenticated: isAuth,
    isHydrated,
    getRedirectPath,
  }
}
```

**Commit Message:**
```
green: implement useAuthRedirect hook with auth detection (fix-auth-redirects)
```

**Verification:**
```bash
cd apps/web && bun test hooks/use-auth-redirect.test.ts
# Expected: All tests pass
```

---

### Task 4: Implement AuthLink Component

**File:** `apps/web/components/auth/AuthLink.tsx`

**Implementation:**
```typescript
'use client'

import Link from 'next/link'
import { useAuthRedirect } from '@/hooks/use-auth-redirect'

interface AuthLinkProps {
  href: string
  fallbackHref?: string
  children: React.ReactNode
  className?: string
  [key: string]: any // Allow other Link props
}

export function AuthLink({ 
  href, 
  fallbackHref = '/join', 
  children, 
  className,
  ...props 
}: AuthLinkProps) {
  const { getRedirectPath } = useAuthRedirect()
  const actualHref = getRedirectPath(href)

  return (
    <Link href={actualHref} className={className} {...props}>
      {children}
    </Link>
  )
}
```

**Commit Message:**
```
green: implement AuthLink component for auth-aware navigation (fix-auth-redirects)
```

**Verification:**
```bash
cd apps/web && bun test components/auth/AuthLink.test.tsx
# Expected: All tests pass
```

---

## Wave 3: Foundation - REFACTOR Phase

### Task 5: Refactor useAuthRedirect

**Potential Improvements:**
- Add memoization for getRedirectPath
- Add JSDoc comments
- Export types

**Commit Message:**
```
refactor: optimize useAuthRedirect with memoization and types (fix-auth-redirects)
```

---

## Wave 4: Integration - GREEN Phase

### Task 6: Update TopNav.tsx

**Changes:**
1. Import AuthLink
2. Replace `<Link href="/dashboard">` with `<AuthLink href="/dashboard">`
3. Replace `<Link href="/marketplace">` with `<AuthLink href="/marketplace">`

**Commit Message:**
```
green: update TopNav with AuthLink for auth-aware navigation (fix-auth-redirects)
```

---

### Task 7: Update SideNav.tsx

**Changes:**
1. Import AuthLink
2. Replace Link with AuthLink in navItems.map
3. Update Settings/Support links

**Commit Message:**
```
green: update SideNav with AuthLink for auth-aware navigation (fix-auth-redirects)
```

---

### Task 8: Update header.tsx

**Changes:**
1. Import AuthLink
2. Update navItems to use AuthLink
3. Keep Login/Sign Up buttons as-is (they go to auth pages)

**Commit Message:**
```
green: update header with AuthLink for auth-aware navigation (fix-auth-redirects)
```

---

### Task 9: Update Landing Page

**Changes:**
1. Import useAuthRedirect or AuthLink
2. Update "Join the EggoWorld" button:
   - Not authenticated → '/join'
   - Authenticated → '/dashboard'
3. Update "View Marketplace" button:
   - Not authenticated → '/join'
   - Authenticated → '/marketplace'

**Commit Message:**
```
green: update landing page buttons with auth-aware redirects (fix-auth-redirects)
```

---

## Wave 5: Verification

### Task 10: Build Verification

```bash
cd apps/web && bun run build
```

**Expected:** Build succeeds with no errors

---

### Task 11: Manual QA Tests

**Test Scenarios:**

1. **Unauthenticated user → Dashboard in TopNav**
   - Clear cookies/localStorage
   - Click "Dashboard" in TopNav
   - Expected: Navigates to /join

2. **Unauthenticated user → Marketplace in SideNav**
   - Click "Marketplace" in SideNav
   - Expected: Navigates to /join

3. **Authenticated user → Dashboard in TopNav**
   - Login with LINE OAuth
   - Click "Dashboard" in TopNav
   - Expected: Navigates to /dashboard

4. **Authenticated user → Marketplace**
   - Click "Marketplace"
   - Expected: Navigates to /marketplace

5. **Unauthenticated → Landing "Join" button**
   - Click "Join the EggoWorld"
   - Expected: Navigates to /join

6. **Authenticated → Landing "Join" button**
   - While logged in, click "Join the EggoWorld"
   - Expected: Navigates to /dashboard (bypasses /join)

7. **Unauthenticated → Landing "View Marketplace"**
   - Click "View Marketplace"
   - Expected: Navigates to /join

8. **Authenticated → Landing "View Marketplace"**
   - Click "View Marketplace"
   - Expected: Navigates to /marketplace

---

## Pre-Commit Hook Awareness

### Known Issues with Pre-Commit Hook
The pre-commit hook may:
1. Run linting (eslint/prettier)
2. Run type checking (tsc)
3. Run tests

### If Pre-Commit Stalls

**Step 1: Check what's running**
```bash
ps aux | grep -E "(eslint|tsc|bun test)"
```

**Step 2: Check for common issues**
```bash
# Type errors
cd apps/web && bun run tsc --noEmit

# Lint errors
cd apps/web && bun run lint

# Test failures
cd apps/web && bun test
```

**Step 3: Fix issues before committing**

**Step 4: Retry commit with verbose output**
```bash
cd apps/web && git commit -m "red: test spec for useAuthRedirect (fix-auth-redirects)" --verbose
```

---

## Commit Sequence

1. `red: add test spec for useAuthRedirect hook (fix-auth-redirects)`
2. `red: add test spec for AuthLink component (fix-auth-redirects)`
3. `green: implement useAuthRedirect hook with auth detection (fix-auth-redirects)`
4. `green: implement AuthLink component for auth-aware navigation (fix-auth-redirects)`
5. `refactor: optimize useAuthRedirect with memoization (fix-auth-redirects)` (optional)
6. `green: update TopNav with AuthLink for auth-aware navigation (fix-auth-redirects)`
7. `green: update SideNav with AuthLink for auth-aware navigation (fix-auth-redirects)`
8. `green: update header with AuthLink for auth-aware navigation (fix-auth-redirects)`
9. `green: update landing page buttons with auth-aware redirects (fix-auth-redirects)`

---

## Success Criteria

### Functional
- [ ] Unauthenticated users clicking Dashboard go to /join
- [ ] Unauthenticated users clicking Marketplace go to /join
- [ ] Authenticated users go directly to destination
- [ ] Landing page "Join" bypasses /join if authenticated
- [ ] No visual regressions in navigation

### Technical
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No console errors
- [ ] TypeScript types correct
- [ ] Code follows project conventions

---

**Document Version:** 1.0
**TDG Phase:** RED → GREEN → REFACTOR
**Status:** Ready for Execution
