---
phase: 36
plan: 01
status: complete
date: 2026-04-25
---

# Phase 36-01 Summary — NFT Burn & KYC Toggle

## Completed

- BURN-01: POST `/api/v2/burn-nft` (egg/food/animal types)
- KYC-01: POST `/api/v2/admin/set-kyc-required` (admin toggle)
- GET `/api/v2/kyc-status` for user KYC verification status
- SPEND-01: POST `/api/v2/spend-usdt` (explicit spend function)
- Burns delegate to wallet-api `/api/v1/wallet/burn-nft` with ownership verification
- PocketBase records marked is_burned=true, burned_at timestamp

## Files Modified

- `apps/backend/pb_hooks/36-burn-kyc-spend.pb.js` (created — 200 lines)
