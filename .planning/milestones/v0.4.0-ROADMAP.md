# Roadmap: Eggo NFT Platform

## Milestones

- ✅ **v0.3.0 E2E Flow Testing** — Phases 41-44 (shipped 2026-04-28) — [See archive](milestones/v0.3.0-ROADMAP.md)
- ✅ **v0.2.0 Functional Spec 100%** — Phases 32-40 (shipped 2026-04-26) — [See archive](milestones/v0.2.0-ROADMAP.md)
- 🚧 **v0.4.0 Functional Journey Tests** — Phases 45+ (planned)

## Overview

v0.3.0 delivered E2E test infrastructure. Next milestone will focus on functional journey tests (buy egg → feed → hatch → referral commission).

## Phases

<details>
<summary>✅ v0.3.0 E2E Flow Testing (Phases 41-44) — SHIPPED 2026-04-28</summary>

- [x] Phase 41: Framework Setup + Docker Environment (2/2 plans) — completed 2026-04-27
- [x] Phase 42: Auth Mock + Blockchain Helpers (2/2 plans) — completed 2026-04-27
- [x] Phase 43: Wallet Automation (1/1 plan) — completed 2026-04-27
- [x] Phase 44: CI Integration (1/1 plan) — completed 2026-04-27

</details>

<details>
<summary>✅ v0.2.0 Functional Spec 100% (Phases 32-40) — SHIPPED 2026-04-26</summary>

- [x] Phase 32: Recruitment Bonus USDT (2/2 plans) — completed 2026-04-25
- [x] Phase 33: Chainlink VRF v2.5 (2/2 plans) — completed 2026-04-25
- [x] Phase 34: Admin Game Config (2/2 plans) — completed 2026-04-25
- [x] Phase 35: NFT Burning + KYC (2/2 plans) — completed 2026-04-25
- [x] Phase 36-40: Additional features (7 plans) — completed 2026-04-26

</details>

### 🚧 v0.4.0 Functional Journey Tests (Planned)

- [x] Phase 45: Buy Egg Journey Test
  - Goal: E2E test for complete "Buy Egg" user journey: authentication → marketplace browsing → purchase → verify NFT ownership
  - Plans: 1 plan
  - Plan list:
    - [x] 45-01-PLAN.md — Journey helpers + main buy journey test with triple verification — completed 2026-04-28
- [x] Phase 46: Feed + Hatch Journey Test
  - Goal: E2E test for complete "Feed + Hatch" user journey: buy food → feed egg → hatch animal
  - Plans: 1 plan
  - Plan list:
    - [x] 46-01-PLAN.md — Feed/hatch helpers + journey test with triple verification — completed 2026-04-28
- [x] Phase 47: Marketplace Journey Test (list → purchase → ownership transfer)
  - Goal: E2E test for marketplace multi-user flow: list → purchase → ownership transfer
  - Plans: 1 plan
  - Plan list:
    - [x] 47-01-PLAN.md — Multi-user journey test with bilateral ownership verification — completed 2026-04-28
- [x] Phase 48: Referral Commission Journey Test
  - Goal: E2E test for referral commission flow: signup → purchase → commission distribution
  - Plans: 1 plan
  - Plan list:
    - [x] 48-01-PLAN.md — Commission verification helpers + referral commission journey test — completed 2026-04-28

## Progress

| Phase                                    | Milestone | Plans Complete | Status   | Completed  |
| ---------------------------------------- | --------- | -------------- | -------- | ---------- |
| 41. Framework Setup + Docker Environment | v0.3.0    | 2/2            | Complete | 2026-04-27 |
| 42. Auth Mock + Blockchain Helpers       | v0.3.0    | 2/2            | Complete | 2026-04-27 |
| 43. Wallet Automation                    | v0.3.0    | 1/1            | Complete | 2026-04-27 |
| 44. CI Integration                       | v0.3.0    | 1/1            | Complete | 2026-04-27 |
| 45. Buy Egg Journey Test                 | v0.4.0    | 1/1            | Complete | 2026-04-28 |
| 46. Feed + Hatch Journey Test            | v0.4.0    | 1/1            | Complete | 2026-04-28 |
| 47. Marketplace Journey Test             | v0.4.0    | 1/1            | Complete | 2026-04-28 |
| 48. Referral Commission Journey Test     | v0.4.0    | 1/1            | Complete | 2026-04-28 |

---

_Last updated: 2026-04-28 — Phase 48 completed_
