# Phase 49: Critical Security Fixes - Research

**Researched:** 2026-04-29
**Domain:** Solidity smart contract security, OpenZeppelin v5, Foundry testing
**Confidence:** HIGH

## Summary

Phase 49 addresses 6 critical vulnerabilities (C-01 through C-06) identified in the 2026-04-29 smart contract audit. These vulnerabilities are deployment-blocking and could result in immediate fund loss if exploited. The fixes are well-scoped, deterministic, and do not require architectural changes — they are targeted corrections to operator misuse, token ID generation, currency handling, access control, and parameter validation.

All 14 implementation decisions (D-01 through D-14) have been made by the user and are locked in CONTEXT.md. Research focuses on verifying the technical approach, identifying standard patterns, and documenting pitfalls.

**Primary recommendation:** Apply the 6 fixes in isolated commits with regression tests. Each fix is independent and can be tested in isolation. Run full test suite after all fixes to catch integration issues.

## User Constraints (from CONTEXT.md)

### Locked Decisions

### SEC-01: XOR Operator Misuse

- **D-01:** Keep current mint prices (25 USDT for eggs, 0.50 USDT for food) - only fix the operator
- **D-02:** Replace `^` with `**` in EggNFT.sol (lines 22-23) and FoodNFT.sol (line 26)
- **D-03:** Add code comment explaining the fix: `// Fixed: was 10^18 (XOR), now 10**18 (exponentiation)`

### SEC-02: TierBadge Token ID Reuse

- **D-04:** Use monotonically increasing counter instead of reusing IDs 1,2,3
- **D-05:** Add `uint256 private _nextTokenId = 1;` counter to TierBadge.sol
- **D-06:** Replace hardcoded IDs with `_nextTokenId++` in mint functions

### SEC-03/04: Currency Mismatch & Treasury Lock

- **D-07:** Use owner-only withdrawals for treasury (MVP approach)
- **D-08:** Change CommissionDistribution to pay USDT instead of ETH
- **D-09:** Add treasury address parameter to constructor
- **D-10:** Route 46% of mint proceeds to treasury address
- **D-11:** Add `withdrawTreasury()` function callable by owner only

### SEC-05/06: Owner Permissions

- **D-12:** Remove burnNFT function entirely (no burn functionality)
- **D-13:** Fix mintFood to use `msg.sender` instead of caller-supplied buyer parameter
- **D-14:** Remove buyer parameter from mintFood function signature

### Claude's Discretion

None - all decisions made by user

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

## Architectural Responsibility Map

| Capability           | Primary Tier         | Secondary Tier | Rationale                                                  |
| -------------------- | -------------------- | -------------- | ---------------------------------------------------------- |
| Mint price constants | Smart Contract (EVM) | —              | On-chain arithmetic, compile-time constants                |
| Token ID generation  | Smart Contract (EVM) | —              | ERC-721 requires globally unique IDs, enforced by contract |
| Commission currency  | Smart Contract (EVM) | —              | USDT ERC-20 transfers on-chain                             |
| Treasury routing     | Smart Contract (EVM) | —              | 46% allocation logic in distributeCommission               |
| Treasury withdrawal  | Smart Contract (EVM) | —              | Owner-only access control on-chain                         |
| burnNFT removal      | Smart Contract (EVM) | —              | Function deletion, no downstream dependency                |
| mintFood buyer param | Smart Contract (EVM) | —              | msg.sender enforcement prevents approval theft             |

## Standard Stack

### Core

| Library                | Version      | Purpose                                                | Why Standard                                                          |
| ---------------------- | ------------ | ------------------------------------------------------ | --------------------------------------------------------------------- |
| Solidity               | 0.8.24       | Smart contract language                                | Project standard, via-IR enabled `[VERIFIED: foundry.toml]`           |
| OpenZeppelin Contracts | 5.6.1        | ERC-721, ERC-1155, SafeERC20, Ownable, ReentrancyGuard | Industry standard, audited, already in use `[VERIFIED: package.json]` |
| Chainlink VRF          | v2.5 (dev)   | Verifiable random function for hatching                | Already integrated, used in hatchEgg flow `[VERIFIED: imports]`       |
| Foundry                | 1.5.1-stable | Test framework, build tool                             | Project standard `[VERIFIED: forge --version]`                        |

