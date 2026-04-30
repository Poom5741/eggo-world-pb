---
status: incomplete
---

# Quick Task 260430: Fix remaining 3 E2E journey test failures

## What was done

- Fixed wallet-api ABIs (EggNFT, FoodNFT, CommissionDistribution) to match deployed contracts
- Fixed buy hook auth ($apis.requireAuth → e.requestInfo().auth)
- Fixed buy hook wallet queries (findFirstRecordByFilter → findFirstRecordByData)
- Added MOCK_BLOCKCHAIN path to buy hook
- Fixed BuyFlow redirect (/inventory → /eggs/ via window.location.href)
- Fixed client.ts localStorage key (model → record) for PocketBase v0.25.2
- Fixed e2e-auth.ts to save 'record' key matching SDK format
- Added restoreAuth() calls to eggs/animals pages and poll hooks
- Fixed useEggPoll/useAnimalPoll initial loading state
- Fixed transaction creation (new Record() not $app.newRecord())
- Deployed full contracts to Anvil
- Updated contract addresses in test fixtures and configs
- Fixed collection names in journey-helpers.ts

## Remaining issues

- E2E test data (eggs, animals, listings) is consumed during test runs and not regenerated
- Tests need a seed-on-startup mechanism before each test run
- Referral Commission test: passes intermittently
- Buy Egg / Feed+Hatch / Marketplace Multi-User: data-dependent failures
