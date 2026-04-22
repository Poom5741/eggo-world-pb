---
status: testing
phase: 22-tier-rewards-badges
source: 22-01-SUMMARY.md, 22-02-SUMMARY.md, 22-03-SUMMARY.md
started: 2026-04-22T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Current Test

number: 1
name: Dashboard Tier Section Display
expected: |
Navigate to /dashboard page. Look for a card in the 3-card grid showing "Tier Progress" or similar title. It should display your current tier status, progress bar toward next tier threshold (10/100/1,000 food items), and possibly a "Claim Reward" button if you've reached a threshold.
awaiting: user response

## Tests

### 1. Dashboard Tier Section Display

expected: Navigate to /dashboard, see tier section card with current tier, progress bar, and claim button if eligible
result: [passed]
notes: Tier section card displays correctly with claymorphism styling. Shows "Getting Started" for new users.

### 2. Tier Badge Components

expected: TierBadgeCard shows tier icon (sprout/potted_plant/agriculture), soulbound lock indicator, and tier name (Seedling/Grower/Farmer)
result: [pending]

### 3. Tier Progress Bar

expected: TierProgressBar shows percentage progress with milestone markers at 25%, 50%, 75%, displays "Ready!" when threshold reached
result: [pending]

### 4. Tier Claim Flow

expected: When eligible, clicking "Claim Reward" button calls POST /api/v2/check-tier-reward, shows loading state, then success toast with USDT reward amount ($5/$50/$500)
result: [pending]

### 5. Dedicated Tiers Page

expected: Navigate to /dashboard/tiers, see full tier management page with badge grid, claim notification banner, and tier explanation
result: [passed]
notes: Page redesigned with claymorphism design system - all cards use clay variants, Material Symbols icons, consistent spacing and styling.

### 6. TierBadge Soulbound Contract

expected: Minted TierBadge NFTs are soulbound (cannot be transferred). Contract implements ERC-5192 with locked(tokenId) returning true
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
