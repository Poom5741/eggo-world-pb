---
phase: "21"
plan: "03"
subsystem: "breeding"
tags: ["cooldown", "validation", "timer", "ui"]
dependencies:
  requires: ["21-01", "21-02"]
  provides: ["21-04", "21-05"]
  affects: ["animal-card", "breeding-hook"]
tech-stack:
  added: ["CooldownTimer component"]
  patterns: ["fast-fail validation", "visual countdown", "multi-layer validation"]
key-files:
  created:
    - apps/backend/pb_migrations/21_add_last_bred_at.js
    - apps/web/components/breeding/CooldownTimer.tsx
  modified:
    - apps/web/components/animal-nft/AnimalCard.tsx
    - apps/backend/pb_hooks/18-breed-animals.pb.js
decisions:
  - "BREED_COOLDOWN = 48 hours (from AnimalNFT.sol)"
  - "Error codes: PARENT1_ON_COOLDOWN, PARENT2_ON_COOLDOWN"
  - "Multi-layer validation: frontend filters, backend hook fast-fail"
  - "Visual countdown with progress bar for better UX"
metrics:
  duration: "45m"
  completed-date: "2026-04-22"
  tasks-completed: 4
  files-created: 2
  files-modified: 2
---

# Phase 21 Plan 03: Cooldown Display & Validation Summary

## Overview

Implemented comprehensive breeding cooldown system with visual countdown timers, backend validation, and multi-layer error handling.

## What Was Built

### 1. Database Migration

- **File**: `apps/backend/pb_migrations/21_add_last_bred_at.js`
- Added `last_bred_at` date field to `animal_nfts` collection
- Tracks when each animal was last used for breeding
- Enables 48-hour cooldown enforcement

### 2. CooldownTimer Component

- **File**: `apps/web/components/breeding/CooldownTimer.tsx`
- Visual countdown timer with progress bar
- Real-time updates every second
- Three size variants: sm, md, lg
- Shows "Ready to Breed" when cooldown expires
- Displays remaining time in HH:MM:SS format

### 3. AnimalCard Updates

- **File**: `apps/web/components/animal-nft/AnimalCard.tsx`
- Added `showCooldown` and `cooldownHours` props
- Integrated CooldownTimer for breeding context
- Disabled breed button when on cooldown
- Dynamic button state: "Breed" → "On Cooldown"
- Added `isOnCooldown()` helper function

### 4. Backend Hook Validation

- **File**: `apps/backend/pb_hooks/18-breed-animals.pb.js`
- Added `BREED_COOLDOWN_HOURS = 48` constant
- Fast-fail validation for both parents
- Error codes: `PARENT1_ON_COOLDOWN`, `PARENT2_ON_COOLDOWN`
- Returns remaining cooldown time in error response
- Sets `last_bred_at` on both parents after successful breeding

## Error Codes

| Code                  | Description                                  |
| --------------------- | -------------------------------------------- |
| `PARENT1_ON_COOLDOWN` | Parent 1 is within 48-hour breeding cooldown |
| `PARENT2_ON_COOLDOWN` | Parent 2 is within 48-hour breeding cooldown |

## Multi-Layer Validation

1. **Frontend**: AnimalCard disables breed button when on cooldown
2. **Backend Hook**: Fast-fail validation before any state changes
3. **Smart Contract**: Final enforcement on blockchain (via wallet-api)

## Key Implementation Details

- Cooldown calculation: `Date.now() < lastBredAt + 48 hours`
- Progress bar shows elapsed time (fills up as cooldown progresses)
- Error messages include human-readable remaining time
- Backend sets `last_bred_at` immediately after successful breeding
- Hook validates cooldown before deducting breeding fee

## Testing Notes

- Visual countdown updates every second via `setInterval`
- Progress bar animates smoothly with CSS transitions
- Button state changes immediately when cooldown expires
- Backend validation prevents breeding even if frontend bypassed

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `ee5aad9`: feat(21-03): cooldown display and validation

## Self-Check: PASSED

- [x] Migration file exists and is valid
- [x] CooldownTimer component created
- [x] AnimalCard updated with cooldown display
- [x] Backend hook has cooldown validation
- [x] Build passes successfully
- [x] All files committed
