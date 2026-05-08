---
status: resolved
trigger: "LINE OAuth signup fails with daccPublickey validation error"
created: "2026-04-15T22:30:00+07:00"
updated: "2026-04-22T00:00:00+07:00"
resolved: "2026-04-22T00:00:00+07:00"
---

## Current Focus

hypothesis: Wallet API returns publicKey in wrong format (raw 0x04... instead of daccPublickey_0x...)
test: Check wallet API response format vs PocketBase validation pattern
expecting: Wallet API should return daccPublickey field with pattern daccPublickey_0x...
next_action: Fix wallet API to return daccPublickey in correct format

## Symptoms

expected: LINE OAuth signup creates user with valid wallet, daccPublickey, and pin fields
actual: User creation fails with validation error on daccPublickey field
errors: {"daccPublickey":{"code":"validation_invalid_format","message":"Invalid value format."}}
reproduction: Sign up via LINE OAuth → redirected to line-callback.html → error occurs
started: When testing LINE OAuth signup

## Eliminated

## Evidence

- timestamp: "2026-04-15T22:31:00+07:00"
  checked: users.json collection schema
  found: daccPublickey field has pattern "^daccPublickey*" which requires value to start with "daccPublickey*"
  implication: Value must be formatted as daccPublickey_0x...

- timestamp: "2026-04-15T22:32:00+07:00"
  checked: 01-create-wallet.pb.js line 76-78
  found: var daccPublickey = responseData.data.daccPublickey || address
  implication: Uses daccPublickey from wallet API response, falls back to address if missing

- timestamp: "2026-04-15T22:33:00+07:00"
  checked: wallet-api/server.js /api/wallet/create endpoint (before fix)
  found: Returns data.publicKey (raw Ethereum public key 0x04...), NOT data.daccPublickey
  implication: responseData.data.daccPublickey is undefined, so hook falls back to address (0x...) which doesn't match pattern ^daccPublickey\_

- timestamp: "2026-04-15T22:35:00+07:00"
  checked: wallet-api/server.js /api/wallet/create endpoint (after fix)
  found: Now returns data.daccPublickey with format daccPublickey\_${address} matching pattern
  implication: Fix applied - daccPublickey will now match validation pattern

## Resolution

root*cause: Wallet API (/api/wallet/create) returns publicKey in raw Ethereum format (0x04...) but users collection requires pattern ^daccPublickey*. Hook falls back to address (0x...) when daccPublickey is undefined, which also doesn't match pattern.
fix: Updated wallet-api/server.js /api/wallet/create endpoint to return daccPublickey field with format daccPublickey\_${address} to match validation pattern. Also kept publicKey field for backward compatibility.
verification: Fix deployed in Phase 18. LINE OAuth wallet auto-creation working for new users.
files_changed: [wallet-api/server.js]
resolved_by: "Phase 18 - Fix LINE OAuth Wallet Auto-Creation"
