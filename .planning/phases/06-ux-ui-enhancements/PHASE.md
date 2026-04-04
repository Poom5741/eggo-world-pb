# Phase 06: UX/UI Post-MVP Enhancements

**Priority:** High
**Category:** UX/UI, Navigation, Auth Flow
**Triggered by:** User-reported bug — post-LOGIN redirect goes to `/auth/login` instead of dashboard, and header shows no user info

---

## Problem Statement

After completing LINE OAuth sign-up, the user is redirected to the landing page (`/`) instead of the dashboard. The landing page shows a basic "SALE COMING SOON" dashboard component with no user data, wallet info, or navigation to their NFTs. The header shows only a LOGOUT button — no user name, avatar, wallet address, or navigation links.

**Expected flow:** LINE OAuth → `/auth/line` → `/dashboard` → user sees their data + navigation
**Actual flow:** LINE OAuth → `/auth/line` → `/` (landing page with minimal "dashboard") → no user data visible

---

## UX/UI Gap Analysis

### Gap 1: Post-Auth Redirect Goes to Landing Page, Not Dashboard

**Severity:** HIGH — User cannot see their NFTs, wallet, or commissions after signing up

| Aspect          | Current                              | Expected                                              |
| --------------- | ------------------------------------ | ----------------------------------------------------- |
| Redirect target | `/` (landing page)                   | `/dashboard`                                          |
| User data shown | None                                 | Name, wallet, USDT balance, NFT count                 |
| Navigation      | None (basic header with logout only) | Sidebar/nav to eggs, marketplace, commissions, wallet |

**Root cause:** `apps/web/app/auth/line/page.tsx` line 34:

```typescript
const redirectTo = sessionStorage.getItem("redirectTo") || "/"
```

On sign-up flow, `redirectTo` is never stored, so it defaults to `/`.

**Affected files:**

- `apps/web/app/auth/line/page.tsx` — reads `redirectTo`
- `apps/web/app/auth/sign-up/page.tsx` — doesn't set default redirect
- `apps/web/app/page.tsx` — has two different "dashboard" implementations

### Gap 2: Header Has No User Info or Navigation

**Severity:** HIGH — Logged-in users have no way to navigate without manually typing URLs

| Aspect           | Current               | Expected                                             |
| ---------------- | --------------------- | ---------------------------------------------------- |
| User display     | None                  | Avatar + name/wallet address                         |
| Navigation links | None when logged in   | Dashboard, My Eggs, Marketplace, Wallet, Commissions |
| Mobile support   | LOGIN/SIGN UP buttons | Hamburger menu with nav + user info                  |
| Logout           | Only action visible   | Available in user dropdown                           |

**Affected files:**

- `apps/web/components/header.tsx` — only shows LogoutButton, no user info or nav

### Gap 3: No Sidebar/Navigation Menu Implemented

**Severity:** HIGH — Dashboard pages have no consistent navigation structure

| Aspect                | Current               | Expected                                            |
| --------------------- | --------------------- | --------------------------------------------------- |
| Navigation pattern    | Each page is isolated | Sidebar with nav tree (shadcn/ui sidebar available) |
| Active page indicator | None                  | Highlighted sidebar item                            |
| Mobile nav            | None                  | Collapsible sidebar / drawer                        |

**Affected files:**

- `apps/web/components/ui/sidebar.tsx` — exists but unused
- All dashboard pages — no shared navigation layout

### Gap 4: Duplicate Dashboard Implementations

**Severity:** MEDIUM — Confusing code paths and inconsistent UX

| Component       | Location                   | Features                                            | Issues                                                            |
| --------------- | -------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `<Dashboard />` | `components/dashboard.tsx` | Wallet modal, referral commissions, sale info       | No real user data, no navigation, shows "SALE COMING SOON"        |
| Dashboard page  | `app/dashboard/page.tsx`   | USDT balance, egg count, commissions, quick actions | Full data, but only accessible via direct URL                     |
| Landing page    | `app/page.tsx`             | Shows `<Dashboard />` when logged in, else landing  | Routes logged-in users to the basic dashboard, not real dashboard |

**Root cause:** `app/page.tsx` line 66-68:

```typescript
if (user) {
  return <Dashboard />  // This is the basic "SALE COMING SOON" dashboard
}
```

### Gap 5: No User Avatar/Profile Display Anywhere

**Severity:** MEDIUM — Users can't identify their account visually

| Aspect         | Current             | Expected                                            |
| -------------- | ------------------- | --------------------------------------------------- |
| Avatar display | Not used anywhere   | Header shows user avatar (LINE picture or fallback) |
| User name      | Not shown in UI     | Header shows name or "LINE User"                    |
| Wallet address | Not shown in header | Truncated wallet in header (e.g., `0x1234...5678`)  |

**Affected files:**

- `apps/web/components/header.tsx` — no user info
- `apps/web/components/ui/avatar.tsx` — exists but unused

### Gap 6: No Loading/Transition UX During Auth Redirect

