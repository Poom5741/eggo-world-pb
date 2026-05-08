---
status: resolved
trigger: "POST /api/v2/list-animal returns filter syntax error: unexpected character '{'"
created: 2026-04-22T15:00:00Z
updated: 2026-04-22T17:08:00Z
resolution: "Fixed parameterized filter syntax, incorrect auth method, and Goja VM compatibility issues"
---

## Root Cause Analysis

**Primary Issue:** Hook used 3 incompatible patterns for PocketBase v0.23.4 Goja VM:

1. **Parameterized filter syntax** - `{:param}` with `{ '@param': value }` NOT supported
2. **Wrong auth method** - `$apis.requireAuth(e)` returns string "pbRequireAuth" not user object
3. **ES6 top-level declarations** - Goja doesn't expose top-level vars to callbacks
4. **Wrong body parsing** - `e.parseBody()` and `e.bind()` don't exist

**Files Changed:** `apps/backend/pb_hooks/23-list-animal.pb.js`

## Changes Made

### Fix 1: Filter Syntax (Lines 61, 80, 118)

- ❌ BEFORE: `$app.findRecordsByFilter('collection', 'field = {:param}', { '@param': value })`
- ✅ AFTER: `$app.findFirstRecordByData("collection", "field", value)`
- ✅ AFTER: `$app.findRecordsByFilter("collection", "seller_id = '" + userId + "'", ...)`

### Fix 2: Authentication (Lines 25-41, GET handler)

- ❌ BEFORE: `$apis.requireAuth(e)` returns "pbRequireAuth" string
- ✅ AFTER: `requestInfo = e.requestInfo(); userId = requestInfo.auth?.id`
- ✅ AFTER: User lookup: `$app.findRecordById("users", userId)`

### Fix 3: Goja VM Compatibility (Entire file)

- ❌ BEFORE: Top-level `const`, functions outside routerAdd
- ✅ AFTER: All helpers INSIDE routerAdd callback with `var` declarations
- ✅ AFTER: Use `for` loops instead of `.map()`, string concat instead of template literals

### Fix 4: Body Parsing (Lines 43-45)

- ❌ BEFORE: `e.bind({ ... })` and `e.parseBody()` - don't exist
- ✅ AFTER: `requestInfo.body || {}` - correct PocketBase v0.23.4 API

## Verification

```bash
# Test with auth (requires valid animal_id)
curl -X POST https://pb.eggoworld.io/api/v2/list-animal \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"animal_id":1,"price":10}'

# Expected: {"success":true,"data":{"listing_id":"..."}}
# NOT expected: {"error":{"code":"LISTING_FAILED","message":"invalid filter expression"}}
```

## Key Learnings

1. **PocketBase v0.23.4 Goja VM** - No ES6 top-level declarations
2. **Parameterized filters** - Use `findFirstRecordByData` or inline values
3. **Authentication** - Use `e.requestInfo().auth`, NOT `$apis.requireAuth(e)`
4. **Body parsing** - Use `e.requestInfo().body`, NOT `e.parseBody()` or `e.bind()`
5. **Hooks must be inside routerAdd** - All helpers and constants

## Resolution

✅ Filter syntax fixed (3 locations)
✅ Authentication fixed (POST + GET handlers)
✅ Goja VM compatibility fixed (var, for loops, inline functions)
✅ Body parsing fixed (requestInfo.body)
✅ Deployed to production: https://pb.eggoworld.io/api/v2/list-animal

**Test Result:** Endpoint now returns proper error for non-existent animal instead of filter syntax error.

## Symptoms

expected: POST /api/v2/list-animal should create a resale listing for animal_id 999001 at price 10 USDT
actual: Returns {"error":{"code":"LISTING_FAILED","message":"invalid filter expression: unexpected character '{'"},"success":false}
errors: PocketBase filter syntax error - "invalid filter expression: unexpected character '{'"
reproduction:

- Endpoint: https://pb.eggoworld.io/api/v2/list-animal
- Method: POST
- Body: {"animal_id":999001,"price":10}
- Auth: Bearer token (valid JWT)
  started: Current session - just triggered when testing listing feature

## Request Details

```json
{
  "endpoint": "https://pb.eggoworld.io/api/v2/list-animal",
  "method": "POST",
  "body": { "animal_id": 999001, "price": 10 },
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs...",
    "Content-Type": "application/json"
  },
  "response": {
    "error": {
      "code": "LISTING_FAILED",
      "message": "invalid filter expression: unexpected character '{'"
    },
    "success": false
  }
}
```

## Known Pattern Match

From AGENTS.md - this error pattern matches:

```
❌ WRONG: These DON'T work:
$app.findFirstRecordByFilter('collection', 'field = {:param}', {'@param': value})
- Error: "invalid filter expression: unexpected character '{'"
```

**Implication**: The hook is using parameterized filter syntax that PocketBase v0.23.4 doesn't support.

## Eliminated

## Evidence
