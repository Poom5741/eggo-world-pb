# Feature: Hot Wallet USDT Withdrawal

## Problem

Users earn USDT commissions from referrals through the EggNFT ecosystem. Currently:

- CommissionDistribution contract tracks referral earnings per address ✅
- Users have no way to withdraw their earned USDT ❌
- System lacks hot wallet model for managing user withdrawals ❌

## Success Criteria

- [ ] Users can view their withdrawable USDT balance (commission earnings)
- [ ] Users can request withdrawal to external wallet address
- [ ] Withdrawals processed from system hot wallet
- [ ] Transaction history tracked in PocketBase
- [ ] Smart contract supports USDT withdrawals (not just ETH)

## Out of Scope

- Deposit flow (users already pay contracts directly with USDT)
- Internal balance tracking for game actions (already on-chain)
- Changes to EggNFT, FoodNFT, AnimalNFT contracts

## Acceptance Test

1. **View Balance**: Open `/dashboard/withdraw`, verify hot wallet balance displays correctly
2. **Request Withdraw**: Enter amount + external wallet address, submit → transaction created
3. **Process Withdraw**: System sends USDT from hot wallet → user receives USDT
4. **Track History**: Withdrawal appears in transaction history with tx hash

## Technical Approach

**Smart Contract:**

- Modify `CommissionDistribution.sol` to support USDT withdrawals
- Add `claimCommissionUSDT()` function
- Deploy updated contract to BSC

**Backend:**

- PocketBase hook: query on-chain commission balance
- PocketBase hook: process withdrawal requests
- Collection: track withdrawal transactions

**Frontend:**

- Withdraw page with balance display
- Withdraw form (amount, external address)
- Transaction status tracking

## Dependencies

| Dependency                      | Status               |
| ------------------------------- | -------------------- |
| CommissionDistribution deployed | ✅ Existing          |
| PocketBase wallet hooks         | ✅ Existing          |
| USDT contract address           | ✅ Known             |
| Hot wallet setup                | ⚠️ Need to configure |

## References

- Existing contract: `/contracts/src/CommissionDistribution.sol`
- Existing withdraw hook: `/apps/backend/pb_hooks/09-withdraw-usdt.pb.js`
- Contract deployments: Check Foundry scripts