### Supporting

| Library   | Version | Purpose                    | When to Use                                                  |
| --------- | ------- | -------------------------- | ------------------------------------------------------------ |
| forge-std | 1.9.x   | Test utilities, StdCheats  | All Foundry tests `[VERIFIED: lib/forge-std]`                |
| MockUSDT  | Local   | Test double for USDT token | CommissionDistribution tests `[VERIFIED: test/MockUSDT.sol]` |

### Alternatives Considered

| Instead of             | Could Use         | Tradeoff                                                                                                                 |
| ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| OpenZeppelin SafeERC20 | Raw call/transfer | Unsafe with non-compliant tokens (USDT), SafeERC20 handles return value inconsistencies `[CITED: docs.openzeppelin.com]` |
| Monotonic counter      | ERC721Enumerable  | Enumerable adds gas overhead; counter is sufficient for this use case `[CITED: docs.openzeppelin.com/erc721]`            |

**Installation:**

```bash
# Already installed — no new dependencies required
cd contracts
forge install  # verifies lib/ dependencies
```

**Version verification:**

```bash
# Solidity compiler
solc --version  # 0.8.24 (via foundry.toml)

# OpenZeppelin
cat lib/openzeppelin-contracts/package.json | grep version  # 5.6.1

# Foundry
forge --version  # 1.5.1-stable
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────┐
│   User      │
│  (EOA)      │
└──────┬──────┘
       │ USDT + call
       ▼
┌─────────────────────┐     ┌─────────────────────────┐
│    EggNFT.sol       │────▶│ CommissionDistribution  │
│  - mintEgg()        │     │  - distributeCommission │
│  - MINT_PRICE **    │     │  - commissionBalances   │
│  - burnNFT REMOVED  │     │  - claimCommissionUSDT  │
└─────────────────────┘     └───────────┬─────────────┘
       │                                │
       │                                ▼
       │                        ┌──────────────────┐
       │                        │  Treasury (46%)  │
       │                        │  withdrawTreasury│
       │                        └──────────────────┘
       │
       ▼
┌─────────────────────┐     ┌─────────────────────────┐
│    FoodNFT.sol      │     │    TierBadge.sol        │
│  - mintFood(sender) │     │  - _nextTokenId counter │
│  - MINT_PRICE **    │     │  - mintTierBadge()      │
└─────────────────────┘     └─────────────────────────┘
```

### Recommended Project Structure

```
contracts/
├── src/
│   ├── EggNFT.sol              # Fix lines 22-23 (MINT_PRICE, BREEDING_FEE)
│   ├── FoodNFT.sol             # Fix line 26 (MINT_PRICE), line 62 (mintFood)
│   ├── TierBadge.sol           # Fix token ID generation (lines 114-175)
│   ├── CommissionDistribution.sol # Fix currency mismatch, add treasury
│   └── AnimalNFT.sol           # No changes (referenced but not modified)
├── test/
│   ├── EggNFT.t.sol            # Add regression test for MINT_PRICE
│   ├── FoodNFT.t.sol           # Add regression test for MINT_PRICE
│   ├── TierBadge.t.sol         # Add test for unique token IDs
│   └── CommissionDistributionUSDT.t.sol # Add treasury tests
└── foundry.toml                # No changes (Solidity 0.8.24, via-IR)
```

### Pattern 1: Exponentiation in Solidity Constants

**What:** Use `**` for exponentiation, not `^` (which is bitwise XOR)
**When to use:** Any time computing powers of 10 for token decimals
**Example:**

