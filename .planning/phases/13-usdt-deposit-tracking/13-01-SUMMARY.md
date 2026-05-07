---
phase: 13-usdt-deposit-tracking
plan: 01
type: execute
wave: 1
completed: 2026-05-07
requires_human_action: false
files_modified:
  - apps/backend/pb_hooks/00-config.pb.js
  - apps/backend/collections/deposits.json
---

# Phase 13 Plan 01: Config & Schema Update Summary

**One-liner:** Updated 5 contract addresses in 00-config.pb.js to Phase 12 deployed addresses and added block tracking fields (block_number, block_hash, confirmations) to deposits.json schema.

---

## Completed Tasks

| Task | Name                                             | Files Modified    |
| ---- | ------------------------------------------------ | ----------------- |
| 1    | Update MockUSDT address in 00-config.pb.js       | `00-config.pb.js` |
| 2    | Add block tracking fields to deposits collection | `deposits.json`   |

---

## Contract Address Changes (Chain 7117 — 0xl3 Testnet)

| Contract                   | Old Address                                  | New Address                                  |
| -------------------------- | -------------------------------------------- | -------------------------------------------- |
| **MockUSDT**               | `0xc015ebb27696b73E72Bef099b72791D7e666E2d0` | `0x93886105218Ca14b370ACA538b13895295916028` |
| **CommissionDistribution** | `0x3c48926556e766E4564af0E264A9980e7C3a1787` | `0xa0C50587306F0CCac627D2eaEcb9e5909dB58F3f` |
| **AnimalNFT**              | `0x973F2cA33E96FCC1fdbc48a7880b238b4C6be464` | `0x35F53aB20B3073903ebDe04aA9b354d1Efe8A99C` |
| **EggNFT**                 | `0xd7135090d78854820722CbCe0B29481Dd5D4808c` | `0xb2FE193523A1E6A240141331A80755f5642e7A44` |
| **FoodNFT**                | `0xbb0E0FcB40E209f7751A784F6b8d63E9C127D8fC` | `0xec21A3c068e84ceeD04975627418E867Ec342A02` |

## New Deposit Collection Fields

| Field           | Type   | Constraints                                       | Purpose                        |
| --------------- | ------ | ------------------------------------------------- | ------------------------------ |
| `block_number`  | number | onlyInt, required, 0-999999999                    | Block where Transfer emitted   |
| `block_hash`    | text   | 66 chars, pattern `^0x[a-fA-F0-9]{64}$`, required | Block hash for reorg detection |
| `confirmations` | number | onlyInt, required, 0-999                          | Current confirmation count     |

## New Indexes

- `idx_deposits_block_number` — For querying deposits by block
- `idx_deposits_confirmations` — For filtering pending/confirmed deposits

---

## Verification

- ✅ `grep MockUSDT 00-config.pb.js` returns deployed Phase 12 address `0x93886105218Ca14b370ACA538b13895295916028`
- ✅ All 5 contract addresses match `contracts/contract-addresses.json` chain 7117
- ✅ `deposits.json` contains 12 fields total (9 original + 3 new)
- ✅ Existing fields (user, amount, tx_hash, from_address, status, confirmed_at) preserved
- ✅ Collection schema is deployable without data loss

---

## Deviations from Plan

None — Plan executed exactly as written.

---

## Next Steps

Proceed to Plan 13-02 (Hook Rewrite) which depends on updated contract addresses.
