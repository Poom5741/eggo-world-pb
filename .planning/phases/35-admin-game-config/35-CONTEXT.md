# Phase 35: Admin Game Configuration - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase implements 4 admin-only configuration functions that allow dynamic game parameter adjustment without contract redeployment:

1. ADMIN-01: `setPlatformFee(percent)` — Dynamic platform fee (0-20%)
2. ADMIN-02: `setBreedCooldown(seconds)` — Dynamic breeding cooldown (1-168 hours)
3. ADMIN-03: `updateRarityWeights(weights[])` — Adjustable rarity distribution
4. ADMIN-04: `addNewSpecies()` — Expand species catalog

All changes are on-chain transactions requiring admin ownership of the config contract.

</domain>

<decisions>
## Implementation Decisions

### AdminConfig Contract

- Single contract manages all game parameters
- OnlyOwner access control for all config functions
- Events emitted for all configuration changes
- Default values match current hardcoded values

### Validation

- Platform fee: 0-2000 basis points (0-20%)
- Breed cooldown: 3600-604800 seconds (1 hour - 7 days)
- Rarity weights: must sum to 10000 (100%)
- Species: unique ID, non-empty name, positive weight

### Frontend

- Admin page at `/admin/game-config` displays all current values
- Each config section has an "Update" button
- GET `/api/v2/game-config` returns current configuration

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- Existing admin page structure at `/admin/`
- `apps/backend/pb_hooks/` — Admin auth patterns
- `wallet-api/server.js` — Admin signer patterns

### Established Patterns

- Admin verification via `user.get("role") === "admin"`
- Wallet API calls via `$http.send()`
- 12-block confirmation wait

### Integration Points

- AdminConfig.sol contract needs to be deployed
- CONFIG_ADDRESS environment variable
- Existing admin middleware in wallet-api

</code_context>

<specifics>
## Specific Ideas

- Display fee as percentage (400 basis points = 4%)
- Display cooldown in hours (172800 seconds = 48 hours)
- Species catalog shows name and weight in list format

</specifics>

<deferred>
## Deferred Ideas

- Config change history/audit log
- Multi-sig approval for config changes
- Config presets (conservative, balanced, aggressive)

</deferred>
