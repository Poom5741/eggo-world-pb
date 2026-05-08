---
status: diagnosed
phase: 23-secondary-market-royalties
source: 23-01-SUMMARY.md, 23-02-A-SUMMARY.md, 23-02-B-SUMMARY.md
started: 2026-04-22T00:00:00Z
updated: 2026-04-25T16:45:00Z
test_method: browser_agent_localhost:3000
---

## Current Test

[re-verified 2026-04-25 — 2 critical issues persist despite Phase 26/31 fixes]

## Tests

### 1. Marketplace Animals Tab

expected: Navigate to /marketplace, see Animals tab with card grid of listings, species icons, rarity badges, "Listed by" badges, prices
result: pass

### 2. Animal Rarity Filter

expected: Click rarity filter buttons (Common/Rare/Epic/Legendary) to filter listings by rarity type
result: issue
reported: "Epic filter shows COMMON Pig #999003, Legendary filter shows COMMON Pig #999003 - filter logic completely broken despite Phase 26 case-insensitive fix"
severity: blocker
verified_by: browser_agent_2026-04-25
note: Case-insensitive comparison fix did NOT resolve. All non-Common filters still return Common animals.

### 3. Price Sorting

expected: Click "Low to High" or "High to Low" sorting buttons to reorder listings by price
result: pass

### 4. List Animal Dialog

expected: On /animals page with an animal, action menu shows "List" button. Click opens ListAnimalDialog with price input, fee breakdown (85% seller, 10% royalties, 5% platform), and confirmation step
result: issue
reported: "works but flow is wrong - no confirm modal or redirect after listing done, and one animal can be listed multiple times"
severity: major

### 5. Buy Listed Animal

expected: Click on listing card, see detail page with BuyFlow. Purchase distributes 85% to seller, 10% to referral chain (G1:2%, G2-G4:1% each), 5% platform
result: issue
reported: "Both valid and invalid ID navigation causes auth redirect to /auth/login/ - Phase 31 server-side redirect fix did NOT resolve. View Details button causes listings to disappear and switches to Eggs tab."
severity: blocker
verified_by: browser_agent_2026-04-25

### 6. Royalty Distribution

expected: After purchase, seller receives 85%, referrers G1-G4 receive their respective percentages, commission_records created with type 'resale_royalty'
result: blocked
blocked_by: prior-phase
reason: "Blocked by Test 5 404 crash - cannot test purchase flow until route fixed"

## Summary

total: 6
passed: 3
issues: 2
pending: 0
skipped: 0
blocked: 1

## Re-Verification Summary (2026-04-25)

**Browser Agent Results:**

- Test 1: Animals Tab Display - PASS (listings show with species icons, rarity badges, prices)
- Test 2: Rarity Filter - ISSUE (Epic/Legendary filters show COMMON animals)
- Test 3: Price Sorting - PASS (Low/High sorting works)
- Test 4: Detail Page Navigation - ISSUE (auth redirect on all navigation)
- Test 5: Buy Flow Preview - BLOCKED (depends on Test 4)
- Test 6: Platform Status Banner - PASS (no pause banner when active)

**Critical Finding:** Phase 26 case-insensitive fix and Phase 31 redirect fix did NOT resolve the underlying issues. Need deeper investigation.

## Gaps

- truth: "Rarity filter buttons filter listings by selected rarity type"
  status: failed
  reason: "User reported: clicking rarity filter buttons shows nothing - sort logic may be broken or cards don't have rarity info"
  severity: major
  test: 2
  root_cause: "PocketBase 0.23.x filter syntax requires single quotes for string values, but use-animal-marketplace.ts uses double quotes: rarity = \"${r}\" should be rarity = '${r}'"
  artifacts:
  - path: "apps/web/hooks/use-animal-marketplace.ts"
    issue: "Line 22: const rarityFilter = rarities.map((r) => `rarity = \"${r}\"`).join(" || ") - double quotes used instead of single quotes"
    missing:
  - "Change filter syntax from rarity = \"Common\" to rarity = 'Common' per PocketBase 0.23.x compatibility"
    debug_session: ""

- truth: "After listing animal, user sees confirmation and listing appears in marketplace"
  status: failed
  reason: "User reported: no confirm modal or redirect after listing done, and one animal can be listed multiple times"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing:
  - "Add success confirmation modal or redirect to /marketplace after listing"
  - "Add validation to prevent duplicate listings for same animal_id (check existing active listing before creating new)"
    debug_session: ""

- truth: "Clicking animal listing card shows detail page with purchase flow"
  status: failed
  reason: "User reported: clicking card leads to detail page with 404 not found crash"
  severity: blocker
  test: 5
  root_cause: "AnimalListingsSection.tsx navigates to /marketplace/animal/${listing.id} but the actual route is /marketplace/[id]/ - there is no /marketplace/animal/ directory"
  artifacts:
  - path: "apps/web/components/marketplace/AnimalListingsSection.tsx"
    issue: "Line 155-158: router.push(`/marketplace/animal/${listing.id}`) - wrong route path"
  - path: "apps/web/app/marketplace/[id]/MarketplaceDetailClient.tsx"
    issue: "Already supports nftType 'egg' | 'food' | 'animal' at line 245 - route exists but path mismatch"
    missing:
  - "Change router.push from /marketplace/animal/${listing.id} to /marketplace/${listing.id}"
    debug_session: ""
