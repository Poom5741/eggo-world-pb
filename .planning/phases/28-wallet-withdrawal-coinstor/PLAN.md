# Phase 28 Plan: Wallet Withdrawal & CoinStor Admin

## Overview
Implement wallet withdrawal system with real blockchain integration, CoinStor admin dashboard, and KYC toggle functionality to complete the wallet ecosystem.

## Goals 
1. Complete wallet withdrawal system with real blockchain transactions (no more mock implementations)
2. Implement CoinStor admin dashboard for platform oversight 
3. Add KYC toggle for user compliance management

## Current State Analysis

### Mock Contract Interactions Identified
- `wallet-api/server.js` line 543: `/api/v1/wallet/transfer` returns mock data only
- `wallet-api/server.js` line 571: `/api/v1/wallet/balance` returns hardcoded zeros
- `apps/backend/pb_hooks/09-withdraw-usdt.pb.js` updates DB only, no real blockchain tx
- Frontend `apps/web/components/WithdrawForm.tsx` creates withdrawal_requests only

### Blockchain Integration Status
- Smart contracts deployed on chain 7117 (0xl3 testnet)
- Contract addresses in `/contracts/contract-addresses.json`
- CommissionDistribution.sol has `claimCommissionUSDT()` function ready
- Ethers.js v6 integration in wallet-api is functional
- Relayer wallet system implemented in wallet-api

### Known Implementation Gaps
- Wallet withdrawal only updates database records but doesn't send actual USDT
- Transfer endpoint returns mock responses instead of real blockchain transactions
- Balance endpoint returns hardcoded zeros instead of querying ERC20 token
- Two different withdrawal patterns exist (API vs collection-based)

## Implementation Plan

### Part 1: Real Blockchain Withdrawal Integration

#### Step 1.1: Update Wallet API to Support Real Transactions
- Add proper `claimCommissionUSDT` ABI to CommissionDistribution contract in `wallet-api/server.js`
- Extend `transfer` endpoint to actually execute ERC20 transfers instead of returning mock data
- Update `balance` endpoint to query actual USDT balance from blockchain

#### Step 1.2: Complete PocketBase Wallet Hook
- Enhance `09-withdraw-usdt.pb.js` to call wallet-api for actual blockchain transaction
- Add comprehensive error handling for failed transactions
- Add transaction tracking with actual txHash verification

#### Step 1.3: Unify Withdrawal Pattern
- Decide between API-based withdrawal (dashboard/withdraw/page.tsx) vs collection-based (WithdrawForm.tsx)
- Consolidate frontend to use consistent withdrawal pattern
- Fix parameter mismatch (external_wallet_address vs external_wallet)

### Part 2: CoinStor Admin Dashboard

#### Step 2.1: Design Admin Dashboard Structure
- Create /admin route with access control
- Dashboard showing platform metrics (transactions, users, withdrawals)
- User management panel with KYC status oversight
- Transaction monitoring and dispute resolution tools

#### Step 2.2: Admin API Endpoints
- Create protected endpoints for admin functions
- Transaction history with filtering and search
- Bulk user operations (KYC approval/rejection)
- System configuration updates

#### Step 2.3: Frontend Implementation
- Role-based access control (admin vs regular users)
- Visual components for metrics, charts, and transaction data
- User management interfaces
- Notification system for admin alerts

### Part 3: KYC Toggle Functionality

#### Step 3.1: User Schema Enhancement
- Add `kyc_verified` boolean field to users collection
- Add `kyc_status` enum field (pending, approved, rejected, not-submitted)
- Add `kyc_submitted_date` and `kyc_reviewed_date` datetime fields

#### Step 3.2: Frontend KYC Compliance
- Implement deposit/withdrawal restrictions based on KYC status
- KYC requirement modal when users attempt restricted operations
- KYC submission form with document upload capabilities

#### Step 3.3: Admin Controls for KYC
- Admin interface to review submitted KYC documents
- Approval/rejection workflow with reason capability
- Bulk KYC operations for large-scale management

## Verification Plan
- Test withdrawal to external wallets with actual blockchain transactions
- Verify CoinStor dashboard shows real-time transaction and user data  
- Confirm KYC restrictions work correctly based on compliance status
- Verify admin panels are secure and accessible only to authorized users
- Test gas sponsorship system works properly for admin-initiated actions

## Dependencies
- Smart contracts deployed with necessary USDT transfer methods (Dependency: Contract deployment - HIGH PRIORITY)
- User collection schema modifications for KYC fields
- Frontend authentication updates to support admin roles

## Risks
- Blockchain transactions could fail or be expensive
- KYC compliance regulations may vary by jurisdiction
- Admin access must be strictly controlled and secured
- Frontend changes could impact user experience 

## Timeline
- Part 1 (Real Withdrawal): 3-4 days
- Part 2 (CoinStor Admin): 3-4 days  
- Part 3 (KYC Toggle): 2-3 days
- Total estimated: 8-11 days depending on contract availability