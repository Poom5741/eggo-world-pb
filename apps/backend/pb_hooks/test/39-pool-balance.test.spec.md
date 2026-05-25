# PocketBase Pool Balance Proxy Hook - Test Specification

## Hook File

`apps/backend/pb_hooks/39-pool-balance.pb.js`

## Purpose

Proxy GET requests from PocketBase to wallet-api pool balance endpoint.
Frontend calls PocketBase → PocketBase forwards to wallet-api → Returns response.

## Test Cases

### Test 1: Success - Forward Pool Balance Request

**Request:**

```bash
curl "http://localhost:8090/api/v2/admin/pool-balances?wallet=0x_OWNER_ADDRESS"
```

**Expected Behavior:**

- PocketBase extracts `wallet` query parameter
- Forwards request to wallet-api: `http://localhost:3001/api/v1/admin/pool-balances?wallet=0x_OWNER_ADDRESS`
- Parses JSON response from wallet-api
- Returns exact response with same status code

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

### Test 2: Error Forwarding - Not Owner (403)

**Request:**

```bash
curl "http://localhost:8090/api/v2/admin/pool-balances?wallet=0x_WRONG_ADDRESS"
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

### Test 3: Error Forwarding - Missing Wallet (401)

**Request:**

```bash
curl "http://localhost:8090/api/v2/admin/pool-balances"
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

### Test 4: Error Forwarding - Wallet API Unreachable

**Scenario:** wallet-api is down or WALLET_SRV_URL is misconfigured

**Expected Response (500):**

- PocketBase returns appropriate error
- Error code indicates upstream service unavailable

### Test 5: Configuration - WALLET_SRV_URL Resolution

**Environment Variable:**

- `WALLET_SRV_URL` (optional) - defaults to `http://localhost:3001` if not set

**Criteria:**

- Uses `$os.getenv("WALLET_SRV_URL")` to read config
- Falls back to `http://localhost:3001` if env var not set
- Properly constructs full URL with query parameters

## PocketBase Hook Requirements

### Hook Registration

```javascript
/// <hook-req>
/// type: route
/// path: /api/v2/admin/pool-balances
/// method: GET
/// </hook-req>
```

### Request Handling

1. Extract query parameter: `const wallet = e.requestInfo().query.wallet`
2. Validate wallet present (optional - wallet-api will handle)
3. Construct wallet-api URL with query parameter
4. Make HTTP GET request using `$http.send()`
5. Parse response body (handle binary buffer if needed)
6. Forward response with same status code

### HTTP Request Pattern

```javascript
const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
const response = $http.send({
  url: walletApiUrl + "/api/v1/admin/pool-balances?wallet=" + encodeURIComponent(wallet),
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
```

### Response Parsing Pattern

Follow existing pattern from `13-track-deposit.pb.js`:

- Check `response.status_code` for HTTP status
- Parse `response.body` (may be binary buffer)
- Use `JSON.parse(new TextDecoder().decode(response.body))` if needed
- Forward response using `e.json(statusCode, data)`

### No Authentication Required

- PocketBase hook does NOT check authentication
- Ownership verification happens on wallet-api side (on-chain)
- Hook simply proxies requests

## Error Handling

### wallet-api Down/Unreachable

- Return 500 with clear error message
- Indicate upstream service unavailable
- Log error for debugging

### Invalid JSON Response

- Return 500 with parsing error
- Log raw response for debugging

### Network Timeout

- Return appropriate timeout error
- Indicate wallet-api took too long to respond

## Integration Requirements

### Environment Variables

- `WALLET_SRV_URL` (optional) - wallet-api service URL
  - Default: `http://localhost:3001`
  - Docker: `http://wallet-api:3001`

### Service Discovery

- Must work in both local dev and Docker environments
- Use default `localhost:3001` for local dev
- Use `WALLET_SRV_URL` env var for Docker/deployed environments

### CORS Considerations

- PocketBase and wallet-api are on same origin in production
- No CORS issues expected (backend-to-backend communication)

## Performance Requirements

1. **Response time:** < 4 seconds total (PocketBase overhead + wallet-api call)
2. **Timeout handling:** Appropriate timeout for wallet-api calls
3. **Error recovery:** Graceful handling of wallet-api failures

## Security Requirements

1. **No auth bypass:** Does NOT skip ownership verification (delegated to wallet-api)
2. **No rate limiting bypass:** Respects any rate limits set by wallet-api
3. **No data exposure:** Only forwards responses from wallet-api, doesn't add data
4. **Input sanitization:** Properly URL-encode wallet parameter

## Testing Commands

```bash
# Start PocketBase
cd apps/backend && ./pocketbase serve

# Test proxy endpoint
curl "http://localhost:8090/api/v2/admin/pool-balances?wallet=0x_OWNER"

# Test error cases
curl "http://localhost:8090/api/v2/admin/pool-balances?wallet=0x_RANDOM"
curl "http://localhost:8090/api/v2/admin/pool-balances"
```
