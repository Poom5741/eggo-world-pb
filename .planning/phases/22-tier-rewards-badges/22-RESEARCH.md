# Phase 22: Tier Rewards & Badges - Research

**Researched:** 2026-04-22
**Domain:** Smart Contracts (Solidity), Backend Hooks (PocketBase), Frontend (Next.js/React)
**Confidence:** HIGH

## Summary

Phase 22 implements a tiered reward system where users progress through Seedling (10 items), Grower (100 items), and Farmer (1,000 items) tiers based on lifetime food items consumed. Each tier grants USDT rewards ($5/$50/$500) and a soulbound badge NFT that permanently marks the achievement.

**Key Technical Components:**

1. **ERC-5192 Soulbound Badge Contract** - Non-transferable NFTs using minimal soulbound standard
2. **Multi-layer Validation** - Hook → wallet-api → contract defense-in-depth pattern
3. **USDT Distribution** - From CoinStor reserve (platform treasury), not minted
4. **Frontend Integration** - Reuse commission claim pattern and egg feeding progress bar

**Primary recommendation:** Implement TierBadge.sol as ERC-721 with ERC-5192 interface (IERC5192), override transfer functions to revert, emit Locked event on mint. Use existing PocketBase hook patterns (16-feed-egg.pb.js, 14-claim-commission.pb.js) for backend validation and USDT distribution.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Single TierBadge contract with ERC-5192 soulbound standard — non-transferable badges
- **D-02:** Three badge tiers with sequential minting: Seedling (tokenId 1), Grower (tokenId 2), Farmer (tokenId 3)
- **D-03:** Contract stores badge metadata on-chain (tier name, threshold, reward amount)
- **D-04:** Badge minting restricted to authorized backend wallet
- **D-05:** Hook endpoint `/api/v2/check-tier-reward` validates before calling wallet-api
- **D-06:** Multi-layer validation: hook → wallet-api → contract
- **D-07:** USDT rewards sent from CoinStor reserve
- **D-08:** Idempotent reward claims via `highest_tier_reached` field check
- **D-10:** Fixed thresholds: Seedling (10), Grower (100), Farmer (1,000 items)
- **D-11:** Fixed USDT rewards: $5, $50, $500
- **D-12:** Rewards cumulative (reaching Farmer = all three rewards)
- **D-17:** Use existing `users.lifetime_food_items` field
- **D-18:** Use existing `users.highest_tier_reached` field
- **D-19:** New `tier_claims` collection for claim history
- **D-20:** New `tier_badges` collection mirrors on-chain ownership

### Claude's Discretion

- Badge SVG/icon design (Material Symbols: sprout, potted_plant, agriculture)
- Progress bar color scheme (primary/secondary from design system)
- Claim modal wording and animation style
- Tier badge card layout specifics (claymorphism patterns)
- Error message wording for insufficient food items

### Deferred Ideas (OUT OF SCOPE)

- Tier system beyond Farmer (1,000+ items) — future phases
- Cosmetic in-game benefits from badges — Phase 24+
- Tier downgrade logic — tiers are permanent
- Mobile-specific tier UI — responsive web only

## Phase Requirements

| ID      | Description                                                        | Research Support                                                                                            |
| ------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| TIER-01 | System tracks user lifetime_food_items                             | Use existing field incremented by 16-feed-egg.pb.js hook [VERIFIED: codebase]                               |
| TIER-02 | Tier thresholds: Seedling (10), Grower (100), Farmer (1,000)       | Fixed thresholds in contract and hook validation [CITED: 22-CONTEXT.md]                                     |
| TIER-03 | USDT reward upon reaching each tier: $5, $50, $500                 | Reuse CommissionDistribution.claimCommission pattern from Phase 12 [VERIFIED: 14-claim-commission.pb.js]    |
| TIER-04 | Soulbound Badge NFT minted for each tier (ERC-5192)                | Implement IERC5192 interface, override \_update to block transfers [CITED: eips.ethereum.org/EIPS/eip-5192] |
| TIER-05 | Tier badges display in user profile                                | Reuse dashboard commission claim pattern [VERIFIED: dashboard/commissions/page.tsx]                         |
| TIER-06 | checkAndGrantTierReward endpoint validates and distributes rewards | New hook 22-check-tier-reward.pb.js following Phase 20 patterns [CITED: 21-CONTEXT.md]                      |

