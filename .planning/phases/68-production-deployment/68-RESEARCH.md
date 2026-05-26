# Phase 68: Production Deployment — Research

**Created:** 2026-05-26
**Researcher:** orchestrator (inline; Task tool unavailable)
**Confidence:** HIGH
**Status:** Ready for planning

---

## Research Question

What do we need to know to plan Phase 68 (Production Deployment) such that the wallet-api, PocketBase hooks, and frontend supporting the Admin Treasury surface (Phases 64–67) are reliably deployed and verified on production (`pb.eggoworld.io` + Cloudflare Pages, BSC mainnet)?

## Summary of Findings

1. The phase is dominantly **verification + runbook authoring**, not new feature code. Frontend auto-deploys via Cloudflare Pages on `git push`; backend services (PocketBase, wallet-api) are already running in production containers.
2. The pool-balance PocketBase hook (`apps/backend/pb_hooks/39-pool-balance.pb.js`) is volume-mounted and only requires a PocketBase container restart to load — no DB migration is needed.
3. The hook's actual registration log line is `"Pool balance proxy endpoint registered: GET /api/v2/admin/pool-balances"` — **not** the generic phrase `"endpoint registered"` written in the ROADMAP success criteria.
4. The hook path that ships is `GET /api/v2/admin/pool-balances` (hyphenated). REQUIREMENTS.md (BACK-01) references `/api/v2/admin/pool/balance` (slashed) — this is documentation drift. The verification log must read what is actually in the file.
5. wallet-api in production runs as `wallet-api` container (or service) — verify it is rebuilt/redeployed from the v0.10.0 branch so the new pool-balance route is present.
6. No staging environment exists (D-42) — verification runs directly on production with the deployer's MetaMask + real BSC mainnet contracts.
7. The phase has **zero source code changes** to ship; it ships docs (runbook + sign-off checklist) and verification evidence.

---

## Architecture Snapshot (deployable surface)

```
Cloudflare Pages              pb.eggoworld.io                  wallet-api container
+--------------------+        +-------------------------+      +---------------------+
| apps/web (static)  | -----> | PocketBase container    | ---> | Express (Bun)       |
| /admin/treasury    |  HTTPS | hooks: 39-pool-balance  | HTTP | GET /api/v1/admin/  |
|                    |        | GET /api/v2/admin/      |      |   pool-balances     |
|                    |        |   pool-balances (proxy) |      | reads commission    |
+--------------------+        +-------------------------+      |  Balances() on BSC  |
       |                                                        +---------------------+
       | viem (MetaMask in browser)                                          |
       v                                                                     v
  BSC mainnet (chainId 56): CommissionDistribution `acceptOwnership`,  `commissionBalances` reads
                            EggNFT, FoodNFT, AnimalNFT, Marketplace, TierBadge
```

### What changes between dev and prod

