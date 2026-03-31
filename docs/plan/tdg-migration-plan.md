# TDG Migration Plan: Current → Reference Implementation

## Executive Summary

This document outlines a **Test-Driven Generation (TDG)** migration plan to transition the EggoWorld backend from the current wallet-api implementation to the dacc-js-based reference implementation found in `/resources/pkbase-wallet/`.

### Migration Goals
1. ✅ Replace custom wallet encryption with **dacc-js** library
2. ✅ Add **EIP-7702** account abstraction support
3. ✅ Update field naming to match reference (`wallet`, `pin`, `daccPublickey`)
4. ✅ Maintain **API compatibility** with existing frontend
5. ✅ Support **multi-chain** operations via chain-based API

### Constraints
- Environment: **Development only** (can delete/redeploy)
- Service Access: Both Docker network and localhost
- EIP-7702 Paymaster: Configure later for deployment
- Rollback: Not needed (force until it works)

---

## TDG Approach

```
┌─────────────────────────────────────────────────────────────┐
│                     TDG CYCLE                               │
├─────────────────────────────────────────────────────────────┤
│  RED   → Write failing test                                │
│  GREEN → Write minimum code to pass                         │
│  REFACTOR → Improve while tests pass                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles
1. **Tests First** - Always write the test before implementation
2. **Minimal Code** - Write only what's needed to pass the test
3. **Continuous Refactoring** - Improve code while keeping tests green
4. **Small Iterations** - One small feature at a time

---

## Architecture Comparison

### Current Structure

```
apps/backend/
├── collections/           # JSON schemas
│   ├── users.json        # wallet_address, publicKey
│   └── ...
├── pb_migrations/        # SQL migrations
├── pb_hooks/            # Business logic
│   ├── 01-create-wallet.pb.js    # onRecordAfterCreateSuccess
│   ├── 05-referral-chain.pb.js
│   └── ...
└── package.json

wallet-api/              # Custom service (REPLACE)
├── src/
│   └── index.js         # ethers.js + XOR encryption
└── package.json
```

### Target Structure

```
apps/backend/
├── collections/           # Updated JSON schemas
│   ├── users.json        # wallet, pin, daccPublickey
│   └── ...
├── pb_migrations/        # SQL migrations + new ones
├── pb_hooks/            # Updated business logic
│   ├── 01-create-wallet.pb.js         # onRecordCreate
│   ├── 02-legacy-api-compat.pb.js     # NEW
│   ├── 11-eip7702-authorize.pb.js     # NEW
│   ├── 12-eip7702-get-hash.pb.js      # NEW
│   ├── 13-eip7702-sign-with-dacc.pb.js # NEW
│   └── 14-eip7702-status.pb.js        # NEW
├── test/                # NEW - TDG test suite
│   ├── hooks/
│   ├── collections/
│   └── api/
└── scripts/
    └── reset-dev.js     # NEW - Dev reset script

wallet-srv/              # NEW service with dacc-js
├── src/
│   ├── index.ts         # Express + TypeScript
│   └── routes/
│       ├── createWallet.ts
│       ├── sendNative.ts
│       ├── sendToken.ts
│       ├── balanceNative.ts
│       ├── balanceToken.ts
│       ├── writeContract.ts
│       ├── signTypedData.ts
│       └── eip7702.ts
├── test/                # NEW - TDG test suite
│   ├── health.test.ts
│   ├── wallet-create.test.ts
│   ├── chain/
│   └── eip7702/
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

---

## Field Mapping

### Users Collection Schema Changes

| Current Field | Target Field | Type | Notes |
|--------------|-------------|------|-------|
| `wallet_address` | `wallet` | text | Renamed |
| `publicKey` | `daccPublickey` | text | Renamed |
| `encrypted_private_key` | — | — | **Removed** (dacc-js handles) |
| — | `pin` | text, hidden | **New** - Password secret key |
| — | `eip7702_enabled` | bool | **New** - Account abstraction enabled |
| — | `eip7702_hash` | text | **New** - Authorization hash |

### Preserved Fields
All other fields remain unchanged:
- `usdt_balance`, `usdt_total_earned`
- `total_direct_recruits`, `lifetime_food_items`
- `highest_tier_reached`, `referrer_id`, `referral_chain`
- `name`, `avatar`, `externalId`, `verified`

---

## API Endpoint Mapping