## Architectural Responsibility Map

| Capability                  | Primary Tier   | Secondary Tier | Rationale                                                                               |
| --------------------------- | -------------- | -------------- | --------------------------------------------------------------------------------------- |
| Soulbound NFT Enforcement   | Smart Contract | —              | Contract must permanently block transfers; backend cannot enforce token ownership rules |
| Tier Eligibility Validation | Backend Hook   | Smart Contract | Hook fast-fail prevents unnecessary gas; contract is final authority                    |
| USDT Reward Distribution    | Smart Contract | Backend Hook   | Contract executes transfers; hook tracks claim state                                    |
| Progress Display            | Frontend       | —              | UI-only concern, reads from PocketBase user record                                      |
| Claim Notification          | Frontend       | —              | Client-side polling/checking for claim availability                                     |

## Standard Stack

### Core

| Library                | Version      | Purpose                        | Why Standard                                                                         |
| ---------------------- | ------------ | ------------------------------ | ------------------------------------------------------------------------------------ |
| OpenZeppelin Contracts | 5.6.1        | ERC-721 base, Ownable, IERC165 | Industry standard for NFT contracts [VERIFIED: npm registry]                         |
| ERC-5192 Interface     | Final (2022) | Soulbound token standard       | Minimal interface for non-transferable NFTs [CITED: eips.ethereum.org/EIPS/eip-5192] |
| Foundry                | Latest       | Contract development, testing  | Project standard [CITED: contracts/foundry.toml]                                     |
| ethers.js              | v6           | Blockchain interaction         | Already used in wallet-api [VERIFIED: wallet-api/server.js]                          |

### Supporting

| Library                                       | Version | Purpose                    | When to Use                        |
| --------------------------------------------- | ------- | -------------------------- | ---------------------------------- |
| @openzeppelin/contracts/utils/ReentrancyGuard | 5.6.1   | Prevent reentrancy on mint | Always for external-call functions |
| @openzeppelin/contracts/access/Ownable        | 5.6.1   | Authorized minter pattern  | For `onlyOwner` mint restriction   |

### TierBadge Contract Architecture

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

// ERC-5192 Minimal Soulbound NFT Interface
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

