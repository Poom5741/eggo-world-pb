# Referrals Module

## Overview

The referrals module implements the 4-level MLM (Multi-Level Marketing) referral system that drives user growth and commission distribution in EggoWorld.

## Purpose

- Incentivize user referrals through commission rewards
- Track multi-level referral relationships
- Distribute commissions automatically on purchases
- Prevent referral fraud and abuse

## Domain Logic

### Referral Chain Structure

Every user has a **4-level referral chain**:

```
New User
  ↓ (referred by)
G1 (Level 1 - Direct Referrer) - 20% commission
  ↓ (referred by)
G2 (Level 2) - 10% commission
  ↓ (referred by)
G3 (Level 3) - 10% commission
  ↓ (referred by)
G4 (Level 4) - 10% commission
```

Plus **CoinStor Reserve**: 4% of every transaction
Plus **Protocol Treasury**: 46% of every transaction
**Total**: 100%

If a referrer doesn't have a complete chain, the **platform address** fills the gap.

### Commission Distribution

When a purchase occurs, commissions are distributed:

- **Total Referrer Payout**: 50% (20+10+10+10)
- **G1 Commission**: 20% of purchase amount
- **G2 Commission**: 10% of purchase amount
- **G3 Commission**: 10% of purchase amount
- **G4 Commission**: 10% of purchase amount
- **CoinStor Reserve**: 4% of purchase amount
- **Protocol Treasury**: 46% of purchase amount

**Example**: $25 Egg NFT purchase

- G1 earns: $5.00 (20%)
- G2 earns: $2.50 (10%)
- G3 earns: $2.50 (10%)
- G4 earns: $2.50 (10%)
- CoinStor Reserve: $1.00 (4%)
- Protocol Treasury: $11.50 (46%)

### Chain Building Algorithm

```javascript
// Pseudocode
function buildReferralChain(referrerId) {
  const chain = {
    g1: referrerId,
    g2: PLATFORM_ADDRESS,
    g3: PLATFORM_ADDRESS,
    g4: PLATFORM_ADDRESS,
  }

  // Get referrer's chain
  const referrerChain = getReferralChain(referrerId)

  // Build chain by walking up referrer's chain
  if (referrerChain) {
    chain.g2 = referrerChain.g1 || PLATFORM_ADDRESS
    chain.g3 = referrerChain.g2 || PLATFORM_ADDRESS
    chain.g4 = referrerChain.g3 || PLATFORM_ADDRESS
  }

  return chain
}
```

## Data Model

### Referrals Collection Schema