**Severity:** LOW — After LINE OAuth, `/auth/line` shows loading but user may not know what's happening

| Aspect         | Current                          | Expected                                                               |
| -------------- | -------------------------------- | ---------------------------------------------------------------------- |
| Loading state  | "PROCESSING... COMPLETING LOGIN" | More descriptive: "Creating your account..." or "Setting up wallet..." |
| Error feedback | Generic "Authentication failed"  | Specific error (user not found, wrong password, etc.)                  |

---

## Scope of Changes

### What WILL be done:

1. Fix post-auth redirect to go to `/dashboard` instead of `/`
2. Enhance header to show user avatar, name, wallet address
3. Add navigation links to header (or sidebar) for logged-in users
4. Remove duplicate dashboard — unify on `/dashboard` page
5. Landing page should always show landing content, redirect authenticated users to `/dashboard`
6. Improve loading/error states during auth flow

### What will NOT be done (out of scope):

- Redesign the entire dashboard UI (it already works)
- Add new features beyond navigation and user display
- Change smart contract integrations
- Modify PocketBase hooks or backend logic

---

## Success Criteria

1. After LINE OAuth sign-up, user lands on `/dashboard` with their data visible
2. Header displays user avatar + name + wallet address when logged in
3. Header has navigation links: Dashboard, My Eggs, Marketplace, Commissions, Wallet
4. Landing page (`/`) redirects authenticated users to `/dashboard`
5. No duplicate dashboard components
6. All existing tests still pass

---

## Tasks

### Task 1: Fix Post-Auth Redirect

- **File:** `apps/web/app/auth/line/page.tsx`
- **Change:** Default `redirectTo` to `/dashboard` instead of `/`
- **File:** `apps/web/app/auth/sign-up/page.tsx`
- **Change:** Set `sessionStorage.setItem('redirectTo', '/dashboard')` before initiating LINE OAuth

### Task 2: Enhance Header with User Info and Navigation

- **File:** `apps/web/components/header.tsx`
- **Changes:**
  - Import and use `getUser()` to get user data
  - Add avatar display using LINE picture or wallet-based fallback
  - Show truncated wallet address
  - Add navigation links (Dashboard, My Eggs, Marketplace, Commissions, Wallet)
  - Mobile-responsive with collapsible menu

### Task 3: Unify Landing Page Auth Flow

- **File:** `apps/web/app/page.tsx`
- **Change:** When user is authenticated, redirect to `/dashboard` instead of rendering `<Dashboard />`
- **Remove:** `<Dashboard />` import from page.tsx (the basic "SALE COMING SOON" version)

### Task 4: Remove Duplicate Dashboard Component

- **File:** `apps/web/components/dashboard.tsx`
- **Action:** Evaluate if this component is still needed (wallet modal can be moved to dashboard page)
- **Decision:** If wallet modal is needed, extract it; otherwise remove the file

### Task 5: Update Middleware for Auth Redirect

- **File:** `apps/web/middleware.ts`
- **Change:** If authenticated user visits `/auth/login` or `/auth/sign-up` or `/`, redirect to `/dashboard` instead of `/`

### Task 6: Add Tests

- **Files:** `app/auth/line/line.test.ts`, `components/header.test.tsx`, `app/page.test.ts`
- **Changes:** Update tests to reflect new redirect behavior and header user info

---

## Risk Assessment

| Risk                                                 | Impact | Mitigation                                   |
| ---------------------------------------------------- | ------ | -------------------------------------------- |
| Breaking existing auth flow                          | HIGH   | Test all OAuth paths thoroughly              |
| Header complexity on mobile                          | MEDIUM | Use responsive design, test on small screens |
| Removing `components/dashboard.tsx` breaks something | MEDIUM | Check all imports before removing            |
| LINE OAuth callback timing                           | LOW    | Only change redirect target, not auth logic  |

---

## Implementation Summary

**Status:** COMPLETED
**Date:** 2026-04-04
**Tests:** 63 pass, 0 fail (115 expect() calls)

### Changes Made:

1. **`apps/web/app/auth/line/page.tsx`** — Changed default redirect from `/` to `/dashboard`
2. **`apps/web/app/auth/sign-up/page.tsx`** — Added `sessionStorage.setItem('redirectTo', '/dashboard')` and passes `/dashboard` to `initiateLineLogin`
3. **`apps/web/components/header.tsx`** — Complete rewrite: added user avatar display, name, wallet address, desktop navigation bar, user dropdown menu, mobile hamburger menu with full nav
4. **`apps/web/app/page.tsx`** — Removed duplicate `<Dashboard />` component, now redirects authenticated users to `/dashboard`
5. **`apps/web/components/dashboard.tsx`** — Deleted (was dead code after page.tsx change)
6. **`apps/web/middleware.ts`** — Added `/` to auth redirect list, redirects authenticated users to `/dashboard`
7. **`apps/web/app/auth/line/line.test.ts`** — Added test for `/dashboard` default redirect
8. **`apps/web/app/auth/sign-up/sign-up.test.ts`** — Added test for sign-up default redirect
