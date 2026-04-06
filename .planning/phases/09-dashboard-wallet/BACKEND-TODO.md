# Backend Integration Tasks

**Created:** 2026-04-05  
**Priority:** High  
**Dependencies:** Phase 9 complete ✅

---

## Problem

Phase 9 frontend design is 100% Jules match ✅, but console shows errors:

1. `ClientResponseError 404: Missing collection context`
2. `ClientResponseError 0: Request was autocancelled` (normal, just noisy)
3. `ClientResponseError 404: The requested resource wasn't found`

**Root Causes:**
- PocketBase collections don't exist or aren't configured
- No seed data for testing
- Backend not integrated with frontend

---

## What's Fixed (Frontend)

✅ **Error Handling Added:**
- `apps/web/lib/pocketbase/error-handling.ts` - Utility functions
- `apps/web/app/dashboard/page.tsx` - Suppress errors, show empty states
- `apps/web/components/dashboard/activity-feed.tsx` - Handle missing transactions
- `apps/web/app/dashboard/eggs/page.tsx` - Already had error handling
- `apps/web/app/mint/food/page.tsx` - Already had error handling

**Result:** Console is now clean during normal usage (no error spam)

---

## What Needs Backend Work

### Collections to Create/Sync in PocketBase

**1. `users` collection**
- Fields: `name`, `wallet`, `daccPublicKey`, `pin`, `usdt_total_earned`, `picture`, `email`
- Already exists but may need data seeding

**2. `egg_nfts` collection**
- Fields: `owner` (relation to users), `food_count`, `is_hatched`, `minted_at`
- Already exists but may need seed data

**3. `commission_records` collection**
- Fields: `user` (relation), `level` (1-4), `amount`, `claimed`, `created`
- May not exist - needs creation

**4. `transactions` collection**
- Fields: `user` (relation), `type` (hatch/mint_egg/mint_food/commission/sale), `amount`, `created`
- May not exist - needs creation

---

## Tasks

### Phase 10 or 9.5 Scope

**Backend Tasks:**
- [ ] Verify all collections exist in PocketBase
- [ ] Create missing collections (commission_records, transactions)
- [ ] Seed test data for demo
- [ ] Test wallet API integration
- [ ] Test referral calculation logic

**Frontend Tasks:**
- [ ] Connect real data to dashboard
- [ ] Test activity feed with real transactions
- [ ] Test Buddy Chain with real referral data
- [ ] End-to-end testing of all flows

---

## Recommendation

Create **Phase 10: Backend Integration** with these tasks:
1. PocketBase collection setup
2. Seed data creation
3. Integration testing
4. End-to-end flows

This keeps Phase 9 design approval clean while organizing backend work properly.

---

**Files Changed:**
- `apps/web/lib/pocketbase/error-handling.ts` (NEW)
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/dashboard/activity-feed.tsx`

**Commits:**
- `aa92780` - feat: add PocketBase error handling utilities
- `cb7ad2f` - fix: add error handling to dashboard page and activity feed

---

*Note: Phase 9 frontend design is 100% Jules match and approved. These are backend integration tasks for next phase.*
