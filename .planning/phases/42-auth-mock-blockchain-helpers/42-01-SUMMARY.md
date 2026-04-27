---
phase: 42-auth-mock-blockchain-helpers
plan: 01
subsystem: testing
tags: [e2e, auth-bypass, playwright, test-users, query-param]

requires: [41-01, 41-02]
provides:
  - E2E login button on auth pages with query param trigger
  - e2eLogin test fixture helper for authenticated sessions
  - TEST_USERS constant with 4 predefined users
affects: [phase-43, phase-44]

tech-stack:
  added: []
  patterns: [e2e-auth-bypass, query-param-trigger, localhost-environment-check]

key-files:
  created:
    - apps/web/lib/auth/e2e-auth.ts
    - tests/e2e/playwright-auth-bypass.test.ts
  modified:
    - apps/web/app/auth/login/page.tsx
    - tests/fixtures/e2e-setup.ts

key-decisions:
  - "E2E login button only shown on localhost or e2e=true param (security check)"
  - "Test users: test_buyer, test_seller, test_referrer, test_admin"
  - "Query param trigger: ?e2e_test_user=test_buyer"

patterns-established:
  - "isE2EEnvironment() for environment detection"
  - "handleE2eLogin() for test user authentication"
  - "e2eLogin(page, testUser) fixture helper"

requirements-completed: [AUTH-01, AUTH-02]

duration: 20min
completed: 2026-04-27
---

# Phase 42 Plan 01: E2E Login Button Summary

**E2E login button with query param trigger for test authentication bypass, enabling authenticated sessions without LINE OAuth UI flow**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-27T06:05:30Z
- **Completed:** 2026-04-27T06:25:30Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- E2E login button visible on localhost/e2e=true environment
- Query param trigger ?e2e_test_user=test_buyer shows single button
- 4 predefined test users: test_buyer, test_seller, test_referrer, test_admin
- e2eLogin helper creates authenticated session without UI flow
- TEST_USERS constant with metadata for each user role

## Task Commits

Each task was committed atomically:

1. **Task 1: Create E2E login button component on auth pages** - `876dbdf` (feat)
2. **Task 2: Create e2eLogin test fixture helper** - `e9a1ae7` (feat)
3. **Task 3: Create smoke test for auth bypass** - `5dc1351` (test)

## Files Created/Modified

- `apps/web/lib/auth/e2e-auth.ts` - E2E authentication helper with E2E_TEST_USERS, isE2EEnvironment(), handleE2eLogin()
- `apps/web/app/auth/login/page.tsx` - Added E2E login button section with TEST MODE badge
- `tests/fixtures/e2e-setup.ts` - Added TEST_USERS constant and e2eLogin helper
- `tests/e2e/playwright-auth-bypass.test.ts` - Smoke tests for E2E button visibility and metadata

## Decisions Made

- E2E button hidden on production domain (hostname check + e2e=true param)
- Test user credentials fetched from PocketBase (not hardcoded in frontend)
- Test user password pattern: username + '\_e2e_test_password'

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

- E2E auth bypass ready for Phase 43 wallet automation
- Test users need to be created in production PocketBase (blocked)

## Known Stubs

| File                                 | Line                       | Description                              | Resolution                                         |
| ------------------------------------ | -------------------------- | ---------------------------------------- | -------------------------------------------------- |
| apps/web/lib/auth/e2e-auth.ts:91-108 | Test user password pattern | Password: `{testUser}_e2e_test_password` | Create test users in PocketBase with this password |

---

_Phase: 42-auth-mock-blockchain-helpers_
_Plan: 01_
_Completed: 2026-04-27_