```javascript
{
  id: "record_id",
  referrerId: "referrer_user_id",
  refereeId: "new_user_id",
  level: 1, // 1-4
  g1: "g1_user_id",
  g2: "g2_user_id",
  g3: "g3_user_id",
  g4: "g4_user_id",
  totalCommission: 150.50,
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Fields

- `id`: Unique record identifier
- `referrerId`: User ID of the referrer
- `refereeId`: User ID of the new user (unique constraint)
- `level`: Level in referral chain (1-4)
- `g1-g4`: User IDs for each level in the chain
- `totalCommission`: Total commissions earned from this referral
- `createdAt`: When the referral was created

## API Surface

### Backend Hooks

#### 1. Create Referral Chain

**File**: `apps/backend/pb_hooks/05-referral-chain.pb.js`

**Endpoint**: `POST /api/referrals/create-chain`

**Request**:

```json
{
  "userId": "new_user_id",
  "referrerId": "referrer_user_id"
}
```

**Response**:

```json
{
  "success": true,
  "chain": {
    "g1": "g1_id",
    "g2": "g2_id",
    "g3": "g3_id",
    "g4": "g4_id"
  }
}
```

#### 2. Get Referral Chain

**Endpoint**: `GET /api/referrals/:userId`

**Response**:

```json
{
  "success": true,
  "chain": {
    "g1": { "id": "...", "name": "...", "wallet": "..." },
    "g2": { "id": "...", "name": "...", "wallet": "..." },
    "g3": { "id": "...", "name": "...", "wallet": "..." },
    "g4": { "id": "...", "name": "...", "wallet": "..." }
  }
}
```

#### 3. Distribute Commission

**Endpoint**: `POST /api/referrals/distribute-commission`

**Request**:

```json
{
  "amount": 25.0,
  "refereeId": "purchaser_user_id",
  "transactionId": "txn_id"
}
```

**Response**:

```json
{
  "success": true,
  "commissions": [
    { "level": 1, "userId": "g1_id", "amount": 5.0 },
    { "level": 2, "userId": "g2_id", "amount": 2.5 },
    { "level": 3, "userId": "g3_id", "amount": 2.5 },
    { "level": 4, "userId": "g4_id", "amount": 2.5 }
  ],
  "coinStor": 1.0,
  "treasury": 11.5
}
```

### Frontend Components

#### ReferralDashboard

**Location**: `apps/web/components/dashboard/referral-dashboard.tsx`

**Props**:

```typescript
interface ReferralDashboardProps {
  userId: string
}
```

**Displays**:

- User's referral code/link
- Total referrals count
- Total commissions earned
- Breakdown by level (G1-G4)
- Recent referral activity

#### ReferralLink

**Location**: `apps/web/components/referral/referral-link.tsx`

**Props**:

```typescript
interface ReferralLinkProps {
  referralCode: string
  className?: string
}
```

**Features**:

- Copy to clipboard functionality
- QR code generation
- Social media sharing buttons

## Dependencies

### Depends On

- **Users Module**: Creates user records
- **Transactions Module**: Records commission payments
- **Wallet Module**: Updates wallet balances

### Depended By

- **Registration Module**: Creates referral chain on signup
- **NFT Module**: Distributes commissions on purchases
- **Dashboard Module**: Displays referral statistics

## Business Rules

### Registration Rules

1. **Required Referrer**: Every user (except first) must have a referrer
2. **No Self-Referral**: A user cannot refer themselves
3. **Single Chain**: Each user has exactly one referral chain
4. **Immutable**: Referral relationships cannot be changed

### Commission Rules

1. **Percentage Fixed**: Commission percentages are immutable
2. **All Levels**: Commissions always distribute to all 4 levels
3. **Platform Fallback**: Platform address fills missing levels
4. **Instant Distribution**: Commissions distribute immediately on purchase
5. **No Negative Balances**: Commissions cannot create negative balances

### Validation Rules

1. **Referrer Exists**: Referrer must be an active user
2. **Chain Depth**: Exactly 4 levels (G1-G4)
3. **Unique Referee**: Each referee can only be referred once
4. **Active Referrers**: Only active users can earn commissions

## Testing Strategy

### Unit Tests

- Chain building algorithm
- Commission calculation
- Percentage validation
- Platform fallback logic

### Integration Tests

- End-to-end referral flow
- Commission distribution on purchase
- Balance updates
- Transaction creation

### Edge Cases to Test

- User without referrer (use platform address)
- Referrer with incomplete chain
- Circular referral attempts
- Same referrer multiple times
- Maximum chain depth (4 levels)
- Zero amount purchases
- Very large commission amounts

### Test Data

```javascript
// Test scenarios
const scenarios = [
  {
    name: "Direct referral",
    input: { referrerId: "user1" },
    expected: { g1: "user1", g2: "platform", g3: "platform", g4: "platform" },
  },
  {
    name: "Second level referral",
    input: { referrerId: "user2", referrerChain: { g1: "user1" } },
    expected: { g1: "user2", g2: "user1", g3: "platform", g4: "platform" },
  },
  {
    name: "Fourth level referral",
    input: { referrerId: "user4", referrerChain: { g1: "user3", g2: "user2", g3: "user1" } },
    expected: { g1: "user4", g2: "user3", g3: "user2", g4: "user1" },
  },
]
```

## Common Issues & Solutions

### Issue: Incomplete Referral Chain

**Symptom**: Some users have missing G2-G4 referrers

**Solution**: Always use platform address as fallback:

```javascript
chain.g2 = referrerChain?.g1 || PLATFORM_ADDRESS
```

### Issue: Circular Referrals

**Symptom**: User A refers B, B refers C, C tries to refer A

**Solution**: Validate no circular relationships during registration:

```javascript
function detectCircular(userId, referrerId) {
  let current = referrerId
  while (current) {
    if (current === userId) return true
    current = getReferrer(current)
  }
  return false
}
```

### Issue: Commission Calculation Errors

**Symptom**: Commissions don't add up to expected total

**Solution**: Validate commission percentages sum to 100% (including platform):

```javascript
const referrerTotal = 20 + 10 + 10 + 10 // 50%
const coinStor = 4 // 4%
const treasury = 46 // 46%
const total = referrerTotal + coinStor + treasury // 100%
if (total !== 100) throw new Error("Invalid percentages")
```

### Issue: Race Conditions in Commission Distribution

**Symptom**: Double-spending or lost commissions

**Solution**: Use database transactions for commission distribution:

```javascript
await db.transaction(async (tx) => {
  await distributeCommissions(tx, purchase)
  await updateBalances(tx, commissions)
})
```

## Performance Considerations

### Database Indexes

- Index on `refereeId` for fast lookups
- Index on `referrerId` for query performance
- Compound index on `(referrerId, createdAt)` for sorting

### Query Optimization

- Cache referral chains in memory
- Batch commission updates
- Use database transactions for atomicity

### Scalability

- Consider denormalizing referral data for read performance
- Implement caching for frequently accessed chains
- Use read replicas for analytics queries

## Security Considerations

### Fraud Prevention

- Validate no self-referrals
- Detect and prevent circular referrals
- Rate limit referral creation per IP/user
- Monitor for suspicious patterns

### Access Control

- Only users can view their own referral chain
- Admin access for audit and debugging
- API rate limiting on commission endpoints

### Data Protection

- Encrypt referral codes
- Sanitize referral links
- Validate all user input

## Monitoring & Metrics

### Key Metrics to Track

- Total number of referrals
- Referral conversion rate
- Average commission per referral
- Commission distribution by level
- Referral chain depth distribution
- Fraud detection alerts

### Alerts

- Unusual referral patterns (spikes in referrals)
- Failed commission distributions
- Circular referral attempts
- Commission calculation errors

## Future Enhancements

### Potential Features

- **Tiered Commissions**: Higher rates for top performers
- **Time-limited Bonuses**: Special commission events
- **Leaderboards**: Competitive referral rankings
- **Referral Contests**: Monthly/weekly competitions
- **Advanced Analytics**: Detailed referral analytics dashboard

### Scalability Improvements

- **Async Processing**: Queue-based commission distribution
- **Batch Updates**: Process commissions in batches
- **Caching Layer**: Redis for referral chain caching
- **Read Replicas**: Separate read DB for analytics

## Related Documentation

- `/docs/01-domain-model.md` - Referral entity definition
- `/docs/modules/transactions.md` - Commission transaction logic
- `/docs/modules/users.md` - User registration flow
- `/docs/02-decisions.md` - ADR-002: 4-Level MLM System
