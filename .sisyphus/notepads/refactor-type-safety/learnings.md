# Refactor Type Safety - Learnings

## Date
2026-04-13

## Key Patterns Discovered

### 1. PocketBase Type Handling
- `getUser()` returns `RecordModel` from PocketBase SDK
- Must cast to custom User interface when type safety needed
- Pattern: `{ id: userRecord.id, wallet: userRecord.wallet }`

### 2. Interface Definition for Deposit
Based on code analysis of deposit page usage:
- `id`, `user`, `amount`, `tx_hash`, `status`, `created` are required
- `status` is enum: 'pending' | 'confirmed' | 'failed'
- `from_address`, `confirmed_at` are optional

### 3. Fixing useState<any> Anti-patterns
- Replace `useState<any>` with proper interface
- Need explicit type casting when source is第三方 library type (RecordModel)

## Commands Used
```bash
npx tsc --noEmit  # TypeScript check
bun test          # Run tests
```

## Result
- 0 TypeScript errors for deposit/page.tsx
- 253 tests pass, 0 fail