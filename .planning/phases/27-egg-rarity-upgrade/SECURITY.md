# Phase 27: Egg Rarity Upgrade System - Security Verification

**Verification Date:** 2026-04-24
**ASVS Level:** 2
**Status:** OPEN_THREATS

---

## Threat Register

| Threat ID | Category               | Component      | Disposition | Status |
| --------- | ---------------------- | -------------- | ----------- | ------ |
| T-27-01   | Spoofing               | Backend Hook   | mitigate    | OPEN   |
| T-27-02   | Tampering              | Smart Contract | mitigate    | CLOSED |
| T-27-03   | Tampering              | Backend Hook   | mitigate    | CLOSED |
| T-27-04   | Elevation of Privilege | Smart Contract | mitigate    | CLOSED |
| T-27-05   | Denial of Service      | Smart Contract | mitigate    | CLOSED |

---

## Threat Verification Details

### T-27-01: Spoofing - Egg Ownership Validation (Backend Hook)

**Status:** OPEN

**Expected Mitigation:** Backend hook validates egg ownership before allowing upgrade

**Evidence Searched:**

- `apps/backend/pb_hooks/27-upgrade-egg-rarity.pb.js` lines 1-106

**Finding:**
The backend hook validates:

- User authentication (lines 6-11): `userId = requestInfo.auth ? requestInfo.auth.id : null`
- User exists in database (lines 13-19)
- Egg token ID and food IDs presence (lines 25-37)
- Max 490 food items (lines 40-44)

**Gap:** The backend hook does NOT validate egg ownership. The comment at line 47 states "// Fetch egg properties to validate ownership and status" but no ownership validation code follows. The hook directly calls wallet-api without verifying the user owns the specified egg token.

**Defense-in-Depth Issue:** While the smart contract validates ownership at line 238 (`require(ownerOf(eggTokenId) == msg.sender, "Not owner")`), the declared mitigation location is the Backend Hook. The current implementation relies solely on smart contract enforcement, which will cause failed transactions (wasting user gas) rather than failing fast at the API layer.

**Recommendation:** Add ownership validation in backend hook before calling wallet-api:

```javascript
// Call contract to verify ownership
var eggOwner = // call ownerOf on contract
if (eggOwner.toLowerCase() !== user.wallet_address.toLowerCase()) {
    return e.json(403, { error: { message: "Not egg owner", code: "NOT_OWNER" } });
}
```

---

### T-27-02: Tampering - Max 500 Food Items (Smart Contract)

**Status:** CLOSED

**Mitigation Location:** `contracts/src/EggNFT.sol` line 244

**Evidence:**

```solidity
require(props.food_count + foodIds.length <= MAX_FOOD_COUNT + MAX_UPGRADE_FOOD,
        "Max 500 food items (10 base + 490 upgrade)");
```

Constants verified:

- `MAX_FOOD_COUNT = 10` (line 24)
- `MAX_UPGRADE_FOOD = 490` (line 26)
- Maximum total: 10 + 490 = 500

---

### T-27-03: Tampering - Max 490 Items (Backend Hook)

**Status:** CLOSED

**Mitigation Location:** `apps/backend/pb_hooks/27-upgrade-egg-rarity.pb.js` lines 40-44

**Evidence:**

```javascript
// Validate food count (max 490 extra items per D-04)
if (foodIds.length > 490) {
  return e.json(400, {
    success: false,
    error: { message: "Maximum 490 food items allowed for upgrade", code: "MAX_ITEMS_EXCEEDED" },
  })
}
```

---

### T-27-04: Elevation of Privilege - Owner-Only Upgrade (Smart Contract)

**Status:** CLOSED

**Mitigation Location:** `contracts/src/EggNFT.sol` line 238

**Evidence:**

```solidity
function upgradeEggRarity(uint256 eggTokenId, uint256[] calldata foodIds) external nonReentrant {
    require(ownerOf(eggTokenId) == msg.sender, "Not owner");
    ...
}
```

Test coverage verified: `contracts/test/EggUpgrading.t.sol` lines 218-237

```solidity
function test_UpgradeEggRarity_RevertWhen_NotOwner() public {
    ...
    vm.expectRevert("Not owner");
    eggNFT.upgradeEggRarity(egg_token_id, food_ids);
}
```

---

### T-27-05: Denial of Service - No Upgrade Fee (Smart Contract)

**Status:** CLOSED

**Mitigation Location:** `contracts/src/EggNFT.sol` line 23

**Evidence:**

```solidity
uint256 public constant UPGRADE_FEE = 0; // No fee — users already paid for food NFTs
```

The upgrade function does not require any fee payment, preventing:

- Gas griefing through fee manipulation
- Economic attacks on upgrade availability
- User fund exhaustion through unexpected fees

---

## Accepted Risks Log

_No accepted risks for this phase._

---

## Unregistered Threat Flags

_No unregistered threat flags identified._

---

## Summary

**Closed:** 4/5
**Open:** 1/5

The primary gap is T-27-01: The backend hook does not validate egg ownership before initiating the upgrade transaction. While the smart contract enforces ownership, the declared mitigation location (Backend Hook) does not contain the expected validation. This is a defense-in-depth issue that could be addressed by adding pre-validation at the API layer.