contract TierBadge is ERC721, Ownable, IERC5192 {
    // Tier definitions
    struct Tier {
        string name;
        uint256 threshold;
        uint256 rewardAmount; // in USDT wei
    }

    mapping(uint256 => Tier) public tiers; // tokenId => Tier
    mapping(address => uint256) public userHighestTier; // user => max tokenId minted

    // USDT token for rewards
    IERC20 public usdtToken;
    address public coinstorReserve;

    // Events
    event TierBadgeMinted(
        address indexed user,
        uint256 indexed tokenId,
        string tierName,
        uint256 rewardAmount
    );

    constructor(
        address _usdtToken,
        address _coinstorReserve
    ) ERC721("Egg World Tier Badge", "EGGOTIER") Ownable(msg.sender) {
        usdtToken = IERC20(_usdtToken);
        coinstorReserve = _coinstorReserve;

        // Initialize tiers
        tiers[1] = Tier("Seedling", 10, 5 * 10**18);    // $5
        tiers[2] = Tier("Grower", 100, 50 * 10**18);    // $50
        tiers[3] = Tier("Farmer", 1000, 500 * 10**18);  // $500
    }

    // Soulbound: Override _update to block transfers
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Block transfers (allow mint from 0, burn to 0)
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfers disabled");
        }

        return super._update(to, tokenId, auth);
    }

    // IERC5192 implementation
    function locked(uint256 tokenId) external view override returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return true; // All tokens permanently locked
    }

    // ERC-165 support
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }

    // Mint tier badge with USDT reward
    function mintTierBadge(
        address user,
        uint256 tokenId,
        uint256 lifetimeFoodItems
    ) external onlyOwner returns (bool) {
        require(tokenId >= 1 && tokenId <= 3, "Invalid tier");
        require(balanceOf(user) == 0 || userHighestTier[user] < tokenId, "Already claimed");
        require(lifetimeFoodItems >= tiers[tokenId].threshold, "Threshold not met");
        require(userHighestTier[user] == tokenId - 1, "Claim tiers in order");

        // Mint badge
        _safeMint(user, tokenId);
        userHighestTier[user] = tokenId;

        // Send USDT reward
        Tier memory tier = tiers[tokenId];
        require(
            usdtToken.transferFrom(coinstorReserve, user, tier.rewardAmount),
            "USDT transfer failed"
        );

        emit Locked(tokenId);
        emit TierBadgeMinted(user, tokenId, tier.name, tier.rewardAmount);

        return true;
    }

    // View function: check if user can claim tier
    function canClaimTier(
        address user,
        uint256 tokenId,
        uint256 lifetimeFoodItems
    ) external view returns (bool) {
        if (tokenId < 1 || tokenId > 3) return false;
        if (balanceOf(user) > 0 && userHighestTier[user] >= tokenId) return false;
        if (lifetimeFoodItems < tiers[tokenId].threshold) return false;
        if (userHighestTier[user] != tokenId - 1) return false;
        return true;
    }
}
```

**Source:** Adapted from ERC-5192 specification [CITED: eips.ethereum.org/EIPS/eip-5192] and attestate/ERC5192 reference implementation

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ Dashboard       │  │ User Profile    │  │ Tier Progress Display   │ │
│  │ (commission     │  │ (badge display) │  │ (X/10, X/100, X/1000)   │ │
│  │  pattern reuse) │  │                 │  │                         │ │
│  └────────┬────────┘  └────────┬────────┘  └───────────┬─────────────┘ │
│           │                    │                       │               │
│           └────────────────────┴───────────────────────┘               │
│                              │                                         │
│                    ┌─────────▼──────────┐                              │
│                    │  Claim Button      │                              │
│                    │  (when threshold   │                              │
│                    │   reached)         │                              │
│                    └─────────┬────────┘                              │
└──────────────────────────────┼────────────────────────────────────────┘
                               │ POST /api/v2/check-tier-reward
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (PocketBase)                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Hook: 22-check-tier-reward.pb.js                               │   │
│  │ 1. Validate auth                                                 │   │
│  │ 2. Check lifetime_food_items >= threshold                       │   │
│  │ 3. Check highest_tier_reached < requested tier                  │   │
│  │ 4. Call wallet-api /tier-claim                                 │   │
│  │ 5. On success: update highest_tier_reached, create tier_claims  │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│  ┌────────────────────────────────▼────────────────────────────────┐   │
│  │ Collections: users.lifetime_food_items (existing)                 │   │
│  │              users.highest_tier_reached (existing)              │   │
│  │              tier_claims (new: user, tier, amount, tx_hash)       │   │
│  │              tier_badges (new: user, token_id, tier_name)          │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                               │ POST /api/wallet/tier-claim
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           WALLET-API (Node.js)                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Endpoint: /api/wallet/tier-claim                                 │   │
│  │ 1. Decrypt user private key                                      │   │
│  │ 2. Create ethers signer                                          │   │
│  │ 3. Call TierBadge.mintTierBadge()                                │   │
│  │ 4. Wait 12 confirmations                                         │   │
│  │ 5. Return tx_hash                                                │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SMART CONTRACTS (BSC)                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ TierBadge.sol (new)                                              │   │
│  │ - mintTierBadge(): Mints soulbound NFT + sends USDT reward       │   │
│  │ - _update(): Blocks all transfers (soulbound enforcement)        │   │
│  │ - locked(): Returns true for all tokens (IERC5192)              │   │
│  │                                                                 │   │
│  │ USDT (BEP-20) ──transferFrom()──► User Wallet                    │   │
│  │     ▲                                                           │   │
│  │     └── CoinStor Reserve (platform treasury)                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
contracts/src/
├── TierBadge.sol              # New: Soulbound badge NFT contract
├── interfaces/
│   └── IERC5192.sol           # ERC-5192 interface (if not in OZ)

apps/backend/
├── pb_hooks/
│   └── 22-check-tier-reward.pb.js    # New: Hook endpoint
├── collections/
│   ├── tier_claims.json       # New: Claim history
│   └── tier_badges.json       # New: Badge ownership mirror

apps/web/
├── components/
│   ├── tier/
│   │   ├── TierBadgeCard.tsx       # Badge display (claymorphism)
│   │   ├── TierProgressBar.tsx     # Progress to next tier
│   │   ├── TierClaimDialog.tsx     # Claim confirmation modal
│   │   └── TierClaimButton.tsx     # Notification badge + claim
│   └── dashboard/
│       └── tier-section.tsx        # Dashboard tier section
├── app/
│   └── dashboard/
│       └── page.tsx                # Add tier section
└── hooks/
    └── use-tier-reward.ts          # Tier claim mutation hook

wallet-api/
├── server.js
│   └── POST /api/wallet/tier-claim # New endpoint
```

