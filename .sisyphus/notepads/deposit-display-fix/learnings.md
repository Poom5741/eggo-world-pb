# Learnings

## [2026-05-15] Investigation

### PocketBase 0.23.4 JSVM Constraints
- NO `setInterval`, NO `cronAdd` — background polling impossible
- Auth via `e.requestInfo().auth?.id` (NOT `$apis.requireAuth(e)`)
- DB queries: `$app.findFirstRecordByData()`, `$app.findRecordsByFilter()`
- HTTP: `fetch()` works, `$http.send()` also works

### Deposit Hook Architecture
- Active code: `checkPendingConfirmations(userId)` + 2 routerAdd endpoints
- Dead code: lines 1-217 in HEAD (pollDeposits + helpers) — references 7 undefined symbols, never called
- Working tree already has fixes: contract address + decimals + dead code removed

### Contract Addresses (BSC Mainnet)
- USDT: `0x55d398326f99059fF775485246999027B3197955` (Binance-Peg USDT, 18 decimals)
- Config key: `CONFIG.blockchain.contracts.USDT`

### Production Deployment
- Server: `root@204.168.144.14`
- SSH key: `~/.ssh/poom-server` (MISSING locally — key not present in this environment)
- Docker container: `eggo-pb`
- Hooks baked into image — must `docker compose build pocketbase` to update
- Path: `/root/eggo-world-pb/`
