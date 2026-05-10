# Phase 59: Marketplace E2E Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 59-marketplace-e2e-verification
**Areas discussed:** Test Wallets & Users, Environment Config

---

## Test Wallets & Users

| Option              | Description                                                                      | Selected |
| ------------------- | -------------------------------------------------------------------------------- | -------- |
| Existing test users | Use existing E2E test accounts (test_seller, test_buyer) in local dev PocketBase | ✓        |
| Fresh test users    | Create new test users in PocketBase with fresh wallets                           |          |
| CLI-only (cast)     | Skip UI testing entirely, use cast/forge CLI commands                            |          |

**User's choice:** Existing test users (test_seller, test_buyer in local PocketBase)
**Notes:** User confirmed using existing E2E test accounts to minimize setup overhead.

| Option                | Description                                                        | Selected |
| --------------------- | ------------------------------------------------------------------ | -------- |
| Yes, set up referrals | Set up referral chain to verify G1 20% commission distribution     | ✓        |
| Skip referrals        | Only verify basic mint → list → buy flow, no referral verification |          |
| Claude's call         | Let the agent decide based on what's testable                      |          |

**User's choice:** Yes, set up referrals
**Notes:** User wants full commission verification including referral chain.

| Option                | Description                                        | Selected |
| --------------------- | -------------------------------------------------- | -------- |
| Full-stack UI         | Run end-to-end through frontend (localhost:3000)   | ✓        |
| CLI-only verification | Use cast for on-chain checks without UI dependency |          |
| Combined CLI + UI     | CLI for on-chain checks + UI for UX validation     |          |

**User's choice:** Full-stack UI verification
**Notes:** User wants the complete flow through the frontend, testing the full application stack.

| Option             | Description                                            | Selected |
| ------------------ | ------------------------------------------------------ | -------- |
| Mint USDT via cast | Manually mint MockUSDT to test wallets using cast send | ✓        |
| Faucet endpoint    | Create temporary faucet endpoint in wallet-api         |          |
| Setup script       | Automated script to fund wallets as part of setup      |          |

**User's choice:** Mint USDT via cast (manual)
**Notes:** User prefers simple manual cast send commands for wallet funding.

## Environment Config

| Option                | Description                                                            | Selected |
| --------------------- | ---------------------------------------------------------------------- | -------- |
| Local full stack      | Local PB (8090) + wallet-api (3001) + frontend (3000) pointing to 0xl3 | ✓        |
| Production PB + local | Production PB (pb.eggoworld.io) + local wallet-api + local frontend    |          |
| CLI-only (cast)       | Pure CLI testing bypassing PocketBase and wallet-api                   |          |

**User's choice:** Local full stack
**Notes:** User wants the full local development stack but with real 0xl3 testnet contracts. MOCK_BLOCKCHAIN must be false.

## Claude's Discretion

- Commission verification approach (on-chain balance checks via cast, PocketBase commission_records, or seller balance calculation)
- Error scenario coverage (insufficient balance, cancelled listing, re-listing)
- Exact wallet funding amounts for MockUSDT
- Test orchestration approach (sequential script, manual steps, or mixed)
- Edge case testing depth

## Deferred Ideas

None — discussion stayed within phase scope.
