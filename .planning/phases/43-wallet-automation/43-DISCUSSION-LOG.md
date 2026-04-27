# Phase 43: Wallet Automation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 43-wallet-automation
**Areas discussed:** Synpress Integration, Wallet Mapping, Anvil Test Accounts, Private Key Storage, Gas Sponsorship Monitor

---

## Wallet Flow

| Option                   | Description                                                                                            | Selected |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | -------- |
| Backend Sponsorship Only | Tests use ethers.js directly with Anvil accounts. No Synpress needed.                                  |          |
| Hybrid: Both Approaches  | ethers for backend ops + Synpress for user wallet ops. More complete but adds complexity.              |          |
| Full Synpress            | Use Synpress for all flows to simulate real user MetaMask experience. More realistic but slower tests. | ✓        |

**User's choice:** Initially selected Backend Sponsorship Only, then pivoted to Synpress approach ("wait actually i want to try synpress")
**Notes:** User emphasized: "the most important thing is system need to work with my pocketbase wallet handle"

---

## Synpress Integration

| Option                      | Description                                                                                                | Selected |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| @synpress/extend-playwright | Official framework, battle-tested for wallet popup automation. More config but handles all MetaMask flows. | ✓        |
| playwright-metamask helper  | Lighter wrapper around Playwright. Less setup overhead but may have edge case gaps.                        |          |
| Hybrid: Synpress + ethers   | Use Synpress for MetaMask flows + ethers helpers for backend-sponsored ops. Covers all scenarios.          |          |

**User's choice:** @synpress/extend-playwright
**Notes:** User wanted to ensure Synpress works with PocketBase wallet handling system

---

## Wallet Mapping

| Option                | Description                                                                                                | Selected |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| Match Anvil defaults  | Create PocketBase test users with wallet addresses that match Anvil's 10 default accounts. Simpler setup.  | ✓        |
| Fund custom addresses | Use existing PocketBase test user wallets. Fund those addresses on Anvil + import custom keys to MetaMask. |          |
| MetaMask for UI only  | Backend sponsorship handles all transactions. MetaMask just for UI state verification.                     |          |

**User's choice:** Match Anvil defaults
**Notes:** Simpler setup — create PocketBase test users with addresses 0xf39Fd..., 0x709979..., 0x3C44Cd..., 0x90F79bf...

---

## Account Mapping

| Option              | Description                                                                                                 | Selected |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| 4 accounts          | Map 4 test users to Anvil accounts 0-3. Accounts 4-9 available for future scenarios. Simple and sufficient. | ✓        |
| All 10 accounts     | Map all 10 Anvil accounts to test scenarios. More test users for complex multi-user flows.                  |          |
| Minimal: 2 accounts | Just use Account 0-1 for buyer/seller. Minimal setup for P0 flows.                                          |          |

**User's choice:** 4 accounts (Recommended)
**Notes:** test_buyer → Account 0, test_seller → Account 1, test_referrer → Account 2, test_admin → Account 3

---

## Key Storage

| Option                     | Description                                                                                                         | Selected |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| .env.e2e file              | Environment variables in .env.e2e. Standard pattern, easy to change. Must gitignore.                                | ✓        |
| Hardcoded in fixture       | Hardcoded constants in tests/fixtures/anvil-accounts.ts. Simplest, works immediately. Anvil keys are public anyway. |          |
| config/anvil-accounts.json | JSON config file with account metadata (address, private key, role). Structured and extensible.                     |          |

**User's choice:** .env.e2e file (Recommended)
**Notes:** Variable naming: ANVIL_ACCOUNT_0_KEY, ANVIL_ACCOUNT_0_ADDR, etc.

---

## Gas Monitor

| Option                      | Description                                                                                                     | Selected |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| ethers balance check helper | Helper in blockchain-helpers.ts that checks relayer balance on Anvil via ethers. Warns if < threshold.          | ✓        |
| Manual check only           | Minimal: log relayer address at test start. Manual check if tests fail with gas errors.                         |          |
| Auto-fund relayer           | Full monitoring: balance check + auto-fund relayer from Anvil account 0 if below threshold. Self-healing tests. |          |

**User's choice:** ethers balance check helper
**Notes:** checkRelayerBalance() helper in blockchain-helpers.ts, threshold 0.1 ETH

---

## Claude's Discretion

- Threshold value for relayer balance warning (default 0.1 ETH)
- Synpress configuration details (timeout, confirmations)
- MetaMask extension version to use in tests

## Deferred Ideas

- Auto-fund relayer from Anvil accounts if balance below threshold (self-healing tests)
- VRF mock coordinator for hatch randomness testing
- Real LINE OAuth smoke test (AUTH-03)
- Additional test users for complex multi-user flows (accounts 4-9)
