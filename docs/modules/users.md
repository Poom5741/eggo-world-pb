# Users Module

## Overview
The users module handles user registration, authentication, profile management, and wallet integration in EggoWorld.

## Purpose
- User registration and authentication
- Profile management
- Wallet integration
- LINE OAuth integration
- User data persistence

## Domain Logic

### Registration Flow

```
1. User initiates registration
   ↓
2. Choose registration method:
   - Email/Password
   - LINE OAuth
   ↓
3. Validate input
   ↓
4. Create user record
   ↓
5. Generate EVM wallet
   ↓
6. Build referral chain
   ↓
7. Send welcome email
   ↓
8. Redirect to dashboard
```

### Authentication Methods

#### 1. Email/Password
- User provides email and password
- Password is hashed using bcrypt
- Email verification required
- Session managed via PocketBase JWT

#### 2. LINE OAuth
- User clicks "Sign up with LINE"
- Redirect to LINE OAuth page
- User authorizes application
- LINE redirects back with code
- Exchange code for access token
- Get user profile from LINE
- Create user account
- Generate wallet and referral chain
- Log user in

### User States

```
[Unverified] --verify email--> [Verified]
[Verified] --deactivate--> [Inactive]
[Inactive] --reactivate--> [Verified]
```

## Data Model

### Users Collection Schema

```javascript
{
  id: "record_id",
  email: "user@example.com",
  password: "hashed_password",
  walletAddress: "0x1234567890abcdef...",
  lineUserId: "U1234567890...",
  lineDisplayName: "John Doe",
  linePictureUrl: "https://...",
  referrerId: "referrer_record_id",
  usdtBalance: 100.50,
  eggNftCount: 0,
  foodNftCount: 2,
  animalNftCount: 0,
  totalEarned: 50.25,
  totalWithdrawn: 0.00,
  avatar: "file_id",
  verified: true,
  active: true,
  created: "2024-01-01T00:00:00Z",
  updated: "2024-01-01T00:00:00Z"
}
```

### Fields
- `id`: Unique record identifier
- `email`: User's email (unique)
- `password`: Hashed password (bcrypt)
- `walletAddress`: EVM wallet address
- `lineUserId`: LINE OAuth user ID (optional)
- `lineDisplayName`: LINE profile name (optional)
- `linePictureUrl`: LINE profile picture (optional)
- `referrerId`: ID of user who referred them (optional)
- `usdtBalance`: Current USDT balance
- `eggNftCount`: Number of Egg NFTs owned
- `foodNftCount`: Number of Food NFTs owned
- `animalNftCount`: Number of Animal NFTs owned
- `totalEarned`: Total commissions earned
- `totalWithdrawn`: Total USDT withdrawn
- `avatar`: Profile avatar file
- `verified`: Email verification status
- `active`: Account active status
- `created`: Account creation timestamp
- `updated`: Last update timestamp

## API Surface

### Backend Hooks

#### 1. Register User
**File**: `apps/backend/pb_hooks/06-register-user.pb.js`

**Endpoint**: `POST /api/users/register`

**Request (Email/Password)**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "referrerCode": "REFERRAL_CODE"
}
```

**Request (LINE OAuth)**:
```json
{
  "code": "LINE_OAUTH_CODE",
  "referrerCode": "REFERRAL_CODE"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "walletAddress": "0x...",
    "token": "jwt_token"
  }
}
```

#### 2. Login
**Endpoint**: `POST /api/users/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

#### 3. Get Profile
**Endpoint**: `GET /api/users/profile`

**Headers**:
```
Authorization: Bearer jwt_token
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "walletAddress": "0x...",
    "usdtBalance": 100.50,
    "eggNftCount": 0,
    "foodNftCount": 2,
    "animalNftCount": 0,
    "totalEarned": 50.25,
    "avatar": "https://..."
  }
}
```

#### 4. Update Profile
**Endpoint**: `PATCH /api/users/profile`

**Request**:
```json
{
  "displayName": "John Doe",
  "avatar": "file_data"
}
```

**Response**:
```json
{
  "success": true,
  "user": { ... }
}
```

### Frontend Components

#### RegisterForm
**Location**: `apps/web/components/auth/register-form.tsx`

**Props**:
```typescript
interface RegisterFormProps {
  onSuccess?: (user: User) => void;
  referrerCode?: string;
}
```

**Features**:
- Email/password validation
- Password strength indicator
- Referral code input
- Terms acceptance checkbox
- LINE OAuth button

#### LoginForm
**Location**: `apps/web/components/auth/login-form.tsx`

