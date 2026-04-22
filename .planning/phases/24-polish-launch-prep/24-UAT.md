---
status: testing
phase: 24-polish-launch-prep
source: 24-wave1-SUMMARY.md, 24-wave2-SUMMARY.md, 24-wave3-SUMMARY.md
started: 2026-04-22T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Current Test

number: 1
name: Error Boundaries on Routes
expected: |
  Test error boundaries by visiting authenticated routes and triggering an error (e.g., invalid API call). Routes /dashboard, /mint, /referrals, /commissions, /dashboard/tiers, /animals all have error.tsx files that catch errors and show recovery UI with retry/back buttons.
awaiting: user response

## Tests

### 1. Error Boundaries on Routes
expected: Routes /dashboard, /mint, /referrals, /commissions, /dashboard/tiers, /animals have error boundaries catching errors with recovery UI
result: [pending]

### 2. Transaction Logging
expected: After mint/feed/breed transactions, transaction_logs collection records with tx_type, status (success/failed), tx_hash, gas_used, error_message for failed
result: [pending]

### 3. Admin Monitoring Dashboard
expected: Navigate to /admin/monitoring, see transaction count, success rate metrics, recent failures table, filter by action type, refresh button
result: [pending]

### 4. Bundle Analyzer
expected: Run `bun run analyze` in apps/web, opens browser showing bundle composition, identifies large chunks for optimization
result: [pending]

### 5. Dynamic Imports for Modals
expected: MintEggModal, FeedDialog, HatchRevealModal, BreedingDialog use Next.js dynamic() with ssr:false, reducing initial bundle size
result: [pending]

### 6. Onboarding Tutorial
expected: First visit to /dashboard shows 4-step overlay tutorial covering: Wallet setup, Buy Egg, Feed Egg, Referrals. LocalStorage tracks completion
result: [pending]

### 7. Recruitment Bonus
expected: After referring 10/100/1,000/10,000 users, Food NFT rewards automatically granted via checkRecruitmentMilestones function in registration hook
result: [pending]

### 8. Launch Checklist
expected: 24-LAUNCH-CHECKLIST.md exists with 57 verification items covering pre-launch, contracts, backend, frontend, security, post-launch
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps

[none yet]