```solidity
// Source: Solidity docs - integer operators
// WRONG: ^ is bitwise XOR, not exponentiation
uint256 public constant MINT_PRICE = 25 * 10^18;  // = 25 * 24 = 600 wei

// CORRECT: ** is exponentiation
uint256 public constant MINT_PRICE = 25 * 10**18;  // = 25 * 10^18 = 25e18 wei
```

### Pattern 2: Monotonically Increasing Token IDs

**What:** Use a counter variable to generate unique ERC-721 token IDs
**When to use:** Any ERC-721 contract where each mint should produce a unique ID
**Example:**

```solidity
// Source: OpenZeppelin docs - ERC721 pattern
contract TierBadge is ERC721 {
    uint256 private _nextTokenId = 1;
    mapping(uint256 => uint256) public tokenTier; // tokenId => tier

    function mintTierBadge(address user, uint256 tierId, uint256 lifetimeFoodItems)
        external onlyOwner returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(user, tokenId);
        tokenTier[tokenId] = tierId;
        return tokenId;
    }
}
```

### Pattern 3: USDT-Only Commission Distribution

**What:** Use SafeERC20.safeTransfer for all commission payouts, never native currency
**When to use:** Any contract handling ERC-20 tokens where commissions are credited in token but must be paid in token
**Example:**

```solidity
// Source: OpenZeppelin SafeERC20 best practices
function claimCommission() external nonReentrant {
    uint256 balance = commissionBalances[msg.sender];
    require(balance > 0, "No commission");

    commissionBalances[msg.sender] = 0;  // Checks-Effects-Interactions

    usdtToken.safeTransfer(msg.sender, balance);  // Not call{value: ...}

    emit CommissionClaimedUSDT(msg.sender, balance);
}
```

### Anti-Patterns to Avoid

- **`^` for exponentiation:** Common typo from Python/JS developers. In Solidity, `^` is XOR. Always use `**`. `[VERIFIED: docs.soliditylang.org]`
- **Hardcoded token IDs for multi-user NFTs:** ERC-721 requires globally unique IDs. Reusing IDs (1,2,3) means only 3 users can ever claim. `[VERIFIED: ERC-721 spec, OpenZeppelin docs]`
- **Native currency payouts for ERC-20 balances:** If you credit USDT balances, you must pay USDT. Paying ETH/BNB drains the wrong balance and loses user funds. `[ASSUMED: standard DeFi pattern]`
- **Caller-supplied `buyer` in transferFrom:** Allows allowance draining. Always use `msg.sender` unless there's a explicit meta-transaction pattern with signed approval. `[VERIFIED: audit C-06]`

## Don't Hand-Roll

| Problem             | Don't Build                         | Use Instead                | Why                                                                                    |
| ------------------- | ----------------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| Token ID generation | Custom hash-based IDs               | `_nextTokenId++` counter   | Simpler, gas-efficient, guaranteed unique, standard pattern                            |
| ERC-20 transfers    | `token.transfer()`                  | `SafeERC20.safeTransfer()` | USDT and 1000+ tokens have non-standard return values; safeTransfer reverts on failure |
| Base64 encoding     | Custom encoder (TierBadge L268-300) | OpenZeppelin `Base64.sol`  | Current implementation over-allocates by 32 bytes, produces invalid URIs               |
| Access control      | Custom `onlyOwner` checks           | OpenZeppelin `Ownable`     | Already imported, adds no overhead, audited                                            |

**Key insight:** The TierBadge Base64 encoder (M-06) is a medium-severity issue but uses the same pattern as C-02. Since we're already modifying TierBadge for token IDs, replace the encoder with OZ's implementation in the same PR.

## Common Pitfalls

### Pitfall 1: Tests Pass Against Buggy Constants

