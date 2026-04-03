---
title: LINE Wallet OAuth Integration - Phase Plan
phase: 04
status: planned
---

# Phase 04: LINE Wallet OAuth Integration

## Objective

Integrate improved wallet creation and EIP-7702 support from pkbase-wallet reference into existing LINE OAuth flow.

## Context

Current implementation:

- LINE OAuth in `05-auth-token.pb.js` - basic token exchange
- Wallet creation in `01-create-wallet.pb.js` - calls wallet-srv
- Wallet-srv exists but needs EIP-7702 enhancements from pkbase-wallet

Target implementation (from pkbase-wallet):

- Enhanced wallet creation with dacc-js
- EIP-7702 authorization endpoints
- Better password validation
- Improved error handling

## Tasks

### Task 1: Audit Current State

- [ ] Review existing LINE OAuth flow end-to-end
- [ ] Document differences between current and pkbase-wallet
- [ ] Identify breaking changes vs backward compatible improvements

### Task 2: Update Wallet Service

- [ ] Copy pkbase-wallet/wallet-srv/src structure to wallet-api/
- [ ] Integrate EIP-7702 routes (eip7702Router.ts)
- [ ] Update package.json with dacc-js dependency
- [ ] Test wallet creation locally

### Task 3: Enhance PocketBase Hooks

- [ ] Update `01-create-wallet.pb.js` with improved validation
- [ ] Add EIP-7702 initialization fields
- [ ] Create `16-line-oauth-enhanced.pb.js` for improved LINE flow
- [ ] Add wallet recovery endpoint

### Task 4: Frontend Integration

- [ ] Update auth pages to handle new wallet flow
- [ ] Add EIP-7702 authorization UI components
- [ ] Test LINE OAuth → Wallet creation → EIP-7702 flow

### Task 5: Testing & Verification

- [ ] Write integration tests for LINE OAuth + wallet
- [ ] Test EIP-7702 authorization flow
- [ ] Verify backward compatibility
- [ ] Load test wallet creation endpoint

## Success Criteria

- [ ] LINE login creates wallet automatically
- [ ] EIP-7702 authorization works post-login
- [ ] All existing features remain functional
- [ ] Password validation meets security requirements
- [ ] Error handling covers edge cases

## Dependencies

- dacc-js package
- Wallet service running
- LINE OAuth credentials configured

## Risks

- Breaking changes to existing users
- Wallet service downtime during migration
- EIP-7702 compatibility issues

## Mitigation

- Staged rollout with feature flag
- Database backup before migration
- Fallback to original flow if EIP-7702 fails
