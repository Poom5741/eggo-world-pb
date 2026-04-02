# Phase 3: Frontend Marketplace - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02  
**Phase:** 03-frontend-marketplace  
**Areas discussed:** Page completion status, missing pages priority, animation complexity, integration approach

---

## Phase 3 Assessment

### Implementation Status Review

| Category        | Status      | Count | Notes                                                                                   |
| --------------- | ----------- | ----- | --------------------------------------------------------------------------------------- |
| Total Pages     | ✅ Built    | 11    | Auth (5), Dashboard (3), Marketplace (2), Mint (1)                                      |
| Core Flow Pages | ✅ Complete | 6     | Auth, Buy Egg, Egg Dashboard, Commissions, Food Marketplace                             |
| Missing Pages   | ⏳ Pending  | 6     | Hatch Egg, My Wallet, Product Detail, Referral Tree, Buy Food standalone, List for Sale |
| UI Components   | ✅ Complete | 58    | shadcn/ui components ready                                                              |

**Total:** Frontend 60% complete — core infrastructure ready, critical pages pending

---

## User Decisions

### Decision 1: Missing Pages Priority

**Question:** Which pages are critical for MVP launch?

**Options presented:**

- Hatch Egg (high) — critical for game loop completion
- My Wallet (high) — users need to see/claim earnings
- Product detail (medium) — nice to have
- Buy Food page (low) — already in marketplace
- Referral dashboard (medium) — can be simple list
- List for sale (low) — marketplace feature, can defer

**User's choice:** ✓ All options acknowledged with priorities as recommended

**Result:**

- **HIGH (MVP):** Hatch Egg, My Wallet
- **MEDIUM (better UX):** Product detail, Referral dashboard
- **LOW (defer):** Buy Food standalone, List for sale

---

### Decision 2: Hatch Egg Animation

**Question:** How elaborate should the hatching experience be?

**Options presented:**

1. Simple reveal — show rarity/species after hatching (1-2 hours)
2. Full animation — egg shaking, cracking, animal appears (half day)
3. No animation — just update inventory after hatch

**User's choice:** ✓ Simple reveal

**Rationale:** MVP focus — functional over flashy. Can add polish later.

---

### Decision 3: Blockchain Integration

**Question:** How should frontend get updated blockchain data?

**Options presented:**

1. Manual refresh — user clicks 'Refresh' after transactions
2. Auto-polling — check balance/NFTs every 30s automatically
3. Event-based — wait for backend event sync (not ready yet)

**User's choice:** ✓ Auto-polling

**Rationale:** Best UX without waiting for Phase 2 event sync. Can add manual refresh as fallback.

---

## Implementation Plan Summary

### Must Build for MVP

1. **Hatch Egg page** — simple reveal after feeding 10 food
2. **My Wallet page** — USDT balance, earnings, withdraw

### Should Build (better UX)

3. **Product detail page** — NFT metadata display
4. **Referral dashboard** — simple list visualization

### Can Defer

5. **Buy Food standalone** — marketplace already covers this
6. **List for sale** — secondary market, post-MVP

---

## Technical Notes

### Auto-Polling Pattern

```typescript
// Recommended implementation
useEffect(() => {
  const pollInterval = setInterval(async () => {
    await fetchWalletBalance()
    await fetchUserNFTs()
    await fetchCommissions()
  }, 30000) // 30 seconds

  return () => clearInterval(pollInterval)
}, [user])
```

### Hatch Egg Simple Reveal Flow

```
1. User clicks "Hatch" (enabled when food_count >= 10)
2. Show loading spinner + "Hatching..." message
3. Call backend hatch endpoint
4. On success: display reveal card with:
   - Animal NFT image
   - Rarity badge (color-coded)
   - Species name
   - Generation, stats
5. "Claim to Inventory" button → redirect to egg dashboard
```

### My Wallet Page Structure

- Current USDT balance (large, prominent)
- Total earnings (lifetime)
- Available to withdraw
- Withdraw form (amount, address)
- Recent transactions list
- Deposit instructions (QR, address copy)

---

## Integration Strategy

**Phase 3 can proceed without Phase 2 event sync by:**

- Polling Wallet API for balances
- Calling PocketBase for NFT metadata
- Manual triggers for blockchain actions (mint, feed, hatch)
- Auto-refresh UI after transactions complete

**When Phase 2 event sync is ready:**

- Replace polling with real-time updates
- Add push notifications for events
- Improve UX with instant feedback

---

## Deferred Ideas

**Out of scope for MVP:**

- Elaborate animations
- Advanced marketplace features
- Social features
- Mobile app
- Advanced analytics
- Multi-language support

---

_Discussion completed: 2026-04-02_  
_Decision: Phase 3 marked as 60% complete — 2 critical pages needed for MVP_  
_Next: Complete Hatch Egg + My Wallet pages, then Phase 4 testing_
