---
phase: 32
plan: 01
status: complete
date: 2026-04-25
---

# Phase 32-01 Summary — getMarketStats() API Endpoint

## Completed

- GET `/api/v2/market-stats` endpoint returning floor_price, volume_24h, active_listings
- Floor price calculated from minimum across all active resale_listings
- 24h volume summed from transaction_logs type='sale' in last 24 hours
- Active listings count from resale_listings with status='active'

## Files Modified

- `apps/backend/pb_hooks/32-market-stats.pb.js` (created — lines 4-64)
