---
phase: 06-auth-flow-revamp
plan: 02
subsystem: auth
tags: [line-oauth, callback-handler, suspense, redirect]
dependency_graph:
  requires:
    - 06-01-SUMMARY.md # initiateLineLogin helper in lib/auth/line-oauth.ts
  provides:
    - login page calls initiateLineLogin directly
    - sign-up page calls initiateLineLogin directly
    - /auth/line is a pure callback handler
  affects:
    - apps/web/app/auth/login/page.tsx
    - apps/web/app/auth/sign-up/page.tsx
    - apps/web/app/auth/line/page.tsx
tech_stack:
  added: []
  patterns:
    - Suspense + useSearchParams split (inner/outer component)
    - sessionStorage redirectTo cleanup after use
    - Guard redirect on missing OAuth params
key_files:
  created: []
  modified:
    - apps/web/app/auth/login/page.tsx
    - apps/web/app/auth/sign-up/page.tsx
    - apps/web/app/auth/line/page.tsx
    - apps/web/app/auth/login/login.test.ts
    - apps/web/app/auth/sign-up/sign-up.test.ts
    - apps/web/app/auth/line/line.test.ts
decisions:
  - D-01: Login and sign-up pages call initiateLineLogin() directly on button click — no intermediate navigation to /auth/line
  - D-03: /auth/line reads sessionStorage.redirectTo after successful auth and removes it immediately after use
  - T-06-06 mitigated: /auth/line guards direct navigation — redirects to /auth/login when ?email=&password= are absent
metrics:
  duration: ~8 minutes
  completed: 2026-04-04
  tasks_completed: 3
  files_changed: 6
---

# Phase 06 Plan 02: Auth Page Revamp — Direct initiateLineLogin + Pure Callback Handler

**One-liner:** Login/sign-up pages now call `initiateLineLogin()` directly on click; `/auth/line` stripped to a pure OAuth callback handler with sessionStorage redirect cleanup.

## What Was Done

### Task 1: Revamp `login/page.tsx`

Rewrote the file with these changes:

- Split into `LoginContent` (inner) + `Page` (outer with Suspense) for `useSearchParams` support
- Replaced `<a href="/auth/line">` with `<button onClick={handleLineLogin}>` calling `initiateLineLogin({ redirectTo })`
- Added `useSearchParams` to read `?redirectTo` param and pass it forward
- Imported `initiateLineLogin` from `@/lib/auth/line-oauth`
- All existing design preserved: pixel font, card layout, EggoWorld logo, LINE green `bg-[#00C300]` button

Updated `login.test.ts`:

- Removed `content.toContain('/auth/line')` assertion
- Added: test for direct `initiateLineLogin` call + `@/lib/auth/line-oauth` import
- Added: test for `useSearchParams`, `redirectTo`, `Suspense`

**Result:** 10/10 tests pass

### Task 2: Update `sign-up/page.tsx`

Minimal changes:

- Added `import { initiateLineLogin } from '@/lib/auth/line-oauth'`
- Added `const redirectTo = searchParams.get('redirectTo')`
- Replaced `router.push('/auth/line...')` with `initiateLineLogin({ referrer, redirectTo })`
- All existing code preserved: Suspense wrapper, referrer display, LINE green button

Updated `sign-up.test.ts`:

- Replaced `content.toContain('/auth/line')` with `content.toContain('initiateLineLogin')` + `not.toContain("router.push('/auth/line')")`

**Result:** 10/10 tests pass

### Task 3: Revamp `/auth/line/page.tsx` as Pure Callback Handler

Rewrote the file:

- **Removed:** `handleLineLogin`, `PRODUCTION_PB_URL`, `LINE_CLIENT_ID`, `generateRandomString`, idle state render with LINE button, `useSearchParams` import, legacy token fallback path
- **Added:** Guard redirect → `router.replace('/auth/login')` when no `?email=&password=` params (T-06-06)
- **Added:** `sessionStorage.getItem('redirectTo')` after auth + `sessionStorage.removeItem('redirectTo')` cleanup (D-03)
- **Changed:** state type from `'idle' | 'loading'` to `'loading' | 'error'`; starts as `'loading'`
- **Added:** Error state with `TRY AGAIN` retry link to `/auth/login`

Rewrote `line.test.ts` completely for new callback-handler behavior (8 tests).

**Result:** 8/8 tests pass

## Final Verification

```
28 pass, 0 fail — bun test app/auth/
```

Pattern checks:

- ✅ `grep "initiateLineLogin" app/auth/login/page.tsx` — 2 matches (import + call)
- ✅ `grep 'href="/auth/line"' app/auth/login/page.tsx` — none
- ✅ `grep "initiateLineLogin" app/auth/sign-up/page.tsx` — 2 matches (import + call)
- ✅ `grep "LOGIN WITH LINE" app/auth/line/page.tsx` — none
- ✅ `grep "handleLineLogin" app/auth/line/page.tsx` — none
- ✅ `grep -r "router.push.*auth/line" app/auth/` — none in source files

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — all threat mitigations applied as specified in plan's `<threat_model>` (T-06-06 guard implemented in Task 3).

## Self-Check: PASSED

Files exist:

- ✅ `apps/web/app/auth/login/page.tsx`
- ✅ `apps/web/app/auth/sign-up/page.tsx`
- ✅ `apps/web/app/auth/line/page.tsx`
- ✅ `apps/web/app/auth/login/login.test.ts`
- ✅ `apps/web/app/auth/sign-up/sign-up.test.ts`
- ✅ `apps/web/app/auth/line/line.test.ts`

Commits exist:

- ✅ `89340db` — feat(06-02): revamp login/page.tsx
- ✅ `27d6729` — feat(06-02): update sign-up/page.tsx
- ✅ `55c20e0` — feat(06-02): revamp /auth/line/page.tsx
