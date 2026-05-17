# Draft: Fix Deposit Display (USDT deposits not appearing on frontend)

## Requirements (confirmed from investigation)

- **Bug A (Primary)**: `13-track-deposit.pb.js` line 365 queries `CONFIG.blockchain.contracts.CommissionDistribution` instead of `CONFIG.blockchain.contracts.USDT` in `eth_getLogs` params
- **Bug B (Secondary)**: Line 397 divides raw amount by `Math.pow(10, 6)` — BSC USDT uses 18 decimals, not 6
- **Bug C (Latent)**: `setInterval` background polling doesn't work in PocketBase 0.23.4 JSVM — already commented out in local tree
- **Bug D (Dead code)**: Lines 1-217 define helper functions (`pollDeposits`, `updatePendingConfirmations`, etc.) referencing undefined symbols (`rpcCallWithRetry`, `REQUIRED_CONFIRMATIONS`, `TRANSFER_SIGNATURE`, `getLastScannedBlock`, `saveLastScannedBlock`, `extractAddress`, `parseAmount`, `findUserByWallet`) — never called, but landmine
- **Deployment blocker**: `docker-compose.yml` missing blockchain env vars (`USDT_ADDRESS`, `COMMISSION_DISTRIBUTION_ADDRESS`, `BSC_RPC_URL`, `BSC_CHAIN_ID`, etc.) in HEAD
- **Local fix exists**: All fixes in working tree, uncommitted, not deployed

## Technical Decisions
- Fix is in working tree: contract address line 347 (new) = `CONFIG.blockchain.contracts.USDT`, decimal line 379 = `Math.pow(10, 18)`
- docker-compose diff adds 8 blockchain env vars
- Dead code (lines 1-217) should be removed — references undefined symbols, never called
- Production deployment requires: commit → push → upload hook to server → `docker compose build pocketbase && docker compose up -d pocketbase`
- Production `.env` must include: `USDT_ADDRESS`, `BSC_RPC_URL`, `BSC_CHAIN_ID`, contract addresses

## Research Findings
- `deposits` collection schema exists with proper fields (block_number, block_hash, confirmations, status, log_index)
- Collection rules: `listRule` and `viewRule` = `@request.auth.id = user.id` (correct scoping)
- Frontend page at `apps/web/app/dashboard/deposit/page.tsx` polls `POST /api/v2/deposit/poll` every 30s + fetches from collection
- Frontend correctly handles auth, errors, 404, empty state
- `user_wallets` collection has `last_polled_block` field for poll state tracking

## Scope Boundaries
- INCLUDE: Fix bugs A+B, clean dead code, commit + deploy, verify .env on server
- EXCLUDE: Adding background polling (PB JSVM limitation — requires external cron or architecture change)
- EXCLUDE: Any frontend changes (frontend is working correctly)
- EXCLUDE: Fixing unrelated uncommitted migration changes (`pb_migrations/*`, `29-platform-control.pb.js`, `30-coinstor-admin.pb.js`)

## Metis Review Findings

### Questions I Should Have Asked
1. Is deposits collection empty or does it have stale/wrong-amount records?
2. What happens to deposits polled during broken period? (They were never detected; user needs to revisit page)
3. Deposits collection unique constraint: EXISTS on `tx_hash` (confirmed from schema). Good — prevents duplicates
4. USDT contract address: `0x55d398326f99059fF775485246999027B3197955` (BSC mainnet) — confirmed in config defaults
5. RPC endpoint rate-limiting risk on `eth_getLogs`
6. Block range: `last_polled_block` in user_wallets schema — confirmed
7. Poll only triggers on /dashboard/deposit page (not global layout) — confirmed
8. Request timeout risk on slow RPC calls

### Additional Guardrails (from Metis)
- MUST NOT modify apps/web/ (frontend confirmed working)
- MUST NOT add background polling (explicit out of scope)
- MUST NOT touch other hook files while cleaning dead code
- MUST verify USDT contract address is correct for BSC mainnet before deploy
- MUST verify .env on production server has blockchain vars
- MUST NOT run docker compose build without confirming current container is healthy
- SHOULD backup deposits collection before deploy (even if empty)
- SHOULD verify git diff shows exactly the correct change sites before committing

### Scope Creep to Explicitly Lock Down
- No TransactionHistory.tsx changes (separate feature)
- No unique index migration (separate PR, flag as follow-up)
- No error logging improvements (observability, not bug fix)
- No other token decimal fixes
- No defensive USDT address validation
- No additional docker-compose vars beyond what's needed for deposits

### Edge Cases Identified
1. Already-polled users — need to revisit page post-fix
2. Block range on first poll after fix — `last_polled_block` persists correctly
3. Multiple deposits from same wallet — all detected (loops all eventLogs)
4. Race condition: two tabs polling — unique constraint on tx_hash protects
5. USDT_ADDRESS env var not set in production .env
6. Deposits collection might not exist in production (undeployed migration)

## Open Questions
- Q: Should we add external cron to hit `/api/v2/deposit/poll` periodically so deposits get detected even when user isn't on the page?
- Q: Should we apply atomic commit (one commit per fix) or single squashed commit?
- Q: Is `.env` on production server already configured with the needed blockchain vars?
- Q: Do we have a real BSC tx hash + test user to verify end-to-end post-deployment?