**What goes wrong:** Existing tests assert `MINT_PRICE == 600` (the XOR result). After fixing to `25e18`, tests that hardcode the old value will fail.
**Why it happens:** Tests were written to match the buggy implementation, not the business requirement.
**How to avoid:** Update test assertions to expect `25e18` and `5e17`. Add explicit regression test: `assertEq(EggNFT(target).MINT_PRICE(), 25e18);`
**Warning signs:** Tests pass but economic model is broken.

### Pitfall 2: TierBadge Token URI Breaks After ID Change

**What goes wrong:** `tokenURI()` reads `tiers[tokenId]` where `tiers` is keyed by tier ID (1,2,3). After switching to monotonic IDs, `tiers[4]`, `tiers[5]`, etc. return empty strings.
**Why it happens:** The mapping `tiers` stores tier configuration by tier number, but `tokenURI` receives a token ID which is no longer the same as tier ID.
**How to avoid:** Add `mapping(uint256 => uint256) public tokenTier;` to map tokenId → tierId. Update `tokenURI` to read `tiers[tokenTier[tokenId]]`.
**Warning signs:** `tokenURI` returns empty or malformed JSON after fix.

### Pitfall 3: Treasury Address Not Set Before First Mint

**What going wrong:** If `treasury` is set in constructor but constructor doesn't receive it, treasury is `address(0)`. 46% of mint proceeds go to address(0) and are lost forever.
**Why it happens:** Constructor parameter order changed or deployment script not updated.
**How to avoid:** Add constructor assertion `require(_treasury != address(0), "Invalid treasury")`. Update deployment scripts to pass treasury address.
**Warning signs:** Treasury balance is 0 after mints.

### Pitfall 4: CommissionDistribution Authorized Callers Break

**What goes wrong:** After removing `owner` from authorized callers (H-07, not in scope but related), existing owner calls to `distributeCommission` revert.
**Why it happens:** Owner was allowed to call for testing/admin purposes. Removing this breaks admin workflows.
**How to avoid:** This phase only fixes C-03/C-04. H-07 is Phase 50 scope. Leave owner authorization in place for now.
**Warning signs:** Admin scripts fail with "Not authorized" after Phase 49.

### Pitfall 5: FoodNFT mintFood Signature Change Breaks Frontend

**What going wrong:** Removing `buyer` parameter changes function signature from `mintFood(address,uint256,address)` to `mintFood(uint256,address)`. Frontend or scripts calling the old signature will fail.
**Why it happens:** ABI change is breaking for any integrated client.
**How to avoid:** Update frontend code in same PR or document breaking change. Check Phase 52 (E2E tests) for integration tests that need updating.
**Warning signs:** Frontend mint button fails after contract deployment.

## Code Examples

### Fix C-01: XOR to Exponentiation

```solidity
// EggNFT.sol lines 22-23
uint256 public constant MINT_PRICE = 25 * 10**18;        // Fixed: was 10^18 (XOR), now 10**18 (exponentiation)
uint256 public constant BREEDING_FEE = 5 * 10**18;       // Fixed: was 10^18 (XOR), now 10**18 (exponentiation)

// FoodNFT.sol line 26
uint256 public constant MINT_PRICE = 5 * 10**17;         // Fixed: was 0.50 * 10^18 (XOR), now 5 * 10**17 (0.5e18)
```

**Note on FoodNFT:** `0.50 * 10**18` is valid Solidity (literals support decimals), but `5 * 10**17` is more explicit and avoids any compiler literal handling ambiguity. Both equal `5e17`.

### Fix C-02: Monotonic Token IDs in TierBadge

