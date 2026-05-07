# STATE.md — Project Memory

**Project:** Egg × Food × Animal NFT Marketplace  
**Milestone:** v0.7.0 Production Hardening  
**Network:** 0xl3 (Chain ID: 7117)  
**Token:** USDT (BEP-20)

---

## Project Reference

**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

**Current Focus:** Production hardening and remaining feature gaps

**Constraints:**

- Static export for Cloudflare Pages
- LINE OAuth only (no email/password)

---

## Current Position

All original GSD phases (12-16) from v0.0.7 are **complete or resolved**.

| Phase | Original Goal | Status | Notes |
|---|---|---|---|
| 12: Wallet-API Contract Integration | Replace mock endpoints | ✅ COMPLETE | Real ethers.js calls, AES-GCM v4, 12 confirmations |
| 13: USDT Deposit Tracking | Event polling service | ✅ COMPLETE | 13-track-deposit.pb.js with eth_getLogs |
| 14: Mobile Responsive Polish | Breakpoints, touch targets | ✅ COMPLETE | Shipped in v0.5.0+ |
| 15: Feed Feature | Wire Feed button | ✅ COMPLETE | FeedDialog + useEggFeed + wallet-api |
| 16: Play Feature + Tests | PLAY + test infra | ⚠️ PARTIAL | Tests fixed; PLAY deferred (needs game design) |

---

## Performance Metrics

| Metric                     | Value                | Target  |
| -------------------------- | -------------------- | ------- |
| **Smart Contracts**        | 5 deployed (0xl3)    | 5/5     |
| **Forge Tests**            | 14 files, all pass   | 100%    |
| **Frontend Tests**         | 27 files, ~25 pass   | 80%+    |
| **PocketBase Hooks**       | 20+ operational      | 20+     |
| **Build Time**             | 2.5s (Bun)           | < 5s    |
| **LOC**                    | ~60K TypeScript      | -       |

---

## Known Remaining Issues

1. **Play Feature** — Needs game design spec (daily check-in vs mini-game)
2. **Deposit polling cursor** — `13-track-deposit.pb.js` scans latest block only
3. **Test coverage** — ~70%, target 80%+
4. **console.log verbosity** — ~200+ debug statements
5. **`any` types** — ~77 instances

---

## Environment

**Production:**

- PocketBase: `https://pb.eggoworld.io`
- Frontend: Cloudflare Pages (static export)
- Network: 0xl3 testnet (Chain ID: 7117)

**Development:**

- PocketBase: `http://localhost:8090` (Docker)
- Frontend: `http://localhost:3000` (Bun)
- Wallet API: `http://localhost:3001` (Bun, `bun run dev` now starts correct server)

**SSH Access:**

- Host: `root@204.168.144.14`
- Production path: `/root/eggo-world-pb`

---

_Last updated: 2026-05-07 — Phase 12-16 completed, production hardening_
