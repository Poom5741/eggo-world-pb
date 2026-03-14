# Wallet Security & Private Key Handling

This document explains how eggo-pb handles wallet private keys securely, including encryption, storage, and access control.

## Table of Contents

1. [Overview](#overview)
2. [Why Store Private Keys?](#why-store-private-keys)
3. [Security Architecture](#security-architecture)
4. [Web3 Secret Storage v3 Format](#web3-secret-storage-v3-format)
5. [Encryption Process](#encryption-process)
6. [Database Storage](#database-storage)
7. [Access Control](#access-control)
8. [Decryption Workflow](#decryption-workflow)
9. [Security Best Practices](#security-best-practices)
10. [Risk Mitigation](#risk-mitigation)

---

## Overview

eggo-pb automatically creates an Ethereum-compatible wallet for each user who signs up via LINE OAuth. The wallet consists of:

- **Public Address** (`wallet_address`): Visible, shareable, used for receiving funds
- **Public Key** (`publicKey`): Cryptographic public key
- **Private Key**: **Encrypted** and stored in database

**Key Principle**: Private keys are never stored in plain text. They are encrypted using the Web3 Secret Storage v3 format before storage.

---

## Why Store Private Keys?

### Common Approaches

1. **User-Managed Keys** (MetaMask-style)
   - User keeps private key in browser extension
   - Backend never sees private key
   - ❌ Requires user to manage their own keys
   - ❌ Hard to backup/recover

2. **Custodial Service** (Exchange-style)
   - Service holds all keys
   - User trusts service completely
   - ❌ Centralized risk
   - ❌ Service can freeze funds

3. **Encrypted Backend Storage** (eggo-pb approach)
   - Backend encrypts and stores keys
   - User doesn't manage keys directly
   - ✅ Convenient for users
   - ✅ Can sign transactions server-side
   - ✅ Encrypted at rest

### Why We Chose Encrypted Backend Storage

For eggo-pb's use case (foodcourt payment system):
- Users shouldn't need to understand blockchain wallets
- Transactions need to be signed server-side for smooth UX
- Encryption provides security while maintaining usability
- Users can recover access via LINE account

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ATTACK SURFACE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐                                          │
│  │   Frontend   │                                          │
│  └──────┬───────┘                                          │
│         │ HTTPS                                            │
│         ▼                                                  │
│  ┌──────────────┐         ┌──────────────────┐            │
│  │  PocketBase  │◄───────►│    Database      │            │
│  │   Backend    │         │   (SQLite)       │            │
│  └──────┬───────┘         └────────┬─────────┘            │
│         │                           │                      │
│         │                           │ Encrypted            │
│         │                           │ Private Keys         │
│         │                           ▼                      │
│         │                    ┌──────────────┐             │
│         │                    │  wallet_     │             │
│         │                    │  address     │             │
│         │                    │  encrypted_  │             │
│         │                    │  private_key │             │
│         │                    └──────────────┘             │
│         │                                                  │
│         │ Requires WALLET_MASTER_KEY                       │
│         │ (Environment Variable)                           │
│         ▼                                                  │
│  ┌──────────────┐                                          │
│  │  Decryption  │◄── Only backend can decrypt              │
│  └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Security Layers

1. **Transport**: HTTPS encrypts data in transit
2. **Database**: Encrypted keys at rest
3. **Access Control**: API rules restrict who can read data
4. **Master Key**: Separate secret required for decryption
5. **Field Hiding**: Sensitive fields never exposed via API

---

## Web3 Secret Storage v3 Format

This is the industry standard for encrypted wallet storage, used by:
- MyEtherWallet
- MetaMask
- Geth (Ethereum client)
- Mist

### Structure

```json
{
  "version": 3,
  "id": "uuid-v4-format",
  "address": "wallet_address_without_0x",
  "crypto": {
    "ciphertext": "encrypted_private_key_hex",
    "cipherparams": {
      "iv": "initialization_vector_hex"
    },
    "cipher": "aes-128-ctr",
    "kdf": "scrypt",
    "kdfparams": {
      "dklen": 32,
      "salt": "salt_hex",
      "n": 262144,
      "r": 8,
      "p": 1
    },
    "mac": "message_authentication_code_hex"
  }
}
```

### Components Explained

| Field | Purpose |
|-------|---------|
| `version` | Format version (3 for Web3 Secret Storage) |
| `id` | Unique identifier (UUID v4) |
| `address` | Wallet address (for verification) |
| `ciphertext` | The encrypted private key |
| `cipherparams.iv` | Initialization vector for AES |
| `cipher` | Encryption algorithm (AES-128-CTR) |
| `kdf` | Key derivation function (scrypt) |
| `kdfparams.n` | Scrypt CPU cost (262144 = 2^18) |
| `kdfparams.r` | Scrypt block size (8) |
| `kdfparams.p` | Scrypt parallelization (1) |
| `kdfparams.dklen` | Derived key length (32 bytes) |
| `mac` | Message authentication code (integrity check) |

### Why Scrypt?

Scrypt is memory-hard, making it resistant to:
- GPU/ASIC attacks
- Brute force attempts
- Rainbow table attacks

Parameters (n=262144, r=8, p=1) require significant computational resources to crack.

---

## Encryption Process

### Step-by-Step

```
┌─────────────────┐
│ Generate Wallet │
│  Private Key    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Derive Key from │
│ Master Key +    │
│ User ID + Salt  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Encrypt Private │
│ Key with AES-   │
│ 128-CTR         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate MAC    │
│ for Integrity   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store Web3      │
│ Keystore JSON   │
└─────────────────┘
```

### Detailed Steps

1. **Generate Wallet**
   ```javascript
   const privateKey = generateRandomHex(64); // 32 bytes
   const wallet = generateWallet(privateKey);
   ```

2. **Derive Encryption Key**
   ```javascript
   // Combine master key with user-specific data
   const password = WALLET_MASTER_KEY + userId;
   
   // Generate random salt
   const salt = randomBytes(32);
   
   // Derive key using scrypt (simplified)
   const derivedKey = scrypt(password, salt, {
     n: 262144,
     r: 8,
     p: 1,
     dklen: 32
   });
   ```

3. **Encrypt Private Key**
   ```javascript
   // Split derived key
   const encryptionKey = derivedKey.slice(0, 16); // 16 bytes for AES-128
   const macKey = derivedKey.slice(16, 32);       // 16 bytes for MAC
   
   // Generate IV
   const iv = randomBytes(16);
   
   // Encrypt with AES-128-CTR
   const ciphertext = aes128ctrEncrypt(privateKey, encryptionKey, iv);
   ```

4. **Generate MAC**
   ```javascript
   // MAC = keccak256(macKey + ciphertext)
   const mac = keccak256(macKey + ciphertext);
   ```

5. **Build Keystore**
   ```javascript
   const keystore = {
     version: 3,
     id: generateUUID(),
     address: wallet.address,
     crypto: {
       ciphertext: ciphertext,
       cipherparams: { iv: iv },
       cipher: "aes-128-ctr",
       kdf: "scrypt",
       kdfparams: {
         dklen: 32,
         salt: salt,
         n: 262144,
         r: 8,
         p: 1
       },
       mac: mac
     }
   };
   ```

---

## Database Storage

### Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  externalId TEXT UNIQUE NOT NULL,     -- LINE user ID
  name TEXT,
  avatar TEXT,
  email TEXT UNIQUE,
  
  -- Wallet fields
  wallet_address TEXT UNIQUE,           -- Public: 0x...
  encrypted_private_key TEXT,           -- Hidden: Web3 keystore JSON
  publicKey TEXT UNIQUE,                -- Public: 0x...
  wallet_version INTEGER,               -- Public: 3
  
  created DATETIME,
  updated DATETIME
);

-- Indexes
CREATE UNIQUE INDEX idx_externalId ON users(externalId);
CREATE UNIQUE INDEX idx_email ON users(email) WHERE email != '';
CREATE UNIQUE INDEX idx_wallet ON users(wallet_address) WHERE wallet_address != '';
```

### Field Visibility

| Field | Visibility | API Access | Notes |
|-------|-----------|------------|-------|
| `wallet_address` | Public | Yes | Safe to share |
| `publicKey` | Public | Yes | Cryptographic public key |
| `encrypted_private_key` | **Hidden** | **No** | Never exposed via API |
| `wallet_version` | Public | Yes | Format version |

---

## Access Control

### API Rules

```javascript
// Users can only view/update their own records
{
  "listRule": "id = @request.auth.id",
  "viewRule": "id = @request.auth.id",
  "createRule": "",  // Only via OAuth
  "updateRule": "id = @request.auth.id",
  "deleteRule": "id = @request.auth.id"
}
```

### Field-Level Protection

In `users.json`, sensitive fields have `hidden: true`:

```json
{
  "name": "encrypted_private_key",
  "hidden": true,  // Never returned in API responses
  "type": "text"
}
```

### Important Note

Even with `hidden: true`, the data exists in the database. Always:
- Secure database backups
- Encrypt backup files
- Limit database access

---

## Decryption Workflow

When you need to sign a transaction:

### Step 1: Retrieve Keystore

```javascript
const user = await pb.collection('users').getOne(userId);
const keystore = JSON.parse(user.encrypted_private_key);
```

### Step 2: Derive Key

```javascript
const password = WALLET_MASTER_KEY + userId;
const derivedKey = scrypt(password, keystore.crypto.kdfparams.salt, {
  n: keystore.crypto.kdfparams.n,
  r: keystore.crypto.kdfparams.r,
  p: keystore.crypto.kdfparams.p,
  dklen: keystore.crypto.kdfparams.dklen
});
```

### Step 3: Verify MAC

```javascript
const macKey = derivedKey.slice(16, 32);
const computedMac = keccak256(macKey + keystore.crypto.ciphertext);

if (computedMac !== keystore.crypto.mac) {
  throw new Error("MAC verification failed - data corrupted or tampered");
}
```

### Step 4: Decrypt Private Key

```javascript
const encryptionKey = derivedKey.slice(0, 16);
const iv = keystore.crypto.cipherparams.iv;

const privateKey = aes128ctrDecrypt(
  keystore.crypto.ciphertext,
  encryptionKey,
  iv
);
```

### Step 5: Use & Clear

```javascript
// Sign transaction
const signedTx = signTransaction(transaction, privateKey);

// IMPORTANT: Clear from memory
privateKey = null;
derivedKey = null;
encryptionKey = null;
```

---

## Security Best Practices

### 1. WALLET_MASTER_KEY Management

```bash
# Generate strong key
openssl rand -hex 32

# Example output:
# a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Do:**
- ✅ Generate with `openssl rand -hex 32` or similar
- ✅ Store in environment variable only
- ✅ Use different keys for dev/staging/production
- ✅ Back up in secure password manager
- ✅ Rotate periodically (if possible)

**Don't:**
- ❌ Hardcode in source code
- ❌ Commit to git
- ❌ Share with team members unnecessarily
- ❌ Use short or predictable keys
- ❌ Reuse keys across environments

### 2. Database Security

```bash
# Secure database directory
chmod 700 pb_data/

# Backup encryption
gpg --encrypt --recipient backup@example.com pb_data_backup.tar.gz

# Regular backups
0 2 * * * /path/to/backup-script.sh
```

**Do:**
- ✅ Restrict database file permissions
- ✅ Encrypt database backups
- ✅ Store backups in secure location
- ✅ Test backup restoration

**Don't:**
- ❌ Store backups on public cloud without encryption
- ❌ Share database files
- ❌ Commit pb_data to git

### 3. Environment Variables

```bash
# .env file (NEVER commit to git!)
WALLET_MASTER_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# Load in application
export $(cat .env | xargs)
```

**Do:**
- ✅ Use .env files
- ✅ Add .env to .gitignore
- ✅ Use secrets management in production (AWS KMS, etc.)

**Don't:**
- ❌ Hardcode secrets
- ❌ Log environment variables
- ❌ Expose in error messages

### 4. Code Security

**Do:**
- ✅ Clear sensitive variables from memory after use
- ✅ Validate all inputs
- ✅ Use constant-time comparison for MAC verification
- ✅ Log security events (not sensitive data)

**Don't:**
- ❌ Log private keys
- ❌ Return sensitive data in errors
- ❌ Trust client-side data

---

## Risk Mitigation

### Risk: Database Breach

**Scenario**: Attacker gains access to database files

**Mitigation**:
- Private keys are encrypted with WALLET_MASTER_KEY
- Attacker needs both database AND master key
- Master key is not in database
- **Impact**: Low (if master key secure)

### Risk: Master Key Exposure

**Scenario**: WALLET_MASTER_KEY leaked

**Mitigation**:
- Rotate master key immediately
- Re-encrypt all private keys with new master key
- Audit access logs
- **Impact**: Critical - immediate action required

### Risk: Code Injection

**Scenario**: Attacker injects malicious code

**Mitigation**:
- Code review for all hook changes
- Restrict file permissions on pb_hooks/
- Monitor for unauthorized changes
- **Impact**: High

### Risk: Insider Threat

**Scenario**: Employee with access misuses data

**Mitigation**:
- Principle of least privilege
- Access logging
- Separate duties (no single person has full access)
- **Impact**: Medium

### Risk: Backup Exposure

**Scenario**: Backup files accessed by unauthorized party

**Mitigation**:
- Encrypt all backups
- Secure backup storage
- Limit backup access
- **Impact**: Low (if encrypted)

---

## Emergency Procedures

### If WALLET_MASTER_KEY is Lost

1. **Stop all services immediately**
2. **Do not attempt to guess the key**
3. **Assess impact**:
   - How many wallets affected?
   - Any funds at risk?
4. **Recovery options**:
   - Check password manager backups
   - Check with other team members
   - Check deployment scripts
5. **If unrecoverable**:
   - Users must create new wallets
   - Funds are lost (if no other backup)
   - **Prevention**: Always maintain multiple secure backups

### If Database is Breached

1. **Rotate WALLET_MASTER_KEY immediately**
2. **Re-encrypt all private keys** with new master key
3. **Audit access logs** to determine scope
4. **Notify affected users** if required
5. **Review security practices**
6. **Implement additional security measures**

### If Private Keys are Exposed

1. **Immediately transfer funds** to new secure wallets
2. **Invalidate exposed keys**
3. **Generate new wallets** for affected users
4. **Investigate cause**
5. **Implement fixes**

---

## Comparison with Other Approaches

### vs. MetaMask (User-Managed)

| Aspect | eggo-pb (Encrypted Backend) | MetaMask |
|--------|---------------------------|----------|
| User experience | Seamless | Requires wallet knowledge |
| Backup | Via LINE account | Seed phrase backup |
| Recovery | Automatic | Manual seed phrase |
| Server signing | Possible | Not possible |
| Security | Encrypted keys | User responsibility |

### vs. Exchange (Custodial)

| Aspect | eggo-pb (Encrypted Backend) | Exchange |
|--------|---------------------------|----------|
| Key control | Server encrypted | Server held |
| Freeze risk | None | Possible |
| Decentralization | Yes | No |
| Transparency | Open source | Proprietary |

---

## Conclusion

eggo-pb's approach balances:
- **Security**: Encryption + access control
- **Usability**: Users don't manage keys
- **Flexibility**: Can sign transactions server-side
- **Recoverability**: Keys recoverable via LINE account

**Remember**: Security is a process, not a product. Regularly review and update your security practices.

---

## Resources

- Web3 Secret Storage: https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition
- Scrypt: https://en.wikipedia.org/wiki/Scrypt
- AES-CTR: https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_(CTR)
- LINE OAuth Security: https://developers.line.biz/en/docs/line-login/security/

## Questions?

For security-related questions:
1. Review this document thoroughly
2. Check [SETUP.md](./SETUP.md) for setup questions
3. See [LINE_OAUTH_SETUP.md](./LINE_OAUTH_SETUP.md) for OAuth questions
