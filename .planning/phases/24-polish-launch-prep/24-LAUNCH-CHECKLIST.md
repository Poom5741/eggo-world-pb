# Phase 24: Launch Checklist

**Created:** 2026-04-23
**Status:** Pending execution
**Verified by:** [Developer name]
**Date verified:** [Date]

---

## Error Boundaries (D-01 to D-03)

- [ ] All 6 authenticated routes have `error.tsx` files
- [ ] Error boundaries display retry + fallback UI correctly
- [ ] Console logs show structured error messages
- [ ] Cloudflare Analytics tracking errors

**Verification notes:**

- [Add notes after manual testing]

---

## Monitoring Dashboard (D-04 to D-06)

- [ ] `transaction_logs` collection exists in PocketBase
- [ ] `/admin/monitoring` page loads with metrics
- [ ] Transaction success rates calculated correctly
- [ ] Recent failures table displays error details
- [ ] Page accessible only to authenticated users

**Verification notes:**

- [Add notes after manual testing]

---

## Performance Optimization (D-07 to D-09)

- [ ] `@next/bundle-analyzer` configured and working
- [ ] Initial bundle size under 200KB
- [ ] Modals use dynamic imports (lazy loading)
- [ ] No hydration errors after dynamic import conversion
- [ ] `bun run check-size` passes without warnings

**Verification notes:**

- [Add notes after manual testing]

---

## Onboarding Tutorial (D-10 to D-13)

- [ ] Tutorial appears on first `/dashboard` visit
- [ ] 4-step walkthrough displays correctly
- [ ] localStorage `tutorial_completed` set on dismiss
- [ ] Tutorial does not reappear after dismissal
- [ ] No SSR/hydration mismatches

**Verification notes:**

- [Add notes after manual testing]

---

## Recruitment Bonus (D-14 to D-16)

- [ ] Hook grants 10 Food NFTs at 10 recruits
- [ ] Hook grants 50 Food NFTs at 100 recruits
- [ ] Hook grants 100 Food NFTs at 1,000 recruits
- [ ] Hook grants 200 Food NFTs at 10,000 recruits
- [ ] Bonus logic non-blocking (registration succeeds even if bonus fails)

**Verification notes:**

- [Add notes after manual testing]

---

## Health Checks & Deployment

- [ ] `curl https://pb.eggoworld.io/api/health` returns 200
- [ ] PocketBase container running (`docker ps | grep eggo-pb`)
- [ ] All hooks loaded (check logs for "endpoint registered")
- [ ] Frontend deployed to Cloudflare Pages
- [ ] DNS resolves correctly for `app.eggoworld.io`

**Verification notes:**

- [Add notes after manual testing]

---

## End-to-End Flow Verification

- [ ] Auth flow: LINE OAuth → Dashboard (new user)
- [ ] Mint flow: Buy egg → NFT appears in /eggs
- [ ] Feed flow: Buy food → Feed egg → 10/10 progress
- [ ] Hatch flow: Feed 10 → Hatch → Animal NFT minted
- [ ] Marketplace flow: List NFT → Buy NFT → Ownership transferred
- [ ] Commission flow: Referral → Earn commission → Claim commission
- [ ] Tier flow: Consume food → Reach threshold → Claim tier badge

**Verification notes:**

- [Add notes after manual testing]

---

## Sign-Off

- [ ] All checklist items verified
- [ ] No critical issues found
- [ ] Ready for production launch

**Verified by:** ______  
**Date:** ______  
**Signature:** ______
