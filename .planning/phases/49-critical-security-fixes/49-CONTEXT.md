# Phase 49: Critical Security Fixes - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate 6 critical vulnerabilities that could lead to fund loss or contract exploitation. This phase focuses exclusively on fixing critical security issues identified in the 2026-04-29 audit.

</domain>

<decisions>
## Implementation Decisions

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

## Claude's Discretion

None - all decisions made by user

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Security Audit

- `docs/SMART_CONTRACT_AUDIT_2026-04-29.md` — Critical findings C-01 through C-06
- `.planning/REQUIREMENTS.md` — SEC-01 through SEC-06 requirements

### Smart Contracts

- `contracts/src/EggNFT.sol` — Lines 22-23 (MINT_PRICE, BREEDING_FEE), Line 131 (mintFood)
- `contracts/src/FoodNFT.sol` — Line 26 (MINT_PRICE)
- `contracts/src/TierBadge.sol` — Lines 68-72 (tier definitions), mint functions
- `contracts/src/CommissionDistribution.sol` — Commission distribution logic

### Project Context

- `.planning/PROJECT.md` — v0.5.0 milestone goals and constraints
- `.planning/ROADMAP.md` — Phase 49 scope and dependencies

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **OpenZeppelin v5:** Already imported in all contracts - use SafeERC20 for USDT transfers
- **Pausable:** Already imported - can be extended if needed
- **Event logging:** Existing patterns for Transfer, CommissionDistributed events

### Established Patterns

- **USDT handling:** EggNFT already uses USDT for minting (line 131)
- **Commission distribution:** Existing pattern in CommissionDistribution.sol needs currency fix
- **Access control:** Ownable pattern already used throughout

### Integration Points

- **EggNFT → CommissionDistribution:** Mint calls distributeCommission (line 133)
- **TierBadge → User claims:** Token ID generation affects all tier claim flows
- **Treasury address:** Needs to be set during deployment or via admin function

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard security implementations

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 49-critical-security-fixes_
_Context gathered: 2026-04-29_
