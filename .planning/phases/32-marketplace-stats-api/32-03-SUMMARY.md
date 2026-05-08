---
phase: 32
plan: 03
status: complete
date: 2026-04-25
---

# Phase 32-03 Summary — getUserReferralStats() API Endpoint

## Completed

- GET `/api/v2/referral-stats` endpoint for authenticated users
- Returns referral_chain (G1-G4 upline IDs)
- Returns direct_recruits list with id, username, email, created
- Returns direct_recruit_count and total_downline (all 4 levels)
- Returns referral_earnings from transaction_logs commission records

## Files Modified

- `apps/backend/pb_hooks/32-market-stats.pb.js` (extended — lines 154-246)