### Pattern 1: Soulbound NFT Implementation

**What:** ERC-721 with overridden `_update` to block transfers, IERC5192 interface
**When to use:** Any non-transferable achievement/badge NFT
**Example:**

```solidity
// Source: ERC-5192 specification + OpenZeppelin ERC-721
function _update(address to, uint256 tokenId, address auth)
    internal override returns (address) {
    address from = _ownerOf(tokenId);
    // Block transfers (allow mint from 0, burn to 0)
    if (from != address(0) && to != address(0)) {
        revert("Soulbound: transfers disabled");
    }
    return super._update(to, tokenId, auth);
}

function locked(uint256 tokenId) external view returns (bool) {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");
    return true; // All tokens permanently locked
}
```

### Pattern 2: Multi-Layer Validation

**What:** Hook validates → wallet-api validates → contract enforces
**When to use:** Any blockchain operation with preconditions
**Example:**

```javascript
// Hook layer (22-check-tier-reward.pb.js)
// Source: Phase 20 pattern from 18-breed-animals.pb.js
if (user.lifetime_food_items < tierThreshold) {
  return e.json(400, { error: { code: "INSUFFICIENT_FOOD", message: "..." } })
}
if (user.highest_tier_reached >= requestedTier) {
  return e.json(400, { error: { code: "TIER_ALREADY_CLAIMED", message: "..." } })
}

// Contract layer (TierBadge.sol)
require(lifetimeFoodItems >= tiers[tokenId].threshold, "Threshold not met")
require(userHighestTier[user] < tokenId, "Already claimed")
```

### Pattern 3: USDT Reward Distribution

**What:** Transfer from platform treasury (CoinStor) to user
**When to use:** Any platform-funded reward
**Example:**

```javascript
// Source: 14-claim-commission.pb.js pattern
const txHash = callTierClaimContract(wallet, daccPublicKey, pin, tierId)

// Contract: TierBadge.sol
require(usdtToken.transferFrom(coinstorReserve, user, rewardAmount))
```

### Anti-Patterns to Avoid

- **Don't use `_beforeTokenTransfer` hook** — deprecated in OpenZeppelin v5; use `_update` instead
- **Don't emit Locked event on every check** — only on mint or state change
- **Don't skip hook validation** — always validate in hook before calling wallet-api (defense in depth)
- **Don't store claim state only on-chain** — mirror in PocketBase for fast queries
- **Don't allow tier downgrade** — tiers are permanent achievements

## Don't Hand-Roll

| Problem                 | Don't Build              | Use Instead                                | Why                                                  |
| ----------------------- | ------------------------ | ------------------------------------------ | ---------------------------------------------------- |
| Soulbound enforcement   | Custom transfer blocking | OpenZeppelin ERC-721 + \_update override   | Standard pattern, battle-tested, IERC5192 compatible |
| USDT transfers          | Manual ABI encoding      | OpenZeppelin SafeERC20                     | Handles non-standard ERC-20s, reentrancy protection  |
| Access control          | Custom modifiers         | OpenZeppelin Ownable                       | Standard pattern, two-step ownership transfer        |
| Contract upgradeability | Proxy patterns           | Keep simple (no upgrade)                   | Phase 22 is feature-complete, no upgrade needed      |
| Progress calculation    | Client-side only         | Hook pre-validation + contract enforcement | Prevents front-running, ensures consistency          |

**Key insight:** Soulbound tokens appear simple but require careful implementation of ERC-721 overrides. Using OpenZeppelin's battle-tested base contracts prevents edge cases (e.g., batch transfers, operator approvals) from being missed.

## Runtime State Inventory

