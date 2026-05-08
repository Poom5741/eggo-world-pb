#!/usr/bin/env bash
# E2E Bootstrap - Option B: Full Local Environment
#
# Brings up the full local stack and seeds it with everything needed to run
# the Playwright journey tests end-to-end without touching production.
#
# Steps:
#   1. Reset pb_data.e2e (fresh DB)
#   2. docker compose up (anvil, pocketbase, wallet-api, frontend)
#   3. Wait for services to become healthy
#   4. Create local PocketBase superuser (0.23.x)
#   5. Seed test users
#   6. Deploy test contracts on local Anvil (forge script)
#   7. Mint test NFTs / USDT / commission
#   8. Sync blockchain data to local PocketBase
#
# Usage: ./scripts/e2e-bootstrap.sh
# Environment:
#   PB_ADMIN_EMAIL    (default: admin@e2e.local)
#   PB_ADMIN_PASSWORD (default: admin_e2e_password)
#   SKIP_DEPLOY=1     Skip forge deploy (reuse existing contracts)
#   SKIP_MINT=1       Skip minting test data
#   SKIP_SYNC=1       Skip syncing to PocketBase
#
set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PB_ADMIN_EMAIL="${PB_ADMIN_EMAIL:-admin@e2e.local}"
PB_ADMIN_PASSWORD="${PB_ADMIN_PASSWORD:-admin_e2e_password}"
POCKETBASE_URL="${POCKETBASE_URL:-http://localhost:8091}"
ANVIL_RPC_URL="${ANVIL_RPC_URL:-http://localhost:8545}"
# Foundry default deployer (Anvil account 0)
DEPLOYER_PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

export POCKETBASE_URL ANVIL_RPC_URL PB_ADMIN_EMAIL PB_ADMIN_PASSWORD

log() { printf '\033[1;34m[e2e]\033[0m %s\n' "$*"; }
ok() { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m  !\033[0m %s\n' "$*"; }

log "1. Resetting pb_data.e2e (fresh local DB)"
rm -rf apps/backend/pb_data.e2e
mkdir -p apps/backend/pb_data.e2e
ok "pb_data.e2e reset"

log "2. Starting docker compose stack (anvil + pocketbase + wallet-api + frontend)"
docker compose -f docker-compose.e2e.yml up -d --build
ok "containers started"

log "3. Waiting for services to become healthy (anvil, pocketbase, wallet-api)"
for svc in e2e-anvil e2e-pocketbase e2e-wallet-api; do
  printf '   waiting for %-20s' "$svc..."
  for _ in $(seq 1 60); do
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$svc" 2>/dev/null || echo 'missing')
    if [ "$status" = "healthy" ] || [ "$status" = "no-healthcheck" ]; then
      echo " $status"
      break
    fi
    sleep 2
  done
  if [ "$status" != "healthy" ] && [ "$status" != "no-healthcheck" ]; then
    echo " TIMEOUT ($status)"
    echo "  Last logs for $svc:"
    docker logs --tail=40 "$svc" || true
    exit 1
  fi
done

log "4. Creating local PocketBase superuser ($PB_ADMIN_EMAIL)"
# `pocketbase superuser upsert` is idempotent in 0.23.x
docker exec e2e-pocketbase /pb/pocketbase superuser upsert \
  "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir /pb_data >/dev/null
ok "superuser ready"

log "5. Seeding test users via admin API"
POCKETBASE_URL="$POCKETBASE_URL" \
PB_ADMIN_EMAIL="$PB_ADMIN_EMAIL" \
PB_ADMIN_PASSWORD="$PB_ADMIN_PASSWORD" \
  bun run scripts/seed-test-users.ts
ok "test users seeded"

if [ "${SKIP_DEPLOY:-0}" != "1" ]; then
  log "6. Deploying test contracts to local Anvil"
  (
    cd contracts
    forge script script/DeployTestContracts.s.sol:DeployTestContracts \
      --rpc-url "$ANVIL_RPC_URL" \
      --private-key "$DEPLOYER_PRIVATE_KEY" \
      --broadcast \
      --chain-id 7117 \
      --tc DeployTestContracts
  )
  ok "contracts deployed"
else
  warn "SKIP_DEPLOY=1, reusing existing contracts"
fi

if [ "${SKIP_MINT:-0}" != "1" ]; then
  log "7. Minting test NFTs + USDT + commission"
  ANVIL_RPC_URL="$ANVIL_RPC_URL" node scripts/mint-test-data.js
  ok "blockchain test data minted"
else
  warn "SKIP_MINT=1, skipping minting"
fi

if [ "${SKIP_SYNC:-0}" != "1" ]; then
  log "8. Syncing blockchain state to local PocketBase"
  POCKETBASE_URL="$POCKETBASE_URL" \
  ANVIL_RPC_URL="$ANVIL_RPC_URL" \
    node scripts/sync-blockchain-to-pocketbase.js
  ok "PocketBase in sync with chain"
else
  warn "SKIP_SYNC=1, skipping PocketBase sync"
fi

cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Local E2E stack ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PocketBase   : $POCKETBASE_URL
  Anvil RPC    : $ANVIL_RPC_URL  (chain id 7117)
  Wallet API   : http://localhost:3001
  Frontend     : http://localhost:3000

Next:
  POCKETBASE_URL=$POCKETBASE_URL \\
  ANVIL_RPC_URL=$ANVIL_RPC_URL \\
  WALLET_API_URL=http://localhost:3001 \\
  E2E_BASE_URL=http://localhost:3000 \\
    bun run test:e2e

Teardown: docker compose -f docker-compose.e2e.yml down -v
EOF
