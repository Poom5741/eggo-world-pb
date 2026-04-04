---
phase: 06-auth-flow-revamp
plan: 03
subsystem: web/auth
tags: [hydration, react, useState, line-oauth, ux]
wave: 3

dependency_graph:
  requires:
    - 06-01-SUMMARY.md # LINE OAuth flow revamp (initiateLineLogin, /auth/line callback)
    - 06-02-SUMMARY.md # middleware redirectTo, auth page cleanup
  provides:
    - root page synchronous auth state initialization (no blank flash)
    - phase 6 complete and build-verified
  affects:
    - apps/web/app/page.tsx

tech_stack:
  added: []
  patterns:
    - React useState lazy initializer for synchronous auth hydration
    - SSR guard (typeof window === 'undefined') inside lazy initializer

key_files:
  modified:
    - apps/web/app/page.tsx # useState lazy initializer replaces useState(null)

decisions:
  - id: D-05
    description: "Use React useState lazy initializer to read authStore.record synchronously on first render, eliminating LOADING... blank flash after LINE OAuth redirect"
  - id: D-07
    description: "useState<any> type accepted for authStore.record — PocketBase RecordModel requires any for compatibility"

metrics:
  duration: ~5 minutes
  completed: "2026-04-04"
  tasks_completed: 1
  files_modified: 1
---

# Phase 6 Plan 03: Root Page Hydration Flash Fix + Build Verification Summary

**One-liner:** Eliminated blank LOADING flash by replacing `useState<any>(null)` with a lazy initializer that reads `createClient().authStore.record` synchronously on first render (D-05).

## What Was Done

### Task 1: Fix root page user state initialization (D-05) + full build verification

Changed `apps/web/app/page.tsx` line 15 from:

```tsx
const [user, setUser] = useState<any>(null)
```

To:

```tsx
const [user, setUser] = useState<any>(() => {
  // โหลด auth จาก localStorage ทันที (sync) แทนการรอ useEffect — ลด blank flash (per D-05)
  if (typeof window === "undefined") return null
  return createClient().authStore.record ?? null
})
```

The existing `useEffect` calling `setUser(pb.authStore.record ?? null)` was left **unchanged** — it handles subsequent auth state changes (error redirects, `authStore.onChange` listener).

**Commit:** `f569b7a`

## Verification Results

### Acceptance Criteria

- ✅ `typeof window === 'undefined'` — 1 match inside lazy initializer
- ✅ `createClient().authStore.record` — 1 match inside lazy initializer
- ✅ `useState.*null)` — 0 matches (old pattern gone)
- ✅ `setUser(pb.authStore.record` — match present (useEffect unchanged)
- ✅ `authStore.onChange` — match present (listener unchanged)

### Must-Have Checks (All 9 Pass)

| #    | Check                                                  | Result  |
| ---- | ------------------------------------------------------ | ------- |
| MH-1 | login calls `initiateLineLogin` directly               | ✅ PASS |
| MH-2 | sign-up calls `initiateLineLogin` directly             | ✅ PASS |
| MH-3 | /auth/line has NO LINE login button                    | ✅ PASS |
| MH-4 | /auth/line redirects to /auth/login if no params       | ✅ PASS |
| MH-5 | /auth/line reads and removes sessionStorage.redirectTo | ✅ PASS |
| MH-6 | middleware appends redirectTo                          | ✅ PASS |
| MH-7 | line-oauth.ts exports initiateLineLogin                | ✅ PASS |
| MH-8 | TypeScript — 22 pre-existing errors, zero in page.tsx  | ✅ PASS |
| MH-9 | Build passes                                           | ✅ PASS |

### Test Suite

- Auth tests: **28 pass, 0 fail** (3 files: login, sign-up, line)
- Full suite: **61 pass, 0 fail** (9 files)

### Build

- All 19 routes compiled successfully including `/auth/line`, `/auth/login`, `/auth/sign-up`
- `bun run build` exits with code 0

## Deviations from Plan

None — plan executed exactly as written. The single targeted change to `useState` lazy initializer was applied without any other modifications.

## Known Stubs

None.

## Threat Surface

No new security-relevant surface introduced. The lazy initializer reads from `localStorage` via `createClient()` which already existed throughout the app. Covered by T-06-07 and T-06-08 in the plan's threat model (both accepted).

## Phase 6 Complete

All three waves of Phase 6 Auth Flow Revamp are complete:

| Wave | Plan  | Summary                                                                                   |
| ---- | ----- | ----------------------------------------------------------------------------------------- |
| 1    | 06-01 | LINE OAuth direct flow — `initiateLineLogin`, `/auth/line` pure callback, `line-oauth.ts` |
| 2    | 06-02 | Middleware `redirectTo`, auth page cleanup, `useSearchParams` wiring                      |
| 3    | 06-03 | Root page hydration flash fix, full build + test verification                             |

**Phase 6 is shippable.** Single-click LINE OAuth, pure callback handler, `redirectTo` support, no blank flash.

## Self-Check: PASSED

- `apps/web/app/page.tsx` modified ✅
- Commit `f569b7a` exists ✅
- Build passes ✅
- 61/61 tests pass ✅
- All 9 must-haves verified ✅
