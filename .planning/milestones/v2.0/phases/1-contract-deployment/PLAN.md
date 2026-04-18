# Phase 1: Contract Deployment (P0)

## Goal

Deploy smart contracts to BSC testnet/mainnet and generate contract addresses file.

## Tasks

- [ ] Deploy MockUSDT contract to BSC testnet
- [ ] Deploy CommissionDistribution contract
- [ ] Deploy EggNFT contract
- [ ] Deploy FoodNFT contract
- [ ] Deploy AnimalNFT contract
- [ ] Deploy Marketplace contract
- [ ] Generate `/contract-addresses.json` file with all deployed addresses
- [ ] Update `.env.example` with contract address environment variables
- [ ] Document deployment transaction hashes

## Success Criteria

- All 6 contracts deployed successfully
- `/contract-addresses.json` exists with valid addresses
- Contract addresses verified on BSCScan
- Frontend can read contract addresses from JSON file

## Dependencies

- None (this unblocks all other phases)

## Files to Create

- `/contract-addresses.json`

## Verification

```bash
# Verify contract addresses file exists
cat /contract-addresses.json | jq '.eggNft, .foodNft, .marketplace'

# Verify contracts on BSCScan
# https://testnet.bscscan.com/address/<CONTRACT_ADDRESS>
```
