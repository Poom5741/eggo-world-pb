# Requirements — Milestone v0.0.8 NFT Ecosystem Complete

**Version:** 1.0  
**Created:** 2026-04-22  
**Milestone:** v0.0.8  
**Source:** NFT_Marketplace_Functional_Spec.md + Phase 20 deferred items

---

## Active Requirements

### Phase 20: Gap Closure & UAT (P0)

**GAPS-01:** ✅ Feed-egg endpoint validates foodCount < 10 before processing (hook fast-fail + wallet-api safety net)  
**GAPS-02:** Complete 10 UAT scenarios for feed/hatch/polling/empty state  
**GAPS-03:** Document gas sponsorship system with 5 human verification tests  
**GAPS-04:** ✅ Implement empty state UI for /eggs page when user has no eggs (CTA routes to /marketplace)  
**GAPS-05:** Execute Phase 17 UAT re-verification (6 manual scenarios)

---

### Phase 21: Breeding System (P1)

**BREED-01:** User can select two Animal NFTs they own to initiate breeding  
**BREED-02:** System validates breeding cooldown period (48 hours) before allowing breed  
**BREED-03:** User pays breeding fee in USDT (amount TBD)  
**BREED-04:** Offspring rarity calculated as max(parent1.rarity, parent2.rarity) with variance  
**BREED-05:** New Animal NFT minted with generation = max(gen1, gen2) + 1  
**BREED-06:** Both parent animals locked during breeding cooldown period  
**BREED-07:** Breeding transaction emits AnimalsBreed event with parent IDs and offspring ID

---

### Phase 22: Tier Rewards (P1)

**TIER-01:** System tracks user lifetime_food_items (cumulative food purchased/consumed)  
**TIER-02:** Tier thresholds: Seedling (10 items), Grower (100 items), Farmer (1,000 items)  
**TIER-03:** User receives USDT reward upon reaching each tier: $5, $50, $500 respectively  
**TIER-04:** Soulbound Badge NFT minted for each tier (non-transferable ERC-5192)  
**TIER-05:** Tier badges display in user profile with cosmetic in-game benefits  
**TIER-06:** checkAndGrantTierReward endpoint validates and distributes rewards

---

### Phase 23: Secondary Market (P2)

**RESALE-01:** User can list Animal NFT for sale on marketplace with custom USDT price  
**RESALE-02:** Secondary sale triggers 10% royalty to original referral chain  
**RESALE-03:** Royalty split: 2% G1, 1% G2, 1% G3, 1% G4 of total sale price  
**RESALE-04:** Seller receives 85% of sale (after 4% platform + 10% royalty + 1% misc)  
**RESALE-05:** Marketplace displays Animal NFTs with rarity, generation, and species filters

---

### Phase 24: Polish & Launch Prep (P2)

**POLISH-01:** Production error boundaries with graceful degradation  
**POLISH-02:** Monitoring dashboard for transaction success rates  
**POLISH-03:** Performance optimization: bundle size < 200KB, LCP < 2.5s  
**POLISH-04:** User onboarding tutorial flow for first-time visitors  
**POLISH-05:** Recruitment bonus system: Food NFT + USDT rewards for 10/100/1,000/10,000 recruits

---

## Future Requirements (Deferred)

- **AUCTION-01:** Auction-style listings with bid system
- **OFFER-01:** Direct offers to NFT owners
- **COLLECTION-01:** Collection views and portfolio analytics
- **RARITY-01:** Extra food feeding for improved hatch rarity odds (rarity upgrade paths)

---

## Out of Scope

- Email/password authentication — LINE OAuth only (existing)
- Mobile native app — Web-first approach (existing)
- Multi-language support — Thai initially (existing)
- Dark mode toggle — Single theme (existing)
- Full gas sponsorship with meta-transactions — MVP uses user wallet for mint

---

## Traceability

| REQ-ID                    | Phase    | Status              |
| ------------------------- | -------- | ------------------- |
| GAPS-01, GAPS-04          | Phase 20 | ✅ Complete (20-01) |
| GAPS-02, GAPS-03, GAPS-05 | Phase 20 | Planned             |
| BREED-01 → BREED-07       | Phase 21 | Planned             |
| TIER-01 → TIER-06         | Phase 22 | Planned             |
| RESALE-01 → RESALE-05     | Phase 23 | Planned             |
| POLISH-01 → POLISH-05     | Phase 24 | Planned             |

---

_Last updated: 2026-04-22 — v0.0.8 milestone requirements defined_
