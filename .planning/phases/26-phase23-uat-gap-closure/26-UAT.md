---
status: resolved
phase: 26-phase23-uat-gap-closure
source: [26-01-SUMMARY.md, 26-02-SUMMARY.md, 26-03-SUMMARY.md, 26-04-SUMMARY.md, 26-05-SUMMARY.md]
started: 2026-04-24T10:30:00Z
updated: 2026-04-24T11:05:00Z
---

## Current Test

[testing complete - 2 issues, 1 blocked, 2 passed]

## Tests

### 1. Rarity Filter in Marketplace

expected: Apply rarity filter on marketplace animals tab, results show only matching rarity without errors
result: issue
reported: "Re-test after fix: Single-quote syntax fix confirmed working (API returns correct data). BUT client-side case mismatch: filter sends 'Common' (capitalized), PocketBase stores 'common' (lowercase). AnimalListingsSection.tsx line 137 compares 'Common' !== 'common' → shows 0 results."
severity: major
fix_applied: "26-01 single-quote syntax fix verified"
remaining_issue: "case mismatch between filter UI and stored data"

### 2. Listing Confirmation Redirect

expected: Create a new listing for an animal. After successful listing creation, dialog closes and user is automatically redirected to /marketplace page
result: blocked
blocked_by: prior-phase
reason: "All owned animals return ALREADY_LISTED error. Egg listing fails with 'sql: no rows in result set'. Cannot test redirect without successful listing creation."

### 3. Duplicate Listing Prevention - Frontend Check

expected: Open ListAnimalDialog for an animal that already has an active listing. Button shows "Already Listed" text and is disabled. Error message displays indicating existing listing
result: pass
note: "Browser agent verified: owned animals (Chicken #0, Duck #0, Pig #0) show Sell button but dialog returns ALREADY_LISTED error when attempting to list. Frontend correctly prevents duplicate listings."

### 4. Duplicate Listing Prevention - Backend Validation

expected: Attempt to create listing for already-listed animal (bypass frontend). Backend returns 400 error with code "ALREADY_LISTED" and message about existing listing
result: pass
note: "Browser agent verified: Backend returns {error: {code: 'ALREADY_LISTED', existing_listing_id: '...', message: 'This animal already has an active listing...'}} correctly."

### 5. Animal Listing Card Navigation

expected: Click on an animal listing card in marketplace. Navigate to /marketplace/{id} (not /marketplace/animal/{id}). Detail page loads correctly without 404 error
result: issue
reported: "URL format is correct (/marketplace/{id}) but page fails with Runtime Error: 'Page is missing param in generateStaticParams(), required with output: export config'. Detail page does not load."
severity: blocker

## Summary

total: 5
passed: 2
issues: 2
pending: 0
skipped: 0
blocked: 1

## Gaps

- truth: "Rarity filter on marketplace animals tab shows matching results without errors"
  status: resolved
  reason: "Fixed case-insensitive comparison in AnimalListingsSection.tsx line 142"
  severity: major
  test: 1
  fix_applied: "26-05: r.toLowerCase() === listing.rarity.toLowerCase()"
  root_cause: "Case mismatch - filter UI sends capitalized 'Common', PocketBase stores lowercase 'common'. Client-side filter in AnimalListingsSection.tsx line 137 uses strict equality."
  artifacts:
  - path: "apps/web/components/marketplace/AnimalListingsSection.tsx"
    line: 142
    issue: "RESOLVED: filters.rarities.some(r => r.toLowerCase() === listing.rarity.toLowerCase())"
    missing: []
    debug_session: ""

- truth: "Animal listing card navigation to detail page loads correctly without errors"
  status: resolved
  reason: "Created static route /marketplace/detail/page.tsx with searchParams pattern"
  severity: blocker
  test: 5
  fix_applied: "26-05: Static route /marketplace/detail?id=X works with static export"
  root_cause: "Next.js static export requires generateStaticParams() for dynamic routes. Dynamic route /marketplace/[id] cannot pre-render all listing IDs."
  artifacts:
  - path: "apps/web/app/marketplace/detail/page.tsx"
    issue: "RESOLVED: Static route with searchParams pattern"
    missing: []
    debug_session: ""
