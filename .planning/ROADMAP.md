# Roadmap — v0.6.0 Quick Production Release

**Milestone:** Quick Production Release  
**Created:** 2026-05-08  
**Status:** Not started — requirements defined, roadmap created  
**Phases:** 3 (54-56)  
**Coverage:** 3 requirements mapped

---

## Phases

- [ ] **Phase 54: Egg Mint Backend Hardening** — Production-ready egg mint flow with reliable error handling
- [ ] **Phase 55: Referral Commission Distribution** — Correct 4-level MLM commission distribution on mint purchases
- [ ] **Phase 56: Egg Mint Frontend & Integration** — Egg mint page with payment flow, status, and transaction confirmation

---

## Phase Details

### Phase 54: Egg Mint Backend Hardening

**Goal**: Production-ready egg mint flow with reliable error handling  
**Depends on**: Nothing (first phase of v0.6.0)  
**Requirements**: MINT-01  
**Success Criteria** (what must be TRUE):

1. Mint-egg API endpoint returns consistent success response for valid mint requests
2. Mint-egg API endpoint returns descriptive error for insufficient USDT balance (no failed blockchain tx)
3. Mint-egg API endpoint returns descriptive error for network/gas failures (no silent failures, no partial state)
4. Minted egg NFT record is created in database on successful mint
5. User's USDT balance is correctly deducted after successful mint  
   **Plans**: TBD

### Phase 55: Referral Commission Distribution

**Goal**: Correct 4-level MLM commission distribution on mint purchases  
**Depends on**: Phase 54 (commissions triggered by mint flow)  
**Requirements**: COMM-01  
**Success Criteria** (what must be TRUE):

1. G1 (25%), G2 (15%), G3 (10%), G4 (5%) commission splits distribute correct USDT amounts on mint
2. Platform treasury receives correct fee routing (46%) on each mint purchase
3. Commission records are written to database for each distribution (traceable per purchase)
4. Missing referrer levels (e.g., no G3) correctly skip to next available level or fall back to platform default
5. Users can verify their commission balance reflects received payouts  
   **Plans**: TBD

### Phase 56: Egg Mint Frontend & Integration

**Goal**: Egg mint page with payment flow, status indicators, and transaction confirmation  
**Depends on**: Phase 54 (needs mint backend endpoint)  
**Requirements**: FE-01  
**Success Criteria** (what must be TRUE):

1. User can navigate to egg mint page and see current egg price and their USDT balance
2. User can click "Mint Egg" button that initiates the purchase flow
3. User sees transaction status updates (pending → confirmed → minted egg details OR failure with error message)
4. On successful mint, user sees minted egg details (egg ID, rarity tier, etc.)
5. On failed mint, user sees clear error message and can retry without page reload  
   **Plans**: TBD  
   **UI hint**: yes

---

## Dependencies

```
Phase 54 (Egg Mint Backend) ──────────────────────────┐
       │                                               │
       ├──► Phase 55 (Referral Commissions)            │
       │    (commissions triggered by mint)             │
       │                                               │
       └──► Phase 56 (Frontend & Integration) ─────────┘
            (needs mint backend endpoint)

Phase 55 and Phase 56 are independent of each other
and can be planned/executed in parallel after Phase 54.
```

---

## Progress Table

| Phase                                | Plans Complete | Status      | Completed |
| ------------------------------------ | -------------- | ----------- | --------- |
| 54. Egg Mint Backend Hardening       | 0/0            | Not started | -         |
| 55. Referral Commission Distribution | 0/0            | Not started | -         |
| 56. Egg Mint Frontend & Integration  | 0/0            | Not started | -         |

---

## Requirement Coverage (v0.6.0)

**Total:** 3 requirements mapped

| Phase | Requirements | Count |
| ----- | ------------ | ----- |
| 54    | MINT-01      | 1     |
| 55    | COMM-01      | 1     |
| 56    | FE-01        | 1     |

---

## Notes

**Phase numbering:** Continuing from v0.5.0 (ended at Phase 53)

**Granularity:** Fine (3 phases for 3 requirements — one requirement per phase)

**Key dependencies:**

- Phase 54 must complete before Phase 56 can begin (frontend needs the backend endpoint)
- Phase 55 can start as soon as Phase 54 is complete (commissions are triggered by the mint flow)
- Phase 55 and Phase 56 can run in parallel after Phase 54

**Solo developer, urgent timeline constraints.**

---

_Last updated: 2026-05-08 — Milestone v0.6.0 roadmap created_
