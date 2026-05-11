---
phase: 59-marketplace-e2e-verification
plan: 01
subsystem: verification
tags: [e2e, marketplace, 0xl3, on-chain, cast, ethers]
requires:
  - phase: 58-testnet-contract-deployment
    provides: "All 6 contracts deployed on 0xl3 testnet"
provides:
  - "Full mint→list→buy→commission flow verified end-to-end on 0xl3 testnet"
  - "On-chain ownership transfer confirmed (EggNFT token #5: seller→buyer)"
  - "Marketplace listing active→sold lifecycle verified"
  - "CommissionDistribution confirms G1 referrer earned 21 USDT"
affects: ["60-withdraw-flow-validation", "61-mainnet-contract-deployment"]
tech-stack:
  added: []
  patterns: ["cast call/send for on-chain verification", "ethers.js direct contract interaction"]
key-files:
  created:
    - ".planning/phases/59-marketplace-e2e-verification/marketplace_flow.cjs"
    - ".planning/phases/59-marketplace-e2e-verification/setup_wallet.py"
  modified:
    - ".planning/phases/59-marketplace-e2e-verification/marketplace_flow.cjs (buyer wallet fix)"
key-decisions:
  - "PB listing hook (24-list-egg.pb.js) has findFirstRecordByData bug with large egg_id — on-chain listing used as workaround"
  - "Seller password: TestPass123! (differed from script default test123456)"
patterns-established:
  - "Direct on-chain marketplace flow via ethers.js + cast (bypassing PB when hooks fail)"
requirements-completed: [VERIFY-01]
duration: 45min
completed: 2026-05-11
---

# Phase 59: Marketplace E2E Verification Summary

Full mint→list→buy→commission flow verified on 0xl3 testnet with real on-chain transactions. Ownership transferred, commissions distributed, listing lifecycle confirmed.

## Performance

- **Duration:** ~45 min (including debug cycles)
- **Started:** 2026-05-11 01:30 ICT
- **Completed:** 2026-05-11 02:15 ICT
- **Tasks:** 4 script steps (setup-buyer, list, buy, verify)

## Accomplishments

### On-Chain Transactions Verified

| Step                | Tx Hash                                                              | Block    | Status |
| ------------------- | -------------------------------------------------------------------- | -------- | ------ |
| Fund buyer ETH      | `0x7ca0ff13a5b072438da81efa7b66240eb9696a122291243115213577299f356e` | —        | ✅     |
| Mint USDT to buyer  | `0x21b98416d76b03ba087564ae7dea543576f8a6ff75bc73979ab2c19d3b54efc7` | —        | ✅     |
| Approve Marketplace | `0x39ff97f55b095921119b5fae96e0b6b7c3fd784edd5f2bb587a1ad2a09957e0f` | 19323254 | ✅     |
| List on Marketplace | `0x66534ed9a01acea90b1da4b3e539b02036583b4f6534990fdf4e5a9ada440b07` | 19323257 | ✅     |
| Approve USDT        | `0xea5d0c0503948f9253d8cd8893ff423984e8d78a70c557603102514c8bde93f7` | 19323269 | ✅     |
| Buy NFT             | `0xc85ba0f551406c1a7d925f15ca456454a25df10243e8fc97c730317fc0c427e3` | 19323273 | ✅     |

### Success Criteria Met

1. ✅ Seller minted egg NFT (token_id=5) on 0xl3 testnet
2. ✅ Egg listed on Marketplace — active listing with 50 USDT price
3. ✅ Buyer purchased — ownership transferred to `0x91711385C5bBb06Ab74B4dB19D528A1E44525ca3`
4. ✅ Referrer `0xe061c25cA759AE4Abcf38FA850f318B98EF009aE` has 21 USDT commission
5. ✅ Listing inactive after purchase (active=false)
6. ✅ PB egg_nfts record updated: owner → buyer (p70qpe6e4fzxiv7)
7. ✅ All transactions confirmed on real 0xl3 testnet

### Key Addresses

- Seller: `0x11a577554eBFE49ed259CAE0A4E08e462c8790E0` (user 2365hdkq6zo7x5y)
- Buyer: `0x91711385C5bBb06Ab74B4dB19D528A1E44525ca3` (user p70qpe6e4fzxiv7)
- Referrer: `0xe061c25cA759AE4Abcf38FA850f318B98EF009aE`

## Issues Found

1. **24-list-egg.pb.js bug**: `findFirstRecordByData("egg_nfts", "egg_id", parseInt(egg_id))` returns `sql: no rows in result set` for large egg_id values (1778433239028). Workaround: on-chain listing via ethers.js direct contract calls.
2. **Seller password mismatch**: Script defaulted to `test123456`, actual was `TestPass123!`.
3. **Buyer wallet mismatch**: Script had stale wallet address; actual PB value used.

## Test Users Ready for Phase 60

Both seller and buyer have wallets funded with USDT on 0xl3 — ready for withdraw flow validation.