### Current → New Endpoints

| Current Endpoint | New Endpoint | Method |
|-----------------|--------------|--------|
| `/api/wallet/create` | `/api/v1/wallet/create` | POST |
| `/api/wallet/balance` | `/api/v1/{chainId}/balance-native` | GET |
| `/api/wallet/send` | `/api/v1/{chainId}/send-native` | POST |
| — | `/api/v1/{chainId}/send-token` | POST |
| — | `/api/v1/{chainId}/write-contract` | POST |
| — | `/api/v1/{chainId}/sign-typed-data` | POST |
| — | `/api/v2/eip7702/authorize` | POST |
| — | `/api/v2/eip7702/status` | GET |

### Chain ID Support

| Chain ID | Network | RPC |
|----------|---------|-----|
| 56 | BSC | https://bsc-dataseed1.binance.org |
| 97 | BSC Testnet | https://data-seed-prebsc-1-s1.binance.org:8545 |
| 1 | Ethereum | https://mainnet.infura.io/v3/YOUR_KEY |
| 11155111 | Sepolia | https://sepolia.infura.io/v3/YOUR_KEY |
| 137 | Polygon | https://polygon-rpc.com |
| 80001 | Mumbai | https://rpc-mumbai.maticvigil.com |

---

## Phase-by-Phase Migration Plan

## 🎯 Phase 1: Foundation Tests (RED)

### Objective
Write failing tests for core functionality before any implementation.

### Test 1.1: Wallet Service Health Check
**File**: `wallet-srv/test/health.test.ts`

```typescript
import { describe, test, expect } from "bun:test";

describe("Health Check", () => {
  test("should return 200 and service status", async () => {
    const response = await fetch("http://localhost:3001/health");
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      status: "ok",
      service: "wallet-srv",
      version: expect.any(String)
    });
  });
});
```

**Expected Result**: ❌ FAIL (service not implemented yet)

---

### Test 1.2: dacc-js Wallet Creation
**File**: `wallet-srv/test/wallet-create.test.ts`

```typescript
describe("Wallet Creation with dacc-js", () => {
  test("should create wallet with password", async () => {
    const response = await fetch("http://localhost:3001/api/v1/wallet/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passwordSecretkey: "TestPassword123!@#"
      })
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(body.data.daccPublickey).toMatch(/^daccPublickey_/);
    expect(body.data.daccPublickey).toBeDefined();
  });

  test("should validate password length", async () => {
    const response = await fetch("http://localhost:3001/api/v1/wallet/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passwordSecretkey: "short"
      })
    });

    expect(response.status).toBe(400);
  });
});
```

**Expected Result**: ❌ FAIL (wallet creation not implemented)

---

### Test 1.3: PocketBase Hook Integration
**File**: `apps/backend/test/hooks/wallet-creation.test.js`

```javascript
describe("Wallet Creation Hook", () => {
  test("should create wallet when user is created", async () => {
    // Create test user via PocketBase
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: "test123456",
      passwordConfirm: "test123456",
      name: "Test User"
    };

    const response = await fetch(`${PB_URL}/api/collections/users/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const user = await response.json();

    // Verify hook fired and created wallet
    expect(user.wallet).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(user.daccPublickey).toMatch(/^daccPublickey_/);
    expect(user.pin).toBeDefined();
    expect(user.pin).not.toBe("");
  });
});
```

**Expected Result**: ❌ FAIL (hooks not updated yet)

---

## 🟢 Phase 2: Implement Wallet Service (GREEN)

### Objective
Write minimal implementation to make Phase 1 tests pass.

### Implementation 2.1: Basic Express Server
**File**: `wallet-srv/src/index.ts`

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "wallet-srv",
    version: "1.0.0"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Wallet service running on port ${PORT}`);
});

export default app;
```

**Test Result**: ✅ PASS - Health check test passes

---

### Implementation 2.2: dacc-js Wallet Creation
**File**: `wallet-srv/src/routes/createWallet.ts`

```typescript
import { Dacc } from "dacc-js";
import { Router } from "express";

const router = Router();

