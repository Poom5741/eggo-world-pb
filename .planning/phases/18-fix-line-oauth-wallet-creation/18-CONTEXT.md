# Phase 18: Fix LINE OAuth Wallet Auto-Creation

## Problem

Users signing up via LINE OAuth don't have wallets auto-created, causing Buy Now flow to fail with "User has no wallet" error.

## Context

- LINE OAuth flow creates user records in `users` collection
- Hook `01-create-wallet.pb.js` should auto-create wallet on user creation
- Current users have empty `wallet` and `daccPublickey` fields
- Buy Now flow requires valid wallet address to proceed

## Success Criteria

- [ ] LINE OAuth signup triggers wallet creation hook
- [ ] New users have `wallet` field populated with valid Ethereum address
- [ ] New users have `daccPublickey` field populated
- [ ] `user_wallets` record created with initial USDT balance
- [ ] Buy Now flow works for LINE OAuth users without errors

## Investigation Needed

1. Check if `01-create-wallet.pb.js` hook is triggered on OAuth user creation
2. Verify PocketBase OAuth2 flow creates users through standard API or bypasses hooks
3. Check hook execution order and conditions
4. Review LINE OAuth callback flow in `04-auth-token.pb.js` and `05-auth-token.pb.js`

## Out of Scope

- Wallet generation API changes (wallet-api service)
- User wallet update/management UI
- Multi-wallet support
