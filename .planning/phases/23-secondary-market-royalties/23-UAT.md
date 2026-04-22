---
status: testing
phase: 23-secondary-market-royalties
source: 23-01-SUMMARY.md, 23-02-A-SUMMARY.md, 23-02-B-SUMMARY.md
started: 2026-04-22T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Current Test

number: 1
name: Marketplace Animals Tab
expected: |
  Navigate to /marketplace page. Click on "Animals" tab (should be alongside Eggs tab). The tab shows Animal NFT resale listings in a card grid with species icons, rarity badges, "Listed by [username]" badge, and USDT price.
awaiting: user response

## Tests

### 1. Marketplace Animals Tab
expected: Navigate to /marketplace, see Animals tab with card grid of listings, species icons, rarity badges, "Listed by" badges, prices
result: [pending]

### 2. Animal Rarity Filter
expected: Click rarity filter buttons (Common/Rare/Epic/Legendary) to filter listings by rarity type
result: [pending]

### 3. Price Sorting
expected: Click "Low to High" or "High to Low" sorting buttons to reorder listings by price
result: [pending]

### 4. List Animal Dialog
expected: On /animals page with an animal, action menu shows "List" button. Click opens ListAnimalDialog with price input, fee breakdown (85% seller, 10% royalties, 5% platform), and confirmation step
result: [pending]

### 5. Buy Listed Animal
expected: Click on listing card, see detail page with BuyFlow. Purchase distributes 85% to seller, 10% to referral chain (G1:2%, G2-G4:1% each), 5% platform
result: [pending]

### 6. Royalty Distribution
expected: After purchase, seller receives 85%, referrers G1-G4 receive their respective percentages, commission_records created with type 'resale_royalty'
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

[none yet]