router.post("/create", async (req, res) => {
  try {
    const { passwordSecretkey, publicEncryption = false } = req.body;

    // Validate password
    const MIN_PASSWORD = parseInt(process.env.MIN_PASSWORD_LENGTH || "12");
    const MAX_PASSWORD = parseInt(process.env.MAX_PASSWORD_LENGTH || "120");

    if (!passwordSecretkey || passwordSecretkey.length < MIN_PASSWORD) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Password must be at least ${MIN_PASSWORD} characters`,
          code: "PASSWORD_TOO_SHORT"
        }
      });
    }

    if (passwordSecretkey.length > MAX_PASSWORD) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Password must be at most ${MAX_PASSWORD} characters`,
          code: "PASSWORD_TOO_LONG"
        }
      });
    }

    // Create wallet using dacc-js
    const dacc = new Dacc();
    const wallet = await dacc.createWallet(passwordSecretkey, {
      publicEncryption
    });

    res.json({
      success: true,
      data: {
        address: wallet.address,
        daccPublickey: wallet.daccPublickey
      }
    });

  } catch (error) {
    console.error("Wallet creation error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: "WALLET_CREATION_FAILED"
      }
    });
  }
});

export default router;
```

**Integration in `wallet-srv/src/index.ts`:**
```typescript
import createWalletRouter from "./routes/createWallet";

app.use("/api/v1/wallet", createWalletRouter);
```

**Test Result**: ✅ PASS - Wallet creation test passes

---

### Implementation 2.3: Update PocketBase Hook
**File**: `apps/backend/pb_hooks/01-create-wallet.pb.js`

```javascript
// ===== CREATE WALLET HOOK =====
// Uses dacc-js wallet service for wallet creation

console.log("Setting up create wallet hook...");

const WALLET_SRV_URL = process.env.WALLET_SRV_URL || "http://wallet-srv:3000";

