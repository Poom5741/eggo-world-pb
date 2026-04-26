---
phase: 34
plan: 01
status: complete
date: 2026-04-25
---

# Phase 34-01 Summary — VRF Integration for Randomness

## Completed

- POST `/api/v2/hatch-egg-vrf` endpoint initiating VRF randomness request
- GET `/api/v2/hatch-status/:egg_id` for polling VRF fulfillment status
- Delegates to wallet-api `/api/v1/wallet/hatch-egg-vrf` for Chainlink VRF call
- is_hatching, vrf_request_id fields on egg_nfts collection
- Returns "vrf_requested" status with estimated 1-3 minute completion

## Files Modified

- `apps/backend/pb_hooks/34-vrf-hatch.pb.js` (created — 107 lines)
