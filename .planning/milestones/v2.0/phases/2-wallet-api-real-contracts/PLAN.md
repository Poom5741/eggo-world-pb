# Phase 2: Wallet API Real Contract Calls (P0 - Security Critical)

## Goal

Replace mock contract interactions in wallet-api with real ethers.js contract calls.

## Background

Currently 4 endpoints return fake transaction hashes. This must be fixed before production.

Reference: AGENTS.md "Mock Contract Interactions" section

## Tasks

- [ ] Add contract ABIs to wallet-api
- [ ] Implement `/api/v1/wallet/mint-egg` with real contract call
- [ ] Implement `/api/v1/wallet/claim-commission` with real contract call
- [ ] Implement `/api/v1/wallet/mint-food` with real contract call
- [ ] Implement `/api/v1/wallet/feed-egg` with real contract call
- [ ] Add gas estimation for all transactions
- [ ] Add retry logic (3 attempts with backoff)
- [ ] Add transaction receipt waiting
- [ ] Test all 4 endpoints with real blockchain calls

## Implementation Pattern

```javascript
// 1. Get user's encrypted private key
const user = await pocketBase.collection("users").getOne(user_address)
const privateKey = await decryptPrivateKey(user.encrypted_private_key, MASTER_KEY + user.id)

// 2. Create signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const signer = new ethers.Wallet(privateKey, provider)

// 3. Connect to contract
const contract = new ethers.Contract(process.env.EGG_NFT_ADDRESS, EGG_NFT_ABI, signer)

// 4. Call function
const tx = await contract.mintEgg(egg_id)
await tx.wait()

// 5. Return real hash
res.json({
  success: true,
  data: { transaction_hash: tx.hash },
})
```

## Dependencies

- Phase 1 complete (contract addresses available)

## Files to Modify

- `wallet-api/server.js` (lines 388, 422, 457, 493)
- `wallet-api/contracts/` (create directory for ABIs)

## Verification

```bash
# Test each endpoint
curl -X POST http://localhost:3001/api/v1/wallet/mint-egg \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x...","egg_id":1}'

# Expected: Real transaction hash, not mock
# Verify on BSCScan: https://testnet.bscscan.com/tx/<HASH>
```
