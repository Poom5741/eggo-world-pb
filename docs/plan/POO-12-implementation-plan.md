# POO-12 Implementation Plan: Wallet Management System with EIP-7702

**Status:** In Progress (85% Complete)  
**Priority:** URGENT - Critical Path  
**Timeline:** 1-Week Sprint (Aggressive)  
**Focus:** EIP-7702 Account Abstraction Implementation  
**Owner:** Backend Team  
**Reviewer:** CTO/Security Lead

---

## Executive Summary

This is a **comprehensive implementation plan** for completing POO-12 (Wallet Management System) with primary focus on EIP-7702 account abstraction features. The migration from the legacy `wallet-api` to the new `wallet-srv` with dacc-js is 85% complete, with core wallet features production-ready.

### Current State (As of 2026-03-31)

```
✅ Phase 1: Foundation Tests        100% Complete
✅ Phase 2: Wallet Service          100% Complete
✅ Phase 3: Collections Schema      100% Complete
✅ Phase 4: PocketBase Hooks        100% Complete
✅ Phase 5: Chain-Based API         100% Complete
🔨 Phase 6: EIP-7702 Support        40% Complete (STUBBED - Priority Focus)
✅ Phase 7: API Compatibility       100% Complete
⚠️  Phase 8: Testing                40% Complete (In Progress)
```

### What's Working Today

- ✅ Wallet creation via dacc-js (`/api/v1/wallet/create`)
- ✅ Chain-based send native API (`/api/v1/{chainId}/send-native`)
- ✅ Chain-based send token API (`/api/v1/{chainId}/send-token`)
- ✅ Chain-based write contract API (`/api/v1/{chainId}/write-contract`)
- ✅ Chain-based sign typed data API (`/api/v1/{chainId}/sign-typed-data`)
- ✅ PocketBase hooks using new field names (`wallet`, `daccPublickey`, `pin`)
- ✅ Legacy API compatibility layer (`/api/wallet/create`, `/api/wallet/send`)
- ✅ Auto-wallet creation on user signup (hook `01`)

### What Needs Implementation (This Sprint)

