# Milestone v0.0.6 Gap Closure Plan

**Document Type:** Product Specification + Implementation Plan  
**Created:** 2026-04-18  
**Status:** Ready for Implementation  
**Priority:** P0 - Blocks Production Launch

---

## Executive Summary

**Current State:** 80% Complete (24/30 requirements shipped)  
**Goal:** 100% Complete — Production Ready  
**Gaps:** 11 requirements incomplete, 3 critical issues to resolve

---

## Gap Analysis

### Shipped ✅ (19 requirements)

**Zero Action Needed:**

- ✅ MKT-01 to MKT-06 (6/6) — Marketplace complete
- ✅ EGG-01 to EGG-07 (7/7) — Egg management complete
- ✅ FOUND-05, FOUND-06 (2/6) — Layout, icons working
- ✅ Smart contracts, backend, LINE OAuth (fixed)

---

## Critical Issues (P0 — Must Fix)

### Issue 1: Phase 03 Buy Now Stub

**Problem:** Product detail page `marketplace/[nftId]/page.tsx` lines 129-130 shows `alert('Buy functionality coming soon')`

**Impact:** Secondary marketplace purchases blocked

**Fix Required:**

```typescript
// Current (line 129-130):
onClick={() => alert('Buy functionality coming soon')}

// Replace with:
onClick={handleBuyNow}

// Where handleBuyNow executes:
const handleBuyNow = async () => {
  try {
    // 1. Check user has wallet
    // 2. Check sufficient USDT balance
    // 3. Open BuyFlow modal (already exists)
    // 4. Execute approveUSDT + buyNFT sequence
  } catch (error) {
    // Error handling
  }
}
```

**Files to Modify:**

- `apps/web/app/marketplace/[nftId]/page.tsx`
- Wire to existing `BuyFlow.tsx` component

**Estimated Effort:** 2-3 hours  
**Risk:** Low (BuyFlow already built and tested)

---

### Issue 2: Test Suite Failures

**Problem:** 9 tests failing due to `vi.mock` setup issues

**Impact:** Cannot verify builds programmatically, blocks CI/CD

**Root Cause:** Test environment configuration for vi.mock not properly initialized

**Fix Required:**

1. Add `@testing-library/jest-dom` to vitest setup
2. Configure `vi.mock` factory functions properly
3. Mock PocketBase client correctly
4. Mock ethers.js contracts correctly

**Files to Create/Modify:**

- `apps/web/vitest.setup.ts` (create)
- `apps/web/vitest.config.ts` (update)
- Update mocks in test files

**Estimated Effort:** 4-6 hours  
**Risk:** Medium (test infrastructure changes)

---

### Issue 3: Mobile Responsive Testing

**Problem:** No verification of responsive layouts at breakpoints

**Impact:** Mobile UX may be broken

**Fix Required:**

1. Manual testing at 4 breakpoints: 320px, 768px, 1024px, 1440px
2. Verify BottomNav toggles on mobile
3. Verify touch interactions work
4. Document any issues found

**Checklist:**

- [ ] Test all marketplace pages
- [ ] Test dashboard pages
- [ ] Test egg management pages
- [ ] Test auth flow (join, login)
- [ ] Test BuyFlow modal on mobile
- [ ] Test navigation (BottomNav vs TopNav)

**Estimated Effort:** 3-4 hours  
**Risk:** Low (testing only, fixes deferred to Phase 12)

---

## Missing Requirements (P1 — Should Fix)

### FOUND Requirements (4 incomplete)

#### FOUND-01: Landing Page Jules Design

**Current Status:** Basic structure exists, Jules design not implemented

**What's Needed:**

- Hero section with Jules character artwork
- NFT showcase carousel
- How-to steps (1-2-3 visual)
- Call-to-action buttons

**Estimated Effort:** 8-12 hours (design + implementation)  
**Decision Required:** Use existing claymorphism style or commission Jules artwork?

---

#### FOUND-02 to FOUND-04: Auth Flow Polish

**Current Status:** LINE OAuth works (bug fixed)

**Missing:**