```solidity
// TierBadge.sol — Add state
uint256 private _nextTokenId = 1;
mapping(uint256 => uint256) public tokenTier; // tokenId => tierId

// TierBadge.sol — mintTierBadge (lines 114-175)
function mintTierBadge(
    address user,
    uint256 tierId,          // Renamed from tokenId to tierId for clarity
    uint256 lifetimeFoodItems
) external onlyOwner nonReentrant returns (uint256 tokenId) {
    // Validate tier ID
    require(tierId >= 1 && tierId <= 3, "Invalid tier");

    // Check sequential claim order
    require(userHighestTier[user] == tierId - 1, "Claim tiers in order");

    // Verify threshold
    Tier memory tier = tiers[tierId];
    require(lifetimeFoodItems >= tier.threshold, "Threshold not met");

    // Generate unique token ID
    tokenId = _nextTokenId++;
    _safeMint(user, tokenId);
    tokenTier[tokenId] = tierId;          // Map tokenId → tierId
    userHighestTier[user] = tierId;

    // Transfer reward
    usdtToken.safeTransferFrom(coinstorReserve, user, tier.rewardAmount);

    emit Locked(tokenId);
    emit TierBadgeMinted(user, tokenId, tier.name, tier.rewardAmount, lifetimeFoodItems);
}

// TierBadge.sol — tokenURI (line 224)
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");

    uint256 tierId = tokenTier[tokenId];  // Map tokenId → tierId
    Tier memory tier = tiers[tierId];
    // ... rest unchanged
}
```

### Fix C-03/C-04: USDT Payouts + Treasury Routing

```solidity
// CommissionDistribution.sol — Constructor
address public immutable treasury;

constructor(
    address _coinStorReserve,
    address _usdtToken,
    address _treasury                  // New parameter
) {
    require(_coinStorReserve != address(0), "Invalid CoinStor");
    require(_usdtToken != address(0), "Invalid USDT");
    require(_treasury != address(0), "Invalid treasury");

    owner = msg.sender;
    coinStorReserve = _coinStorReserve;
    usdtToken = IERC20(_usdtToken);
    treasury = _treasury;               // Set immutable
}

// CommissionDistribution.sol — distributeCommission (lines 55-83)
function distributeCommission(address[4] calldata referralChain, uint256 amount) external {
    require(msg.sender == eggNFTContract || msg.sender == foodNFTContract, "Not authorized");
    require(amount > 0, "Amount must be > 0");

    // Referral commissions (54% total: 20+10+10+10+4)
    for (uint256 i = 0; i < 4; i++) {
        address referrer = referralChain[i];
        if (referrer != address(0)) {
            uint256 level = (i == 0) ? G1_PERCENT : (i == 1) ? G2_PERCENT : (i == 2) ? G3_PERCENT : G4_PERCENT;
            uint256 commission = (amount * level) / TOTAL_PERCENT;
            if (commission > 0) {
                commissionBalances[referrer] += commission;
            }
        }
    }

    // CoinStor reserve (4%)
    uint256 coinStorAmount = (amount * COINSTOR_PERCENT) / TOTAL_PERCENT;
    commissionBalances[coinStorReserve] += coinStorAmount;

    // Treasury (46%) — NEW
    uint256 treasuryAmount = (amount * TREASURY_PERCENT) / TOTAL_PERCENT;
    commissionBalances[treasury] += treasuryAmount;

    emit CommissionDistributed(msg.sender, referralChain, amount);
    emit CoinStorDeposit(msg.sender, coinStorAmount);
}

// CommissionDistribution.sol — Remove claimCommission() (ETH variant, lines 85-95)
// CommissionDistribution.sol — Remove withdrawCoinStor() (ETH variant, lines 112-121)

// CommissionDistribution.sol — Add treasury withdrawal
function withdrawTreasury(uint256 amount) external {
    require(msg.sender == owner, "Owner only");
    require(amount > 0, "Amount must be > 0");
    require(commissionBalances[treasury] >= amount, "Insufficient treasury balance");

    commissionBalances[treasury] -= amount;
    usdtToken.safeTransfer(treasury, amount);

    emit TreasuryWithdrawn(msg.sender, treasury, amount);
}

// CommissionDistribution.sol — Add event
event TreasuryWithdrawn(address indexed caller, address indexed treasury, uint256 amount);

// CommissionDistribution.sol — Prevent accidental ETH deposits
receive() external payable {
    revert("Contract does not accept ETH");
}
```

