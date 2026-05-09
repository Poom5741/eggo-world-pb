---
milestone: v0.8.0
milestone_name: Production Launch
created: 2026-05-10
status: active
total_requirements: 5
---

# Milestone v0.8.0 Requirements

**Defined:** 2026-05-10
**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions

Deploy smart contracts to 0xl3 testnet, verify end-to-end flows (marketplace buy/sell, deposit/withdraw), then deploy to BSC mainnet with all production configs updated.

---

## Contract Deployment (DEPLOY)

- [ ] **DEPLOY-01**: All smart contracts deployed and verified on 0xl3 testnet
  - **Phase:** Phase 58
  - Details: Fresh deployment of CommissionDistribution, EggNFT, FoodNFT, AnimalNFT, Marketplace contracts to 0xl3 testnet (Chain ID: 7117). Use `DEPLOY_MOCK_USDT=true` for testnet. Verify all contracts on 0xl3 explorer.

- [ ] **DEPLOY-02**: All smart contracts deployed and verified on BSC mainnet
  - **Phase:** Phase 61
  - Details: Deploy same contracts to BSC mainnet (Chain ID: 56). Use real USDT address (0x55d398326f99059fF775485246999027B3197955). Verify on BscScan. Deployer wallet funded with ~5+ BNB for gas.

## Flow Verification (VERIFY)

- [ ] **VERIFY-01**: Marketplace buy/sell flow verified end-to-end on testnet
  - **Phase:** Phase 59
  - Details: Full user journey on testnet: user mints egg → lists for sale → buyer purchases → ownership transfers → seller receives USDT. Commission distribution verified (G1 20%, G2-G4 10%, CoinStor 4%).

- [ ] **VERIFY-02**: Withdraw flow verified on testnet with real USDT transfer
  - **Phase:** Phase 60
  - Details: User initiates USDT withdrawal → fee preview shows correct amount → real blockchain transaction executed → tx_hash stored → balance updated. Test with 1-10 USDT.

## Production Configuration (CONFIG)

- [ ] **CONFIG-01**: All production configs updated for BSC mainnet
  - **Phase:** Phase 62
  - Details: Update `contract-addresses.json` with mainnet addresses, update RPC URLs in wallet-api `.env`, update PocketBase hook configs, update frontend env vars, verify nginx CORS/rate-limiting.

---

## Traceability

| REQ-ID    | Phase    | Status  |
| --------- | -------- | ------- |
| DEPLOY-01 | Phase 58 | Pending |
| DEPLOY-02 | Phase 61 | Pending |
| VERIFY-01 | Phase 59 | Pending |
| VERIFY-02 | Phase 60 | Pending |
| CONFIG-01 | Phase 62 | Pending |

**Coverage:**

- v0.8.0 requirements: 5 total
- Mapped to phases: 5
- Unmapped: 0

---

## Out of Scope

| Feature                 | Reason                                                    |
| ----------------------- | --------------------------------------------------------- |
| New UI Features         | Scope is deployment + verification only, not new features |
| Legacy UAT/Verification | Pre-existing legacy gaps from prior milestones            |
| Contract Upgrades/Proxy | Use standard deployment for MVP, proxy pattern deferred   |
| Multi-chain Deployment  | BSC mainnet only for now                                  |

---

_Requirements defined: 2026-05-10_
