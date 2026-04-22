---
status: testing
phase: 21-breeding-system
source: 21-wave1-SUMMARY.md, 21-03-SUMMARY.md, 21-04-SUMMARY.md, 21-05-SUMMARY.md
started: 2026-04-22T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Current Test

number: 1
name: Breeding Dialog Flow
expected: |
  Navigate to /animals page with 2+ animals. Click "Breed" button opens BreedingDialog. Step 1 shows AnimalSelectionGrid with selectable animals. Select 2 parents, click Next to see BreedingConfirmation with parent previews, generation calculation, and 5 USDT fee. Click Confirm initiates breeding.
awaiting: user response

## Tests

### 1. Breeding Dialog Flow
expected: Navigate to /animals with 2+ animals, click Breed button, see two-step dialog (selection → confirmation), confirm breeding
result: [pending]

### 2. Animal Card Breed Button
expected: Breed button with favorite icon shows on AnimalCard when user has 2+ animals. Clicking opens dialog with that animal pre-selected as parent1
result: [pending]

### 3. Cooldown Display & Validation
expected: Animals on 48h cooldown show CooldownTimer with HH:MM:SS countdown. Breed button disabled with "On Cooldown" text. Backend rejects breeding with PARENT1_ON_COOLDOWN or PARENT2_ON_COOLDOWN error
result: [pending]

### 4. Breeding Egg Display
expected: Breeding eggs appear in /eggs page with purple "Breeding Egg" badge showing favorite icon. Tooltip displays generation (Gen 1, 2+, etc.) and parent animal IDs (#123 × #456)
result: [pending]

### 5. Blockchain Integration
expected: Breeding creates real blockchain transaction via wallet-api POST /api/wallet/breed-animals. Gas sponsored by relayer wallet. Egg record stores tx_hash, blockchain_child_token_id, blockchain_child_generation
result: [pending]

### 6. Success Animation & Flow
expected: After successful breeding, toast notification shows success message. User redirected to /eggs page where new breeding egg appears in list
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