onRecordCreate((e) => {
  console.log("Create wallet hook triggered for user:", e.record.id);

  try {
    // Generate secure password secret key (20 chars with special chars)
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let passwordSecretkey = "";
    for (let i = 0; i < 20; i++) {
      passwordSecretkey += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    console.log("Generated password secret key for user:", e.record.id);

    // Call wallet-srv to create wallet
    const apiUrl = `${WALLET_SRV_URL}/api/v1/wallet/create`;
    const requestBody = {
      passwordSecretkey: passwordSecretkey,
      publicEncryption: false
    };

    console.log("Calling wallet-srv to create wallet...");
    console.log("Request URL:", apiUrl);

    const response = $http.send({
      url: apiUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    console.log("Wallet-srv response status:", response.statusCode);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Wallet-srv returned status ${response.statusCode}: ${response.body}`);
    }

    // Convert byte array to string if needed
    let responseBody = response.body;
    if (typeof response.body === 'object' && response.body.length !== undefined) {
      responseBody = String.fromCharCode.apply(null, response.body);
    }

    if (!responseBody || responseBody.trim() === "") {
      throw new Error("Wallet-srv returned empty response body");
    }

    let responseData;
    try {
      responseData = JSON.parse(responseBody);
    } catch (parseError) {
      throw new Error(`Failed to parse wallet-srv response: ${responseBody}`);
    }

    console.log("Wallet-srv parsed response:", responseData);

    if (!responseData.success) {
      throw new Error(`Wallet creation failed: ${responseData.error?.message || 'Unknown error'}`);
    }

    // Set NEW field names (matching reference implementation)
    e.record.set("wallet", responseData.data.address);
    e.record.set("pin", passwordSecretkey);  // NEW: pin field
    e.record.set("daccPublickey", responseData.data.daccPublickey);  // NEW: daccPublickey

    // Initialize EIP-7702 fields (NEW)
    e.record.set("eip7702_enabled", false);
    e.record.set("eip7702_hash", "");

    // Initialize game-related fields
    e.record.set("usdt_balance", 0);
    e.record.set("usdt_total_earned", 0);
    e.record.set("total_direct_recruits", 0);
    e.record.set("lifetime_food_items", 0);
    e.record.set("highest_tier_reached", "bronze");

    console.log("Wallet data saved to user record");

  } catch (error) {
    console.error("Failed to create wallet:", error);
    throw new Error(`Wallet creation failed: ${error.message}`);
  }

  e.next();
}, "users");

console.log("Create wallet hook registered");
console.log("Wallet-srv URL:", WALLET_SRV_URL);
```

**Test Result**: ✅ PASS - Hook integration test passes

---

## 🔄 Phase 3: Update Collections Schema (REFACTOR)

### Test 3.1: Users Collection Schema Validation
**File**: `apps/backend/test/collections/users-schema.test.js`

```javascript
describe("Users Collection Schema", () => {
  test("should have correct field structure", () => {
    const users = $app.findCollectionByNameOrId("users");

    // Check NEW fields exist
    expect(users.schema.getFieldByName("wallet")).toBeDefined();
    expect(users.schema.getFieldByName("pin")).toBeDefined();
    expect(users.schema.getFieldByName("daccPublickey")).toBeDefined();
    expect(users.schema.getFieldByName("eip7702_enabled")).toBeDefined();
    expect(users.schema.getFieldByName("eip7702_hash")).toBeDefined();

    // Check OLD fields are removed
    expect(users.schema.getFieldByName("wallet_address")).toBeUndefined();
    expect(users.schema.getFieldByName("publicKey")).toBeUndefined();
    expect(users.schema.getFieldByName("encrypted_private_key")).toBeUndefined();

    // Check pin field is hidden
    const pinField = users.schema.getFieldByName("pin");
    expect(pinField.hidden).toBe(true);
  });
});
```

**Implementation**: Update `apps/backend/collections/users.json`

Key changes:
1. Rename `wallet_address` → `wallet`
2. Rename `publicKey` → `daccPublickey`
3. Remove `encrypted_private_key`
4. Add `pin` (hidden: true)
5. Add `eip7702_enabled` (bool)
6. Add `eip7702_hash` (text)

---

## 🌐 Phase 4: Chain-Based API Structure

### Test 4.1: Multi-Chain Send Native
**File**: `wallet-srv/test/chain/send-native.test.ts`

```typescript
describe("Multi-Chain Send Native", () => {
  test("should send native token on BSC (chainId 56)", async () => {
    const response = await fetch("http://localhost:3001/api/v1/56/send-native", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
      },
      body: JSON.stringify({
        daccPublickey: "test_dacc_key",
        passwordSecretkey: "test_password",
        address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
        to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
        amount: "0.001"
      })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  test("should reject unsupported chain ID", async () => {
    const response = await fetch("http://localhost:3001/api/v1/99999/send-native", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
  });
});
```

**Implementation**: `wallet-srv/src/routes/sendNative.ts`

```typescript
import { Dacc } from "dacc-js";
import { Router } from "express";

const router = Router();

// Chain configurations
const CHAINS = {
  56: {
    rpc: "https://bsc-dataseed1.binance.org",
    chainId: 56,
    name: "BSC",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }
  },
  97: {
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    chainId: 97,
    name: "BSC Testnet",
    nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 }
  },
  1: {
    rpc: "https://mainnet.infura.io/v3/" + process.env.INFURA_KEY,
    chainId: 1,
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  137: {
    rpc: "https://polygon-rpc.com",
    chainId: 137,
    name: "Polygon",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }
  }
};

router.post("/:chainId/send-native", async (req, res) => {
  try {
    const { chainId } = req.params;
    const { daccPublickey, passwordSecretkey, address, to, amount } = req.body;

    // Validate chain
    const chain = CHAINS[chainId];
    if (!chain) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported chain ID: ${chainId}`,
          code: "UNSUPPORTED_CHAIN"
        }
      });
    }

    // Use dacc-js to send
    const dacc = new Dacc();
    const result = await dacc.sendNative({
      daccPublickey,
      passwordSecretkey,
      address,
      to,
      amount,
      network: chain
    });

    res.json({
      success: true,
      data: {
        transactionHash: result.txHash,
        from: address,
        to: to,
        amount: amount,
        network: chain.name,
        chainId: parseInt(chainId)
      }
    });

  } catch (error) {
    console.error("Send native error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: "SEND_NATIVE_FAILED"
      }
    });
  }
});

export default router;
```

---

## 🔐 Phase 5: EIP-7702 Account Abstraction

### Test 5.1: EIP-7702 Authorization
**File**: `apps/backend/test/hooks/eip7702.test.js`

```javascript
describe("EIP-7702 Account Abstraction", () => {
  test("should authorize EIP-7702 for user", async () => {
    const response = await fetch(`${PB_URL}/api/v2/eip7702/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${testUserToken}`
      },
      body: JSON.stringify({
        smartAccount: "0xSmartAccount123..."
      })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Verify user record updated
    const user = await fetch(`${PB_URL}/api/collections/users/records/${testUserId}`);
    const userData = await user.json();
    expect(userData.eip7702_hash).toBe(body.data.hash);
  });
});
```

**Implementation**: `apps/backend/pb_hooks/11-eip7702-authorize.pb.js`

```javascript
// ===== EIP-7702 AUTHORIZATION HOOK =====
// Enables account abstraction for sponsored transactions

