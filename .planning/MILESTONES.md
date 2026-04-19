# Milestones

## v0.0.6 Frontend Migration & Integration (Shipped: 2026-04-18)

**Phases completed:** 7 phases, 14 plans, 25 tasks

**Key accomplishments:**

- None
- Total: 16 tests passing across 3 components
- Landing page, Join page, and OAuth callback handler with claymorphism design, Material Symbols icons, and full TDD test coverage (18 tests)
- Completed:
- None
- Purpose:
- FeaturedEggHero Component (`apps/web/components/eggs/featured-egg-hero.tsx`):
- Phase 10 Plan 03: Hatch Flow Implementation
- Part A - HatchRevealModal (`apps/web/components/eggs/hatch-reveal-modal.tsx`):
- One-liner:
- None
- One-liner:
- Completed:

---

## v2.0 Contract Interactions & Game Features (Planned)

**Status:** Planning

**Priority Issues:**

- **P0:** Mock contract interactions (4 wallet-api endpoints)
- **P1:** RED PHASE test (track-deposit hook)
- **P2:** Feed feature (UI + backend + wallet-api)
- **P2:** Play feature (game design needed)

**Phases:** 5 planned (see .planning/milestones/v2.0/ROADMAP.md)

**Dependencies:** Contract deployment must complete before wallet-api implementation

---

## v0.0.5 Claymorphism UI Launch (Shipped: 2026-04-05)

**Phases completed:** 7 phases, 26 plans, 40 tasks

**Key accomplishments:**

- **Smart Contracts Foundation:** Deployed 5 contracts to 0XL3 testnet (MockUSDT, CommissionDistribution, AnimalNFT, EggNFT, FoodNFT) with cross-contract wiring
- **Backend Integration:** Built PocketBase event sync hook with block polling, crash recovery, and 5 event handlers
- **Frontend Marketplace:** Delivered 5 plans covering hatch flow, wallet page, product detail, referral dashboard, and polling integration
- **LINE Wallet Integration:** Migrated wallet API to TypeScript + dacc-js v0.0.5, integrated with LINE OAuth signup flow
- **Testing & Launch:** Security fixes, integration tests, production deployment, and UI polish (63 tests passing)
- **Auth Flow Revamp:** Fixed double-click OAuth issue, enhanced header with user info/navigation, unified redirect to `/dashboard`
- **Claymorphism Redesign:** Complete UI redesign with hybrid "Clay Frames, Pixel Content" aesthetic — 12+ components, 14+ pages, WCAG AA compliant

---
