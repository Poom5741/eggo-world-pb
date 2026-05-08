# Smart Contract Security Audit Report

**Target:** `contracts/src/`
**Scope:** `EggNFT.sol`, `CommissionDistribution.sol`, `FoodNFT.sol`, `AnimalNFT.sol`, `TierBadge.sol`
**Compiler:** Solidity 0.8.24 (via-ir, optimizer 200 runs)
**Date:** 2026-04-29
**Auditor:** Internal static + logical review (Foundry project)
**Status:** 🔴 **DO NOT DEPLOY TO MAINNET**

---

## 1. Executive Summary

| Metric              | Value                           |
| ------------------- | ------------------------------- |
| Contracts audited   | 5                               |
| Critical findings   | **6**                           |
| High findings       | **7**                           |
| Medium findings     | **8**                           |
| Low / Informational | **10**                          |
| Overall risk        | 🔴 **DO NOT DEPLOY TO MAINNET** |

The codebase contains multiple **deployment-blocking vulnerabilities**:

1. **Arithmetic bugs** — `^` (XOR) used instead of `**` (exponentiation) in pricing constants, reducing mint prices to ~0.
2. **ERC-721 design flaw** — `TierBadge` reuses token IDs (1, 2, 3), so only one user per tier can ever claim.
3. **Currency mismatch** — `CommissionDistribution` credits USDT balances but pays out ETH, causing permanent loss of referral earnings.
4. **Treasury lock** — 46% of all mint proceeds are credited to no one and cannot be withdrawn.
5. **Owner rug-pull** — `burnNFT` allows the owner to burn any user's NFT.
6. **Approval theft** — `FoodNFT.mintFood` accepts a caller-supplied `buyer` address, enabling allowance draining.

A full refactor of `CommissionDistribution`, `TierBadge` and the pricing constants is required before redeployment. Most existing tests pass only because they assert against the same buggy constants.

**Risk distribution**

```
Critical  ██████         6
High      ███████        7
Medium    ████████       8
Low/Info  ██████████    10
```

---

## 2. Detailed Vulnerability Assessment

### 🔴 CRITICAL

---

#### C-01 — Mint prices reduced to ~0 via XOR operator misuse

**Files/Lines:**

- `src/EggNFT.sol:22` — `uint256 public constant MINT_PRICE = 25 * 10^18;`
- `src/EggNFT.sol:23` — `uint256 public constant BREEDING_FEE = 5 * 10^18;`
- `src/FoodNFT.sol:26` — `uint256 public constant MINT_PRICE = 0.50 * 10^18;`

**Technical explanation:**
In Solidity, `^` is the **bitwise XOR** operator, not exponentiation. The correct operator is `**`.

- `10^18` = `10 XOR 18` = `0b01010 XOR 0b10010` = `0b11000` = **24**
- `EggNFT.MINT_PRICE` = `25 * 24` = **600 wei** (intended: 25 USDT = 25×10¹⁸)
- `EggNFT.BREEDING_FEE` = `5 * 24` = **120 wei**
- `FoodNFT.MINT_PRICE` = `0.50 * 24` = **12 wei**

Eggs and food NFTs are mintable for ~$0 while the business logic _thinks_ it is charging dollars. All downstream commission distribution, treasury accounting, and tier-reward thresholds are ~10¹⁶× too small.

**PoC:**

```solidity
assertEq(EggNFT(target).MINT_PRICE(), 600);   // not 25e18
usdtToken.approve(address(eggNFT), 600);
eggNFT.mintEgg(address(0));                   // succeeds for 600 wei USDT
```

**Fix:**

```solidity
uint256 public constant MINT_PRICE   = 25 * 10**18;   // EggNFT
uint256 public constant BREEDING_FEE = 5  * 10**18;
uint256 public constant MINT_PRICE   = 5 * 10**17;    // FoodNFT (0.5 * 1e18)
```

Add a regression test asserting `MINT_PRICE == 25e18`.

---

#### C-02 — `TierBadge.mintTierBadge` reuses tokenIds → only one user per tier can ever claim

**File/Line:** `src/TierBadge.sol:145`

```solidity
_safeMint(user, tokenId);   // tokenId ∈ {1,2,3} — SHARED across all users
```

ERC-721 requires globally unique `tokenId`s. The second user to claim any tier reverts (`ERC721InvalidSender`). The rewards system breaks permanently after the first claim of each tier.

**PoC:**

