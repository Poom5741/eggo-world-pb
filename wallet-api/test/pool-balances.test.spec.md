# Pool Balances Endpoint - Test Specification

## Endpoint

`GET /api/v1/admin/pool-balances`

## Purpose

Read-only endpoint to fetch treasury and CoinStor pool balances from CommissionDistribution contract.
Ownership verification via on-chain `owner()` check.

## Test Cases

### Test 1: Success - Contract Owner Requests Balances

**Request:**

```bash
curl "http://localhost:3001/api/v1/admin/pool-balances?wallet=0x_CONTRACT_OWNER"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "treasury": {
      "wei": "1234567890000000000000",
      "usdt": "1234.56"
    },
    "coinstor": {
      "wei": "567890000000000000000",
      "usdt": "567.89"
    }
  }
}
```

**Criteria:**

- Returns 200 status
- Both treasury and coinstor balances present
- Wei values are strings (BigNumbers)
- USDT values formatted to 2 decimal places
- Balances fetched from `commissionBalances(treasury)` and `commissionBalances(coinStorReserve)`

### Test 2: Authorization Error - Not Contract Owner

**Request:**

```bash
curl "http://localhost:3001/api/v1/admin/pool-balances?wallet=0x_RANDOM_ADDRESS"
```

**Expected Response (403):**

```json
{
  "success": false,
  "error": {
    "message": "Not a contract owner",
    "code": "NOT_OWNER"
  }
}
```

**Criteria:**

- Returns 403 status
- Error code "NOT_OWNER"
- Clear error message
- No balance data exposed

### Test 3: Authorization Error - Missing Wallet Parameter

**Request:**

```bash
curl "http://localhost:3001/api/v1/admin/pool-balances"
```

**Expected Response (401):**

```json
{
  "success": false,
  "error": {
    "message": "Wallet address is required",
    "code": "AUTH_REQUIRED"
  }
}
```

**Criteria:**

- Returns 401 status
- Error code "AUTH_REQUIRED"
- Missing parameter clearly indicated

### Test 4: Configuration Error - Contract Not Found

**Scenario:** CHAIN_ID has no commission address configured

**Expected Response (500):**

```json
{
  "success": false,
  "error": {
    "message": "CommissionDistribution contract not configured for this chain",
    "code": "CONFIG_ERROR"
  }
}
```

### Test 5: RPC Error - Blockchain Read Failure

**Scenario:** RPC URL unreachable or times out

**Expected Response (500):**

```json
{
  "success": false,
  "error": {
    "message": "Failed to fetch pool balances",
    "code": "BALANCE_FETCH_FAILED"
  }
}
```

## Contract Interaction Requirements

### ABI Functions Used:

1. `function owner() view returns (address)` - Ownership verification
2. `function treasury() view returns (address)` - Get treasury address
3. `function coinStorReserve() view returns (address)` - Get CoinStor address
4. `function commissionBalances(address) view returns (uint256)` - Get balance for address

### USDT Decimals:

- 18 decimals (BSC USDT)
- Conversion: `wei / 10^18` = USDT amount
- Format to 2 decimal places for display

### Contract Address Source:

- `CONTRACT_ADDRESSES[CHAIN_ID].commission` from `contract-addresses.json`

## Multi-Chain Support

**Supported Chains:**

- BSC Mainnet (CHAIN_ID: 56)
- BSC Testnet (CHAIN_ID: 97)
- 0xl3 (CHAIN_ID: 7117)

**Criteria:**

- Endpoint works on all configured chains
- Uses correct contract address per chain
- Uses correct RPC URL per chain

## Security Requirements

1. **Read-only operations only** - No state changes
2. **Ownership verification** - Must match `contract.owner()`
3. **No admin keys required** - Uses read-only provider
4. **Rate limiting applies** - Inherited from app-wide rate limiter

## Performance Requirements

1. **Response time:** < 3 seconds for successful requests
2. **Timeout handling:** RPC calls timeout appropriately
3. **Error recovery:** Graceful handling of RPC failures
