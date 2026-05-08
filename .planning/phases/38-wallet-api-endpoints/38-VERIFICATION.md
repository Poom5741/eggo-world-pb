# Phase 38: Wallet API Endpoints — Verification

**Completed:** 2026-04-25
**Status:** ✅ All tasks verified

## Verification Checklist

### Syntax Check

- [x] `node -c wallet-api/server.js` passes (Syntax OK)

### Endpoint Count

- [x] 10 new endpoints registered in app.listen route logging
- [x] `grep "api/v1/wallet/" wallet-api/server.js` confirms all 10 routes exist

### Endpoint Inventory

| #   | Method | Route                                      | Lines | Category      |
| --- | ------ | ------------------------------------------ | ----- | ------------- |
| 1   | POST   | /api/v1/wallet/claim-recruitment-bonus     | 1707  | Recruitment   |
| 2   | POST   | /api/v1/wallet/hatch-egg-vrf               | 1815  | VRF           |
| 3   | POST   | /api/v1/wallet/check-vrf-fulfillment       | 1916  | VRF           |
| 4   | POST   | /api/v1/wallet/admin/set-platform-fee      | 2214  | Admin Config  |
| 5   | POST   | /api/v1/wallet/admin/set-breed-cooldown    | 2271  | Admin Config  |
| 6   | POST   | /api/v1/wallet/admin/update-rarity-weights | 2324  | Admin Config  |
| 7   | POST   | /api/v1/wallet/admin/add-species           | 2389  | Admin Config  |
| 8   | POST   | /api/v1/wallet/admin/set-kyc-required      | 2436  | Admin/KYC     |
| 9   | POST   | /api/v1/wallet/burn-nft                    | 2485  | NFT Burn      |
| 10  | GET    | /api/v1/wallet/game-config                 | 2575  | Config Reader |

### Input Validation

| Endpoint                | Validation                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------- |
| claim-recruitment-bonus | user_address, tier (1-4), food_count, usdt_bonus required                             |
| hatch-egg-vrf           | user_id, egg_id required; ownership verified via ownerOf()                            |
| check-vrf-fulfillment   | egg_id required; graceful handling of pre-Phase 37 contracts                          |
| set-platform-fee        | fee_percent required; 0-2000 range check                                              |
| set-breed-cooldown      | cooldown_seconds required; 3600-604800 range check                                    |
| update-rarity-weights   | common, rare, epic, legendary required; sum must = 10000                              |
| add-species             | species_id, name required; weight default to 100                                      |
| set-kyc-required        | kyc_required required (boolean)                                                       |
| burn-nft                | user_address, nft_id, nft_type ("egg"/"animal") required; ownership check for animals |
| game-config             | No input required (GET)                                                               |

### Security / Threat Mitigation

| Threat ID | Mitigation                                              | Status |
| --------- | ------------------------------------------------------- | ------ |
| T-38-01   | Validate user_address is present (relayer wallet check) | ✅     |
| T-38-02   | Verify egg ownership via ownerOf() before hatchEgg      | ✅     |
| T-38-03   | All txs logged with tx_hash, EggHatched event parsed    | ✅     |
| T-38-04   | Private key decrypted in memory, never logged           | ✅     |
| T-38-05   | 20% gas buffer on all txs                               | ✅     |
| T-38-06   | Only relayer wallet mints food/transfers USDT           | ✅     |
| T-38-07   | ADMIN_PRIVATE_KEY required, onlyOwner on contract       | ✅     |
| T-38-08   | Input validation 0-2000 basis points                    | ✅     |
| T-38-09   | Weights must sum to 10000                               | ✅     |
| T-38-10   | Verify NFT ownership via ownerOf() before burning       | ✅     |
| T-38-11   | ADMIN_PRIVATE_KEY never logged/exposed                  | ✅     |
| T-38-12   | Read-only view calls, Promise.all for efficiency        | ✅     |
| T-38-13   | All tx hashes returned for on-chain audit               | ✅     |

### Gas Management

- [x] All state-changing endpoints estimate gas with 20% buffer
- [x] claim-recruitment-bonus logs gas sponsorship for both food mint and USDT transfer
- [x] hatch-egg-vrf uses user wallet (user pays gas for VRF)
- [x] check-vrf-fulfillment uses user wallet for claimHatch
- [x] Admin endpoints use ADMIN_PRIVATE_KEY for signing
- [x] 12-block confirmation wait on all transactions

### Response Format

All endpoints return:

```json
{ "success": true, "data": { ... } }
// or
{ "success": false, "error": { "message": "...", "code": "..." } }
```

### Contract Dependencies

| Function                             | Contract | Required By             |
| ------------------------------------ | -------- | ----------------------- |
| mint(to, foodType, quantity)         | FoodNFT  | claim-recruitment-bonus |
| transfer(to, amount)                 | USDT     | claim-recruitment-bonus |
| hatchEgg(tokenId)                    | EggNFT   | hatch-egg-vrf           |
| claimHatch(tokenId)                  | EggNFT   | check-vrf-fulfillment   |
| ownerOf(tokenId)                     | EggNFT   | hatch-egg-vrf, burn-nft |
| pendingHatches(requestId)            | EggNFT   | hatch-egg-vrf           |
| setPlatformFee(fee)                  | EggNFT   | set-platform-fee        |
| setBreedCooldown(cooldown)           | EggNFT   | set-breed-cooldown      |
| updateRarityWeights(...)             | EggNFT   | update-rarity-weights   |
| addNewSpecies(id, name, weight)      | EggNFT   | add-species             |
| setKYCRequired(bool)                 | EggNFT   | set-kyc-required        |
| burnNFT(tokenId, nftType)            | EggNFT   | burn-nft                |
| platformFee(), breedCooldown(), etc. | EggNFT   | game-config             |

---

_Phase: 38-wallet-api-endpoints_
_Verified: 2026-04-25_
