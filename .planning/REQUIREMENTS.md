# v0.7.0 Requirements

**Milestone:** Production Hardening  
**Created:** 2026-04-18  
**Updated:** 2026-05-07  
**Status:** All SEC requirements resolved

---

## Requirements Status

### Security (P0 — Originally Blocks Launch)

| Req ID | Requirement | Phase | Status | Resolution |
|---|---|---|---|---|
| SEC-01 | Mint Egg with real blockchain tx | 12 | ✅ COMPLETE | wallet-api POST /api/wallet/mint-egg with ethers.js |
| SEC-02 | Claim commission with real blockchain tx | 12 | ✅ COMPLETE | wallet-api POST /api/wallet/claim-commission |
| SEC-03 | Mint Food with real blockchain tx | 12 | ✅ COMPLETE | wallet-api POST /api/wallet/mint-food |
| SEC-04 | Feed Egg with real blockchain tx | 12 | ✅ COMPLETE | wallet-api POST /api/wallet/feed-egg with ownership verify |
| SEC-05 | Auto-track USDT deposits via event polling | 13 | ✅ COMPLETE | 13-track-deposit.pb.js eth_getLogs polling |
| SEC-06 | 12-block confirmation wait | 13 | ✅ COMPLETE | Implemented in all wallet-api endpoints |
| SEC-07 | Duplicate detection (idempotent) | 13 | ✅ COMPLETE | tx_hash unique constraint in deposits collection |
| SEC-08 | User notified on deposit confirmation | 13 | ✅ COMPLETE | Frontend polling shows pending→confirmed transition |

### Quality (P1 — Technical Debt)

| Req ID | Requirement | Phase | Status | Resolution |
|---|---|---|---|---|
| QUAL-01 | Fix 9 vi.mock test failures | 16 | ✅ COMPLETE | All test setup issues resolved |
| QUAL-02 | Test coverage 80%+ | 16 | ⚠️ PARTIAL | ~70% currently; needs continued effort |
| QUAL-03 | Bottom tab bar on mobile | 14 | ✅ COMPLETE | Shipped in v0.5.0 |
| QUAL-04 | 44x44px touch targets WCAG 2.2 | 14 | ✅ COMPLETE | Shipped in v0.5.0 |
| QUAL-05 | 5 breakpoint testing | 14 | ✅ COMPLETE | Shipped in v0.5.0 |
| QUAL-06 | iOS zoom prevention | 14 | ✅ COMPLETE | 16px min on inputs |

### Features (P1/P2)

| Req ID | Requirement | Phase | Status | Resolution |
|---|---|---|---|---|
| FEAT-01 | Feed button on eggs page | 15 | ✅ COMPLETE | FeaturedEggHero + EggCard feed buttons work |
| FEAT-02 | Select up to 10 food NFTs | 15 | ✅ COMPLETE | FeedDialog with counter, selection |
| FEAT-03 | Feeding progress bar (X/10) | 15 | ✅ COMPLETE | Egg cards show food_count progress |
| FEAT-04 | Mark consumed food as "used" | 15 | ✅ COMPLETE | 16-feed-egg.pb.js marks NFTs consumed |
| FEAT-05 | Play button on eggs page | 16 | ❌ DEFERRED | Needs game design spec |
| FEAT-06 | Daily check-in reward | 16 | ❌ DEFERRED | Needs game design spec |
| FEAT-07 | Check-in streak tracking | 16 | ❌ DEFERRED | Needs game design spec |
| FEAT-08 | Balance refresh 30s polling | 16 | ✅ COMPLETE | useWalletPoll with exponential backoff |
| FEAT-09 | Balance detail breakdown | 16 | ✅ COMPLETE | Wallet display with history |

---

## Remaining Requirements

| ID | Priority | Description | Status |
|---|---|---|---|
| PLAY-01 | P2 | Play feature: daily check-in or mini-game | ❌ Needs game design |
| QUAL-02 | P1 | Test coverage 80%+ | ⚠️ ~70% |
| TECH-01 | P2 | Deposit polling `fromBlock` cursor | ⚠️ Needs implementation |
| TECH-02 | P2 | Remove debug console.log (~200) | ⚠️ Needs cleanup |
| TECH-03 | P2 | Fix `any` types (~77) | ⚠️ Needs refactor |
| TECH-04 | P2 | Clean up dead code paths | ⚠️ Needs refactor |

---

_Last updated: 2026-05-07 — All SEC requirements resolved_
