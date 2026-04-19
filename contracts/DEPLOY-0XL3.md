# Deploying Contracts to 0xl3 Testnet

**Phase:** 12-01  
**Network:** 0xl3 Testnet (Chain ID: 7117)  
**RPC:** https://rpc.0xl3.com

---

## Prerequisites

1. **Foundry installed:** `curl -L https://foundry.paradigm.xyz | bash`
2. **Deployer wallet:** Generate new wallet (NEVER use production wallet)
3. **CoinStor reserve address:** Platform treasury address
4. **Mock USDT:** Will be deployed for testnet

---

## Step 1: Generate Deployer Wallet

```bash
# Generate new wallet for testnet deployment
cast wallet new
```

Save:

- **Private Key:** `0x...` (32 bytes)
- **Address:** `0x...` (fund this for gas)

---

## Step 2: Set Environment Variables

```bash
cd contracts

# Deployer wallet (from Step 1)
export DEPLOYER_PRIVATE_KEY="0x..."

# CoinStor reserve (platform treasury)
export COINSTOR_RESERVE_ADDRESS="0x..."

# Deploy mock USDT for testnet
export DEPLOY_MOCK_USDT=true

# RPC URL
export RPC_URL="https://rpc.0xl3.com"
```

---

## Step 3: Deploy Contracts

```bash
# Deploy all contracts
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  -vv
```

**Expected Output:**

```
Network: 7117
Deployer: 0x...
[OK] MockUSDT deployed at: 0x...
[OK] CommissionDistribution deployed at: 0x...
[OK] AnimalNFT deployed at: 0x...
[OK] EggNFT deployed at: 0x...
[OK] FoodNFT deployed at: 0x...
```

---

## Step 4: Update Contract Addresses

After deployment, update `contracts/contract-addresses.json`:

```json
{
  "7117": {
    "usdt": "0x...", // From deployment output
    "commission": "0x...", // From deployment output
    "animalNft": "0x...", // From deployment output
    "eggNft": "0x...", // From deployment output
    "foodNft": "0x..." // From deployment output
  }
}
```

---

## Step 5: Update Wallet API Environment

Copy deployed addresses to `wallet-api/.env.local`:

```bash
cd wallet-api
cp .env.example .env.local

# Edit .env.local
EGG_NFT_ADDRESS=0x...          # From Step 4
FOOD_NFT_ADDRESS=0x...         # From Step 4
COMMISSION_NFT_ADDRESS=0x...   # From Step 4
```

---

## Step 6: Verify Deployment

### Check on Explorer (if available)

Visit: https://scan.0xl3.com (replace with actual explorer URL)

Search for contract addresses.

### Test with Cast

```bash
# Verify EggNFT contract
cast code 0x... --rpc-url $RPC_URL

# Should return contract bytecode (not empty)
```

---

## Troubleshooting

### "insufficient funds"

**Cause:** Deployer wallet has no gas token  
**Fix:** Fund deployer address with 0xl3 native token

### "network mismatch"

**Cause:** Wrong chain ID  
**Fix:** Verify `--rpc-url` and chain ID match (7117)

### "nonce too low"

**Cause:** Previous deployment in progress  
**Fix:** Wait for confirmation or increment nonce

---

## Post-Deployment

1. ✅ Verify all contracts have code (not empty addresses)
2. ✅ Update `contract-addresses.json`
3. ✅ Update `wallet-api/.env.local`
4. ✅ Test wallet-api endpoints
5. ✅ Document deployment in PHASE-12-SUMMARY.md

---

## Security Notes

- NEVER commit private keys to `.env` files
- NEVER use production deployer wallet for testnet
- ALWAYS use separate wallet per network
- ROTATE deployer wallet after each deployment

---

**Last Updated:** 2026-04-18  
**Reference:** [Foundry Book - Forge Script](https://book.getfoundry.sh/reference/forge/forge-script)
