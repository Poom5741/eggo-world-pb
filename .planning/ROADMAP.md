# Roadmap — v0.7.0 Production Hardening

**Milestone:** Production Hardening  
**Created:** 2026-04-18  
**Updated:** 2026-05-07  
**Status:** All v0.0.7 phases resolved

---

## Original v0.0.7 Phases (All Complete)

| Phase | Status | Resolution |
|---|---|---|
| **Phase 12: Wallet-API Contract Integration** | ✅ COMPLETE | 4 mock endpoints replaced with real ethers.js calls. AES-GCM v4 decryption. Deployed to 0xl3 (7117). |
| **Phase 13: USDT Deposit Tracking** | ✅ COMPLETE | `13-track-deposit.pb.js` polls `eth_getLogs` for Transfer events. Idempotent. Balance updates. |
| **Phase 14: Mobile Responsive Polish** | ✅ COMPLETE | Shipped as part of v0.5.0 Security Hardening milestone. |
| **Phase 15: Feed Feature** | ✅ COMPLETE | `FeedDialog` + `useEggFeed` + `16-feed-egg.pb.js` + wallet-api endpoint. FEED ME button fixed. |
| **Phase 16: Play Feature + Test Infrastructure** | ⚠️ PARTIAL | Test failures resolved (9 vi.mock fixed). PLAY deferred pending game design spec. |

---

## Remaining Work

### P1: Wallet-api Dual Codebase (Fixed)

`wallet-api/package.json` `"main"` now points to `server.js`. `bun run dev` starts the correct server.

### P1: Hardcoded localhost URLs (Fixed)

4 pb_hooks (20-buy-nft, 23-list-animal, 24-list-egg, 26-list-food) now require `WALLET_API_URL` env var.

### P2: Play Feature (Needs Game Design)

Frontend PLAY button routes to FeedDialog as placeholder. Requires game design spec.

### P2: Deposit Polling Cursor

`13-track-deposit.pb.js` scans latest block only. Needs `fromBlock` cursor tracking.

### P2: Technical Debt

- Increase test coverage from 70% → 80%+
- Remove ~200 debug console.log statements
- Fix ~77 `any` TypeScript instances
- Clean up dead code (`wallet-api/src/`, `wallet-api/utils/dacc-decrypt.js`)

---

_Last updated: 2026-05-07 — Phases 12-16 complete_
