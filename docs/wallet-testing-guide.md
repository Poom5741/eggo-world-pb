# Wallet Management System - Testing Guide

## Prerequisites

1. PocketBase running on port 8090
2. Wallet API running on port 3001
3. Bun runtime installed

## Setup

### 1. Start PocketBase

```bash
cd apps/backend
docker-compose up -d
```

### 2. Apply Migrations

Migrations are auto-applied when PocketBase starts. Verify collections exist:

- `users` (updated with wallet fields)
- `user_wallets` (new)
- `referrals` (new)
- `wallet_configs` (new)

### 3. Create Admin User (if not exists)

Access PocketBase Admin UI: http://localhost:8090/_/

Create admin with:
- Email: `test@eggo.io`
- Password: `testpassword123`

### 4. Install Dependencies

```bash
cd apps/backend
bun install
```

## Run Tests

```bash
cd apps/backend
bun test
```

### Run Specific Test Suite

```bash
bun test --test-name-pattern="withdrawUSDT"
bun test --test-name-pattern="Referral Chain"
```

## Manual Testing

### Test Endpoints with curl

#### 1. Get Wallet Balance

```bash
TOKEN="YOUR_AUTH_TOKEN"
WALLET_ADDRESS="0x..."

curl -X POST http://localhost:8090/api/v2/wallet/balance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_address\": \"$WALLET_ADDRESS\"}"
```

#### 2. Withdraw USDT

```bash
curl -X POST http://localhost:8090/api/v2/wallet/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_address\": \"$WALLET_ADDRESS\", \"amount\": 50}"
```

#### 3. Spend USDT

```bash
curl -X POST http://localhost:8090/api/v2/wallet/spend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_address\": \"$WALLET_ADDRESS\", \"amount\": 25, \"purpose\": \"food_item\"}"
```

#### 4. Transfer USDT

```bash
curl -X POST http://localhost:8090/api/v2/wallet/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"from_address\": \"$WALLET_ADDRESS_1\", \"to_address\": \"$WALLET_ADDRESS_2\", \"amount\": 30}"
```

#### 5. Update Tier

```bash
curl -X POST http://localhost:8090/api/v2/user/update-tier \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"user_address\": \"$WALLET_ADDRESS\", \"tier\": \"gold\"}"
```

## Test Checklist

### Schema Validation
- [ ] `users` collection has wallet fields (usdt_balance, usdt_total_earned, etc.)
- [ ] `user_wallets` collection created with correct fields
- [ ] `referrals` collection created with level field
- [ ] `wallet_configs` collection created with WITHDRAWAL_FEE = 0.05

### Hook Validation
- [ ] Hook 01: Auto-creates UserWallet on user signup
- [ ] Hook 05: Creates 4-level referral chain
- [ ] Hook 06: Returns wallet balance
- [ ] Hook 07: Withdraws USDT with fee
- [ ] Hook 08: Spends USDT and tracks food items
- [ ] Hook 09: Transfers USDT P2P
- [ ] Hook 10: Updates tier (no downgrades)

### Functional Tests
- [ ] User signup creates UserWallet with 0 balance
- [ ] getWalletBalance returns correct data
- [ ] withdrawUSDT deducts 5% fee
- [ ] spendUSDT decrements balance
- [ ] spendUSDT with food_item increments lifetime_food_items
- [ ] transferUSDT moves funds between wallets
- [ ] Referral chain creates G1-G4 relationships
- [ ] total_direct_recruits updates correctly
- [ ] Tier upgrades work, downgrades rejected
- [ ] INSUFFICIENT_BALANCE errors returned correctly
- [ ] All USDT immediately spendable (no locks)

## Error Codes Reference

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Missing or invalid parameters |
| `WALLET_NOT_FOUND` | User wallet doesn't exist |
| `USER_NOT_FOUND` | User doesn't exist |
| `INSUFFICIENT_BALANCE` | Not enough USDT |
| `INVALID_TIER` | Invalid tier name |
| `BALANCE_FETCH_FAILED` | Error fetching balance |
| `WITHDRAWAL_FAILED` | Error processing withdrawal |
| `SPEND_FAILED` | Error processing spend |
| `TRANSFER_FAILED` | Error processing transfer |
| `TIER_UPDATE_FAILED` | Error updating tier |

## Troubleshooting

### Hooks Not Firing

1. Check PocketBase logs: `docker-compose logs -f`
2. Verify hooks are loaded: Look for "Setting up..." messages
3. Restart PocketBase: `docker-compose restart`

### Migration Issues

1. Check migrations directory: `ls -la pb_migrations/`
2. Verify migration syntax
3. Re-apply migrations from Admin UI

### Test Failures

1. Ensure admin user exists with correct credentials
2. Check PocketBase is running on port 8090
3. Verify test cleanup doesn't interfere

## Next Steps

After successful testing:

1. Update production PocketBase with migrations
2. Deploy hooks to production
3. Configure WITHDRAWAL_FEE in wallet_configs
4. Monitor hook logs in production