**Trigger:** New tier_claims and tier_badges collections; new TierBadge contract deployment

| Category            | Items Found                                                    | Action Required                                                              |
| ------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Stored data         | users.lifetime_food_items already tracked by 16-feed-egg.pb.js | No migration — field exists [VERIFIED: users.json line 252-260]              |
| Stored data         | users.highest_tier_reached exists but may be null              | Code handles null → treat as "no tier" [VERIFIED: users.json line 289-298]   |
| Live service config | CoinStor reserve address in environment                        | Ensure CONTRACT_ADDRESSES has tierBadgeAddress [CITED: wallet-api/server.js] |
| Secrets/env vars    | RELAYER_PRIVATE_KEY for gas sponsorship                        | Reuse existing relayer wallet [VERIFIED: wallet-api/server.js line 47-71]    |
| Build artifacts     | No existing TierBadge contract                                 | Deploy new contract, add to contract-addresses.json                          |

**Nothing found in category:** OS-registered state — no OS-level tasks registered for tier system.

## Common Pitfalls

### Pitfall 1: Transfer Blocking Incompleteness

**What goes wrong:** Only overriding `transferFrom` but not `safeTransferFrom` or `_update`
**Why it happens:** Developers forget ERC-721 has multiple transfer paths
**How to avoid:** Override `_update` (the internal function called by all transfer methods)
**Warning signs:** Token shows as transferable on block explorers, marketplace sites

### Pitfall 2: Locked Event Emission Timing

**What goes wrong:** Emitting `Locked` event before mint completes (reorg risk)
**Why it happens:** Event emitted in constructor or before `_safeMint`
**How to avoid:** Emit `Locked` after successful mint, in same transaction
**Warning signs:** Event appears but token query reverts

### Pitfall 3: USDT Decimal Mismatch

**What goes wrong:** Using 18 decimals for USDT (BEP-20 USDT uses 18, but verify)
**Why it happens:** Assuming all USDT is 6 decimals (Ethereum mainnet)
**How to avoid:** Check USDT contract decimals() before deployment
**Warning signs:** Reward amounts off by 10^12

### Pitfall 4: Sequential Tier Enforcement

**What goes wrong:** Allowing Farmer claim before Grower
**Why it happens:** Only checking threshold, not previous tier ownership
**How to avoid:** Check `userHighestTier[user] == tokenId - 1`
**Warning signs:** Users can skip tiers, claim highest first

### Pitfall 5: Hook-Contract State Drift

**What goes wrong:** Hook marks tier as claimed but contract reverts
**Why it happens:** Race condition or validation mismatch
**How to avoid:** Update PocketBase state AFTER wallet-api confirms success; don't rollback on contract failure (log error)
**Warning signs:** Users show tier claimed but no NFT in wallet

## Code Examples

### Verified patterns from official sources:

#### ERC-5192 Interface (EIP-5192)

```solidity
// Source: https://eips.ethereum.org/EIPS/eip-5192
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}
// Interface ID: 0xb45a3c0e
```

#### PocketBase Hook Pattern (from 16-feed-egg.pb.js)

```javascript
// Source: apps/backend/pb_hooks/16-feed-egg.pb.js
routerAdd("POST", "/api/v2/check-tier-reward", (e) => {
  const user = $apis.requireAuth(e)
  const body = e.parseBody()
  const { tier } = body

  // Validation
  const lifetimeFood = user.get("lifetime_food_items") || 0
  const highestTier = user.get("highest_tier_reached") || ""

  // Tier thresholds
  const thresholds = { seedling: 10, grower: 100, farmer: 1000 }
  const tierOrder = ["seedling", "grower", "farmer"]

  // Check sequential claim
  const currentIndex = tierOrder.indexOf(highestTier)
  const requestedIndex = tierOrder.indexOf(tier)

  if (requestedIndex !== currentIndex + 1) {
    return e.json(400, {
      success: false,
      error: { code: "INVALID_TIER_ORDER", message: "Claim tiers in sequence" },
    })
  }

  // Check threshold
  if (lifetimeFood < thresholds[tier]) {
    return e.json(400, {
      success: false,
      error: { code: "INSUFFICIENT_FOOD", message: `Need ${thresholds[tier]} items` },
    })
  }

  // Call wallet-api...
})
```