### Fix C-05: Remove burnNFT

```solidity
// EggNFT.sol — Delete lines 490-519 entirely
// Remove: enum NFTType, events EggBurned/AnimalBurned, function burnNFT
// No replacement — burn functionality removed completely
```

### Fix C-06: Remove buyer Parameter from mintFood

```solidity
// FoodNFT.sol — mintFood (lines 62-103)
function mintFood(
    // address buyer,          // REMOVED — use msg.sender
    uint256 quantity,
    address referrer
) external nonReentrant returns (uint256[] memory food_ids) {
    require(quantity > 0, "Quantity must be > 0");

    uint256 totalCost = MINT_PRICE * quantity;
    usdtToken.safeTransferFrom(msg.sender, commissionDistribution, totalCost);  // Changed: was buyer

    address[4] memory referralChain;
    referralChain[0] = referrer;

    CommissionDistribution(commissionDistribution).distributeCommission(referralChain, totalCost);

    food_ids = new uint256[](quantity);

    for (uint256 i = 0; i < quantity; i++) {
        _nextFoodId++;
        uint256 foodId = _nextFoodId - 1;

        FoodType foodType = _assignRandomFoodType(foodId);

        _foodProperties[foodId] = FoodProperties({
            food_id: foodId,
            owner: msg.sender,              // Changed: was buyer
            food_type: foodType,
            is_consumed: false,
            consumed_by_egg_id: 0
        });

        _mint(msg.sender, foodId, 1, "");   // Changed: was buyer

        emit FoodTypeAssigned(foodId, foodType);

        food_ids[i] = foodId;
    }

    emit FoodMinted(food_ids, msg.sender, quantity);  // Changed: was buyer

    return food_ids;
}
```

## State of the Art

| Old Approach                  | Current Approach           | When Changed           | Impact                                                  |
| ----------------------------- | -------------------------- | ---------------------- | ------------------------------------------------------- |
| `^` for exponentiation        | `**` for exponentiation    | Solidity 0.5.0+        | `^` was always XOR; this is a bug, not a version change |
| Hardcoded token IDs           | Monotonic counter          | ERC-721 best practice  | Prevents single-user-per-tier limitation                |
| ETH payouts for USDT balances | USDT payouts via SafeERC20 | DeFi standard 2020+    | Prevents permanent fund loss                            |
| Caller-supplied buyer         | msg.sender                 | Security best practice | Prevents allowance draining                             |

**Deprecated/outdated:**

- **Custom Base64 encoder in TierBadge:** M-06 (medium severity) — over-allocates by 32 bytes. Replace with OpenZeppelin Base64.sol in same PR as C-02 fix. `[VERIFIED: audit M-06]`
- **`owner` authorized in distributeCommission:** H-07 (high severity) — allows owner to credit arbitrary balances without depositing USDT. Phase 50 scope, but note for planner.

## Assumptions Log

| #   | Claim                                                                            | Section                        | Risk if Wrong                                                            |
| --- | -------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| A1  | Treasury should receive USDT via commissionBalances mapping, not direct transfer | CommissionDistribution pattern | Low — matches existing CoinStor pattern                                  |
| A2  | Frontend calls mintFood with 3 parameters (buyer, quantity, referrer)            | Anti-Patterns                  | Medium — if frontend already uses msg.sender pattern, no breaking change |
| A3  | No external contracts call burnNFT                                               | C-05 fix                       | Low — function is onlyOwner, internal use only                           |
| A4  | Deployment scripts need manual update for new constructor parameter              | Environment                    | Medium — if scripts auto-deploy, they must be updated                    |

## Open Questions

1. **Treasury Address**
   - What we know: D-09 requires treasury address in constructor
   - What's unclear: What is the actual treasury address? Is it the same as coinStorReserve or a new address?
   - Recommendation: Planner should add task to confirm treasury address with user before deployment script updates