- `apps/web/.env.production` → `NEXT_PUBLIC_POCKETBASE_URL=https://pb.eggoworld.io` (already set)
- `apps/web/app/admin/treasury/page.tsx` resolves `targetChainId=56` for non-localhost hostnames (already in code)
- wallet-api production `.env` (server-side, not in repo) must set `RPC_URL=https://bsc-dataseed.binance.org` (or equivalent), `CHAIN_ID=56`, plus production `WALLET_MASTER_KEY` / `PB_*` admin creds
- `contracts/contract-addresses.json` already contains chain 56 entries including `commission: 0x18b486086f4414500398276766697ad0fc1a43cf` (this file ships in `apps/web/lib/contracts.json` + `wallet-api`'s build)

---

## Layer-by-Layer Verification Plan

### Layer 1 — wallet-api (DEPL-01)

- **Build & deploy:** `wallet-api/` is built via its own Dockerfile. The host (DigitalOcean / VPS hosting `pb.eggoworld.io`) runs the wallet-api container as part of the production compose stack (`apps/backend/docker-compose.yml` references the wallet-api service by name).
- **Trigger:** ssh into prod host, `git pull` on the deploy branch, then `docker compose up -d --build wallet-api` (or whatever the host's standard cmd is — capture exact cmd from the deployer in runbook).
- **Verify:**
  - container is healthy (`docker compose ps wallet-api` → `Up (healthy)`)
  - hot endpoint exists from inside the network:
    `docker compose exec pocketbase wget -qO- "http://wallet-api:3001/api/v1/admin/pool-balances?wallet=0x0000000000000000000000000000000000000000"` returns HTTP-shaped JSON (will be `NOT_OWNER` for zero address — that proves the route is reachable)
  - For the real owner address (admin MetaMask), the same request returns `{ success: true, data: { treasury: {...}, coinstor: {...} } }`
  - Logs do not show RPC failures: `docker compose logs --tail=200 wallet-api | grep -i "rpc\|chain\|error"`

### Layer 2 — PocketBase hook (DEPL-02)

- **Deploy:** the file already exists in the repo at `apps/backend/pb_hooks/39-pool-balance.pb.js`. Production compose mounts `./pb_hooks` as a volume, so `git pull` followed by `docker compose restart pocketbase` is sufficient. **No migration.**
- **Verify hook loaded:**
  - `docker compose logs --tail=300 pocketbase | grep -F "Pool balance proxy endpoint registered"`
    (must show exactly one line containing `GET /api/v2/admin/pool-balances`)
  - Public reachability from outside the host:
    `curl -i "https://pb.eggoworld.io/api/v2/admin/pool-balances?wallet=0x0000000000000000000000000000000000000000"` → JSON with `code: "NOT_OWNER"`
  - With real admin wallet:
    `curl -s "https://pb.eggoworld.io/api/v2/admin/pool-balances?wallet=$ADMIN_ADDR" | jq` → 200 with treasury+coinstor data
- **Hook reload semantics:** PocketBase JS hooks are loaded by the Goja runtime at process boot. Editing a file does **not** hot-reload. `restart` is required, hence the explicit restart step.

### Layer 3 — Frontend (DEPL-03)

- **Deploy:** Cloudflare Pages is connected to the repository. A push to the configured deploy branch (typically `main` or `dev`; verify in Cloudflare dashboard) triggers an automatic build (`bun install && bun run build`). The output is a static export pushed to Cloudflare's edge.
- **Verify:**
  - Cloudflare dashboard shows the latest commit SHA matches `git rev-parse HEAD` for the deploy branch and the build status is `Success`
  - `curl -I https://eggoworld.io/admin/treasury` returns 200 (or 308 → 200 after redirect resolution)
  - Page loads visually; the Phase 64–67 UI shows: MetaMask Connection card, Contract Ownership grid (6 contracts), Treasury Withdrawal section with Pool Balance Card + Withdrawal Form
  - Network tab in browser shows the page calling `https://pb.eggoworld.io/api/v2/admin/pool-balances?wallet=…` and receiving 200 once MetaMask is connected
  - Wallet network badge displays `BSC Mainnet` (BSC_CHAINS[56]) and not "Wrong Network" once MetaMask is on chain 56

### Layer 4 — End-to-end (DEPL success criterion #4)

Full admin journey on production:

1. Sign in as admin (PocketBase admin account)
2. Navigate to `/admin/treasury`
3. Click "Connect MetaMask" → approve in MetaMask
4. Confirm address shown matches CommissionDistribution `pendingOwner()` or `owner()` on BSC mainnet (check via BscScan)
5. Switch MetaMask to BSC Mainnet (chainId 56) if not already
6. Ownership grid loads — 6 cards, each shows current owner, pending owner where applicable. CommissionDistribution shows "Accept Ownership" if connected wallet matches `pendingOwner`.
7. Pool Balance Card loads — shows Total, Treasury, CoinStor with USDT formatting
8. Withdrawal form: enter `0.01` USDT, observe gas estimation appears; do **not** submit the transaction during verification (per CONTEXT.md scope clarification — verification only; no real withdrawals)
9. Refresh button refreshes balances; UI stays usable

Document each step as a checkbox in the sign-off document (D-44, D-46).

---

## Documentation Drift Discovered

Surface these in the plan as **decisions to make during verification** (not blockers):

| Source                       | Wrote                               | Actual                                                                      |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| ROADMAP success criterion #2 | `admin-pool-balance.pb.js` filename | `39-pool-balance.pb.js` (already shipped from Phase 64)                     |
| ROADMAP success criterion #2 | log line `"endpoint registered"`    | `"Pool balance proxy endpoint registered: GET /api/v2/admin/pool-balances"` |
| REQUIREMENTS BACK-01         | route `/api/v2/admin/pool/balance`  | route `/api/v2/admin/pool-balances`                                         |

Verification scripts in the plan **must** check against actual strings, not ROADMAP strings. The sign-off doc should call out the docs drift so a future cleanup phase can normalize wording.

---

## Risks & Pre-Flight Items

| Risk                                                                                | Severity | Mitigation                                                                                                                         |
| ----------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Production wallet-api `.env` missing `RPC_URL`/`CHAIN_ID` or pointing to testnet    | HIGH     | SSH check before kicking off deploy; capture redacted env summary in sign-off                                                      |
| Production PocketBase container fails to pick up new hook because mount missed file | MEDIUM   | Confirm `docker compose exec pocketbase ls /pb_hooks` lists `39-pool-balance.pb.js` before restart; recheck log line after restart |
| Cloudflare Pages building from wrong branch / cached build                          | MEDIUM   | Cross-check commit SHA in Cloudflare deployment detail vs. `git rev-parse HEAD` of deploy branch                                   |
| Admin MetaMask wallet is not the contract owner / pendingOwner                      | HIGH     | Verify on-chain via BscScan before starting E2E (`CommissionDistribution.owner()`, `.pendingOwner()`)                              |
| Accidental real withdrawal during verification                                      | HIGH     | Explicit rule in sign-off: enter amount, observe gas, **do not** click Confirm in MetaMask                                         |
| Rollback path (D-34) untested                                                       | LOW      | Plan includes a "rollback dry-run" task: identify previous commit SHA, document `git revert` cmd, but do not execute               |

---

## Tooling & Patterns Already in Repo

- `docs/DEPLOY_RUNBOOK.md` — existing runbook for daily operations + incident response. Phase 68's runbook should **append a new section** (e.g., "Admin Treasury (v0.10.0) Deployment") rather than rewrite the file.
- `docs/DEPLOY_GUIDE.md` — high-level guide; reference but don't duplicate.
- `DEPLOY_WALLET_API.md` (repo root) — historical wallet-api deploy notes. Phase 68's wallet-api verification can cite it.

## Open Questions for the Operator

These are recorded as Claude's-discretion items in CONTEXT.md and should be answered in the sign-off doc as it is filled in (not now during planning):

1. Exact SSH host/user for the production server
2. Cloudflare Pages deploy branch name (verify in dashboard)
3. Admin MetaMask address (must match `CommissionDistribution.pendingOwner()` on chain 56)
4. Final sign-off approver (single approver per D-46)

---

## Phase 68 Plan Shape (recommendation)

A **single PLAN.md** is appropriate because:

- Phase 68 has 3 tightly-sequenced requirements (DEPL-01, -02, -03) that share infrastructure and verification flow
- No parallelizable code work — every task is a sequential operator action or evidence capture
- The chunked / multi-plan structure would only add overhead

Recommended task waves (sequential by nature; "Wave" label is mainly for plan-checker conformance):

- **Wave 1 — Pre-flight & Documentation**
  - Task 1.1 (DEPL-01 prep): write/extend `docs/DEPLOY_RUNBOOK.md` "Admin Treasury (v0.10.0)" section
  - Task 1.2: create sign-off doc skeleton `.planning/phases/68-production-deployment/SIGN-OFF.md`
  - Task 1.3: pre-flight checklist verifying production env vars (SSH, env, BscScan)
- **Wave 2 — Deploy wallet-api (DEPL-01)**
  - Task 2.1: push deploy branch / rebuild wallet-api container, confirm health and route
- **Wave 3 — Deploy / verify PocketBase hook (DEPL-02)**
  - Task 3.1: restart PocketBase container, confirm hook log line, confirm public route
- **Wave 4 — Deploy frontend (DEPL-03)**
  - Task 4.1: trigger Cloudflare Pages deploy (push or manual), confirm SHA match, confirm `/admin/treasury` loads
- **Wave 5 — End-to-end verification & sign-off**
  - Task 5.1: full admin journey checklist
  - Task 5.2: fill out SIGN-OFF.md, capture evidence (screenshots/log snippets), commit

This shape keeps **autonomy = false** on every task that requires SSH or browser-driven verification — those steps cannot be automated by execute-phase.

---

## RESEARCH COMPLETE

Confidence: HIGH for layer-by-layer verification; MEDIUM for exact production host commands (operator-specific, captured in runbook during execution).