console.log("Setting up EIP-7702 authorization hook...");

const WALLET_SRV_URL = process.env.WALLET_SRV_URL || "http://wallet-srv:3000";

routerAdd("POST", "/api/v2/eip7702/authorize", (e) => {
  console.log("EIP-7702 authorization hook triggered");

  try {
    // Require authentication
    const authRecord = $apis.requireAuth(e);
    if (!authRecord) {
      throw new Error("User authentication required");
    }

    // Parse request body
    let requestBody;
    try {
      const bodyStr = toString(e.request.body);
      requestBody = JSON.parse(bodyStr);
    } catch (parseError) {
      throw new Error("Invalid JSON in request body");
    }

    // Validate required fields
    if (!requestBody.smartAccount) {
      throw new Error("smartAccount address is required");
    }

    // Get user wallet information
    const wallet = e.auth.getString("wallet");
    const daccPublickey = e.auth.getString("daccPublickey");
    const passwordSecretkey = e.auth.getString("pin");

    if (!wallet || !daccPublickey || !passwordSecretkey) {
      throw new Error("User wallet information not found");
    }

    // Call wallet-srv for EIP-7702 authorization
    const apiUrl = `${WALLET_SRV_URL}/api/v1/56/eip7702-authorize`;
    const walletRequest = {
      daccPublickey: daccPublickey,
      passwordSecretkey: passwordSecretkey,
      address: wallet,
      smartAccount: requestBody.smartAccount
    };

    const response = $http.send({
      url: apiUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(walletRequest)
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Wallet-srv returned status ${response.statusCode}`);
    }

    let responseBody = response.body;
    if (typeof response.body === 'object' && response.body.length !== undefined) {
      responseBody = String.fromCharCode.apply(null, response.body);
    }

    const responseData = JSON.parse(responseBody);

    if (!responseData.success) {
      throw new Error(`EIP-7702 authorization failed: ${responseData.error?.message}`);
    }

    // Update user record
    e.auth.set("eip7702_enabled", true);
    e.auth.set("eip7702_hash", responseData.data.hash);
    $app.save(e.auth);

    console.log("EIP-7702 authorized for user:", authRecord.id);

    return e.json(200, {
      success: true,
      data: {
        hash: responseData.data.hash,
        smartAccount: requestBody.smartAccount
      }
    });

  } catch (error) {
    console.error("EIP-7702 authorization error:", error);
    return e.json(400, {
      success: false,
      error: {
        message: error.message,
        code: "EIP7702_AUTH_FAILED"
      }
    });
  }
});

console.log("EIP-7702 authorization hook registered");
```

### Additional EIP-7702 Hooks

**12-eip7702-get-hash.pb.js**: Get authorization hash for signing
**13-eip7702-sign-with-dacc.pb.js**: Sign with dacc-js
**14-eip7702-status.pb.js**: Check EIP-7702 status
**15-eip7702-paymaster-execute.pb.js**: Execute sponsored transaction via paymaster

---

## 🔄 Phase 6: API Compatibility Layer

### Test 6.1: Legacy Endpoint Forwarding
**File**: `apps/backend/test/api/compatibility.test.js`

```javascript
describe("API Compatibility Layer", () => {
  test("should forward /api/wallet/create to new service", async () => {
    const response = await fetch(`${PB_URL}/api/wallet/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    // Should return legacy format
    expect(body.success).toBe(true);
    expect(body.data.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(body.data.publicKey).toBeDefined();
  });

  test("should forward /api/wallet/send to new service", async () => {
    const response = await fetch(`${PB_URL}/api/wallet/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${testUserToken}`
      },
      body: JSON.stringify({
        to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
        amount: "0.001"
      })
    });

    expect(response.status).toBe(200);
  });
});
```

**Implementation**: `apps/backend/pb_hooks/02-legacy-api-compat.pb.js`

```javascript
// ===== LEGACY API COMPATIBILITY LAYER =====
// Maintains backward compatibility with existing frontend