2. **Deployment Order**
   - What we know: CommissionDistribution constructor changes (new `_treasury` parameter)
   - What's unclear: Are contracts already deployed? If so, this phase requires redeployment, not just code changes
   - Recommendation: Planner should verify deployment status and include redeployment tasks if needed

3. **Frontend Integration**
   - What we know: mintFood signature changes from 3 params to 2 params
   - What's unclear: Is frontend code in this repo or separate? Who updates it?
   - Recommendation: Check if frontend is in scope for Phase 49 or needs separate phase

4. **Test Coverage for Treasury**
   - What we know: CommissionDistributionUSDT.t.sol exists but may not test treasury
   - What's unclear: Does existing test suite cover 46% treasury routing?
   - Recommendation: Add treasury-specific tests in Wave 0

## Environment Availability

| Dependency              | Required By       | Available | Version              | Fallback |
| ----------------------- | ----------------- | --------- | -------------------- | -------- |
| Foundry (forge)         | Build & test      | ✓         | 1.5.1-stable         | —        |
| Solidity compiler       | Compilation       | ✓         | 0.8.24 (via Foundry) | —        |
| OpenZeppelin v5         | Contract imports  | ✓         | 5.6.1                | —        |
| Chainlink VRF contracts | EggNFT imports    | ✓         | v2.5 dev             | —        |
| Anvil (local node)      | Integration tests | ✓         | Ships with Foundry   | —        |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework

| Property           | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| Framework          | Foundry (forge) 1.5.1-stable                                      |
| Config file        | `contracts/foundry.toml`                                          |
| Quick run command  | `cd contracts && forge test --match-contract {ContractName} -vvv` |
| Full suite command | `cd contracts && forge test`                                      |

### Phase Requirements → Test Map

| Req ID | Behavior                                       | Test Type   | Automated Command                                                    | File Exists?            |
| ------ | ---------------------------------------------- | ----------- | -------------------------------------------------------------------- | ----------------------- |
| SEC-01 | MINT_PRICE equals 25e18 (eggs) and 5e17 (food) | unit        | `forge test --match-contract EggNFT -vvv`                            | ✅ Wave 0 gap           |
| SEC-02 | Each mintTierBadge produces unique tokenId     | unit        | `forge test --match-contract TierBadge -vvv`                         | ❌ Wave 0               |
| SEC-03 | claimCommissionUSDT pays USDT, not ETH         | unit        | `forge test --match-test testClaimCommissionUSDT -vvv`               | ✅ Exists               |
| SEC-04 | 46% of mint proceeds routed to treasury        | integration | `forge test --match-contract CommissionDistributionIntegration -vvv` | ❌ Wave 0               |
| SEC-05 | burnNFT function removed                       | compilation | `forge build`                                                        | ✅ Compilation verifies |
| SEC-06 | mintFood uses msg.sender, not buyer param      | unit        | `forge test --match-contract FoodNFT -vvv`                           | ❌ Wave 0               |

### Sampling Rate