```solidity
tierBadge.mintTierBadge(alice, 1, 10);   // ✅ token #1 → alice
tierBadge.mintTierBadge(bob,   1, 10);   // ❌ reverts — token 1 exists
```

**Fix:**

```solidity
mapping(uint256 => uint256) public tokenTier; // tokenId => tier

uint256 id = _nextTokenId++;
_safeMint(user, id);
tokenTier[id] = tierId;
```

Update `tokenURI` / `getTierDetails` to read `tokenTier[tokenId]`.

---

#### C-03 — `CommissionDistribution` pays **ETH** for **USDT** balances (currency mismatch)

**Files/Lines:** `src/CommissionDistribution.sol:91, 119`

```solidity
(bool success, ) = payable(msg.sender).call{value: balance}("");         // L91
(bool success, ) = payable(coinStorReserve).call{value: balance}("");    // L119
```

`commissionBalances` is credited from USDT mint proceeds, but `claimCommission()` / `withdrawCoinStor()` pay **native ETH/BNB**.

1. **Funds lost:** Callers zero out their USDT balance (L89) and receive 0 ETH (contract has no ETH).
2. **ETH drain:** If native currency ever enters the contract, the first caller drains it regardless of their entitlement.

**Fix:** Delete `claimCommission()` and `withdrawCoinStor()`. Keep only the USDT variant:

```solidity
function claimCommission() external nonReentrant {
    uint256 balance = commissionBalances[msg.sender];
    require(balance > 0, "No commission");
    commissionBalances[msg.sender] = 0;
    usdtToken.safeTransfer(msg.sender, balance);
    emit CommissionClaimed(msg.sender, balance);
}
```

Add `receive() external payable { revert(); }` to prevent accidental ETH deposits.

---

#### C-04 — 46% of all mint proceeds are permanently locked

**File/Line:** `src/CommissionDistribution.sol:21, 55–82`

`TREASURY_PERCENT = 46` is declared but never credited or withdrawable. USDT is transferred in full to the contract, only 54% is distributed, and there is **no owner rescue path**. Every mint leaks 46% into an unreachable pool.

**Fix:**

```solidity
address public immutable treasury;
...
uint256 treasuryAmount = (amount * TREASURY_PERCENT) / TOTAL_PERCENT;
commissionBalances[treasury] += treasuryAmount;
```

Add constructor assertion: `require(G1+G2+G3+G4+COINSTOR+TREASURY == 100)`.

---

#### C-05 — Owner can burn arbitrary user NFTs (`burnNFT`)

**File/Line:** `src/EggNFT.sol:497–519`

```solidity
function burnNFT(uint256 tokenId, NFTType nftType) external onlyOwner {
    ...
    _burn(tokenId);                                      // burns ANY user's egg
    AnimalNFT(animalNFTContract).burnAnimal(tokenId);    // burns ANY user's animal
}
```

Pure rug-pull vector. Owner can destroy any holder's valuable NFT.

**Fix:** Remove, or require `ownerOf(tokenId) == msg.sender`, or gate behind multi-sig + timelock governance.

---

#### C-06 — `FoodNFT.mintFood` accepts caller-supplied `buyer` → approval-based theft

**File/Line:** `src/FoodNFT.sol:62–103`

```solidity
function mintFood(address buyer, uint256 quantity, address referrer) external {
    usdtToken.safeTransferFrom(buyer, commissionDistribution, totalCost);
```

Anyone can pass an arbitrary `buyer`. If a user approves the FoodNFT contract (a normal UX flow), an attacker drains the victim's allowance AND pockets 20% referral commission by setting `referrer = attacker` (compounded by H-01).

**PoC:**

```solidity
victim.approve(foodNFT, 1_000e18);
foodNFT.mintFood(victim, 2000, attacker);
```

**Fix:**

```solidity
function mintFood(uint256 quantity, address referrer) external nonReentrant {
    require(referrer != msg.sender, "Self-referral");
    usdtToken.safeTransferFrom(msg.sender, commissionDistribution, totalCost);
    _mint(msg.sender, foodId, 1, "");
}
```

---

### 🟠 HIGH

---

#### H-01 — Self-referral allowed in all mint/breed flows

**Files/Lines:** `src/EggNFT.sol:119–128, 394–414`; `src/FoodNFT.sol:62–75`

No check rejects `referrer == buyer`. Attackers claim 20% back on every mint.

**Fix:**

```solidity
require(referrer != msg.sender, "Self-referral");
for (uint i; i < 4; ++i) require(referralChain[i] != msg.sender, "Self-referral");
```

Consider requiring the referrer to own ≥1 Egg NFT.

