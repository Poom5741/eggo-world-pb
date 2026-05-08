---
phase: 20-gap-closure-uat-execution
reviewed: 2026-04-22T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/web/app/eggs/page.tsx
  - apps/backend/pb_hooks/16-feed-egg.pb.js
  - apps/web/app/eggs/page.test.tsx
  - apps/backend/pb_hooks/16-feed-egg.pb.test.js
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-04-22
**Depth:** standard
**Files Reviewed:** 4 (2 source, 2 test)
**Status:** issues_found

## Summary

Reviewed the feed-egg hook implementation, eggs page frontend, and associated tests. Found one **critical** security vulnerability involving filter injection in the PocketBase backend hook, four **warnings** covering race conditions, dead code, and error-handling gaps, and three **info** items. The test files are well-structured and do not contain reliability issues.

## Critical Issues

### CR-01: Filter Injection in `findRecordsByFilter` Queries

**File:** `apps/backend/pb_hooks/16-feed-egg.pb.js`
**Line:** 75, 125
**Issue:** `egg_token_id` and `foodId` values from the request body are directly interpolated into PocketBase filter strings without strict type validation or sanitization. A malicious client can pass a string such as `"1 || 1=1"` for `egg_token_id`. Because `"1 || 1=1" <= 0` evaluates to `false` in JavaScript, it passes the validation check, and the resulting filter becomes `token_id = 1 || 1=1 && owner.id = "user123"`. Due to `&&` precedence over `||`, this effectively evaluates to `token_id = 1 || owner.id = "user123"`, returning **all** records owned by the user instead of the specific one. This can cause the wrong egg or food NFT to be selected and mutated.

**Fix:** Strictly validate and cast inputs to integers before interpolation:

```javascript
// Validate egg_token_id
const eggTokenIdNum = parseInt(egg_token_id, 10)
if (isNaN(eggTokenIdNum) || eggTokenIdNum <= 0) {
  return e.json(400, {
    success: false,
    error: { message: "Invalid egg token ID", code: "INVALID_EGG_ID" },
  })
}

// Use eggTokenIdNum in filter
const eggs = $app
  .dao()
  .findRecordsByFilter("egg_nfts", `token_id = ${eggTokenIdNum} && owner.id = "${user.id}"`, "", 1)

// Validate food_ids elements
const validatedFoodIds = []
for (const rawId of food_ids) {
  const num = parseInt(rawId, 10)
  if (isNaN(num) || num <= 0) {
    return e.json(400, {
      success: false,
      error: { message: `Invalid food ID: ${rawId}`, code: "INVALID_FOOD_ID" },
    })
  }
  validatedFoodIds.push(num)
}
// Use validatedFoodIds in the loop
```

## Warnings

### WR-01: Race Condition in Food Count Update

**File:** `apps/backend/pb_hooks/16-feed-egg.pb.js`
**Line:** 103–115, 218–220
**Issue:** The pre-feed validation (`preFeedFoodCount + requestedFoodCount > 10`) and the subsequent `egg.set('food_count', currentFoodCount + food_ids.length)` are not atomic. Two concurrent requests can both read the same `food_count`, both pass the check, and both increment the value, with the second save overwriting the first. This can lead to an inconsistent database state relative to the number of food NFTs actually consumed on-chain.

**Fix:** Wrap the read-modify-save sequence in a PocketBase database transaction, or use an atomic increment approach if the DAO supports it.

### WR-02: Dead Code — Unused Wallet State and Fetch Effect

**File:** `apps/web/app/eggs/page.tsx`
**Line:** 51–66
**Issue:** The component declares `_userWallet` / `_setUserWallet` state and a `useEffect` that fetches the user's wallet field from PocketBase. The fetched value is never read in render logic, event handlers, or passed to child components. This is dead code that adds unnecessary re-renders and maintenance burden.

**Fix:** Remove the unused state and `useEffect` block. If a child component needs the wallet, pass it from the auth record or fetch it in the hook/component that actually consumes it.

### WR-03: JSON Parse Error Can Mask Wallet API Failure

**File:** `apps/backend/pb_hooks/16-feed-egg.pb.js`
**Line:** 193, 203
**Issue:** `walletResponse.json()` is called without guarding against non-JSON responses (e.g., an HTML 502 error page from a reverse proxy). If parsing fails, the thrown error is caught by the outer `catch` block, returning a generic `FEED_ERROR` to the client and obscuring the original wallet API failure.

**Fix:** Wrap JSON parsing in a defensive helper:

```javascript
function safeJsonParse(response) {
  try {
    return response.json()
  } catch (_) {
    return { error: { message: "Invalid response from wallet API" } }
  }
}
```

### WR-04: `fetch()` to Wallet API Has No Timeout

**File:** `apps/backend/pb_hooks/16-feed-egg.pb.js`
**Line:** 186
**Issue:** The `fetch()` call to the wallet API does not specify a timeout. If the wallet API becomes unresponsive, the PocketBase request handler can hang indefinitely, exhausting server resources.

**Fix:** Use a timeout mechanism. Since PocketBase JS hooks run in a Go-based JSVM with limited fetch options, consider adding an abort signal or wrapping the fetch in a timeout Promise if the runtime supports it. At minimum, document the expected wallet API SLA and add monitoring.

## Info

### IN-01: Unimplemented Play Interaction Stub

**File:** `apps/web/app/eggs/page.tsx`
**Line:** 97–100
**Issue:** `handlePlayEgg` contains a TODO comment and only logs to the console. This is intentional stub code but should be tracked.

**Fix:** Remove the stub or implement the play interaction before production release.

### IN-02: Hardcoded Fallback Contract Addresses

**File:** `apps/backend/pb_hooks/16-feed-egg.pb.js`
**Line:** 162–163
**Issue:** Default contract addresses are hardcoded as fallbacks. If environment variables are missing in production, the system silently uses development/testnet addresses, which could lead to failed or unexpected on-chain transactions.

**Fix:** Remove the hardcoded defaults and return a 500 configuration error immediately if the required environment variables are absent.

### IN-03: Magic Number in Egg Power Calculation

**File:** `apps/web/app/eggs/page.tsx`
**Line:** 229
**Issue:** `eggs.length * 1000` uses an unexplained multiplier.

**Fix:** Extract to a named constant, e.g., `const EGG_POWER_MULTIPLIER = 1000`, with a comment explaining the game-design rationale.

---

_Reviewed: 2026-04-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