- **Per task commit:** `cd contracts && forge test --match-contract {AffectedContract} -vvv`
- **Per wave merge:** `cd contracts && forge test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `test/SecurityFixes.t.sol` — regression tests for all 6 critical fixes
  - Test MINT_PRICE == 25e18 for EggNFT
  - Test MINT_PRICE == 5e17 for FoodNFT
  - Test unique token IDs in TierBadge (mint 5 badges, assert all different)
  - Test treasury receives 46% in CommissionDistribution
  - Test burnNFT removed (compile-time verification)
  - Test mintFood uses msg.sender (call from different addresses, assert correct buyer)
- [ ] `test/CommissionDistributionUSDT.t.sol` — add treasury withdrawal test
- [ ] Update existing tests that assert buggy MINT_PRICE values (600 wei → 25e18)

**Note:** Current tests pass because they assert against the buggy XOR result (600 wei). Wave 0 must update these assertions or they will fail after the fix.

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                              |
| --------------------- | ------- | ------------------------------------------------------------- |
| V2 Authentication     | no      | Not applicable (smart contracts use cryptographic signatures) |
| V3 Session Management | no      | Not applicable (stateless contract calls)                     |
| V4 Access Control     | yes     | Ownable pattern, onlyOwner modifiers                          |
| V5 Input Validation   | yes     | require() checks, SafeERC20 for token transfers               |
| V6 Cryptography       | no      | No custom cryptography (VRF from Chainlink)                   |

### Known Threat Patterns for Smart Contracts

| Pattern                       | STRIDE                 | Standard Mitigation                                                       |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| Arithmetic overflow/underflow | Tampering              | Solidity 0.8.x built-in checks (project uses 0.8.24)                      |
| Reentrancy                    | Tampering              | ReentrancyGuard on all external state-mutating functions                  |
| Access control bypass         | Elevation              | Ownable with onlyOwner, remove owner from distributeCommission (Phase 50) |
| Approval draining             | Tampering              | Use msg.sender, never caller-supplied addresses in transferFrom           |
| Token ID collision            | Spoofing               | Monotonic counter, never reuse IDs                                        |
| Currency mismatch             | Information Disclosure | Use same currency for credits and payouts (USDT throughout)               |
| Permanent fund lock           | Denial of Service      | Treasury withdrawal path, no address(0) destinations                      |

### Security Checklist for Phase 49

- [ ] All `^` replaced with `**` in price constants
- [ ] MINT_PRICE regression tests added and passing
- [ ] TierBadge token IDs are globally unique (verified by test)
- [ ] CommissionDistribution pays USDT exclusively (ETH functions removed)
- [ ] Treasury address validated in constructor (non-zero check)
- [ ] 46% treasury routing verified by integration test
- [ ] withdrawTreasury() owner-only modifier present
- [ ] burnNFT function completely removed (no dead code)
- [ ] mintFood uses msg.sender (no buyer parameter)
- [ ] Frontend integration tested (or documented breaking change)
- [ ] All existing tests updated to expect correct MINT_PRICE values
- [ ] Full test suite passes: `forge test`

## Sources

### Primary (HIGH confidence)

- **Solidity Documentation** — Operator precedence, exponentiation `**` vs XOR `^` `[CITED: docs.soliditylang.org/en/latest/types.html]`
- **OpenZeppelin Contracts v5.6.1** — ERC721, SafeERC20, Ownable, ReentrancyGuard `[VERIFIED: lib/openzeppelin-contracts/package.json]`
- **OpenZeppelin ERC721 Docs** — Monotonic token ID pattern `_nextTokenId++` `[CITED: docs.openzeppelin.com/contracts/5.x/erc721]`
- **Smart Contract Audit 2026-04-29** — C-01 through C-06 vulnerability details, PoCs, and fix recommendations `[VERIFIED: docs/SMART_CONTRACT_AUDIT_2026-04-29.md]`
- **Project source code** — EggNFT.sol, FoodNFT.sol, TierBadge.sol, CommissionDistribution.sol `[VERIFIED: contracts/src/]`

### Secondary (MEDIUM confidence)

- **Foundry Book** — Test framework, forge test commands `[CITED: book.getfoundry.sh]`
- **Ethereum StackExchange** — SafeERC20 non-standard return value handling `[CITED: ethereum.stackexchange.com/questions/137049]`

### Tertiary (LOW confidence)

- **Medium articles** — General Solidity security best practices (cross-verified with official docs) `[MARKED for validation]`

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — verified via package.json, foundry.toml, forge --version
- Architecture: HIGH — standard patterns from OpenZeppelin docs and Solidity spec
- Pitfalls: HIGH — audit provides detailed PoCs, code review confirms issues

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days — stable stack, no fast-moving dependencies)
