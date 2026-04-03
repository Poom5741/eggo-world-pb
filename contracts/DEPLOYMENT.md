# Egg Hatching Mechanism Deployment Guide

## Deployment Status: ✅ DEPLOYED ON 0XL3 TESTNET

### Contracts Deployed (Chain ID 7117):
**Deployed:** 2026-04-03  
**Network:** 0XL3 Testnet  
**Explorer:** https://exp.0xl3.com

| Contract | Address |
|----------|---------|
| **MockUSDT** | `0xc015ebb27696b73E72Bef099b72791D7e666E2d0` |
| **CommissionDistribution** | `0x3c48926556e766E4564af0E264A9980e7C3a1787` |
| **AnimalNFT** | `0x973F2cA33E96FCC1fdbc48a7880b238b4C6be464` |
| **EggNFT** | `0xd7135090d78854820722CbCe0B29481Dd5D4808c` |
| **FoodNFT** | `0xbb0E0FcB40E209f7751A784F6b8d63E9C127D8fC` |

**CoinStor Reserve:** `0x17A670280817999B4073eB6CE2D7B4Eb542d372b`  
**Egg Mint Price:** 25 USDT  
**Food Mint Price:** 0.50 USDT

**Verification Status:** ⚠️ Manual verification required (Blockscout API issues)

### Cross-Contract Authorization:
- ✅ CommissionDistribution → EggNFT & FoodNFT authorized
- ✅ EggNFT → FoodNFT & AnimalNFT authorized
- ✅ AnimalNFT → EggNFT authorized
- ✅ FoodNFT → EggNFT authorized

## Deployment Commands

### Testnet Deployment (BSC Testnet):
```bash
cd contracts

# Set environment variables
export PRIVATE_KEY=<your-private-key>
export COINSTOR_RESERVE_ADDRESS=<reserve-wallet>
export DEPLOY_MOCK_USDT=true  # Set to false for mainnet with real USDT

# Deploy all contracts
forge script script/DeployEggNFT.s.sol:DeployEggNFT \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast \
  --verify \
  -vvvv
```

### Mainnet Deployment (BSC Mainnet):
```bash
cd contracts

# Set environment variables
export PRIVATE_KEY=<your-private-key>
export COINSTOR_RESERVE_ADDRESS=<reserve-wallet>
export DEPLOY_MOCK_USDT=false
export USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955  # BSC USDT

# Deploy all contracts
forge script script/DeployEggNFT.s.sol:DeployEggNFT \
  --rpc-url https://bsc-dataseed1.binance.org:443 \
  --broadcast \
  --verify \
  -vvvv
```

## Post-Deployment Verification

### 1. Verify Contract Addresses
```bash
# Check deployment artifacts
cat broadcast/DeployEggNFT.s.sol/<chain-id>/run-latest.json
```

### 2. Verify Authorizations
```solidity
// On EggNFT contract
eggNFT.foodNFT()  // Should return FoodNFT address
eggNFT.animalNFTContract()  // Should return AnimalNFT address

// On AnimalNFT contract
animalNFT.eggNFTContract()  // Should return EggNFT address

// On FoodNFT contract
foodNFT.eggNFTContract()  // Should return EggNFT address
```

### 3. Test Hatching Flow
```solidity
// 1. Mint Egg (requires USDT approval)
eggNFT.mintEgg(referrerAddress)

// 2. Feed Egg 8 times (needs 8 Food NFTs)
foodNFT.mintFood(buyer, 8, referrer)
foodNFT.feedEgg(eggTokenId, foodIds, eggNFTAddress)

// 3. Hatch Egg (requires food_count >= 10)
animalTokenId = eggNFT.hatchEgg(eggTokenId)

// 4. Verify Animal NFT minted
animalNFT.ownerOf(animalTokenId)  // Should be egg owner
animalNFT.getRarity(animalTokenId)  // Common/Rare/Epic/Legendary
animalNFT.getSpecies(animalTokenId)  // One of 12 species
```

## Environment Variables

### Required:
- `PRIVATE_KEY` - Deployer private key
- `COINSTOR_RESERVE_ADDRESS` - Commission reserve wallet

### Conditional:
- `DEPLOY_MOCK_USDT` - true for testnet, false for mainnet
- `USDT_ADDRESS` - Only required if `DEPLOY_MOCK_USDT=false`

## Contract Addresses (Testnet)

| Contract | Address | Verified |
|----------|---------|----------|
| MockUSDT | TBD | - |
| CommissionDistribution | TBD | - |
| AnimalNFT | TBD | - |
| EggNFT | TBD | - |
| FoodNFT | TBD | - |

## Contract Addresses (Mainnet)

| Contract | Address | Verified |
|----------|---------|----------|
| USDT | 0x55d398326f99059fF775485246999027B3197955 | ✅ |
| CommissionDistribution | TBD | - |
| AnimalNFT | TBD | - |
| EggNFT | TBD | - |
| FoodNFT | TBD | - |

## Rarity Distribution

| Rarity | Probability | Species Pool |
|--------|-------------|--------------|
| Common | 60% | Chicken, Duck, Quail |
| Rare | 25% | Peacock, Swan, Turkey |
| Epic | 12% | Phoenix, GoldenChicken, SilverDuck |
| Legendary | 3% | Dragon, Unicorn, Gryphon |

## Food Type Influence

Food types consumed affect species determination for Common/Rare tiers:
- **Grain** → Chicken, Quail (Common)
- **Fish** → Duck (Common)
- **Insects** → Quail (Common)
- **Herb** → Chicken, Quail (Common)

Epic/Legendary species determined by seed only.

## Troubleshooting

### Error: "Not authorized"
- Ensure all cross-contract authorizations are set
- Check `authorizedFoodNFTContracts` on EggNFT
- Check `authorizedContracts` on FoodNFT

### Error: "Not enough food consumed"
- Egg requires food_count >= 10 (includes initial 2)
- Need to feed egg 8 additional times

### Error: "Egg already hatched"
- Egg can only be hatched once
- Check `isEggHatched(tokenId)` before calling

## Test Results

✅ **AnimalNFT.t.sol**: 20/20 tests passing
✅ **EggHatching.t.sol**: 14/14 tests passing
✅ **Total**: 34/34 tests passing

### Coverage:
- Deployment & initialization
- Minting with authorization
- All view functions
- Hatching success paths
- Verification/revert conditions
- Food type influence on species
- Statistical rarity distribution (100 eggs)
- Edge cases (ownership transfer, exactly 10 food, etc.)

## Next Steps

1. Deploy to BSC Testnet
2. Verify contracts on BSCScan
3. Test full mint → feed → hatch flow
4. Deploy to BSC Mainnet
5. Frontend integration with deployed contracts