console.log("Setting up legacy API compatibility layer...");

const WALLET_SRV_URL = process.env.WALLET_SRV_URL || "http://wallet-srv:3000";

// Legacy: /api/wallet/create
routerAdd("POST", "/api/wallet/create", (e) => {
  console.log("Legacy wallet create endpoint called");

  try {
    // Parse request
    let requestBody;
    try {
      const bodyStr = toString(e.request.body);
      requestBody = JSON.parse(bodyStr);
    } catch (parseError) {
      throw new Error("Invalid JSON in request body");
    }

    // Forward to wallet-srv
    const response = $http.send({
      url: `${WALLET_SRV_URL}/api/v1/wallet/create`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passwordSecretkey: requestBody.password || generateRandomPassword(20)
      })
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Wallet-srv returned status ${response.statusCode}`);
    }

    let responseBody = response.body;
    if (typeof response.body === 'object' && response.body.length !== undefined) {
      responseBody = String.fromCharCode.apply(null, response.body);
    }

    const responseData = JSON.parse(responseBody);

    if (!responseData.success) {
      throw new Error(responseData.error?.message || "Wallet creation failed");
    }

    // Transform to legacy response format
    return e.json(200, {
      success: true,
      data: {
        address: responseData.data.address,
        publicKey: responseData.data.daccPublickey.substring(0, 42),
        wallet_version: 1
      }
    });

  } catch (error) {
    console.error("Legacy wallet creation error:", error);
    return e.json(400, {
      success: false,
      error: {
        message: error.message,
        code: "WALLET_CREATION_FAILED"
      }
    });
  }
});

// Legacy: /api/wallet/send (forwards to chain-based API)
routerAdd("POST", "/api/wallet/send", (e) => {
  console.log("Legacy wallet send endpoint called");

  try {
    const authRecord = $apis.requireAuth(e);
    if (!authRecord) {
      throw new Error("User authentication required");
    }

    let requestBody;
    try {
      const bodyStr = toString(e.request.body);
      requestBody = JSON.parse(bodyStr);
    } catch (parseError) {
      throw new Error("Invalid JSON in request body");
    }

    // Get user wallet
    const wallet = e.auth.getString("wallet");
    const daccPublickey = e.auth.getString("daccPublickey");
    const passwordSecretkey = e.auth.getString("pin");

    // Determine chain (default to BSC)
    const chainId = requestBody.chainId || 56;

    // Forward to wallet-srv
    const response = $http.send({
      url: `${WALLET_SRV_URL}/api/v1/${chainId}/send-native`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        daccPublickey: daccPublickey,
        passwordSecretkey: passwordSecretkey,
        address: wallet,
        to: requestBody.to,
        amount: requestBody.amount
      })
    });

    // Handle response and transform to legacy format
    // ... (similar to above)

  } catch (error) {
    console.error("Legacy wallet send error:", error);
    return e.json(400, {
      success: false,
      error: { message: error.message }
    });
  }
});

function generateRandomPassword(length) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

console.log("Legacy API compatibility layer registered");
```

---

## 🧪 Phase 7: Development Tools

### Development Reset Script
**File**: `apps/backend/scripts/reset-dev.js`

```javascript
#!/usr/bin/env bun
/**
 * Development Database Reset Script
 *
 * WARNING: Only use in development environment!
 * This will delete all data and reset migrations.
 */

import { $ } from "bun";

console.log("🔄 Resetting development database...\n");

// 1. Stop PocketBase
console.log("1️⃣  Stopping PocketBase...");
try {
  await $`pgrep -f pocketbase | xargs kill`.quiet();
  console.log("   ✅ PocketBase stopped\n");
} catch {
  console.log("   ℹ️  PocketBase was not running\n");
}

// 2. Delete database file
console.log("2️⃣  Deleting database file...");
try {
  await $`rm -f pb_data/data.db`.quiet();
  await $`rm -f pb_data/data.db-shm`.quiet();
  await $`rm -f pb_data/data.db-wal`.quiet();
  console.log("   ✅ Database deleted\n");
} catch {
  console.log("   ℹ️  No database file found\n");
}

// 3. Run migrations
console.log("3️⃣  Running migrations...");
await $`./pocketbase migrate up`;
console.log("   ✅ Migrations applied\n");

// 4. Start PocketBase
console.log("4️⃣  Starting PocketBase...");
const pb = $`./pocketbase serve`;
pb.exiting.then(() => console.log("\n✅ PocketBase started"));

console.log("\n✨ Development database reset complete!");
console.log("📝 PocketBase is running on http://localhost:8090");
```

Make executable:
```bash
chmod +x apps/backend/scripts/reset-dev.js
```

---

## 📦 Phase 8: Docker Configuration

### Updated docker-compose.yml
**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  pocketbase:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: eggo-pb
    ports:
      - "8090:8090"
    environment:
      - WALLET_SRV_URL=http://wallet-srv:3000
    volumes:
      - ./apps/backend/pb_data:/pb/pb_data
      - ./apps/backend/pb_hooks:/pb/pb_hooks
      - ./apps/backend/pb_migrations:/pb/pb_migrations
      - ./apps/backend/pb_public:/pb/pb_public
    networks:
      - eggo-network
    depends_on:
      - wallet-srv
    restart: unless-stopped

  wallet-srv:
    build:
      context: ./wallet-srv
      dockerfile: Dockerfile
    container_name: eggo-wallet-srv
    ports:
      - "3001:3000"  # Map container 3000 to host 3001
    environment:
      - NODE_ENV=development
      - PORT=3000
      - MIN_PASSWORD_LENGTH=12
      - MAX_PASSWORD_LENGTH=120
      - PUBLIC_ENCRYPTION=false
      - CORS_ORIGIN=*
    networks:
      - eggo-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: eggo-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./apps/web/.next:/app/.next:ro
    depends_on:
      - pocketbase
    networks:
      - eggo-network
    restart: unless-stopped

networks:
  eggo-network:
    driver: bridge
```

### wallet-srv Dockerfile
**File**: `wallet-srv/Dockerfile`

```dockerfile
FROM oven/bun:1.1.21-alpine

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN bun run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Run
CMD ["bun", "src/index.ts"]
```

---

## 🧪 Phase 9: Testing Strategy

### Test Coverage Goals

| Component | Coverage Target | Priority |
|-----------|----------------|----------|
| wallet-srv routes | 90%+ | High |
| PocketBase hooks | 80%+ | High |
| API compatibility | 85%+ | Medium |
| EIP-7702 flows | 75%+ | Medium |

### Test Categories

1. **Unit Tests**: Individual functions and methods
2. **Integration Tests**: Service-to-service communication
3. **Contract Tests**: API compatibility
4. **End-to-End Tests**: Full user flows

### Running Tests

```bash
# wallet-srv tests
cd wallet-srv
bun test

# PocketBase hook tests
cd apps/backend
bun test

# All tests
bun run test:all
```

---

## 📊 Execution Timeline

### Week 1: Foundation
- [ ] Day 1-2: Phase 1 tests (RED)
- [ ] Day 3-4: Phase 2 implementation (GREEN)
- [ ] Day 5: Phase 3 schema updates (REFACTOR)

### Week 2: Core Features
- [ ] Day 1-2: Phase 4 chain-based API
- [ ] Day 3-4: Phase 5 EIP-7702 implementation
- [ ] Day 5: Testing and refinement

### Week 3: Integration
- [ ] Day 1-2: Phase 6 API compatibility
- [ ] Day 3-4: Frontend integration
- [ ] Day 5: End-to-end testing

### Week 4: Polish & Deploy
- [ ] Day 1-2: Phase 7 dev tools
- [ ] Day 3: Phase 8 Docker setup
- [ ] Day 4: Documentation
- [ ] Day 5: Deployment verification

---

## 🔧 Configuration Files

### Environment Variables

**apps/backend/.env**
```bash
# PocketBase
POCKETBASE_URL=http://localhost:8090

# Wallet Service
WALLET_SRV_URL=http://wallet-srv:3000
WALLET_SRV_LOCAL=http://localhost:3001

# App
NODE_ENV=development
```

**wallet-srv/.env**
```bash
# Server
PORT=3000
NODE_ENV=development

# dacc-js Configuration
MIN_PASSWORD_LENGTH=12
MAX_PASSWORD_LENGTH=120
PUBLIC_ENCRYPTION=false

# CORS
CORS_ORIGIN=*

# Blockchain RPCs (optional - defaults used if not set)
# INFURA_KEY=your_key_here
# ALCHEMY_KEY=your_key_here
```

---

## 📝 Implementation Notes

### Critical Differences to Remember

1. **Hook Timing**: Reference uses `onRecordCreate` (before save), current uses `onRecordAfterCreateSuccess`
2. **Field Access**: Use `e.record.set()` in `onRecordCreate`, not `e.auth.set()`
3. **Service URLs**: Use Docker network URL internally, localhost externally
4. **Response Parsing**: PocketBase returns byte arrays, need conversion
5. **Error Handling**: Always try-catch HTTP calls to wallet-srv

### Common Pitfalls

1. ❌ Don't forget to call `e.next()` in hooks
2. ❌ Don't use async/await in PocketBase hooks (not supported)
3. ❌ Don't expose `pin` field in API responses
4. ❌ Don't hardcode chain IDs - use configuration
5. ❌ Don't skip validation in compatibility layer

### Best Practices

1. ✅ Always validate required fields
2. ✅ Use proper HTTP status codes
3. ✅ Log errors with context
4. ✅ Test both success and failure paths
5. ✅ Keep compatibility layer thin

---

## ✅ Final Verification Checklist

### Pre-Migration
- [ ] Backup current database (even for dev)
- [ ] Document current API endpoints
- [ ] List all wallet field references
- [ ] Identify all hook dependencies

### During Migration
- [ ] Run tests after each phase
- [ ] Verify Docker containers start
- [ ] Check service-to-service communication
- [ ] Test EIP-7702 flows

### Post-Migration
- [ ] All tests passing
- [ ] API compatibility verified
- [ ] Frontend integration tested
- [ ] Documentation updated
- [ ] Team trained on new structure

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Wallet creation fails
```
Solution:
1. Check wallet-srv is running: curl http://localhost:3001/health
2. Verify WALLET_SRV_URL in PocketBase
3. Check Docker network connectivity
```

**Issue**: Hook not firing
```
Solution:
1. Verify hook filename order (01-*, 02-*)
2. Check console logs in PocketBase
3. Ensure collection name matches in onRecordCreate()
```

**Issue**: Field not found
```
Solution:
1. Verify collection JSON is updated
2. Restart PocketBase after schema changes
3. Check for typos in field names
```

**Issue**: EIP-7702 signature fails
```
Solution:
1. Verify daccPublickey format
2. Check smart account address
3. Ensure paymaster is configured
```

---

## 📚 Additional Resources

### Reference Implementation
- Location: `/resources/pkbase-wallet/`
- Key files to study:
  - `pkbase/pb_hooks/01-create-wallet-hook.pb.js`
  - `wallet-srv/src/routes/*.ts`

### dacc-js Documentation
- GitHub: (link to dacc-js repo)
- Key methods:
  - `createWallet(password, options)`
  - `sendNative(params)`
  - `sendToken(params)`
  - `writeContract(params)`

### EIP-7702 Specification
- EIP: (link to EIP-7702)
- Key concepts:
  - Account abstraction
  - Paymaster sponsorship
  - Authorization hash

---

## 🎯 Success Criteria

Migration is considered successful when:

1. ✅ All Phase 1-9 tests pass
2. ✅ Wallet creation works via wallet-srv
3. ✅ EIP-7702 authorization completes
4. ✅ Legacy API endpoints still function
5. ✅ Multi-chain transactions execute
6. ✅ Docker compose starts all services
7. ✅ Frontend can create wallets
8. ✅ Field naming matches reference
9. ✅ No data loss (if migrating existing users)
10. ✅ Team can deploy to production

---

## 📞 Support & Collaboration

### Agent Instructions for Implementation

When implementing this plan:

1. **Use TDG Method**: Follow RED-GREEN-REFACTOR strictly
2. **Start Small**: Begin with health check, not wallet creation
3. **Test Locally**: Verify each phase before moving on
4. **Document Changes**: Update this file as needed
5. **Ask Questions**: If blocked, clarify before proceeding

### Command Reference

```bash
# Initialize TDG for this module
/tdg:init

# Run specific phase
/tdg:phase 1

# Show current status
/tdg:status

# Create atomic commit
/tdg:atomic

# Get help
/tdg:help
```

---

**Document Version**: 1.0
**Last Updated**: 2026-03-31
**Author**: TDG Planning Session
**Status**: Ready for Implementation
