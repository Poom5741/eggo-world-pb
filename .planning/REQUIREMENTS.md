---
milestone: v0.10.0
milestone_name: Admin Treasury & Ownership
created: 2026-05-24
status: active
total_requirements: 27
---

# Milestone v0.10.0 Requirements

**Defined:** 2026-05-24
**Core Value:** Gamified NFT marketplace on BSC where users buy, sell, hatch, and trade NFTs
**Branch:** `dev`

Give admin users the ability to accept contract ownership, monitor USDT pool balances across all contracts, and withdraw treasury funds via MetaMask wallet (viem). The admin connects MetaMask directly — transactions are signed in-browser and broadcast to BSC.

---

## Wallet Connection (WALL)

- [ ] **WALL-01**: Admin can connect MetaMask wallet to the `/admin/treasury` page using viem
- [ ] **WALL-02**: Connected wallet address and network are displayed with chain validation (must be BSC mainnet or testnet)
- [ ] **WALL-03**: Admin can disconnect and reconnect wallet

## Contract Ownership (OWN)

- [ ] **OWN-01**: Admin can view ownership status of all 6 deployed contracts (current owner, pending owner, ownership type)
- [ ] **OWN-02**: CommissionDistribution (Ownable2Step) shows "Accept Ownership" button when connected wallet matches pendingOwner
- [ ] **OWN-03**: Admin calls `acceptOwnership()` on CommissionDistribution directly via MetaMask (viem `writeContract`)
- [ ] **OWN-04**: Admin receives tx confirmation (hash, status, updated owner verified on-chain)

## Pool Balance (POOL)

- [ ] **POOL-01**: Admin can view CoinStor reserve (4%), Treasury (46%/6%), and total pool balance in a single dashboard
- [ ] **POOL-02**: Admin can manually refresh pool balances
- [ ] **POOL-03**: Balances are formatted to 2 decimal places with thousands separators

## Treasury Withdrawal (WDRW)

- [ ] **WDRW-01**: Admin can withdraw a specified USDT amount from treasury pool via MetaMask (viem `writeContract`)
- [ ] **WDRW-02**: Withdrawal form shows treasury destination address and available balance before submit
- [ ] **WDRW-03**: System displays tx confirmation (hash, amount, updated balances)
- [ ] **WDRW-04**: Withdrawal button only enabled when admin wallet has accepted ownership
- [ ] **WDRW-05**: System validates amount ≤ available treasury balance before allowing submit

## Admin Page (PAGE)

- [ ] **PAGE-01**: New `/admin/treasury` page accessible only to admin users (role === "admin")
- [ ] **PAGE-02**: Page uses existing `AuthGuard` with `requireAdmin` pattern
- [ ] **PAGE-03**: Admin nav updated to include Treasury link

## Error Handling (ERR)

- [ ] **ERR-01**: Reverted transactions show user-friendly error message with reason
- [ ] **ERR-02**: RPC/network failures show retry option with clear error context
- [ ] **ERR-03**: Contract read failures (ownership, balance) show inline error state with retry

## Backend Hooks (BACK)

- [ ] **BACK-01**: PocketBase hook `GET /api/v2/admin/pool/balance` returns combined pool balances (proxy to wallet-api)
- [ ] **BACK-02**: wallet-api `GET /api/v2/admin/pool/balance` reads `commissionBalances` for coinStorReserve + treasury + total from CommissionDistribution contract
- [ ] **BACK-03**: Config env vars include all 6 contract addresses for ownership queries

## Deployment (DEPL)

- [ ] **DEPL-01**: New wallet-api endpoints deployed to production container
- [ ] **DEPL-02**: New PocketBase hook deployed, loaded, and verified (check `endpoint registered` in logs)
- [ ] **DEPL-03**: Frontend deployed to Cloudflare Pages

---

## Out of Scope

| Feature                              | Reason                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| CoinStor (4%) pool withdrawal        | No `withdrawCoinStor` function in CommissionDistribution.sol — requires contract update + redeploy |
| Withdraw to custom address           | `withdrawTreasury` sends to immutable treasury address (contract design)                           |
| Ownership transfer initiation        | Deployer already called `transferOwnership()` via TransferOwnership script                         |
| Multi-sig or multi-wallet admin      | Solo developer project — single MetaMask wallet sufficient                                         |
| Wallet connect on other admin pages  | Only `/admin/treasury` needs MetaMask for now                                                      |
| EggNFT custom ownership modification | EggNFT has custom owner pattern — dashboard displays it, no modification needed                    |

---

## Previous Milestone (v0.9.0 — SHIPPED)

- [x] AUTH-01: Google OAuth sign-in (Phase 63)
- [x] AUTH-02: Auto-wallet creation on first Google signup (Phase 63)
- [x] AUTH-03: Referral tracking through Google OAuth (Phase 63)
- [x] AUTH-04: LINE-specific files removed (Phase 63)

---

## Traceability

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| WALL-01     | 65    | Pending |
| WALL-02     | 65    | Pending |
| WALL-03     | 65    | Pending |
| OWN-01      | 66    | Pending |
| OWN-02      | 66    | Pending |
| OWN-03      | 66    | Pending |
| OWN-04      | 66    | Pending |
| POOL-01     | 67    | Pending |
| POOL-02     | 67    | Pending |
| POOL-03     | 67    | Pending |
| WDRW-01     | 67    | Pending |
| WDRW-02     | 67    | Pending |
| WDRW-03     | 67    | Pending |
| WDRW-04     | 67    | Pending |
| WDRW-05     | 67    | Pending |
| PAGE-01     | 65    | Pending |
| PAGE-02     | 65    | Pending |
| PAGE-03     | 65    | Pending |
| ERR-01      | 67    | Pending |
| ERR-02      | 67    | Pending |
| ERR-03      | 67    | Pending |
| BACK-01     | 64    | Pending |
| BACK-02     | 64    | Pending |
| BACK-03     | 64    | Pending |
| DEPL-01     | 68    | Pending |
| DEPL-02     | 68    | Pending |
| DEPL-03     | 68    | Pending |

**Coverage:**

- v0.10.0 requirements: 27 total
- Mapped to phases: 27 ✅
- Unmapped: 0 ✅

---

_Requirements defined: 2026-05-24_
_Last updated: 2026-05-24 after devil's advocate review + MetaMask/viem wallet connect addition_
