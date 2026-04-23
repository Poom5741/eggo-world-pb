# Phase 29: Admin Controls & Platform Safety - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 29-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 29-admin-controls-safety
**Areas discussed:** Contract Admin Functions, Admin Auth Model, Admin Panel Structure, Platform Stats Design

---

## Contract Admin Functions

| Option                           | Description                                                            | Selected |
| -------------------------------- | ---------------------------------------------------------------------- | -------- |
| Extend CommissionDistribution    | Add pause/unpause, setPlatformFee, etc. to CommissionDistribution.sol  | ✓        |
| New AdminControl contract        | New contract with all admin functions, CommissionDistribution calls it |          |
| Distribute to specific contracts | Split functions across EggNFT, AnimalNFT, etc.                         |          |

**User's choice:** Extend CommissionDistribution
**Notes:** Keep admin functions centralized in existing contract, simpler deployment

### Owner Key Storage

| Option                    | Description                                              | Selected |
| ------------------------- | -------------------------------------------------------- | -------- |
| Single key (backend-held) | Private key in wallet-api env vars, backend relays calls | ✓        |
| Multi-sig wallet          | Gnosis Safe, requires 2-of-3 signatures                  |          |
| Admin UI + backend relay  | PocketBase admin auth triggers backend calls             |          |

**User's choice:** Single key (backend-held)
**Notes:** MVP simplicity, owner key in WALLET_OWNER_KEY env var, wallet-api endpoint calls contract

---

## Admin Auth Model

| Option                  | Description                                   | Selected |
| ----------------------- | --------------------------------------------- | -------- |
| PocketBase admin role   | Built-in pb.authStore.record.role === 'admin' | ✓        |
| Custom superAdmin field | Boolean field on users collection             |          |
| Whitelist admin emails  | List in CONFIG, check email match             |          |

**User's choice:** PocketBase admin role
**Notes:** Built-in role field, no migration needed, standard PocketBase pattern

---

## Admin Panel Structure

| Option                    | Description                                     | Selected |
| ------------------------- | ----------------------------------------------- | -------- |
| New /admin/settings route | Separate from /admin/monitoring with navigation | ✓        |
| Extend /admin with tabs   | Single page with Stats/Controls tabs            |          |
| Unified admin dashboard   | Single /admin page with sidebar navigation      |          |

**User's choice:** New /admin/settings route
**Notes:** Clear separation of concerns, settings route for controls, monitoring stays as-is

---

## Platform Stats Design

### Metrics Scope

| Option             | Description                                 | Selected |
| ------------------ | ------------------------------------------- | -------- |
| Revenue (USDT)     | Total CoinStor deposits + commission claims | ✓        |
| Marketplace volume | Total Egg/Food/Animal sold in USDT          |          |
| User count         | Registered users, active users              |          |
| Active listings    | Current resale listings count               |          |

**User's choice:** Revenue (USDT) only
**Notes:** MVP simplicity, single metric from transaction_logs

### Stats Source

| Option                      | Description                                      | Selected |
| --------------------------- | ------------------------------------------------ | -------- |
| PocketBase transaction_logs | Query collection for completed sales             | ✓        |
| Smart contract read         | Call CommissionDistribution.getCoinStorBalance() |          |
| Cached stats collection     | Maintain cached stats, update on events          |          |

**User's choice:** PocketBase transaction_logs
**Notes:** No RPC dependency, simpler aggregation, existing collection from Phase 24

---

## Emergency Controls UX

### Pause Confirmation

| Option                      | Description                            | Selected |
| --------------------------- | -------------------------------------- | -------- |
| Confirmation modal required | "Are you sure?" with impact warning    | ✓        |
| One-click with audit log    | Single click, immediate effect         |          |
| Two-admin approval          | Both must click within 5-minute window |          |

**User's choice:** Confirmation modal required
**Notes:** Prevents accidental pause, shows marketplace impact warning

### Status Indicator

| Option                  | Description                         | Selected |
| ----------------------- | ----------------------------------- | -------- |
| Global banner alert     | Top banner on all pages when paused | ✓        |
| Marketplace-only banner | Indicator only on marketplace pages |          |
| No visible indicator    | Silent prevention, disable buttons  |          |

**User's choice:** Global banner alert
**Notes:** All users informed of pause state, "Marketplace Paused - Trading Disabled" message

---

## MVP Scope Clarification

| Option                     | Description                       | Selected |
| -------------------------- | --------------------------------- | -------- |
| Defer to future phase      | Only pause/unpause in Phase 29    | ✓        |
| Include all in Phase 29    | All 4 admin functions implemented |          |
| Pause now, fee when needed | Pause/unpause + setPlatformFee    |          |

**User's choice:** Defer to future phase
**Notes:** Phase 29 MVP: pause/unpause only, setPlatformFee/rarity weights/cooldown deferred

---

## Claude's Discretion

- Exact banner styling and positioning
- Confirmation modal wording and impact warning text
- Revenue stats card visual design
- Pause/unpause button styling and placement
- Navigation link between /admin/settings and /admin/monitoring

---

## Deferred Ideas

- setPlatformFee — Change CoinStor fee percentage
- updateRarityWeights — Adjust drop rates
- setBreedCooldown — Configure breeding wait duration
- setKYCRequired — Toggle KYC for withdrawals
- Multi-sig wallet — More secure admin authorization
- Additional metrics — Marketplace volume, user count, active listings
