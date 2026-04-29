# Phase 50: High-Severity Security Fixes - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Address 7 high-severity security vulnerabilities (H-01 through H-07) that enable abuse or broken functionality: self-referral exploitation, weak randomness, no-op functions, missing validation, duplicate requests, transfer exploits, and unauthorized access.

</domain>

<decisions>
## Implementation Decisions

### Self-Referral Prevention (SEC-07)

- **D-50-01:** Address-only check: `require(referrer != msg.sender, "Self-referral")`
- **D-50-02:** Apply to all mint/breed flows: `mintEgg`, `mintFood`, `breedAnimals`
- **D-50-03:** No Egg ownership requirement for referrers (MVP approach)
- **D-50-04:** Also check referral chain: `for (uint i; i < 4; ++i) require(referralChain[i] != msg.sender, "Self-referral")`

### Randomness Improvement — VRF Extension (SEC-08)

- **D-50-05:** Extend existing hatchEgg two-phase VRF pattern (request → callback → claim)
- **D-50-06:** Apply to both breeding rarity determination and food type assignment
- **D-50-07:** Reuse working VRF infrastructure — no Chainlink VRF v2.5 integration (saves gas, consistent security model)
- **D-50-08:** Breeding: `requestBreedingRandomness(parent1, parent2)` → VRF callback → `claimBreedingResult(requestId)`
- **D-50-09:** Food: `requestFoodRandomness(quantity, referrer)` → VRF callback → `claimFoodResult(requestId)`

### Mint Price Mutability (SEC-09)

- **D-50-10:** Convert `MINT_PRICE` from `constant` to mutable `uint256 public mintPrice`
- **D-50-11:** Add bounds validation: `require(newPrice >= 1e18 && newPrice <= 1000e18, "Price bounds: 1-1000 USDT")`
- **D-50-12:** Initial value: `25e18` (25 USDT, matches current constant)
- **D-50-13:** `setMintPrice` implementation:
  ```solidity
  function setMintPrice(uint256 newPrice) external onlyOwner {
      require(newPrice >= 1e18 && newPrice <= 1000e18, "Price bounds: 1-1000 USDT");
      mintPrice = newPrice;
      emit MintPriceUpdated(newPrice);
  }
  ```

### Validation & Access Control (SEC-10, SEC-11, SEC-12, SEC-13)

- **D-50-14:** SEC-10: Add food count check to `hatchBreedingEgg`:
  ```solidity
  require(props.food_count >= MAX_FOOD_COUNT, "Not enough food consumed");
  ```
- **D-50-15:** SEC-11: Prevent duplicate VRF requests in `hatchEgg`:
  ```solidity
  require(tokenToRequestId[tokenId] == 0, "Hatch already requested");
  ```
- **D-50-16:** SEC-12: Handle NFT transfer during VRF pending — in `_update`:
  ```solidity
  if (tokenToRequestId[tokenId] != 0 && !is_hatched) {
      revert("Cannot transfer during VRF pending");
  }
  ```
- **D-50-17:** SEC-13: Remove owner from authorized callers in `distributeCommission`:
  ```solidity
  function distributeCommission(...) external {
      require(
          msg.sender == address(eggNFT) ||
          msg.sender == address(animalNFT) ||
          msg.sender == address(foodNFT),
          "Unauthorized caller"
      );
      // ... distribution logic
  }
  ```

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Security Audit

- `docs/SMART_CONTRACT_AUDIT_2026-04-29.md` §H-01 through H-07 — High-severity vulnerability descriptions and fix recommendations
- `docs/SMART_CONTRACT_AUDIT_2026-04-29.md` §C-01 through C-06 — Critical vulnerabilities (Phase 49, for context)

### Smart Contracts (Phase 49 baseline)

- `contracts/src/EggNFT.sol` — Mint, hatch, breed flows (XOR fixed, burnNFT removed)
- `contracts/src/FoodNFT.sol` — Food minting (XOR fixed, mintFood uses msg.sender)
- `contracts/src/CommissionDistribution.sol` — Commission routing (USDT payouts, treasury added)
- `contracts/src/TierBadge.sol` — Tier badges (monotonic token IDs)
- `contracts/src/AnimalNFT.sol` — Animal NFTs

### Phase 49 Context & Plans

- `.planning/phases/49-critical-security-fixes/49-CONTEXT.md` — Prior phase decisions (TDD, wave execution)
- `.planning/phases/49-critical-security-fixes/49-01-SUMMARY.md` — XOR operator fix pattern
- `.planning/phases/49-critical-security-fixes/49-04-SUMMARY.md` — burnNFT removal, mintFood fix

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **VRF request/claim pattern** (EggNFT.sol lines 206-290): Already implemented for egg hatching, can be extended to breeding and food
- **TDD test infrastructure** (Phase 49): 29 security tests passing, RED/GREEN/REFACTOR workflow established
- **Wave-based execution** (Phase 49): Parallel execution pattern validated for different contracts

### Established Patterns

- **TDD workflow:** All plans must write failing tests first (RED), implement fix (GREEN), refactor with confidence
- **Atomic commits:** Each fix committed separately with descriptive message
- **Breaking changes:** Constructor signature changes handled (Phase 49 updated 18+ files)
- **Auto-fix patterns:** Test files auto-updated for API changes (103 mintFood calls fixed in Phase 49)

### Integration Points

- **EggNFT ↔ CommissionDistribution:** Mint flows call distributeCommission (SEC-13 access control)
- **EggNFT ↔ AnimalNFT:** Breeding calls AnimalNFT for parent validation and offspring creation
- **FoodNFT ↔ CommissionDistribution:** Food mints trigger referral commission distribution
- **VRF Coordinator:** EggNFT already integrated — extend to breeding/food flows

</code_context>

<specifics>
## Specific Ideas

- VRF extension should follow exact pattern from `hatchEgg` (lines 206-245) and `claimHatch` (lines 253-290)
- Mint price bounds (1-1000 USDT) provide wide range for market adjustments while preventing extreme values
- Transfer restriction during VRF pending (SEC-12) protects LINK cost investment — prevents exploitation of paid randomness

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 50-high-severity-security-fixes_
_Context gathered: 2026-04-29_
