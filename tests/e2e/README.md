# E2E Tests

## Playwright Tests (Phase 41+)

Playwright tests run against static export from `apps/web/out/`.

**Prerequisites:**

1. Build static export: `bun run build` (from project root)
2. Start Docker E2E environment: `docker-compose -f docker-compose.e2e.yml up -d`

**Run:**

```bash
bun run test:e2e
```

**Available tests:**

- `playwright-smoke.test.ts` - Framework smoke tests

---

## Phase 19 Manual E2E Tests

End-to-end test suite for complete NFT mint → PocketBase registration → marketplace listing → buy flow.

## Prerequisites

1. PocketBase running locally: `docker-compose up -d`
2. Wallet API running: `cd wallet-api && bun run server.js`
3. Test user accounts created with USDT balance
4. Environment variables set (see below)

## Environment Variables

```bash
export SELLER_USER_ID=<seller-user-id>
export BUYER_USER_ID=<buyer-user-id>
export WALLET_API_URL=http://localhost:3001
export POCKETBASE_URL=http://localhost:8090
export EGG_NFT_ADDRESS=0xb2FE193523A1E6A240141331A80755f5642e7A44
export MARKETPLACE_ADDRESS=<marketplace-contract-address>
```

## Run

```bash
node tests/e2e/nft-mint-marketplace-flow.test.js
```

## Expected Duration

~2-3 minutes (due to 12-block confirmation waits)

## Test Flow

1. **Mint**: Seller calls POST /mint-egg via wallet-api
2. **Verify Mint**: Check PocketBase egg_nfts collection for new record
3. **Buy**: Buyer calls POST /api/v2/marketplace/buy via PocketBase
4. **Verify Buy**: Check on-chain ownership (ownerOf returns buyer address)
5. **Verify DB**: Check PocketBase egg_nfts ownership transferred to buyer
6. **Verify Gas Logs**: Check wallet-api logs for gas sponsorship entries

## Notes

- Test requires real testnet transactions (not mocks)
- Use test user accounts with USDT balance (not production accounts)
- All assertions must pass for test to succeed
- Log all transaction hashes for manual verification on BSCScan
- Clean up test data after test completes (optional)
