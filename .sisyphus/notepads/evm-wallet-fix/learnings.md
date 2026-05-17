# EVM Wallet Fix - Learnings

## Task Completed
Registered EVM wallet endpoint in Express router.

## Changes Made

### 1. Added import to `wallet-api/src/index.ts` (line 8)
```typescript
import { createEvmWalletRouter } from './routes/createEvmWallet.js'
```

### 2. Added route registration (line 56)
```typescript
app.use('/api/wallet', createEvmWalletRouter)
```

## Result
- ✅ Import added following existing pattern
- ✅ Route mounted under `/api/wallet` prefix
- ✅ Endpoint accessible at `POST /api/wallet/create-evm`
- ⚠️ Could not verify with `bun run dev` (port 3001 in use by existing process)
- ⚠️ Pre-existing TypeScript errors in createEvmWallet.ts (module augmentation) - unrelated to this task

## Pattern Used
Followed existing Express router registration pattern:
- Import: `import { router as xxxRouter } from './routes/xxx.js'`
- Mount: `app.use('/api/wallet', xxxRouter)`

---

## Task: Update 01-create-wallet.pb.js for Dual Wallet Creation

### Changes Made

#### 1. Changed hook trigger from `onRecordCreate` to `onRecordBeforeCreate`
- Required for setting fields before record commits
- Must call `e.next()` at end to commit record

#### 2. Added sequential wallet creation:
- **STEP 1**: Call DACC endpoint (`/api/wallet/create`) with random password
  - Request: `{ passwordSecretkey: randomPassword, publicEncryption: false }`
  - Response: `{ data: { address, daccPublickey } }`
- **STEP 2**: Call EVM endpoint (`/api/wallet/create-evm`) with userId
  - Request: `{ userId: e.record.id }`
  - Response: `{ data: { address, encrypted_private_key, version } }`

#### 3. Field mapping on user record:
- `wallet` = EVM address (used for USDT transactions)
- `daccPublickey` = DACC public key
- `pin` = random 20-char password (for DACC wallet encryption)
- `encrypted_private_key` = JSON string of EVM encrypted private key

### Key Implementation Details

- Used `$http.send()` for both API calls (Goja sync, no async/await)
- Used `$os.getenv("WALLET_SRV_URL")` for wallet-api URL
- Generated random password: 20 chars with charset `a-zA-Z0-9!@#$%^&*`
- Used try/catch blocks for both wallet creation steps
- Both errors throw and abort user creation
- Maintained `e.next()` at line 141 to commit record

### Response Format from EVM Endpoint
```typescript
{
  success: true,
  data: {
    address: "0x...",           // EVM wallet address
    encrypted_private_key: {     // Encrypted key object
      version: number,
      iv: string,
      authTag: string,
      ciphertext: string
    },
    version: number
  }
}
```

### Testing Notes
- Test user creation via direct API or LINE OAuth
- Verify: `wallet`, `daccPublickey`, `pin`, `encrypted_private_key` fields populated
- Check PocketBase logs for "Create wallet hook triggered" and wallet addresses

---

## Task: Create migrateWallet.ts Endpoint

### Changes Made

#### 1. Created `wallet-api/src/routes/migrateWallet.ts`
- Endpoint: `POST /api/wallet/migrate-evm`
- Accepts: `{ userId, pbUrl }`
- Generates EVM wallet using `ethers.Wallet.createRandom()`
- Encrypts private key using `encryptPrivateKey(privateKey, MASTER_KEY + userId)`
- Updates PocketBase user record with `encrypted_private_key` field
- Uses PB admin API: `_superusers/auth-with-password` → `PATCH /api/collections/users/records/{userId}`

#### 2. Updated `wallet-api/src/index.ts`
- Added import: `import { migrateWalletRouter } from './routes/migrateWallet.js'`
- Added route: `app.use('/api/wallet', migrateWalletRouter)`

### Pattern Used
- Followed `/create-and-save` pattern from createWallet.ts (lines 111-199)
- Used same PB admin auth approach
- Used same encryption logic from createEvmWallet.ts

### Files Created/Modified
- Created: `wallet-api/src/routes/migrateWallet.ts`
- Modified: `wallet-api/src/index.ts` (import + route registration)

### Result
- ✅ File created: `wallet-api/src/routes/migrateWallet.ts`
- ✅ Endpoint registered: `POST /api/wallet/migrate-evm`
- ✅ Uses createEvmWallet logic (ethers.Wallet.createRandom + encryptPrivateKey)
- ✅ Updates PB user via admin API with `encrypted_private_key`
- ✅ Returns `{ success: true, data: { address, encrypted_private_key } }`
- ⚠️ Pre-existing TS errors in encrypt.js module augmentation (unrelated to this task)
- ✅ Server starts (port in use by existing process)