1. 🔨 **EIP-7702 Full Implementation** (Priority #1)
   - Replace stub implementations with real dacc-js integration
   - Implement paymaster integration for gasless transactions
   - Add PocketBase hooks for EIP-7702 flows
   - Write comprehensive tests

2. ⚠️ **Database Migration Script** (Required for Production)
   - Create SQL migration for existing users
   - Field rename: `wallet_address` → `wallet`
   - Field rename: `publicKey` → `daccPublickey`
   - Remove: `encrypted_private_key`
   - Add: `pin`, `eip7702_enabled`, `eip7702_hash`

3. 🧪 **Expanded Test Coverage** (Required for Confidence)
   - Integration tests for all hooks
   - API endpoint tests for wallet-srv
   - E2E tests for critical user flows
   - EIP-7702 specific tests

---

## 1-Week Sprint Timeline

### Day 1: EIP-7702 Deep Dive & Planning

**Morning (RED Phase)**

- [ ] Write comprehensive failing tests for EIP-7702 flows
- [ ] Test: Authorize smart account delegation
- [ ] Test: Check EIP-7702 status on-chain
- [ ] Test: Execute gasless transaction via paymaster

**Afternoon (Research)**

- [ ] Study dacc-js EIP-7702 API documentation
- [ ] Review reference implementation in `/resources/pkbase-wallet/`
- [ ] Identify paymaster providers for BSC (chainId 56)
- [ ] Document EIP-7702 workflow for team

**Deliverables:**

- ✅ `wallet-srv/test/eip7702/eip7702-full.test.ts` (comprehensive test suite)
- ✅ EIP-7702 workflow diagram
- ✅ Paymaster provider shortlist

---

### Day 2-3: EIP-7702 Implementation (GREEN Phase)

**Day 2: Core Implementation**

**Morning: wallet-srv Routes**

- [ ] Update `wallet-srv/src/routes/eip7702Router.ts`
  - Replace stub `POST /authorize` with dacc-js integration
  - Replace stub `GET /status` with on-chain status check
  - Add `POST /execute` for paymaster transactions

**Afternoon: Testing**

- [ ] Run EIP-7702 tests
- [ ] Fix failing tests
- [ ] Verify authorization flow works

**Day 3: PocketBase Hooks & Integration**

**Morning: Hook Implementation**

- [ ] Create `11-eip7702-authorize.pb.js`
- [ ] Create `12-eip7702-get-hash.pb.js`
- [ ] Create `13-eip7702-sign-with-dacc.pb.js`
- [ ] Create `14-eip7702-status.pb.js`
- [ ] Create `15-eip7702-paymaster-execute.pb.js`

**Afternoon: Integration Testing**

- [ ] Test hooks with wallet-srv
- [ ] Verify end-to-end EIP-7702 flow
- [ ] Test error scenarios

**Deliverables:**

- ✅ Fully functional EIP-7702 router
- ✅ 5 new PocketBase hooks
- ✅ All EIP-7702 tests passing
- ✅ Integration tests passing

---

### Day 4: Database Migration & Testing

**Morning: Migration Script**

- [ ] Create `apps/backend/pb_migrations/1730350800_wallet_srv_migration.sql`

  ```sql
  -- Rename fields
  ALTER TABLE users RENAME COLUMN wallet_address TO wallet;
  ALTER TABLE users RENAME COLUMN publicKey TO daccPublickey;

  -- Remove old field
  ALTER TABLE users DROP COLUMN encrypted_private_key;

  -- Add new fields
  ALTER TABLE users ADD COLUMN pin TEXT;
  ALTER TABLE users ADD COLUMN eip7702_enabled BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN eip7702_hash TEXT;
  ```

**Afternoon: Test Expansion**

- [ ] Add integration tests for all hooks
- [ ] Add API tests for wallet-srv endpoints
- [ ] Add E2E test for wallet creation flow
- [ ] Add E2E test for EIP-7702 authorization flow

**Deliverables:**

- ✅ Database migration script
- ✅ Comprehensive test suite (80%+ coverage)
- ✅ All tests passing

---

### Day 5: Documentation, Polish & Deployment Prep

**Morning: Documentation**

- [ ] Update `wallet-srv/README.md` with EIP-7702 examples
- [ ] Create `docs/eip7702-integration-guide.md`
- [ ] Document paymaster configuration
- [ ] Update API documentation

**Afternoon: Deployment Preparation**

- [ ] Create deployment checklist
- [ ] Test Docker Compose locally
- [ ] Verify health checks
- [ ] Prepare rollback plan
- [ ] Security review with CTO

**Evening: Sprint Review**

- [ ] Demo EIP-7702 flow
- [ ] Review test coverage report
- [ ] Identify remaining technical debt
- [ ] Plan next sprint (if needed)

**Deliverables:**

- ✅ Complete documentation
- ✅ Deployment checklist
- ✅ Security review sign-off
- ✅ Sprint retrospective

---

## EIP-7702 Technical Specification

### What is EIP-7702?

EIP-7702 introduces **account abstraction** by allowing EOAs (Externally Owned Accounts) to temporarily delegate code execution to a smart contract for a single transaction. This enables:

1. **Gasless Transactions**: Paymaster sponsors gas fees
2. **Smart Account Features**: Batch operations, spending limits, social recovery
3. **Backward Compatibility**: Works with existing wallets (no migration needed)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User's Browser                        │
│  (Frontend calls PocketBase API)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              PocketBase Backend                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 11-eip7702-authorize.pb.js                       │   │
│  │ - Requires auth                                  │   │
│  │ - Validates smartAccount address                 │   │
│  │ - Calls wallet-srv /authorize                    │   │
│  │ - Updates user.eip7702_hash                      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 15-eip7702-paymaster-execute.pb.js               │   │
│  │ - Requires auth                                  │   │
│  │ - Validates transaction params                   │   │
│  │ - Calls wallet-srv /execute                      │   │
│  │ - Returns transaction hash                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 wallet-srv                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ eip7702Router.ts                                 │   │
│  │ POST /authorize                                  │   │
│  │ - Uses dacc-js to sign EIP-7702 auth            │   │
│  │ - Returns authorization hash                     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ POST /execute (NEW)                              │   │
│  │ - Uses dacc-js to execute via paymaster         │   │
│  │ - Returns transaction hash                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              BSC Network (Chain ID 56)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Paymaster Contract                               │   │
│  │ - Validates sponsorship criteria                │   │
│  │ - Pays gas fees on behalf of user               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. wallet-srv: `eip7702Router.ts` (Updated)

```typescript
import { Dacc } from "dacc-js"
import { Router } from "express"

const router = Router()

// POST /api/v2/eip7702/authorize
router.post("/authorize", async (req, res) => {
  try {
    const { daccPublickey, passwordSecretkey, address, smartAccount, chainId = 56 } = req.body

    // Validate required fields
    if (!daccPublickey || !passwordSecretkey || !address || !smartAccount) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing required fields",
          code: "MISSING_REQUIRED_FIELDS",
        },
      })
    }

    // Get network config
    const network = getNetworkByChainId(chainId)
    if (!network) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported chain ID: ${chainId}`,
          code: "UNSUPPORTED_CHAIN",
        },
      })
    }

    // Use dacc-js to create EIP-7702 authorization
    const dacc = new Dacc()
    const authResult = await dacc.eip7702Authorize({
      daccPublickey,
      passwordSecretkey,
      address,
      smartAccount,
      network,
    })

    // Update PocketBase user record (caller's responsibility)
    // e.auth.set("eip7702_enabled", true);
    // e.auth.set("eip7702_hash", authResult.authorizationHash);

    res.json({
      success: true,
      data: {
        hash: authResult.authorizationHash,
        smartAccount,
        chainId,
        status: "authorized",
        expiresAt: authResult.expiresAt, // Block number or timestamp
      },
    })
  } catch (error: any) {
    console.error("EIP-7702 authorize error:", error)
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: "EIP7702_AUTH_FAILED",
      },
    })
  }
})