- FOUND-02: Single-click button on `/join` page
- FOUND-03: Auth callback redirect to `/dashboard` (already working?)
- FOUND-04: Navigation components (TopNav, BottomNav, SideNav)

**Action:** Verify which are actually missing vs documented as incomplete

---

### DASH Requirements (6 incomplete)

#### DASH-01: Dashboard USDT Balance Display

**Current Status:** Wallet page shows balance, dashboard may not

**Check:** Does `/dashboard` show balance summary?

**If Missing:**

- Add balance card to dashboard
- Show USDT balance prominently
- Add "Updating..." indicator during polling

**Estimated Effort:** 2-3 hours

---

#### FOUND-07: Wallet Auto-Polling (30s)

**Current Status:** `useWalletPoll` hook exists

**Missing:** Integration on dashboard pages

**Fix Required:**

- Add polling to `/dashboard` page
- Add polling to `/dashboard/eggs` page
- Add polling to `/dashboard/commissions` page
- Show "Updating..." during refresh

**Estimated Effort:** 3-4 hours

---

#### DASH-02 to DASH-05: Dashboard Features

**Quick Assessment Needed:**

| Requirement                       | Current Implementation          | Gap                  |
| --------------------------------- | ------------------------------- | -------------------- |
| DASH-02: Referral 4-level display | `/dashboard/commissions` exists | Verify G1-G4 shown   |
| DASH-03: Quick action buttons     | Dashboard has action cards?     | Verify buttons wired |
| DASH-04: Recent activity          | Transaction history exists?     | Add to dashboard     |
| DASH-05: Active eggs count        | Egg preview on dashboard?       | Add counter          |

**Estimated Effort:** 6-8 hours total

---

## Deferred Items (Phase 12 — Not Required for Launch)

### MOB Requirements (5 items)

**Mobile & Polish — Deferred to Phase 12:**

- MOB-01: BottomNav toggle animation
- MOB-02: Responsive verification (4 breakpoints)
- MOB-03: Touch interaction optimization
- MOB-04: Test suite 63+ passing
- MOB-05: Build zero warnings

**Decision:** Ship with P0 fixes, address MOB in Phase 12

---

## Implementation Plan

### Wave 1: P0 Critical Fixes (Must Complete)

**Duration:** 1-2 days

**Tasks:**

1. **Fix Buy Now stub** (2-3 hours)
   - File: `apps/web/app/marketplace/[nftId]/page.tsx`
   - Wire to existing BuyFlow component
   - Test end-to-end

2. **Fix test suite** (4-6 hours)
   - Create vitest setup file
   - Configure vi.mock properly
   - Fix 9 failing tests
   - Verify all tests pass

3. **Mobile responsive testing** (3-4 hours)
   - Manual testing at 4 breakpoints
   - Document any critical issues
   - Defer polish fixes to Phase 12

**Success Criteria:**

- ✅ Buy Now executes real transaction
- ✅ `bun test` shows 0 failures
- ✅ Mobile testing documented (even if polish deferred)

---

### Wave 2: P1 Dashboard Polish (Should Complete)

**Duration:** 2-3 days

**Tasks:**

1. **Dashboard balance display** (2-3 hours)
2. **Auto-polling integration** (3-4 hours)
3. **Referral chain display** (verify existing, fix if needed)
4. **Quick action buttons** (verify existing, wire if needed)
5. **Recent activity** (add transaction list)
6. **Active eggs count** (add to dashboard)

**Success Criteria:**

- ✅ Dashboard shows balance, referrals, actions, activity, eggs
- ✅ All data auto-refreshes every 30 seconds

---

### Wave 3: Landing Page (Nice to Have)

**Duration:** 3-5 days

**Decision Point:** Is Jules design critical for launch?

**If Yes:**

- Commission or create Jules artwork
- Implement hero section
- Add NFT showcase carousel
- Add how-to steps

**If No:**

- Defer to Phase 12
- Focus on dashboard polish instead

---

## Recommendations

### Launch Criteria (Minimum Viable)

**Ship if all P0 fixes complete:**

- ✅ Buy Now button works (not stub)
- ✅ Tests pass (CI/CD ready)
- ✅ Mobile critical issues documented

