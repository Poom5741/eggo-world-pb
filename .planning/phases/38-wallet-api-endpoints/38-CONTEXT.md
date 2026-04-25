# Phase 38: Wallet API Endpoints - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase implements 7 new wallet-api endpoints required by the PocketBase hooks created in Phases 32-36:

1. POST `/api/v1/wallet/claim-recruitment-bonus` — Mint food NFTs + transfer USDT bonus
2. POST `/api/v1/wallet/hatch-egg-vrf` — Initiate VRF hatch request
3. POST `/api/v1/wallet/check-vrf-fulfillment` — Poll for VRF completion
4. POST `/api/v1/wallet/admin/set-platform-fee` — Update platform fee on-chain
5. POST `/api/v1/wallet/admin/set-breed-cooldown` — Update breed cooldown on-chain
6. POST `/api/v1/wallet/admin/update-rarity-weights` — Update rarity weights on-chain
7. POST `/api/v1/wallet/admin/add-species` — Add new species on-chain
8. POST `/api/v1/wallet/burn-nft` — Burn NFT on-chain
9. POST `/api/v1/wallet/admin/set-kyc-required` — Toggle KYC requirement
10. GET `/api/v1/wallet/game-config` — Read current game config from chain

</domain>

<decisions>
## Implementation Decisions

### Admin Middleware
- Reuse existing `requireAdmin` middleware pattern
- Verify admin role via PocketBase user lookup

### Contract Interactions
- Use ethers.js v6 for all contract calls
- 12-block confirmation wait on all transactions
- Admin signer uses platform private key from .env

### Error Handling
- Standard response format: `{ success: true, data: { ... } }`
- Error format: `{ success: false, error: { message, code } }`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `wallet-api/server.js` — Express.js server with existing endpoints
- `getAdminSigner()` helper function
- Contract ABI patterns from existing endpoints

### Established Patterns
- Decrypt user private key with `MASTER_KEY + user.id`
- ethers.js JsonRpcProvider for BSC connection
- 12-block confirmation wait

### Integration Points
- Needs CONFIG_ADDRESS for AdminConfig contract
- Needs EGG_NFT_ADDRESS for burn/hatch functions
- Needs USDT contract address for bonus transfers

</code_context>

<specifics>
## Specific Ideas

- Add new ABIs to server.js (AdminConfig, VRF-related)
- Use existing gas estimation patterns with 20% buffer

</specifics>

<deferred>
## Deferred Ideas

- Rate limiting for admin endpoints
- Transaction retry logic for failed VRF requests
- Gas price optimization

</deferred>
