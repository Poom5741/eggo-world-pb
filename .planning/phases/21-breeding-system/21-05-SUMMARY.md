---
phase: "21"
plan: "05"
subsystem: "breeding"
tags: ["wallet-api", "blockchain", "gas-sponsorship", "error-handling"]
dependencies:
  requires: ["21-03", "21-04"]
  provides: ["21-06"]
  affects: ["wallet-api", "breeding-hook"]
tech-stack:
  added: ["breed-animals endpoint"]
  patterns: ["gas sponsorship", "comprehensive error handling", "log but don't rollback"]
key-files:
  created: []
  modified:
    - wallet-api/server.js
    - apps/backend/pb_hooks/18-breed-animals.pb.js
decisions:
  - "Gas sponsorship via relayer wallet for breeding transactions"
  - "Comprehensive error handling: log but don't rollback"
  - "Synchronous blockchain call before database commit"
  - "Store blockchain metadata even on partial failure"
metrics:
  duration: "35m"
  completed-date: "2026-04-22"
  tasks-completed: 3
  files-created: 0
  files-modified: 2
---

# Phase 21 Plan 05: Backend Hook Improvements Summary

## Overview

Enhanced the breeding system with real blockchain integration via wallet-api, comprehensive error handling, and gas sponsorship support.

## What Was Built

### 1. Wallet-API Breed Endpoint

- **File**: `wallet-api/server.js`
- New endpoint: `POST /api/wallet/breed-animals`
- Gas sponsorship via relayer wallet
- Pre-breeding cooldown check via `canBreed()` contract call
- ANIMAL_NFT_ABI with breedAnimals, canBreed, getLastBredTimestamp
- Event log parsing for child token ID and generation
- Comprehensive error codes: `PARENT1_ON_COOLDOWN`, `PARENT2_ON_COOLDOWN`, `BREEDING_FAILED`

### 2. Backend Hook Integration

- **File**: `apps/backend/pb_hooks/18-breed-animals.pb.js`
- Replaced mock tx hash with real blockchain call
- Synchronous call to wallet-api before database commit
- Comprehensive error handling with "log but don't rollback" pattern
- Stores blockchain metadata in egg record
- Falls back gracefully if blockchain temporarily unavailable

### 3. Error Handling Strategy

- **Log but Don't Rollback**: Database state preserved even if blockchain fails
- **Pre-validation**: Cooldown check before gas estimation
- **Graceful Degradation**: Egg record created even without tx_hash
- **Metadata Storage**: Blockchain results stored for audit trail

## API Endpoints

### POST /api/wallet/breed-animals

**Request Body:**

```json
{
  "userId": "user_record_id",
  "parent1TokenId": 123,
  "parent2TokenId": 456,
  "animalNftAddress": "0x..."
}
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "blockNumber": 12345,
    "status": "confirmed",
    "parent1TokenId": 123,
    "parent2TokenId": 456,
    "childTokenId": "789",
    "childGeneration": "1"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "message": "Parent 1 is on cooldown",
    "code": "PARENT1_ON_COOLDOWN"
  }
}
```

## Error Codes

| Code                     | Description                   | HTTP Status |
| ------------------------ | ----------------------------- | ----------- |
| `MISSING_PARAMS`         | Required parameters missing   | 400         |
| `RELAYER_NOT_CONFIGURED` | Gas sponsorship unavailable   | 500         |
| `PARENT1_ON_COOLDOWN`    | Parent 1 cannot breed yet     | 400         |
| `PARENT2_ON_COOLDOWN`    | Parent 2 cannot breed yet     | 400         |
| `BREEDING_FAILED`        | Blockchain transaction failed | 500         |

## Gas Sponsorship

- Uses platform relayer wallet for all breeding transactions
- 20% gas buffer for reliable execution
- 12-block confirmation wait
- Gas cost logging for monitoring

## Egg Record Fields

| Field                         | Type    | Description                                |
| ----------------------------- | ------- | ------------------------------------------ |
| `is_breeding_egg`             | boolean | True for bred eggs                         |
| `parent1_animal_id`           | number  | First parent animal ID                     |
| `parent2_animal_id`           | number  | Second parent animal ID                    |
| `generation`                  | number  | Breeding generation                        |
| `tx_hash`                     | string  | Blockchain transaction hash (may be empty) |
| `blockchain_child_token_id`   | string  | Token ID from blockchain event             |
| `blockchain_child_generation` | string  | Generation from blockchain event           |

## Comprehensive Error Handling

### Pattern: Log but Don't Rollback

```javascript
try {
  const breedResponse = fetch(WALLET_SRV_URL + '/api/wallet/breed-animals', {...});
  if (breedResponse.ok) {
    txHash = breedResponse.data.txHash;
  } else {
    console.error("Blockchain failed:", error);
    // Continue - don't rollback
  }
} catch (apiError) {
  console.error("API error:", apiError);
  // Continue - egg record created without tx_hash
}

// Always create egg record
createBreedingEggRecord(...);
```

### Benefits

1. **User Experience**: Breeding succeeds even if blockchain temporarily down
2. **Data Consistency**: Database state always reflects user actions
3. **Audit Trail**: Failed attempts logged for debugging
4. **Recovery**: Missing tx_hash indicates need for manual reconciliation

## Security Considerations

- Relayer wallet pays gas, not user
- Contract enforces cooldown at blockchain level
- Backend validates before calling wallet-api
- No private keys exposed in hook

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `eb84b67`: feat(21-05): backend hook improvements

## Self-Check: PASSED

- [x] Wallet-api breed-animals endpoint created
- [x] ANIMAL_NFT_ABI added with breeding functions
- [x] Backend hook calls wallet-api instead of mock
- [x] Comprehensive error handling implemented
- [x] Egg record fields populated correctly
- [x] Gas sponsorship configured
- [x] Build passes successfully
- [x] All files committed
