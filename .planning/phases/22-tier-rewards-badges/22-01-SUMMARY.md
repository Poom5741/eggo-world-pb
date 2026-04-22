---
phase: 22-tier-rewards-badges
plan: 01
subsystem: contracts
tags: [solidity, erc-5192, soulbound, pocketbase, tier-rewards]
dependency_graph:
  requires: []
  provides: [tier-badge-contract, tier-collections]
  affects: [22-02, 22-03]
tech_stack:
  added:
    - solidity-0.8.24
    - openzeppelin-contracts-v5
    - erc-5192-interface
  patterns:
    - soulbound-nft
    - sequential-tier-minting
    - on-chain-metadata
key_files:
  created:
    - contracts/src/interfaces/IERC5192.sol
    - contracts/src/TierBadge.sol
    - apps/backend/collections/tier_claims.json
    - apps/backend/collections/tier_badges.json
  modified: []
decisions:
  - Use ERC-5192 minimal soulbound standard (not full EIP-5484)
  - Store tier metadata on-chain (no external URI dependency)
  - Sequential tier enforcement (must claim Seedling → Grower → Farmer)
  - USDT rewards from CoinStor reserve (not minting new tokens)
  - Immutable PocketBase collections (no update/delete rules)
  - Base64-encoded on-chain JSON metadata for tokenURI
metrics:
  duration: 12
  completed_date: "2026-04-22"
---

# Phase 22 Plan 01: TierBadge Contract & Collections Summary

## One-Liner

Created TierBadge soulbound NFT contract implementing ERC-5192 with three achievement tiers (Seedling/Grower/Farmer) and PocketBase collections for claim tracking and badge ownership mirroring.

## What Was Delivered

### Smart Contracts

**IERC5192.sol** — Minimal soulbound NFT interface per EIP-5192
- `Locked(uint256 tokenId)` event
- `Unlocked(uint256 tokenId)` event  
- `locked(uint256 tokenId)` view function
- Interface ID: `0xb45a3c0e`

**TierBadge.sol** — Soulbound achievement badge contract
- ERC-721 base with ERC-5192 soulbound extension
- Three tier configurations:
  - **Seedling** (Token ID 1): 10 food items → $5 USDT reward
  - **Grower** (Token ID 2): 100 food items → $50 USDT reward
  - **Farmer** (Token ID 3): 1,000 food items → $500 USDT reward
- Soulbound enforcement via `_update` override (blocks all transfers except mint/burn)
- Sequential tier minting (must claim 1 → 2 → 3 in order)
- `mintTierBadge()` with USDT reward distribution from CoinStor reserve
- `canClaimTier()` view function for eligibility checks
- `getNextClaimableTier()` to determine available tier
- On-chain base64-encoded JSON metadata (no external dependencies)
- ReentrancyGuard protection on mint function

### PocketBase Collections

**tier_claims.json** — Claim history tracking
- `user`: relation to users collection (cascade delete)
- `tier`: select field (seedling/grower/farmer)
- `usdt_amount`: number field for reward amount
- `tx_hash`: blockchain transaction hash (0x...64 pattern)
- `token_id`: NFT token ID (1-3 range)
- `claimed_at`: timestamp of claim
- Unique index on (user, tier) combination
- API rules: user-scoped access, immutable after creation

**tier_badges.json** — On-chain badge ownership mirror
- `user`: relation to users collection (cascade delete)
- `token_id`: NFT token ID (1-3, unique per user)
- `tier_name`: select field (Seedling/Grower/Farmer)
- `contract_address`: TierBadge contract address (0x...40 pattern)
- `tx_hash`: mint transaction hash (0x...64 pattern)
- `minted_at`: timestamp of mint
- Unique index on (user, token_id) combination
- API rules: user-scoped access, immutable after creation

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 5d68141 | feat(22-01): create IERC5192 soulbound NFT interface | contracts/src/interfaces/IERC5192.sol |
| 4f4a3ca | feat(22-01): create TierBadge soulbound NFT contract | contracts/src/TierBadge.sol |
| 2d6b313 | feat(22-01): create tier_claims PocketBase collection | apps/backend/collections/tier_claims.json |
| 2ef6cc2 | feat(22-01): create tier_badges PocketBase collection | apps/backend/collections/tier_badges.json |

## Verification Results

- ✅ `forge build` compiles TierBadge.sol without errors
- ✅ IERC5192 interface defines Locked/Unlocked events and locked() function
- ✅ TierBadge implements ERC-5192 with soulbound enforcement
- ✅ tier_claims.json has all required fields (user, tier, usdt_amount, tx_hash, token_id, claimed_at)
- ✅ tier_badges.json has all required fields (user, token_id, tier_name, contract_address, tx_hash, minted_at)
- ✅ All collections have proper API rules (user-scoped access, immutable)

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: soulbound-transfer-blocking | TierBadge.sol | _update override prevents all transfers (T-22-01 mitigated) |
| threat_flag: onlyOwner-minting | TierBadge.sol | mintTierBadge restricted to owner (T-22-02 mitigated) |
| threat_flag: reentrancy-guard | TierBadge.sol | ReentrancyGuard on mintTierBadge (T-22-03 mitigated) |
| threat_flag: user-scoped-access | tier_claims.json | API rules restrict to user's own records (T-22-04 mitigated) |

All threats from the plan's threat model have been addressed.

## Self-Check: PASSED

- ✅ contracts/src/interfaces/IERC5192.sol exists
- ✅ contracts/src/TierBadge.sol exists
- ✅ apps/backend/collections/tier_claims.json exists
- ✅ apps/backend/collections/tier_badges.json exists
- ✅ All commits verified in git log
- ✅ Contract compiles without errors

## Next Steps

Plan 22-02 (Backend Hook & Wallet-API) will build on these foundations:
- Create `check-tier-reward` PocketBase hook
- Add `/tier-claim` wallet-api endpoint
- Implement tier claim UI components
