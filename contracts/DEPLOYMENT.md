# Egg Hatching Mechanism Deployment Guide

## Deployment Status: ✅ READY

### Contracts Deployed (in order):
1. **CommissionDistribution** - Commission management
2. **AnimalNFT** - Animal NFT ERC721 contract
3. **EggNFT** - Egg NFT with hatching mechanism
4. **FoodNFT** - Food NFT ERC1155 contract

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
