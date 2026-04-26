# Phase 36: NFT Burn & KYC Toggle - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase implements 3 remaining spec gaps:

1. BURN-01: `burnNFT(nft_id)` — Destroy NFTs (owner or admin only)
2. KYC-01: `setKYCRequired(bool)` — Toggle KYC for withdrawals
3. SPEND-01: `spendUSDT()` — Explicit USDT spending function

Endpoints:

- POST `/api/v2/burn-nft` — Burn an NFT
- POST `/api/v2/admin/set-kyc-required` — Toggle KYC requirement (admin)
- GET `/api/v2/kyc-status` — Check user's KYC status
- POST `/api/v2/spend-usdt` — Spend USDT from user balance

</domain>

<decisions>
## Implementation Decisions

### NFT Burning

- Only owner or admin can burn
- Hatched eggs cannot be burned (they've produced animals)
- Animals in breeding cooldown cannot be burned
- Burned NFTs are marked in PocketBase but remain on-chain (burned token ID)

### KYC Toggle

- Global KYC requirement is admin-configurable
- When KYC required, unverified users cannot withdraw
- KYC verification is admin-managed (manual approval for MVP)
- Future: integrate with third-party KYC provider

### spendUSDT

- Internal utility for tracking USDT expenditures
- Validates sufficient balance before spending
- Creates transaction_logs record with purpose
- Updates wallet's total_spent tracking

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- Existing burn patterns in OpenZeppelin contracts
- KYC field on users collection (`kyc_verified`)
- `transaction_logs` collection from Phase 24

### Established Patterns

- PocketBase hooks validate ownership via wallet-api
- Admin checks via `user.get("role") === "admin"`
- Response format: `{ success: true, data: { ... } }`

### Integration Points

- egg_nfts, food_nfts, animal_nfts need `is_burned` field
- users collection needs `kyc_required_globally` field
- Existing withdrawal flow should check KYC status

</code_context>

<specifics>
## Specific Ideas

- BurnNFTDialog shows warning with irreversible action message
- KYCStatusBadge shows verified/required/not-required states
- spendUSDT requires purpose string for audit trail

</specifics>

<deferred>
## Deferred Ideas

- Automated KYC via third-party provider (Jumio, Onfido)
- NFT burn recovery (admin can restore burned NFTs)
- USDT spending limits and approval workflows

</deferred>
