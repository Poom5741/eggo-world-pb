# Phase 29: Admin Controls & Platform Safety - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Emergency platform controls for operational safety: marketplace pause/unpause with confirmation UX, admin panel at `/admin/settings` for platform controls, global status indicator for all users when marketplace is paused, revenue stats dashboard from transaction logs.

**In scope:**

- Smart contract: Add pauseMarketplace/unpauseMarketplace to CommissionDistribution.sol
- Backend hook: Admin auth middleware using PocketBase admin role
- Backend hook: Pause state sync (read from contract, cache in PocketBase)
- Frontend: `/admin/settings` route with pause controls and revenue stats
- Frontend: Global banner alert component for pause status on all pages
- Confirmation modal for pause action with impact warning
- Revenue stats from transaction_logs aggregation

**Out of scope:**

- setPlatformFee contract function (deferred to future phase)
- updateRarityWeights contract function (deferred to future phase)
- setBreedCooldown contract function (deferred to future phase)
- setKYCRequired toggle (deferred to future phase)
- Multi-sig wallet for admin authorization
- Marketplace volume, user count, active listings metrics
- User management or admin user creation

</domain>

<decisions>
## Implementation Decisions

### Contract Admin Functions

- **D-01:** Extend CommissionDistribution.sol — Add pause/unpause functions to existing contract, no new AdminControl contract
- **D-02:** Owner key: single private key in wallet-api — Backend-relayed admin calls via wallet-api endpoint with owner key in env vars
- **D-03:** Pause mechanism: Pausable pattern — Use OpenZeppelin Pausable or custom paused boolean with modifier on marketplace functions

### Admin Authentication

- **D-04:** Auth model: PocketBase admin role — Check `pb.authStore.record.role === 'admin'` for admin panel access, no custom superAdmin field
- **D-05:** Hook middleware: requireAdmin — Create reusable `$apis.requireAdmin(e)` pattern mirroring requireAuth

### Admin Panel Structure

- **D-06:** New `/admin/settings` route — Separate from existing `/admin/monitoring`, navigation links between them
- **D-07:** Settings page layout: Controls section + Stats section — Pause controls at top, revenue stats below, claymorphism card styling matching existing admin

### Platform Stats

- **D-08:** Metrics scope: Revenue (USDT) — Total CoinStor deposits from transaction_logs, no marketplace volume or user count for MVP
- **D-09:** Data source: PocketBase transaction_logs — Query collection for completed sales, sum USDT amounts, no contract read calls

### Emergency Controls UX

- **D-10:** Pause confirmation: Modal required — "Are you sure?" dialog with marketplace impact warning before pause action
- **D-11:** Unpause confirmation: Modal optional — Less critical, can be single-click with audit log
- **D-12:** Status indicator: Global banner — Top banner on all pages "Marketplace Paused - Trading Disabled" when paused, dismissable

### Claude's Discretion

- Exact banner styling and positioning (follow existing alert patterns)
- Confirmation modal wording and impact warning text
- Revenue stats card visual design (use existing dashboard card patterns)
- Pause/unpause button styling and placement in settings page
- Navigation link between /admin/settings and /admin/monitoring

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` §Phase 29 — ADMIN-01 (pause/unpause), ADMIN-06 (stats)
- `.planning/ROADMAP.md` §Phase 29 — Admin Controls & Platform Safety entry
- `docs/NFT_Marketplace_Functional_Spec.md` §12 — Admin functions specification

### Prior Phase Patterns

- `.planning/phases/24-polish-launch-prep/24-CONTEXT.md` — Admin monitoring pattern, transaction_logs usage
- `.planning/phases/28-wallet-withdrawal-coinstor/CONTEXT.md` — CoinStor reserve, admin auth consideration

### Smart Contracts

- `contracts/src/CommissionDistribution.sol` — Extend with pause/unpause functions
- `contracts/src/EggNFT.sol` — Existing onlyOwner pattern to follow
- `contracts/src/AnimalNFT.sol` — Existing onlyOwner pattern to follow

### Backend & Config

- `apps/backend/pb_hooks/00-config.pb.js` — Platform config pattern, owner key env var
- `apps/backend/pb_hooks/04-auth-token.pb.js` — Auth middleware pattern to extend

### Frontend Admin

- `apps/web/app/admin/monitoring/page.tsx` — Existing admin page structure to extend
- `apps/web/components/ui/AlertDialog.tsx` — Confirmation modal pattern
- `apps/web/app/dashboard/layout.tsx` — Banner placement reference

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Admin monitoring:** `apps/web/app/admin/monitoring/page.tsx` — Transaction logs display, auth pattern, can extend with settings nav
- **Confirmation modals:** `apps/web/components/ui/AlertDialog.tsx` — Use for pause confirmation
- **Config hook:** `apps/backend/pb_hooks/00-config.pb.js` — Platform config pattern, env var access
- **Auth middleware:** `apps/backend/pb_hooks/04-auth-token.pb.js` — `$apis.requireAuth(e)` pattern to mirror for admin

### Established Patterns

- **PocketBase admin role:** Built-in role field on users, accessible via `pb.authStore.record.role`
- **Owner pattern:** Contracts use `onlyOwner` modifier, owner set in constructor
- **Claymorphism admin cards:** Existing `/admin/monitoring` uses `clay-card` styling
- **Transaction logs:** Collection exists with tx_type, status, tx_hash fields from Phase 24

### Integration Points

- **Contract extension:** Add to CommissionDistribution.sol: `paused` boolean, `pauseMarketplace()`, `unpauseMarketplace()`, `whenNotPaused` modifier
- **New route:** `/admin/settings/page.tsx` with pause controls and stats
- **Backend hook:** `NN-admin-pause.pb.js` for pause state sync and admin auth middleware
- **Wallet API:** New endpoint `/admin/pause` to call contract with owner key
- **Global banner:** Component in root layout showing pause status when active

### Known Gaps

- CommissionDistribution.sol has no pause functions — needs extension
- No admin-only hook middleware exists — needs creation
- No global banner component for platform status — needs creation
- No `/admin/settings` route exists — needs creation
- Wallet API has no admin endpoints — needs owner-key-secured endpoints

</code_context>

<specifics>
## Specific Ideas

- "Single pause/unpause for MVP — setPlatformFee and rarity weights add complexity, defer until needed"
- "Confirmation modal prevents accidental pause — marketplace impact warning sets expectations"
- "Global banner keeps all users informed — marketplace pages disabled but other features work"
- "Revenue from transaction_logs is simpler than contract read — no RPC dependency for stats"
- "PocketBase admin role is built-in — no custom field migration needed"
- "Settings route separate from monitoring — clear separation of concerns, easy navigation"

</specifics>

<deferred>
## Deferred Ideas

- **setPlatformFee** — Change CoinStor fee percentage (currently hardcoded 4%), deferred to future phase
- **updateRarityWeights** — Adjust drop rates for Common/Rare/Epic/Legendary, deferred to future phase
- **setBreedCooldown** — Configure breeding wait duration, deferred to future phase
- **setKYCRequired** — Toggle KYC requirement for withdrawals, deferred to future phase
- **Multi-sig wallet** — More secure admin authorization, out of MVP scope
- **Additional metrics** — Marketplace volume, user count, active listings stats, deferred to future phase

</deferred>

---

_Phase: 29-admin-controls-safety_
_Context gathered: 2026-04-23_