// POST /api/v2/eip7702/execute (NEW)
router.post("/execute", async (req, res) => {
  try {
    const {
      daccPublickey,
      passwordSecretkey,
      address,
      to,
      data,
      value = "0",
      smartAccount,
      chainId = 56,
    } = req.body

    // Validate required fields
    if (!daccPublickey || !passwordSecretkey || !address || !to || !smartAccount) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing required fields",
          code: "MISSING_REQUIRED_FIELDS",
        },
      })
    }

    // Get network config
    const network = getNetworkByChainId(chainId)
    if (!network) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported chain ID: ${chainId}`,
          code: "UNSUPPORTED_CHAIN",
        },
      })
    }

    // Use dacc-js to execute via paymaster
    const dacc = new Dacc()
    const result = await dacc.eip7702Execute({
      daccPublickey,
      passwordSecretkey,
      address,
      smartAccount,
      to,
      data,
      value,
      network,
    })

    res.json({
      success: true,
      data: {
        transactionHash: result.txHash,
        from: address,
        to: to,
        value: value,
        smartAccount: smartAccount,
        network: network.name,
        chainId: chainId,
        gasSponsored: true, // Paymaster paid gas
      },
    })
  } catch (error: any) {
    console.error("EIP-7702 execute error:", error)
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: "EIP7702_EXECUTE_FAILED",
      },
    })
  }
})

// GET /api/v2/eip7702/status
router.get("/status", async (req, res) => {
  try {
    const { address, chainId = 56 } = req.query

    if (!address) {
      return res.status(400).json({
        success: false,
        error: {
          message: "address is required",
          code: "MISSING_ADDRESS",
        },
      })
    }

    // Get network config
    const network = getNetworkByChainId(parseInt(chainId as string))
    if (!network) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported chain ID: ${chainId}`,
          code: "UNSUPPORTED_CHAIN",
        },
      })
    }

    // Check EIP-7702 status on-chain
    const dacc = new Dacc()
    const status = await dacc.eip7702Status({
      address,
      network,
    })

    res.json({
      success: true,
      data: {
        address: address,
        eip7702Enabled: status.isEnabled,
        delegateAddress: status.delegate,
        authorizationHash: status.authorizationHash,
        expiresAt: status.expiresAt,
        chainId: parseInt(chainId as string),
        network: network.name,
      },
    })
  } catch (error: any) {
    console.error("EIP-7702 status error:", error)
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: "EIP7702_STATUS_FAILED",
      },
    })
  }
})

function getNetworkByChainId(chainId: number) {
  const networks: Record<number, any> = {
    56: {
      rpc: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      name: "BSC",
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    },
    97: {
      rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      name: "BSC Testnet",
      nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
    },
    1: {
      rpc: "https://mainnet.infura.io/v3/" + process.env.INFURA_KEY,
      chainId: 1,
      name: "Ethereum",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    },
    137: {
      rpc: "https://polygon-rpc.com",
      chainId: 137,
      name: "Polygon",
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    },
  }
  return networks[chainId]
}

export default router
```

#### 2. PocketBase Hook: `11-eip7702-authorize.pb.js`

```javascript
// ===== EIP-7702 AUTHORIZATION HOOK =====
// Enables account abstraction for sponsored transactions

console.log("Setting up EIP-7702 authorization hook...")

