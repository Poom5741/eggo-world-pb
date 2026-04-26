# Phase 34: VRF Integration for Randomness - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase replaces pseudo-random number generation with Chainlink VRF v2.5 for verifiable, tamper-proof egg hatching randomness.

Current implementation uses `block.timestamp` and `block.prevrandao` which are manipulable by miners/validators.

New implementation uses Chainlink VRF which provides cryptographically verifiable random numbers.

Endpoints:

- POST `/api/v2/hatch-egg-vrf` — Initiate VRF hatch request
- GET `/api/v2/hatch-status/:egg_id` — Check VRF hatch status

</domain>

<decisions>
## Implementation Decisions

### VRF Provider

- Use Chainlink VRF v2.5 (proven, widely adopted)
- Subscription-based billing in LINK tokens
- ~1-3 minute response time for randomness

### Two-Phase Hatching

- `hatchEgg()` initiates VRF request and marks egg as `isHatching`
- `fulfillRandomWords()` callback mints Animal NFT with verifiable random rarity
- Frontend polls for completion every 15 seconds

### Rarity Distribution

- Common: 60% (0-59)
- Rare: 25% (60-84)
- Epic: 12% (85-96)
- Legendary: 3% (97-99)

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- Existing egg hatching logic in EggNFT.sol
- `apps/backend/pb_hooks/` — Hook patterns
- `wallet-api/server.js` — Contract interaction patterns

### Established Patterns

- PocketBase hooks validate auth via `e.requestInfo().auth`
- Wallet API uses ethers.js v6 for contract calls
- 12-block confirmation wait on all transactions

### Integration Points

- EggNFT.sol needs VRFConsumerBaseV2 inheritance
- egg_nfts collection needs `is_hatching`, `vrf_request_id` fields
- Frontend hatch flow needs polling for VRF fulfillment

</code_context>

<specifics>
## Specific Ideas

- VRF configuration (subscriptionId, keyHash) should be admin-configurable
- Frontend should show "Hatching..." state with 1-3 minute estimate
- Auto-stop polling after 5 minutes timeout

</specifics>

<deferred>
## Deferred Ideas

- BSC native VRF as alternative to Chainlink (lower cost, less proven)
- Batch VRF requests for multiple eggs
- VRF cost tracking and reimbursement system

</deferred>
