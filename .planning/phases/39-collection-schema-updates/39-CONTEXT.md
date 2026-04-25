# Phase 39: Collection Schema Updates - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds new fields to existing PocketBase collections to support the features implemented in Phases 32-36:

**users collection:**
- `claimed_recruitment_tier` (number, default: 0) — Tracks which recruitment bonus tier was claimed
- `kyc_required_globally` (bool, default: false) — Global KYC requirement flag

**egg_nfts collection:**
- `is_hatching` (bool, default: false) — Egg is waiting for VRF randomness
- `vrf_request_id` (text, nullable) — Chainlink VRF request ID
- `vrf_transaction_hash` (text, nullable) — Transaction hash for VRF request
- `is_burned` (bool, default: false) — NFT has been burned
- `burned_at` (datetime, nullable) — When NFT was burned

**food_nfts collection:**
- `is_burned` (bool, default: false)
- `burned_at` (datetime, nullable)

**animal_nfts collection:**
- `is_burned` (bool, default: false)
- `burned_at` (datetime, nullable)

</domain>

<decisions>
## Implementation Decisions

### Schema Migration
- Use PocketBase Admin UI to add fields manually
- Or create migration script using PocketBase API
- Default values ensure backward compatibility

### Field Types
- Numbers: integer with default 0
- Bools: boolean with default false
- Text: string with no validation (for hashes/IDs)
- Datetime: ISO 8601 format

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- PocketBase Admin UI at `https://pb.eggoworld.io/_/`
- Existing collection schemas in `apps/backend/collections/`

### Established Patterns
- Collections defined in JSON/YAML format
- Migrations tracked in STATE.md

### Integration Points
- Fields must match names used in PocketBase hooks
- Default values prevent null reference errors

</code_context>

<specifics>
## Specific Ideas

- Add fields via Admin UI for immediate effect
- Document field additions in migration log
- Test hooks after schema updates

</specifics>

<deferred>
## Deferred Ideas

- Automated schema migration tool
- Field validation rules
- Index optimization for new fields

</deferred>
