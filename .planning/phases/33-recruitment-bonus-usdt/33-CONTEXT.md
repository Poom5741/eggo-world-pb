# Phase 33: Recruitment Bonus USDT Rewards - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase implements the recruitment bonus system from the functional spec. Users who recruit others earn Food NFT bonuses and USDT rewards based on their downline size.

Tier structure:

- 10 recruits → 2 Food NFTs + $10 USDT (×2 multiplier)
- 100 recruits → 4 Food NFTs + $20 USDT (×4 multiplier)
- 1,000 recruits → 6 Food NFTs + $30 USDT (×6 multiplier)
- 10,000 recruits → 10 Food NFTs + $50 USDT (×10 multiplier)

Endpoints:

- POST `/api/v2/claim-recruitment-bonus` — Claim bonus for current tier
- GET `/api/v2/recruitment-bonus-status` — Check eligibility without claiming

</domain>

<decisions>
## Implementation Decisions

### Tier System

- Users can only claim each tier once (tracked via `claimed_recruitment_tier` field)
- Must reach next tier threshold before claiming (no partial claims)
- Bonuses are cumulative — reaching tier 2 doesn't auto-claim tier 1

### Reward Distribution

- Food NFTs minted via wallet-api endpoint
- USDT transferred from CoinStor reserve or platform wallet
- Both rewards distributed in a single transaction

### Frontend

- Status card shows current tier, next tier progress, and claim button
- Claim button disabled when already claimed or no tier reached
- Refreshes status after successful claim

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- `apps/backend/pb_hooks/` — Existing hook patterns
- `wallet-api/server.js` — Wallet API endpoint patterns
- TierBadge components from Phase 22 (can reuse styling)

### Established Patterns

- PocketBase hooks use `e.requestInfo().auth` for authentication
- Wallet API calls via `$http.send()` with JSON body
- Response format: `{ success: true, data: { ... } }`

### Integration Points

- Users collection needs `claimed_recruitment_tier` field (default: 0)
- Wallet API needs new `/api/v1/wallet/claim-recruitment-bonus` endpoint
- Dashboard can display RecruitmentBonusCard

</code_context>

<specifics>
## Specific Ideas

- Tier labels: "Seedling (10)", "Grower (100)", "Farmer (1,000)", "Master (10,000)"
- Use Trophy icon for bonus card header
- Show "Need X more recruits" progress indicator

</specifics>

<deferred>
## Deferred Ideas

- Automatic bonus claiming when tier reached (vs manual claim)
- Bonus history tracking (list of all claimed bonuses)
- Referral leaderboard (top recruiters)

</deferred>
