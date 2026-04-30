# Phase 51 Context: Medium-Severity Security Fixes

## Scope

8 medium-severity issues from audit that affect state management and access control. Low execution risk — each is a 1-3 line change or addition.

## Issues & Fixes (from SMART_CONTRACT_AUDIT_2026-04-29.md)

| ID            | Fix                                                                       | Files                                                               | Complexity                          |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------- |
| M-01 (SEC-14) | Replace `ownerOf` with `_ownerOf` in check patterns                       | EggNFT.sol (7), AnimalNFT.sol (5)                                   | Trivial                             |
| M-02 (SEC-15) | Reset referral chain in `_update` on transfer                             | EggNFT.sol:551-563                                                  | Trivial (ALREADY FIXED in Phase 50) |
| M-03 (SEC-16) | Add food-cap check to `recordFoodConsumption`                             | EggNFT.sol:457-471                                                  | Trivial                             |
| M-04 (SEC-17) | Add `whenNotPaused` to state-mutating functions                           | EggNFT.sol (upgradeEggRarity, breedAnimals), FoodNFT (all external) | Trivial                             |
| M-05 (SEC-18) | Replace raw `transferFrom` with `SafeERC20.safeTransferFrom` in TierBadge | TierBadge.sol:149-160                                               | Trivial                             |
| M-06 (SEC-19) | Replace buggy Base64 with OZ Base64                                       | TierBadge.sol:273                                                   | Trivial                             |
| M-07 (SEC-20) | Drop pseudorandom `rarity_seed` from VRF hatch                            | EggNFT.sol:143-148                                                  | Low                                 |
| M-08 (SEC-21) | Remove stale `owner` field from FoodProperties                            | FoodNFT.sol:85-91, 192-199                                          | Low                                 |

## Decisions

1. **M-02 ALREADY FIXED**: Phase 50 added referral chain reset in `_update` (see EggNFT.sol commit 50-wave2). SEC-15 is satisfied.
2. **M-04 FoodNFT**: Add `Pausable` import and `whenNotPaused` modifier to all external state-mutating functions in FoodNFT. Don't add `ownable` unless required — FoodNFT already uses `Ownable`.
3. **M-07 rarity_seed**: Set `rarity_seed = 0` in VRF hatch path (don't mix `keccak256(...)` with VRF). Keep `rarity_seed` field for backward compat but don't write to it.
4. **M-08 FoodProperties.owner**: Remove field from struct; remove any `owner = msg.sender` assignments. Off-chain readers use `balanceOf` from IERC1155.
5. **Testing**: Add 1 failing + 1 passing test per issue where practical. Use `forge test --match-contract` per issue group.

## Plans Structure

Single plan (51-01) covering all 8 fixes. Most are atomic 1-line changes. TDD workflow per issue:

- RED: Add failing assertion for each issue
- GREEN: Apply fix
- VERIFY: Full test suite passes

## Dependencies

- Phase 50 must be complete ✅ (it is)
- No external dependencies beyond existing contracts
