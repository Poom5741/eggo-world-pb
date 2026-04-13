# Feature: Hot Wallet USDT Withdrawal

## Problem
User commission earnings accumulate in CommissionDistribution contract but can only be withdrawn as ETH (not USDT). Users need to withdraw their referral commissions in USDT to their external wallets.

## Success Criteria
- ✅ CommissionDistribution.sol supports `claimCommissionUSDT()` function
- ✅ Contract deployed to BSC testnet with USDT integration
- ✅ PocketBase endpoint returns user's withdrawable hot wallet balance
- ✅ Withdraw hook sends USDT from system hot wallet to user
- ✅ Frontend withdraw UI displays balance and processes withdrawals
- ✅ Full flow tested: mint NFT → earn commission → withdraw USDT

## Out of Scope
- Deposit functionality (user pays contracts directly)
- Internal balance tracking (all game transactions on-chain)
- Multi-chain support (BSC only for now)

## Acceptance Test
1. Open withdraw page at `/dashboard/withdraw`
2. Verify balance显示 user's CommissionDistribution USDT balance
3. Enter amount and external wallet address
4. Submit withdraw request
5. Receive USDT in external wallet within 5 minutes
6. Verify transaction hash in withdrawal history

## Technical Constraints
- Use existing hot wallet model (system holds funds, distributes on request)
- Match existing code patterns (Thai comments, pb_hooks naming)
- TDG workflow: Red-Green-Refactor cycles
- Deploy to BSC testnet first, then mainnet
- Security: ReentrancyGuard, validation, no ETH in USDT functions