#### Commission Claim Pattern (from dashboard/commissions/page.tsx)

```typescript
// Source: apps/web/app/dashboard/commissions/page.tsx
const handleClaim = async () => {
  if (!user || stats.totalPending === 0) return
  setClaiming(true)

  try {
    const response = await fetch("/api/v2/check-tier-reward", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ tier: "seedling" }),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message)

    setClaimSuccess(result.data)
    fetchData(user.id) // Refresh
  } catch (err) {
    console.error("Claim failed:", err)
  } finally {
    setClaiming(false)
  }
}
```

#### Progress Bar Pattern (from FeedDialog)

```typescript
// Source: apps/web/components/eggs/feed-dialog.tsx
<p className="text-sm font-bold text-center">
    {selectedFoodIds.length}/10 food selected
</p>
// Reuse for: X/10, X/100, X/1000 tier progress
```

## State of the Art

| Old Approach                         | Current Approach           | When Changed             | Impact                                                            |
| ------------------------------------ | -------------------------- | ------------------------ | ----------------------------------------------------------------- |
| `_beforeTokenTransfer` hook          | `_update` override         | OpenZeppelin v5.0 (2023) | Cleaner override pattern, consistent with v5 architecture         |
| Custom soulbound implementations     | ERC-5192 standard          | July 2022 (Final)        | Interoperability with wallets, marketplaces that detect soulbound |
| Transfer to address(0) for "locking" | Explicit locked() function | ERC-5192 Final           | Clear semantic distinction between burn and lock                  |

**Deprecated/outdated:**

- `_beforeTokenTransfer`: Deprecated in OpenZeppelin v5, use `_update`
- `_afterTokenTransfer`: Deprecated in OpenZeppelin v5
- Custom soulbound without ERC-5192: Non-standard, poor tooling support

## Assumptions Log

| #   | Claim                                                                    | Section               | Risk if Wrong                                            |
| --- | ------------------------------------------------------------------------ | --------------------- | -------------------------------------------------------- |
| A1  | BEP-20 USDT uses 18 decimals (same as ERC-20)                            | Standard Stack        | Reward amounts will be incorrect if USDT uses 6 decimals |
| A2  | CoinStor reserve has sufficient USDT and has approved TierBadge contract | Architecture Patterns | USDT transfers will fail if allowance insufficient       |
| A3  | Material Symbols icons "sprout", "potted_plant", "agriculture" exist     | Claude's Discretion   | Icons will not render if names are different             |
| A4  | Gas sponsorship (relayer wallet) will pay for tier claim transactions    | Runtime State         | Users need BNB for gas if relayer not configured         |

## Open Questions

1. **CoinStor Reserve Allowance**
   - What we know: CommissionDistribution uses CoinStor for commission payouts
   - What's unclear: Whether CoinStor has approved TierBadge contract for USDT transfers
   - Recommendation: Add approval step in contract deployment; verify allowance

2. **Badge Metadata URI**
   - What we know: Contract stores metadata on-chain per D-03
   - What's unclear: Whether external JSON metadata is needed for marketplaces
   - Recommendation: Implement tokenURI returning on-chain JSON data URI

3. **Tier Downgrade Edge Case**
   - What we know: Tiers are permanent per deferred items
   - What's unclear: Behavior if lifetime_food_items decreases (bug? admin action?)
   - Recommendation: Document that lifetime_food_items is monotonically increasing

## Environment Availability

| Dependency             | Required By          | Available | Version           | Fallback      |
| ---------------------- | -------------------- | --------- | ----------------- | ------------- |
| Foundry                | Contract compilation | ✓         | Latest            | —             |
| OpenZeppelin Contracts | TierBadge.sol        | ✓         | 5.6.1             | —             |
| BSC Testnet            | Contract deployment  | ✓         | 0xl3 (Chain 7117) | —             |
| PocketBase             | Hook execution       | ✓         | 0.22+             | —             |
| wallet-api             | USDT distribution    | ✓         | Node.js 20+       | —             |
| Relayer wallet         | Gas sponsorship      | ✓         | Configured        | User pays gas |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework

