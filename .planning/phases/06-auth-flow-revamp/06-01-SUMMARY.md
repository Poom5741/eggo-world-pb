---
phase: 06-auth-flow-revamp
plan: 01
subsystem: auth
tags: [line-oauth, middleware, auth-flow, wave-1]
dependency_graph:
  requires: []
  provides: [lib/auth/line-oauth.ts, middleware-redirectTo]
  affects: [apps/web/app/auth/login/page.tsx, apps/web/app/auth/sign-up/page.tsx]
tech_stack:
  added: []
  patterns: [shared-helper, sessionStorage-handoff, crypto.getRandomValues]
key_files:
  created:
    - apps/web/lib/auth/line-oauth.ts
  modified:
    - apps/web/middleware.ts
decisions:
  - "returnUrl in stateData hardcoded to /auth/line — not from user input (T-06-01 mitigation)"
  - "redirectTo in middleware uses pathname only — no full URL from user (T-06-03 mitigation)"
  - "sessionStorage used for redirectTo/referrer handoff across LINE OAuth navigation"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-04T14:10:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 06 Plan 01: LINE OAuth Helper + Middleware redirectTo Summary

## One-liner

Shared `initiateLineLogin()` helper extracted from auth/line page, plus middleware `?redirectTo=` injection for post-login deep-link return.

## What Was Done

### Task 1: Create `lib/auth/line-oauth.ts`

Created a new shared helper file that encapsulates LINE OAuth initiation logic. Previously this logic lived inside `apps/web/app/auth/line/page.tsx`; extracting it allows both login and sign-up pages (Wave 2) to trigger LINE OAuth directly without navigating to `/auth/line` first.

Key implementation details:

- `initiateLineLogin({ referrer?, redirectTo? })` builds the LINE OAuth URL and navigates immediately
- `stateData.returnUrl` is always hardcoded as `${window.location.origin}/auth/line` — never from user input (prevents open redirect via T-06-01)
- `redirectTo` and `referrer` are saved to `sessionStorage` before navigation so `/auth/line` page can read them after callback
- `crypto.getRandomValues` used for state generation (not `Math.random`)
- Thai comments throughout per project convention

### Task 2: Update `middleware.ts` with `redirectTo` param

Changed the unauthenticated redirect from a bare `/auth/login` to `/auth/login?redirectTo=<pathname>`. This is a minimal 2-line change (add `const loginUrl` + `loginUrl.searchParams.set`). The `pathname` variable was already destructured from `request.nextUrl` on line 4 — no new imports needed. Only `pathname` is used (not a user-supplied URL), preventing open redirects (T-06-03).

## Commits

| Hash    | Message                                                      |
| ------- | ------------------------------------------------------------ |
| d629ea4 | feat(06-01): add LINE OAuth helper and middleware redirectTo |

## Acceptance Criteria Verification

| Criterion                                                     | Status                                           |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `export function initiateLineLogin` in line-oauth.ts          | ✅                                               |
| `export interface LineLoginOptions` in line-oauth.ts          | ✅                                               |
| `returnUrl` points to `/auth/line`                            | ✅                                               |
| `sessionStorage.setItem` for both `redirectTo` and `referrer` | ✅                                               |
| `crypto.getRandomValues` used (not Math.random)               | ✅                                               |
| `PRODUCTION_PB_URL` = `pb.eggoworld.io`                       | ✅                                               |
| No `Math.random` in file                                      | ✅                                               |
| No `any` type in file                                         | ✅                                               |
| Thai comments present                                         | ✅                                               |
| `redirectTo` in middleware.ts                                 | ✅                                               |
| `loginUrl` appears 2× (const + return)                        | ✅                                               |
| `publicPaths` unchanged                                       | ✅                                               |
| `export const config` with matcher intact                     | ✅                                               |
| No TS errors in new/modified files                            | ✅ (0 errors in line-oauth.ts and middleware.ts) |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID                                        | Status                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| T-06-01: returnUrl tampering                     | ✅ Mitigated — hardcoded to `${window.location.origin}/auth/line` |
| T-06-02: redirectTo in sessionStorage            | ✅ Accepted — same-origin only                                    |
| T-06-03: Open redirect via middleware redirectTo | ✅ Mitigated — `pathname` only, no user-supplied URL              |

## Known Stubs

None.

## Self-Check: PASSED

- `apps/web/lib/auth/line-oauth.ts` — FOUND ✅
- `apps/web/middleware.ts` — FOUND (modified) ✅
- Commit `d629ea4` — FOUND ✅