const WALLET_SRV_URL = process.env.WALLET_SRV_URL || "http://wallet-srv:3000"

routerAdd("POST", "/api/v2/eip7702/authorize", (e) => {
  console.log("EIP-7702 authorization hook triggered")

  try {
    // Require authentication
    const authRecord = $apis.requireAuth(e)
    if (!authRecord) {
      throw new Error("User authentication required")
    }

    // Parse request body
    let requestBody
    try {
      const bodyStr = toString(e.request.body)
      requestBody = JSON.parse(bodyStr)
    } catch (parseError) {
      throw new Error("Invalid JSON in request body")
    }

    // Validate required fields
    if (!requestBody.smartAccount) {
      throw new Error("smartAccount address is required")
    }

    // Get user wallet information
    const wallet = e.auth.getString("wallet")
    const daccPublickey = e.auth.getString("daccPublickey")
    const passwordSecretkey = e.auth.getString("pin")

    if (!wallet || !daccPublickey || !passwordSecretkey) {
      throw new Error("User wallet information not found")
    }

    // Call wallet-srv for EIP-7702 authorization
    const apiUrl = `${WALLET_SRV_URL}/api/v2/eip7702/authorize`
    const walletRequest = {
      daccPublickey: daccPublickey,
      passwordSecretkey: passwordSecretkey,
      address: wallet,
      smartAccount: requestBody.smartAccount,
      chainId: requestBody.chainId || 56,
    }

    const response = $http.send({
      url: apiUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(walletRequest),
    })

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Wallet-srv returned status ${response.statusCode}`)
    }

    let responseBody = response.body
    if (typeof response.body === "object" && response.body.length !== undefined) {
      responseBody = String.fromCharCode.apply(null, response.body)
    }

    const responseData = JSON.parse(responseBody)

    if (!responseData.success) {
      throw new Error(`EIP-7702 authorization failed: ${responseData.error?.message}`)
    }

    // Update user record
    e.auth.set("eip7702_enabled", true)
    e.auth.set("eip7702_hash", responseData.data.hash)
    $app.save(e.auth)

    console.log("EIP-7702 authorized for user:", authRecord.id)

    return e.json(200, {
      success: true,
      data: {
        hash: responseData.data.hash,
        smartAccount: requestBody.smartAccount,
        chainId: responseData.data.chainId,
        status: responseData.data.status,
      },
    })
  } catch (error) {
    console.error("EIP-7702 authorization error:", error)
    return e.json(400, {
      success: false,
      error: {
        message: error.message,
        code: "EIP7702_AUTH_FAILED",
      },
    })
  }
})

console.log("EIP-7702 authorization hook registered")
```

#### 3. PocketBase Hook: `15-eip7702-paymaster-execute.pb.js`

```javascript
// ===== EIP-7702 PAYMASTER EXECUTION HOOK =====
// Executes transactions via paymaster (gasless)

console.log("Setting up EIP-7702 paymaster execution hook...")

const WALLET_SRV_URL = process.env.WALLET_SRV_URL || "http://wallet-srv:3000"

routerAdd("POST", "/api/v2/eip7702/execute", (e) => {
  console.log("EIP-7702 paymaster execution hook triggered")

  try {
    // Require authentication
    const authRecord = $apis.requireAuth(e)
    if (!authRecord) {
      throw new Error("User authentication required")
    }

    // Parse request body
    let requestBody
    try {
      const bodyStr = toString(e.request.body)
      requestBody = JSON.parse(bodyStr)
    } catch (parseError) {
      throw new Error("Invalid JSON in request body")
    }

    // Validate required fields
    if (!requestBody.to || !requestBody.smartAccount) {
      throw new Error("to and smartAccount addresses are required")
    }

    // Get user wallet information
    const wallet = e.auth.getString("wallet")
    const daccPublickey = e.auth.getString("daccPublickey")
    const passwordSecretkey = e.auth.getString("pin")
    const eip7702Enabled = e.auth.getBool("eip7702_enabled")

    if (!wallet || !daccPublickey || !passwordSecretkey) {
      throw new Error("User wallet information not found")
    }

    if (!eip7702Enabled) {
      throw new Error("EIP-7702 not enabled for this user")
    }

    // Call wallet-srv for paymaster execution
    const apiUrl = `${WALLET_SRV_URL}/api/v2/eip7702/execute`
    const walletRequest = {
      daccPublickey: daccPublickey,
      passwordSecretkey: passwordSecretkey,
      address: wallet,
      smartAccount: requestBody.smartAccount,
      to: requestBody.to,
      data: requestBody.data || "0x",
      value: requestBody.value || "0",
      chainId: requestBody.chainId || 56,
    }

    const response = $http.send({
      url: apiUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(walletRequest),
    })

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Wallet-srv returned status ${response.statusCode}`)
    }

    let responseBody = response.body
    if (typeof response.body === "object" && response.body.length !== undefined) {
      responseBody = String.fromCharCode.apply(null, response.body)
    }

    const responseData = JSON.parse(responseBody)

    if (!responseData.success) {
      throw new Error(`EIP-7702 execution failed: ${responseData.error?.message}`)
    }

    console.log("EIP-7702 transaction executed:", responseData.data.transactionHash)

    return e.json(200, {
      success: true,
      data: responseData.data,
    })
  } catch (error) {
    console.error("EIP-7702 execution error:", error)
    return e.json(400, {
      success: false,
      error: {
        message: error.message,
        code: "EIP7702_EXECUTE_FAILED",
      },
    })
  }
})

