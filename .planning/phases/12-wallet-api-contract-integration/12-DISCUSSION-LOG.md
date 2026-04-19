# Phase 12: Wallet-API Contract Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 12-Wallet-API Contract Integration
**Areas discussed:** Private key decryption, Gas strategy, Error handling, Deployment target

---

## Gray Area 1: Private Key Decryption

| Option                                        | Description                                                                 | Selected |
| --------------------------------------------- | --------------------------------------------------------------------------- | -------- |
| Match reference (dacc-js + passwordSecretkey) | Use dacc-js library internally with passwordSecretkey from user's pin field | ✓        |
| Keep current AES-256-GCM pattern              | Continue with WALLET_MASTER_KEY + userId derivation                         |          |
| Other                                         | Custom approach                                                             |          |

**User's choice:** Match reference (dacc-js + passwordSecretkey)

**Notes:**

- Reference implementation at `/resources/pkbase-wallet/pkbase/pb_hooks/01-create-wallet-hook.pb.js` shows the pattern
- User stores randomly generated `passwordSecretkey` in `pin` field (12-120 chars)
- dacc-js handles decryption internally, no custom crypto code needed
- User explicitly noted: "All design if have should follow this resource /resources/pkbase-wallet"

---

## Gray Area 2: Gas Strategy

| Option                                | Description                                             | Selected |
| ------------------------------------- | ------------------------------------------------------- | -------- |
| User holds BNB for gas                | Simple: user needs native token for gas                 |          |
| Gas sponsorship via USDT              | Platform pays gas, deducts from USDT (meta-transaction) | ✓        |
| Hybrid (sponsor first N transactions) | First 5 free, then user pays                            |          |
| Other                                 | Custom approach                                         |          |

**User's choice:** Gas sponsorship via USDT

**Notes:**

- Reference has complete pattern in `wallet-srv/README-payment-flow.md`
- Flow: `payment/create` (user signs USDT approval) → `pay/send` (platform sponsors gas)
- Matches product vision: USDT-only economy, users don't need to think about native tokens
- Platform absorbs gas cost as operational expense

---

## Gray Area 3: Error Handling & Retries

| Option                                       | Description                                     | Selected |
| -------------------------------------------- | ----------------------------------------------- | -------- |
| Fail fast                                    | No retries, user manually retries               |          |
| Auto-retry transient errors (3x, nonce bump) | Retry network errors with exponential backoff   | ✓        |
| Queue-based retry                            | Background worker processes failed transactions |          |
| Other                                        | Custom approach                                 |          |

**User's choice:** Auto-retry transient errors (3x, nonce bump)

**Notes:**

- Retry only transient network errors, NOT contract reverts
- Max 3 attempts with exponential backoff (1s, 2s, 4s pattern suggested)
- Increment nonce for each retry to prevent replacement transaction issues
- Fail immediately for: insufficient balance, revert errors, invalid signatures

---

## Gray Area 4: Deployment Target

| Option                         | Description                                     | Selected |
| ------------------------------ | ----------------------------------------------- | -------- |
| Testnet first (BSC testnet 97) | Deploy to BSC testnet, test, then mainnet       |          |
| Mainnet direct                 | Deploy straight to production                   |          |
| Parallel (testnet + mainnet)   | Deploy both simultaneously                      |          |
| 0xl3 testnet (Chain ID: 7117)  | Deploy to 0xl3 testnet only (https://0xl3.com/) | ✓        |

**User's choice:** 0xl3 testnet but on this chain https://0xl3.com/ (Chain ID: 7117)

**Notes:**

- User specified exact chain: 0xl3 (https://0xl3.com/)
- Chain ID: 7117, RPC: https://rpc.0xl3.com
- Reference shows this chain is supported (see API_LIST.md supported networks table)
- Deploy to testnet first for free gas testing
- Generate `/contract-addresses.json` with deployed addresses
- Mainnet deployment deferred to future phase

---

## OpenCode's Discretion

The following areas were explicitly left to OpenCode's discretion:

1. **ABI format** — Hardcoded minimal ABI vs separate JSON files (recommended: hardcoded)
2. **Gas estimation buffer** — Exact percentage (recommended: 20%)
3. **Backoff timing** — Exact retry delays (recommended: 1s, 2s, 4s)
4. **Contract deployment tooling** — Which Foundry scripts to use (recommended: forge script)

---

## Canonical References Accumulated

During discussion, user specified the following reference must be followed:

- `/Users/poom-work/tokenine/eggo-pocketbase/resources/pkbase-wallet` (ALL designs)
  - Specifically: `wallet-srv/API_LIST.md`, `wallet-srv/README-payment-flow.md`
  - Hook pattern: `pkbase/pb_hooks/01-create-wallet-hook.pb.js`
  - Contract deployment: `contracts/DEPLOY.md`, `contracts/README.md`

---

## Deferred Ideas

**Scope items that came up but belong in other phases:**

- Frontend balance display refresh → Phase 16
- Transaction history UI → Phase 14-15
- Wallet connect button styling → Phase 14 (mobile polish)

**Discussion stayed within phase scope** — No significant scope creep detected.

---

## Session Metadata

**Duration:** ~15 minutes
**Questions asked:** 4 (one per gray area)
**User decisions:** 4 locked choices
**OpenCode discretion:** 4 areas
**Canonical refs:** 8 files across 4 directories

**State after session:** CONTEXT.md created with 17 implementation decisions

---

_Generated: 2026-04-18_
_Phase: 12-wallet-api-contract-integration_
