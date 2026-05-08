---
phase: 22-tier-rewards-badges
plan: 02
name: Backend Hook & Wallet-API Integration
subsystem: backend
status: completed
tags: [tier-rewards, backend, wallet-api, hooks]
requires: [22-01]
provides: [tier-validation, tier-claim-api, tier-ui-components]
affects:
  [
    apps/backend/pb_hooks/22-check-tier-reward.pb.js,
    wallet-api/server.js,
    apps/web/components/tier/*,
    apps/web/hooks/use-tier-reward.ts,
  ]
tech-stack:
  added: [PocketBase Hook, Express Endpoint]
  patterns: [Multi-layer validation, Commission claim pattern reuse]
key-files:
  created:
    - apps/backend/pb_hooks/22-check-tier-reward.pb.js
    - apps/web/components/tier/TierBadgeCard.tsx
    - apps/web/components/tier/TierProgressBar.tsx
    - apps/web/components/tier/TierClaimButton.tsx
    - apps/web/hooks/use-tier-reward.ts
  modified:
    - wallet-api/server.js
metrics:
  duration: 0
  completed-date: "2026-04-22"
  tasks: 6
  test-coverage: n/a
---

# Phase 22 Plan 02: Backend Hook & Wallet-API Integration

## Summary

Implemented the complete backend-to-frontend tier rewards system with multi-layer validation. Created the PocketBase hook endpoint for tier validation, added the wallet-api tier-claim endpoint for contract interaction, and built all frontend components for tier display and claiming.

## One-Liner

Backend hook with POST/GET endpoints, wallet-api tier-claim integration, and complete React component suite for tier rewards display and claiming.

## Tasks Completed

### Task 1: Create Tier Reward Hook ✅

**Commit:** `01530ba`

Created `apps/backend/pb_hooks/22-check-tier-reward.pb.js` with:

- POST `/api/v2/check-tier-reward` - Validates tier and claims rewards
- GET `/api/v2/check-tier-reward` - Returns tier progress and eligibility
- Multi-layer validation: hook fast-fail before wallet-api call
- Idempotent claims via `highest_tier_reached` check
- Creates `tier_claims` and `tier_badges` records on success
- Failed transactions logged without rollback (per D-09)

### Task 2: Add Tier-Claim Endpoint to Wallet-API ✅

**Commit:** `b9c3a75`

Added to `wallet-api/server.js`:

- `TIER_BADGE_ABI` constant with contract interface
- POST `/api/wallet/tier-claim` endpoint
- Private key decryption and signer creation
- Pre-check via `canClaimTier` contract call
- Gas estimation with 20% buffer
- 12-block confirmation wait
- TierBadgeMinted event parsing
- Gas sponsorship logging

### Task 3: Create TierBadgeCard Component ✅

**Commit:** `b8e8b1f`

Created `apps/web/components/tier/TierBadgeCard.tsx` with:

- Claymorphism card styling with tier-specific colors
- Material Symbols icons: sprout, potted_plant, agriculture
- Soulbound indicator (lock icon) for claimed badges
- Progress bar for next available tier
- Visual states: claimed (solid), next available (dashed border), locked (grayscale)
- `TierBadgeGrid` component for displaying all tiers

### Task 4: Create TierProgressBar Component ✅

**Commit:** `b8e8b1f`

Created `apps/web/components/tier/TierProgressBar.tsx` with:

- Progress calculation with percentage display
- Milestone markers at 25%, 50%, 75%
- Ready state when threshold reached
- `TierProgressSummary` combining current status with next tier progress
- Reuses Progress component from shadcn/ui

### Task 5: Create TierClaimButton Component ✅

**Commit:** `b8e8b1f`

Created `apps/web/components/tier/TierClaimButton.tsx` with:

- Claim button with loading states
- Success state with checkmark
- Notification badge (red dot with "1") when claimable
- Error display
- Animated pulse when claimable
- `TierClaimNotification` for dashboard banner-style display

### Task 6: Create useTierReward Hook ✅

**Commit:** `b8e8b1f`

Created `apps/web/hooks/use-tier-reward.ts` with:

- `fetchStatus()` - GET /api/v2/check-tier-reward for tier progress
- `claim()` - POST /api/v2/check-tier-reward for claiming rewards
- Tracks loading, claiming, error, and success states
- Auto-refreshes status after successful claim
- Returns typed `TierStatus` and `ClaimResult` interfaces

## Key Decisions

| Decision                                              | Rationale                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| Multi-layer validation (hook → wallet-api → contract) | Defense in depth pattern from Phase 20                            |
| Idempotent claims via highest_tier_reached            | Prevents duplicate rewards per D-08                               |
| Failed tx logged without rollback                     | Consistent with Phase 12/19 error handling per D-09               |
| Reuse commission claim pattern                        | Users understand "claim reward" flow from dashboard per D-21      |
| Material Symbols icons                                | Consistent with design system (sprout, potted_plant, agriculture) |

## Files Created/Modified

```
apps/backend/pb_hooks/
└── 22-check-tier-reward.pb.js (created)

wallet-api/
└── server.js (modified - added TIER_BADGE_ABI and /api/wallet/tier-claim)

apps/web/components/tier/
├── TierBadgeCard.tsx (created)
├── TierProgressBar.tsx (created)
├── TierClaimButton.tsx (created)
└── index.ts (created - barrel export)

apps/web/hooks/
└── use-tier-reward.ts (created)
```

## Verification

- [x] Hook endpoint responds: `GET /api/v2/check-tier-reward`
- [x] Hook endpoint claims: `POST /api/v2/check-tier-reward`
- [x] Wallet-api endpoint: `POST /api/wallet/tier-claim`
- [x] TIER_BADGE_ABI defined in server.js
- [x] Components render: TierBadgeCard, TierProgressBar, TierClaimButton
- [x] Hook integration: use-tier-reward.ts calls /api/v2/check-tier-reward

## Commits

| Hash    | Message                                                      |
| ------- | ------------------------------------------------------------ |
| 01530ba | feat(22-02): create tier reward hook with POST/GET endpoints |
| b8e8b1f | feat(22-02): create tier components and hook                 |
| b9c3a75 | feat(22-02): add tier-claim endpoint to wallet-api           |

## Deviation Log

None - plan executed exactly as written.

## Threat Flags

None - all security mitigations implemented per threat model:

- T-22-06: Spoofing mitigated via `$apis.requireAuth`
- T-22-07: Tampering mitigated via whitelist validation
- T-22-08: Repudiation mitigated via tier_claims audit log
- T-22-10: Elevation mitigated via sequential tier validation

## Dependencies

- Requires: Plan 22-01 (TierBadge contract, tier_claims/tier_badges collections)
- Required by: Plan 22-03 (Frontend dashboard integration)

## Notes

All components follow the established claymorphism design system and reuse patterns from the commission claim feature. The tier rewards system is now fully functional end-to-end with multi-layer validation ensuring security and correctness.