| Property           | Value                                             |
| ------------------ | ------------------------------------------------- |
| Framework          | Foundry (contracts), Vitest (frontend)            |
| Config file        | contracts/foundry.toml, apps/web/vitest.config.ts |
| Quick run command  | `bun test` (frontend), `forge test` (contracts)   |
| Full suite command | `bun run test:ci`                                 |

### Phase Requirements → Test Map

| Req ID  | Behavior                           | Test Type   | Automated Command                        | File Exists? |
| ------- | ---------------------------------- | ----------- | ---------------------------------------- | ------------ |
| TIER-01 | lifetime_food_items tracking       | integration | Hook test                                | ❌ Wave 0    |
| TIER-02 | Threshold validation (10/100/1000) | unit        | `forge test --match-test testThresholds` | ❌ Wave 0    |
| TIER-03 | USDT reward distribution           | integration | Wallet-api test                          | ❌ Wave 0    |
| TIER-04 | Soulbound NFT minting              | unit        | `forge test --match-test testSoulbound`  | ❌ Wave 0    |
| TIER-05 | Badge display in profile           | e2e         | Playwright                               | ❌ Wave 0    |
| TIER-06 | checkAndGrantTierReward endpoint   | integration | Hook test                                | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `bun test --run` (frontend), `forge test` (contracts)
- **Per wave merge:** Full suite
- **Phase gate:** All tests green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `contracts/test/TierBadge.t.sol` — contract unit tests
- [ ] `apps/backend/pb_hooks/22-check-tier-reward.pb.test.js` — hook tests
- [ ] `apps/web/components/tier/*.test.tsx` — frontend component tests
- [ ] TierBadge contract deployment script

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                  |
| --------------------- | ------- | ------------------------------------------------- |
| V2 Authentication     | No      | —                                                 |
| V3 Session Management | Yes     | PocketBase auth token validation                  |
| V4 Access Control     | Yes     | onlyOwner for mint, hook auth check               |
| V5 Input Validation   | Yes     | Threshold validation in hook and contract         |
| V6 Cryptography       | Yes     | AES-256-GCM for private key encryption (existing) |
| V7 Error Handling     | Yes     | Log but don't rollback on contract failure        |

### Known Threat Patterns for Soulbound NFTs

| Pattern                        | STRIDE                 | Standard Mitigation                                          |
| ------------------------------ | ---------------------- | ------------------------------------------------------------ |
| Transfer bypass via approval   | Tampering              | Override \_update (blocks all transfers including approved)  |
| Fake soulbound (mock contract) | Spoofing               | Verify contract address, check supportsInterface(0xb45a3c0e) |
| Replay attack on tier claim    | Replay                 | Idempotent check via highest_tier_reached                    |
| Front-running tier claims      | Information Disclosure | Hook validation prevents unnecessary transactions            |
| Reentrancy on USDT transfer    | Elevation              | Use ReentrancyGuard, check-effects-interactions pattern      |

## Sources

### Primary (HIGH confidence)

- ERC-5192 Specification: https://eips.ethereum.org/EIPS/eip-5192 — Interface definition, rationale
- attestate/ERC5192 GitHub: https://github.com/attestate/ERC5192 — Reference implementation patterns
- OpenZeppelin Contracts v5.6.1: contracts/lib/openzeppelin-contracts — ERC-721 base, Ownable
- EggNFT.sol: contracts/src/EggNFT.sol — Existing project patterns for NFT contracts
- 16-feed-egg.pb.js: apps/backend/pb_hooks/16-feed-egg.pb.js — Hook validation patterns
- 14-claim-commission.pb.js: apps/backend/pb_hooks/14-claim-commission.pb.js — USDT distribution pattern

### Secondary (MEDIUM confidence)

- wallet-api/server.js — ethers.js patterns, gas sponsorship
- dashboard/commissions/page.tsx — Claim UI pattern
- feed-dialog.tsx — Progress bar pattern

### Tertiary (LOW confidence)

- BEP-20 USDT decimals — Assumed 18, verify on deployment

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — ERC-5192 is final standard, OpenZeppelin v5.6.1 verified
- Architecture: HIGH — Reuses established Phase 12/20/21 patterns
- Pitfalls: MEDIUM — Based on common Solidity patterns, limited project-specific history

**Research date:** 2026-04-22
**Valid until:** 30 days (stable standards)
