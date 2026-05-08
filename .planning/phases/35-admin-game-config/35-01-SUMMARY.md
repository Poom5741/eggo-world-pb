---
phase: 35
plan: 01
status: complete
date: 2026-04-25
---

# Phase 35-01 Summary — Admin Game Config Functions

## Completed

- ADMIN-01: POST `/api/v2/admin/set-platform-fee` (0-2000 basis points)
- ADMIN-02: POST `/api/v2/admin/set-breed-cooldown` (3600-604800 seconds)
- ADMIN-03: POST `/api/v2/admin/update-rarity-weights` (must sum to 10000)
- ADMIN-04: POST `/api/v2/admin/add-species` (species_id + name + weight)
- GET `/api/v2/game-config` for reading all config values
- All admin endpoints require role='admin' authentication
- Delegates to wallet-api admin/\* endpoints for on-chain operations

## Files Modified

- `apps/backend/pb_hooks/35-admin-config.pb.js` (created — 184 lines)