**Props**:
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void;
}
```

**Features**:
- Email/password input
- Remember me checkbox
- Forgot password link
- LINE OAuth button

#### UserProfile
**Location**: `apps/web/components/user/user-profile.tsx`

**Props**:
```typescript
interface UserProfileProps {
  userId: string;
}
```

**Displays**:
- User avatar and name
- Wallet address (truncated)
- USDT balance
- NFT counts
- Total earned
- Edit profile button

## Dependencies

### Depends On
- **Wallet Module**: Creates user wallet
- **Referrals Module**: Builds referral chain
- **Transactions Module**: Records registration bonus

### Depended By
- **NFT Module**: Identifies NFT owners
- **Referrals Module**: Tracks referrer relationships
- **Dashboard Module**: Displays user data

## Business Rules

### Registration Rules
1. **Email Unique**: Email addresses must be unique
2. **Password Requirements**: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
3. **Email Verification**: Required for email/password registration
4. **Wallet Creation**: Every user gets a unique EVM wallet
5. **Referral Chain**: Every user gets a 4-level referral chain
6. **No Duplicate LINE**: LINE user IDs must be unique

### Authentication Rules
1. **JWT Expiration**: Tokens expire after 7 days
2. **Refresh Tokens**: Support token refresh
3. **Secure Storage**: Store tokens in httpOnly cookies
4. **Logout**: Invalidate tokens on logout

### Profile Rules
1. **Email Changes**: Require email verification on change
2. **Password Changes**: Require current password
3. **Avatar**: Max 2MB, jpg/png/gif
4. **Display Name**: 3-50 characters

### Validation Rules
1. **Email Format**: Valid email address
2. **Password Strength**: Minimum requirements
3. **Wallet Address**: Valid EVM address format
4. **Referral Code**: Valid referrer ID

## Testing Strategy

### Unit Tests
- Password hashing and verification
- Email validation
- Registration flow
- Login flow
- Profile updates

### Integration Tests
- End-to-end registration
- LINE OAuth flow
- Email verification
- Profile management
- Authentication/authorization

### Edge Cases to Test
- Duplicate email registration
- Duplicate LINE user ID
- Invalid referral code
- Weak password rejection
- Expired JWT token
- Concurrent registration attempts
- Very long display names

## Common Issues & Solutions

### Issue: Duplicate Email Registration
**Symptom**: Multiple users with same email

**Solution**: Enforce unique constraint on email field:
```javascript
collection.createRule(
  "email",
  "unique",
  { message: "Email already registered" }
);
```

### Issue: LINE OAuth Fails
**Symptom**: OAuth redirect doesn't work

**Solution**: Verify LINE app configuration:
- Correct redirect URL
- Valid channel ID and secret
- Proper OAuth scopes

### Issue: Wallet Creation Fails
**Symptom**: User created but wallet missing

**Solution**: Implement rollback mechanism:
```javascript
try {
  await createWallet(userId);
} catch (error) {
  await deleteUser(userId);
  throw error;
}
```

### Issue: Referral Chain Not Built
**Symptom**: User registered without referral chain

**Solution**: Use database transaction for registration:
```javascript
await db.transaction(async (tx) => {
  const user = await createUser(tx, data);
  await createWallet(tx, user.id);
  await buildReferralChain(tx, user.id, referrerId);
});
```

## Performance Considerations

### Database Indexes
- Unique index on `email`
- Unique index on `lineUserId`
- Unique index on `walletAddress`
- Index on `referrerId` for referral queries

### Query Optimization
- Cache user profile data
- Use read replicas for profile queries
- Implement pagination for user lists

### Scalability
- Consider database sharding for large user bases
- Implement caching for frequently accessed profiles
- Use CDN for avatar images

## Security Considerations

### Password Security
- Hash passwords with bcrypt (cost factor 10+)
- Never log passwords or hash them in logs
- Implement password strength requirements
- Use secure password reset flow

### Authentication Security
- Use httpOnly cookies for JWT storage
- Implement CSRF protection
- Rate limit login attempts
- Detect and prevent brute force attacks

### Data Protection
- Encrypt sensitive data at rest
- Use TLS for all communications
- Sanitize all user input
- Implement proper access controls

### Privacy
- Comply with GDPR/data protection laws
- Implement data export functionality
- Support account deletion
- Minimize data collection

## Monitoring & Metrics

### Key Metrics to Track
- Total registered users
- Active users (daily/weekly/monthly)
- Registration conversion rate
- Authentication success rate
- LINE OAuth vs email/password split
- Profile completion rate

### Alerts
- Unusual registration patterns
- High authentication failure rates
- Failed wallet creation
- LINE OAuth failures

## Future Enhancements

### Potential Features
- **2FA**: Two-factor authentication
- **Social Login**: Additional OAuth providers (Google, Facebook)
- **Profile Customization**: More profile fields
- **User Tiers**: Bronze/Silver/Gold user levels
- **Achievements**: Badges and achievements
- **Activity Feed**: User activity timeline

### Scalability Improvements
- **User Partitioning**: Shard by user ID
- **Profile Caching**: Redis for profile data
- **Avatar CDN**: Dedicated CDN for images
- **Read Replicas**: Separate read DB for queries

## Related Documentation
- `/docs/01-domain-model.md` - User entity definition
- `/docs/modules/wallet.md` - Wallet creation and management
- `/docs/modules/referrals.md` - Referral chain building
- `/docs/guides/setup.md` - LINE OAuth setup guide