---

#### H-02 — Weak on-chain randomness (MEV/validator grindable)

**Files/Lines:**

- `src/EggNFT.sol:143–148` (`_mintEggWithChain`)
- `src/EggNFT.sol:423–430` (`breedAnimals` — authoritative rarity, no VRF)
- `src/FoodNFT.sol:179–190` (`_assignRandomFoodType`)

`keccak256(block.timestamp, block.prevrandao, ...)` is grindable by validators. Breeding rarity bypasses VRF entirely.

**Fix:** Extend the `hatchEgg`/`claimHatch` two-phase VRF pattern to breeding and food type assignment.

---

#### H-03 — `setMintPrice` is a no-op

**File/Line:** `src/EggNFT.sol:565–567`

```solidity
function setMintPrice(uint256 newPrice) external onlyOwner {
    emit MintPriceUpdated(newPrice);   // does nothing
}
```

`MINT_PRICE` is `constant`. The event gives a false impression of admin control; off-chain indexers will mis-price.

**Fix:** Convert to mutable `uint256 public mintPrice` with bounds, or remove the setter.

---

#### H-04 — `hatchBreedingEgg` skips the food-count requirement

**File/Line:** `src/EggNFT.sol:316–323`

Normal `hatchEgg` requires 10 feedings; breeding variant lacks the check. Breeding eggs can be hatched with 2 initial food items, skipping the economy loop.

**Fix:**

```solidity
require(props.food_count >= MAX_FOOD_COUNT, "Not enough food consumed");
```

---

#### H-05 — `hatchEgg` allows duplicate VRF requests and overwrites mapping

**File/Line:** `src/EggNFT.sol:206–245`

No guard against calling twice. `tokenToRequestId[tokenId]` is replaced; the first VRF request's LINK cost is wasted and its randomness is orphaned.

**Fix:**

```solidity
require(tokenToRequestId[tokenId] == 0, "Hatch already requested");
```

---

#### H-06 — Egg transferable while VRF is pending → second-owner claims hatched animal

**File/Line:** `src/EggNFT.sol:551–563`

If an unhatched egg with `hatchRandomness[requestId]` set is transferred, the new owner can call `claimHatch(tokenId)` and take the Animal the old owner paid LINK to roll.

**Fix:** In `_update`, if `tokenToRequestId[tokenId] != 0 && !is_hatched`, either revert or clear the pending VRF state.

---

#### H-07 — `distributeCommission` authorizes `owner` to credit arbitrary balances

**File/Line:** `src/CommissionDistribution.sol:55–82`

`owner` is allowed to call `distributeCommission` with arbitrary parameters, crediting themselves unlimited balance without depositing USDT.

**Fix:** Remove `owner` from the authorized caller list — only NFT contracts should be allowed.

---

### 🟡 MEDIUM

---

#### M-01 — `ownerOf(tokenId) != address(0)` checks unreachable in OZ v5

**Files/Lines:** `src/EggNFT.sol:185, 478, 498, 529, 534, 539, 684`; `src/AnimalNFT.sol:131, 156, 161, 166, 179`

OZ v5 `ownerOf` reverts on non-existent tokens. The `require` line is unreachable.

**Fix:** Use `_ownerOf(tokenId) != address(0)` or drop the check.

---

#### M-02 — Referral chain not reset on egg transfer

**File/Line:** `src/EggNFT.sol:551–563`

Transferring an egg leaves the original buyer's referral chain. Second-hand buyers game the tree.

**Fix:** Either freeze behavior explicitly (document) or reset `_eggProperties[tokenId].referral_chain` inside `_update`.

---

#### M-03 — `recordFoodConsumption` missing food-cap check

**File/Line:** `src/EggNFT.sol:457–471`

Cap (`MAX_FOOD_COUNT + MAX_UPGRADE_FOOD`) is enforced only in `upgradeEggRarity`. A malicious/compromised food contract can exceed it.

**Fix:**

```solidity
require(props.food_count + food_ids.length <= MAX_FOOD_COUNT + MAX_UPGRADE_FOOD, "Food cap");
```

---

#### M-04 — Several state-mutating functions are not `whenNotPaused`

**Files/Lines:** `src/EggNFT.sol:366 (upgradeEggRarity), :394 (breedAnimals)`; entirety of `FoodNFT`

**Fix:** Add `whenNotPaused` to every externally-callable state-mutating function; make `FoodNFT` inherit `Pausable`.

---

#### M-05 — `TierBadge.mintTierBadge` uses raw `transferFrom`, silent failure