**Defer to Phase 12:**

- ❌ Landing page Jules design
- ❌ Dashboard polish (DASH requirements)
- ❌ Mobile responsive polish (MOB requirements)

### Rationale

**Marketplace is core value prop** — Buy Now must work  
**Tests are quality gate** — Must pass for CI/CD  
**Mobile testing is risk mitigation** — Document before launch

**Dashboard polish improves UX but not blocking**  
**Landing page is marketing, not functionality**

---

## Next Steps

### Immediate Actions

1. **Review this spec** — Confirm priorities align with launch goals
2. **Decide on Wave 3** — Is landing page critical or can it wait?
3. **Prioritize P0** — Start with Buy Now fix + test suite

### If Launching This Week

**Do:**

- Wave 1 (P0 fixes) — 1-2 days
- Quick mobile test — 2-3 hours
- Launch with Wave 2 deferred

**Document:**

- Known issues (dashboard polish, mobile UX)
- Phase 12 roadmap (addresses deferred items)

### If Launching Next Week

**Do:**

- Wave 1 (P0 fixes) — 1-2 days
- Wave 2 (dashboard polish) — 2-3 days
- Wave 3 optional (landing page) — 3-5 days

**Result:**

- Full v0.0.6 feature set
- Ready for marketing push
- Phase 12 focuses on mobile optimization

---

## Success Criteria

### v0.0.6 Launch Ready

**Must Have:**

- ✅ 6/6 MKT requirements complete (Buy Now fixed)
- ✅ 7/7 EGG requirements complete (already done)
- ✅ Auth working (LINE OAuth bug fixed)
- ✅ Tests passing (no CI/CD blockers)
- ✅ Mobile critical issues documented

**Nice to Have:**

- ⚠️ Dashboard balance display
- ⚠️ Dashboard auto-polling
- ⚠️ Referral display polish

**Defer to v2.0:**

- ❌ Landing page Jules design
- ❌ Mobile responsive polish
- ❌ Test count targets (63+)

---

## Approval

| Role        | Name | Date | Decision               |
| ----------- | ---- | ---- | ---------------------- |
| Product     | TBD  | TBD  | Approve Wave 1-2-3?    |
| Engineering | TBD  | TBD  | Technical feasibility? |
| Design      | TBD  | TBD  | Landing page priority? |

---

## Appendix: File References

### P0 Fixes

| File                                        | Action                          | Lines      |
| ------------------------------------------- | ------------------------------- | ---------- |
| `apps/web/app/marketplace/[nftId]/page.tsx` | Replace alert with handleBuyNow | 129-130    |
| `apps/web/vitest.setup.ts`                  | Create setup file               | New        |
| `apps/web/vitest.config.ts`                 | Add test config                 | New/Update |

### P1 Dashboard

| File                                          | Action                      | Notes             |
| --------------------------------------------- | --------------------------- | ----------------- |
| `apps/web/app/dashboard/page.tsx`             | Add balance, eggs, activity | May exist         |
| `apps/web/app/dashboard/eggs/page.tsx`        | Add polling                 | Use useWalletPoll |
| `apps/web/app/dashboard/commissions/page.tsx` | Verify referral display     | Check G1-G4       |

### Wave 3 Landing

| File                                  | Action                 | Notes    |
| ------------------------------------- | ---------------------- | -------- |
| `apps/web/app/page.tsx`               | Hero, carousel, how-to | Redesign |
| `apps/web/components/JulesHero.tsx`   | Create component       | New      |
| `apps/web/components/NFTShowcase.tsx` | Create carousel        | New      |

---

**Generated by:** gsd-discuss-phase workflow  
**Date:** 2026-04-18 15:30 ICT  
**Version:** 1.0

---

## Decision Log

**Dec-001:** Wave 1 (P0) is launch-critical — Buy Now fix + tests  
**Dec-002:** Mobile testing documentation acceptable — polish deferred  
**Dec-003:** Dashboard polish (Wave 2) recommended but not blocking  
**Dec-004:** Landing page (Wave 3) deferred unless marketing requires

---

**Next Action:** User/stakeholder review of priorities and launch criteria