console.log("EIP-7702 paymaster execution hook registered")
```

---

## Test Suite

### EIP-7702 Comprehensive Tests

**File**: `wallet-srv/test/eip7702/eip7702-full.test.ts`

```typescript
import { describe, test, expect, beforeEach } from "bun:test"

describe("EIP-7702 Account Abstraction - Full Suite", () => {
  const TEST_WALLET = {
    daccPublickey: "daccPublickey_test_0x1234567890123456789012345678901234567890",
    passwordSecretkey: "TestPassword123!@#",
    address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
    smartAccount: "0xSmartAccount1234567890123456789012345678901234",
  }

  describe("POST /api/v2/eip7702/authorize", () => {
    test("should authorize EIP-7702 for smart account", async () => {
      const response = await fetch("http://localhost:3001/api/v2/eip7702/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daccPublickey: TEST_WALLET.daccPublickey,
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          smartAccount: TEST_WALLET.smartAccount,
          chainId: 56,
        }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
      expect(body.data.smartAccount).toBe(TEST_WALLET.smartAccount)
      expect(body.data.chainId).toBe(56)
      expect(body.data.status).toBe("authorized")
    })

    test("should require daccPublickey", async () => {
      const response = await fetch("http://localhost:3001/api/v2/eip7702/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          smartAccount: TEST_WALLET.smartAccount,
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe("MISSING_REQUIRED_FIELDS")
    })

    test("should reject unsupported chain ID", async () => {
      const response = await fetch("http://localhost:3001/api/v2/eip7702/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daccPublickey: TEST_WALLET.daccPublickey,
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          smartAccount: TEST_WALLET.smartAccount,
          chainId: 99999,
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe("UNSUPPORTED_CHAIN")
    })
  })

  describe("POST /api/v2/eip7702/execute", () => {
    test("should execute transaction via paymaster", async () => {
      const response = await fetch("http://localhost:3001/api/v2/eip7702/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daccPublickey: TEST_WALLET.daccPublickey,
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          smartAccount: TEST_WALLET.smartAccount,
          to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
          data: "0x",
          value: "0",
          chainId: 56,
        }),
      })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
      expect(body.data.gasSponsored).toBe(true)
    })

    test("should require smartAccount for execution", async () => {
      const response = await fetch("http://localhost:3001/api/v2/eip7702/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daccPublickey: TEST_WALLET.daccPublickey,
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
        }),
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe("MISSING_REQUIRED_FIELDS")
    })
  })

  describe("GET /api/v2/eip7702/status", () => {
    test("should get EIP-7702 status", async () => {
      const response = await fetch(
        "http://localhost:3001/api/v2/eip7702/status?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45&chainId=56"
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.address).toBe("0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45")
      expect(typeof body.data.eip7702Enabled).toBe("boolean")
      expect(body.data.chainId).toBe(56)
    })

    test("should require address parameter", async () => {
      const response = await fetch("http://localhost:3001/api/v2/eip7702/status")

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe("MISSING_ADDRESS")
    })
  })
})
```

---

## Paymaster Provider Options

### Option 1: BSC Native Paymaster (Recommended for Production)

**Provider**: BSC Official Paymaster  
**Network**: BSC Mainnet (56)  
**Setup**: Contact BSC team for access  
**Cost**: Pay per transaction

### Option 2: Self-Hosted Paymaster

**Contract**: Deploy own paymaster contract  
**Network**: Any EVM chain  
**Setup**: Deploy contract, fund with BNB  
**Cost**: Gas fees + maintenance

### Option 3: Third-Party Paymaster Services

**Providers**:

- Biconomy
- GasStation
- OpenZeppelin Defender

**Setup**: API integration  
**Cost**: Subscription + usage fees

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`bun test` in wallet-srv)
- [ ] All hook tests passing (`bun test` in apps/backend)
- [ ] EIP-7702 integration tested end-to-end
- [ ] Database migration script reviewed
- [ ] Docker Compose builds successfully
- [ ] Health checks configured
- [ ] Environment variables documented
- [ ] Security review completed

### Deployment Steps

1. **Stop Services**

   ```bash
   docker-compose down
   ```

2. **Backup Database**

   ```bash
   cp apps/backend/pb_data/data.db apps/backend/pb_data/data.db.backup
   ```

3. **Apply Migration**

   ```bash
   cd apps/backend
   ./pocketbase migrate up
   ```

4. **Start Services**

   ```bash
   docker-compose up -d
   ```

5. **Verify Health**

   ```bash
   curl http://localhost:3001/health
   curl http://localhost:8090/api/health
   ```

6. **Test EIP-7702 Flow**
   ```bash
   # Create test user
   # Authorize EIP-7702
   # Execute gasless transaction
   ```

### Rollback Plan

If deployment fails:

1. **Restore Database**

   ```bash
   cp apps/backend/pb_data/data.db.backup apps/backend/pb_data/data.db
   ```

2. **Restart Services**

   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Verify Rollback**
   ```bash
   curl http://localhost:8090/api/health
   ```

---

## Success Criteria

POO-12 is considered **complete** when:

- [ ] ✅ All existing criteria (from TDG plan) met
- [ ] ✅ EIP-7702 authorization works end-to-end
- [ ] ✅ EIP-7702 paymaster execution works
- [ ] ✅ All 5 EIP-7702 hooks implemented and tested
- [ ] ✅ Database migration script created and tested
- [ ] ✅ Test coverage > 80% for wallet-srv
- [ ] ✅ Test coverage > 80% for PocketBase hooks
- [ ] ✅ Documentation complete
- [ ] ✅ Security review sign-off
- [ ] ✅ Team trained on EIP-7702 workflow

---

## Risk Assessment

### High Risk

1. **dacc-js EIP-7702 API Incomplete**
   - **Mitigation**: Contact dacc-js team, fallback to stub implementation
   - **Contingency**: Defer EIP-7702 to next sprint

2. **Paymaster Integration Complexity**
   - **Mitigation**: Start with testnet, use third-party service initially
   - **Contingency**: Launch without paymaster, add later

### Medium Risk

1. **Database Migration Data Loss**
   - **Mitigation**: Test on staging first, backup production DB
   - **Contingency**: Rollback plan ready

2. **Performance Impact**
   - **Mitigation**: Load test EIP-7702 endpoints
   - **Contingency**: Rate limiting, async processing

### Low Risk

1. **Documentation Gaps**
   - **Mitigation**: Assign tech writer, peer review
   - **Contingency**: Add to next sprint backlog

---

## Team Responsibilities

| Role                | Responsibilities                          |
| ------------------- | ----------------------------------------- |
| **Backend Lead**    | EIP-7702 implementation, hook development |
| **DevOps Engineer** | Docker setup, deployment automation       |
| **QA Engineer**     | Test suite expansion, E2E testing         |
| **Security Lead**   | Security review, paymaster vetting        |
| **Tech Writer**     | Documentation, API reference              |
| **Product Owner**   | Prioritization, stakeholder communication |

---

## Next Steps (Post-POO-12)

### Sprint 2: Polish & Optimization

- Performance optimization
- Advanced EIP-7702 features
- Multi-chain paymaster support
- Monitoring & alerting

### Sprint 3: Scale & Deploy

- Production deployment
- Load testing
- Disaster recovery setup
- Team training

---

## References

- **TDG Migration Plan**: `/docs/plan/tdg-migration-plan.md`
- **Reference Implementation**: `/resources/pkbase-wallet/`
- **dacc-js Documentation**: `/resources/pkbase-wallet/dacc-js/docs/`
- **EIP-7702 Specification**: https://eips.ethereum.org/EIPS/eip-7702
- **BSC Paymaster Guide**: https://docs.bnbchain.org/

---

**Document Version:** 1.0  
**Created:** 2026-03-31  
**Last Updated:** 2026-03-31  
**Status:** Ready for Implementation  
**Approval:** Pending CTO Review