**File/Line:** `src/TierBadge.sol:149–160`

Badge is minted even when USDT transfer returns `false` (silent reward loss). Not portable to non-bool USDT implementations.

**Fix:** Use `SafeERC20.safeTransferFrom` and revert on failure.

---

#### M-06 — Buggy Base64 encoder in TierBadge

**File/Line:** `src/TierBadge.sol:273`

```solidity
bytes memory result = new bytes(encodedLen + 32);   // over-allocates
```

Trailing 32 garbage bytes are included in the returned string — some wallets reject the URI.

**Fix:** Use OZ `contracts/utils/Base64.sol`.

---

#### M-07 — Pseudorandom `rarity_seed` mixed into VRF adds no security

**File/Line:** `src/EggNFT.sol:143–148`

Since VRF already supplies randomness at hatch, the pre-committed seed complicates the model. Drop it.

**Fix:** Let VRF alone determine hatching entropy.

---

#### M-08 — `FoodNFT.FoodProperties.owner` stale after ERC-1155 transfer

**Files/Lines:** `src/FoodNFT.sol:85–91, 192–199`

No `_update` override updates `owner`; off-chain readers see stale data.

**Fix:** Remove the `owner` field (redundant with `balanceOf`) or override `_update` to sync.

---

### 🔵 LOW / INFORMATIONAL

| ID   | File:Line                       | Issue                                                                     | Fix                                                |
| ---- | ------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| L-01 | `CommissionDistribution.sol:10` | `owner` is `immutable` — inconsistent with `Ownable` elsewhere            | Use OZ `Ownable2Step`                              |
| L-02 | `EggNFT.sol:700–705`            | `setVRFConfig` accepts `bytes32(0)` keyHash                               | `require(keyHash != bytes32(0))`                   |
| L-03 | `EggNFT.sol:694–698`            | `setFoodNFTContract` doesn't deauthorize previous address                 | Deauthorize old before setting new                 |
| L-04 | `EggNFT.sol:263`                | `require(randomWord != 0)` rejects valid zero result (1-in-2²⁵⁶)          | Track fulfillment with a boolean mapping           |
| L-05 | `FoodNFT.sol:179–190`           | `block.prevrandao` for food type — grindable                              | VRF or commit-reveal                               |
| L-06 | `AnimalNFT.sol:184–187`         | `recordBreeding` no existence check                                       | `require(_ownerOf(tokenId) != address(0))`         |
| L-07 | `TierBadge.sol:36`              | `_nextTokenId` declared but unused (dead state)                           | Remove, or wire up (see C-02)                      |
| L-08 | `EggNFT.sol:316–364`            | `hatchBreedingEgg` doesn't distribute commission — referral chain dropped | Document or route commission                       |
| L-09 | `CommissionDistribution.sol`    | No per-referrer event, only aggregated — harder off-chain indexing        | Emit `CommissionCredited(referrer, level, amount)` |
| L-10 | All contracts                   | NatSpec coverage partial (`EggNFT`, `AnimalNFT`, `FoodNFT`)               | Add `@notice` / `@param` like TierBadge does       |

---

## 3. Gas Analysis

| #    | Location                                       | Pattern                                                   | Optimization                                 | Est. Gas Saved         |
| ---- | ---------------------------------------------- | --------------------------------------------------------- | -------------------------------------------- | ---------------------- |
| G-01 | `EggNFT.sol:135–139, 416–419`                  | `_nextTokenId++; uint256 tokenId = _nextTokenId - 1;`     | `uint256 tokenId = _nextTokenId++;`          | ~30 per mint           |
| G-02 | `EggNFT.sol:274–288, 327–341`                  | Duplicated food-distribution loops                        | Extract `_countFood(FoodType[])` helper      | ~200 + bytecode↓       |
| G-03 | `EggNFT.sol:282–288`                           | `if/else if` on `FoodType` for 4 buckets                  | `foodDistribution[uint8(ft)]++;`             | ~500 per hatch         |
| G-04 | `FoodNFT.sol:121–134`                          | Per-iter `_burn` / `balanceOf`                            | Use `_burnBatch(msg.sender, ids, amounts)`   | ~5–15k on 10+ items    |
| G-05 | `TierBadge.sol:268–300`                        | Home-grown Base64                                         | Use OZ `Base64.encode`                       | Bytecode↓ + gas↓       |
| G-06 | `EggNFT.sol:50` struct layout                  | Bools between `uint256`s waste slots                      | Reorder fields (pack bools + addresses)      | ~20k per mint          |
| G-07 | `CommissionDistribution.sol:61–76`             | Unrolled loop with `if/else if`                           | `uint8[4] memory levels = [20,10,10,10];`    | ~300 per call          |
| G-08 | `EggNFT.sol:171–202` / `AnimalNFT.sol:115–153` | `memory` struct copy in view functions                    | Use `storage` refs, return individual fields | ~1k per view call      |
| G-09 | All contracts                                  | `require` with string messages                            | Custom errors (Solidity ≥0.8.4)              | ~50 per revert + size↓ |
| G-10 | `EggNFT.sol:457–471`                           | `props.food_count++` inside loop (storage write per iter) | Cache `count = props.food_count`, write once | ~5k per feed           |

---

## 4. Final Security Checklist

| Checkpoint                                             | Status | Notes                                                              |
| ------------------------------------------------------ | :----: | ------------------------------------------------------------------ | ------- |
| Solidity `^0.8.x` (built-in overflow checks)           |   ✅   | 0.8.24                                                             |
| OpenZeppelin `ERC721` / `ERC1155` / `Ownable`          |   ✅   | v5                                                                 |
| `ReentrancyGuard` on all external state-mutating funcs |   ⚠️   | Missing on `CommissionDistribution.claim*`                         |
| Pull-over-push for payouts                             |   ⚠️   | Implemented but wrong currency (C-03)                              |
| Checks-Effects-Interactions                            |   ✅   | Balance zeroed before transfer                                     |
| Mint price logic correct                               |   🔴   | **C-01 — `^` instead of `**`\*\*                                   |
| No arbitrary external calls                            |   ✅   | Only known NFT/commission contracts                                |
| Access control on admin functions                      |   ⚠️   | `onlyOwner` present but too powerful (C-05, H-07)                  |
| Self-referral / sybil mitigation                       |   🔴   | H-01                                                               |
| Secure randomness (VRF)                                |   ⚠️   | Only `hatchEgg` uses VRF; breeding + food use block entropy (H-02) |
| ERC-721 tokenId uniqueness                             |   🔴   | **C-02 — TierBadge reuses IDs**                                    |
| ERC-721/1155 receiver hook safety                      |   ✅   | `_safeMint` used                                                   |
| Pausable coverage                                      |   ⚠️   | Partial (M-04)                                                     |
| Events for every state change                          |   ⚠️   | Treasury credit missing (C-04), per-referrer missing (L-09)        |
| Immutable ↔ mutable correctness                        |   ⚠️   | `owner` immutable in `CommissionDistribution` prevents rotation    |
| Integer overflow / underflow                           |   ✅   | 0.8.x native checks                                                |
| Storage slot packing                                   |   ⚠️   | Struct packing suboptimal (G-06)                                   |
| Tests assert canonical numeric semantics               |   🔴   | Tests pass despite buggy constants — add canonical asserts         |
| Slither / static analyzer clean                        |   ❌   | Not verified — run `slither . --filter-paths 'lib/                 | test/'` |
| Multisig + timelock for admin                          |   ❌   | Owner is EOA per deploy script                                     |

Legend: ✅ pass · ⚠️ partial / needs attention · 🔴 fails · ❌ not implemented

---

## 5. Recommended Remediation Sequence

1. **Block deployment.** Do not ship any of these contracts to mainnet in current state.
2. Fix `**` vs `^` in all `MINT_PRICE` / `BREEDING_FEE` constants (C-01) + regression tests.
3. Rewrite `TierBadge.mintTierBadge` to use monotonically increasing IDs (C-02).
4. Refactor `CommissionDistribution` to be USDT-only, add treasury routing, remove owner from the authorized caller list (C-03, C-04, H-07).
5. Remove or restrict `EggNFT.burnNFT` (C-05).
6. Replace `mintFood(address buyer, ...)` with `mintFood(...)` using `msg.sender` (C-06).
7. Add self-referral guards everywhere (H-01).
8. Extend VRF pattern to `breedAnimals` and `FoodNFT._assignRandomFoodType` (H-02).
9. Add `whenNotPaused` to all state-mutating flows (M-04).
10. Transfer ownership to a Gnosis Safe multisig + 48 h timelock before any mainnet deploy.
11. Run `slither`, `mythril`, and Foundry invariant fuzzing on the patched contracts; add an invariant: `sum(commissionBalances) == USDT.balanceOf(CommissionDistribution)`.

Until items 2–7 are addressed, this codebase **must not handle real user funds**.
