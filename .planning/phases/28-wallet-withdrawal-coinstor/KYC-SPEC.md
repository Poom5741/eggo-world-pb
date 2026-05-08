# KYC Toggle Functionality Specification

## Overview

Implement comprehensive KYC (Know Your Customer) compliance system with on/off toggles for user features based on verification status. The system will allow platform administrators to manage user compliance levels and restrict features for non-compliant users.

## User Profile Schema Changes

### New Fields in Users Collection

- `kyc_verified` - Boolean (default: false)
- `kyc_status` - Enum: ["not_submitted", "pending", "approved", "rejected", "under_review"] (default: "not_submitted")
- `kyc_submitted_date` - DateTime (when user submits KYC)
- `kyc_reviewed_date` - DateTime (when admin reviews/resolves)
- `kyc_documents` - JSON field storing document information
- `kyc_rejection_reason` - Text (filled when KYC is rejected)
- `kyc_country_residence` - String (country of residence)
- `kyc_account_level` - Enum: ["basic", "verified", "premium"] (controls feature access, default: "basic")

## Frontend Implementation

### Deposit Restrictions

- When `kyc_verified` = false and `kyc_account_level` = "basic", impose:
  - Daily deposit limit: $200 USD equivalent
  - Monthly deposit limit: $1,000 USD equivalent
  - Show warning when limits approach
- Verified accounts may have higher limits

### Withdrawal Restrictions

- If `kyc_verified` = false:
  - Disable direct withdrawals to external wallets
  - Display message to complete KYC
  - Show alternative options
- If `kyc_verified` = true:
  - Full withdrawal functionality
  - Higher transaction limits

### KYC Submission Form

- Full name input
- National ID/Passport upload
- Proof of address (utility bill/bank statement, <3 months old)
- Selfie photo verification
- Country of residence selection
- Processing notice with typical wait time
- Submit button with consent acknowledgment

### KYC Status Dashboard

- Clear indicator of current KYC status
- Upload progress tracker
- Estimated time to verification
- FAQ section for common questions
- Contact support option

## Backend Implementation

### PocketBase Hooks

#### 1. KYC Document Submission Handler

- **Endpoint:** `/api/v2/kyc/submit` (require auth)
- **Function:** Process KYC document uploads and update user record
- **Logic:** Validate files, set kyc_status to "pending", update submission date

#### 2. Deposit Verification Hook

- Before deposit processing, check KYC status and limits
- Block deposit if limits would be exceeded

#### 3. Withdrawal Verification Hook

- Before withdrawal, check kyc_verified flag
- Block withdrawal to external wallet if not verified, allow internal transfers

#### 4. Admin KYC Review Handler

- **Endpoint:** `/api/v2/admin/kyc-review` (admin auth required)
- **Function:** Approve/reject KYC submissions
- **Logic:** Update kyc_status, kyc_reviewed_date, and kyc_rejection_reason

## KYC Toggle Mechanism

### Feature Access Tiers

#### Basic (kyc_verified = false)

- Wallet creation: ✅
- Egg NFT minting: ✅ (limited by USDT balance only)
- Internal USDT transfers: ✅
- Sell NFTs to other users: ✅
- Feed eggs with NFTs: ✅
- Participation in community features: ✅
- External withdrawals: ❌
- Large deposits: Limited by KYC-free tier ($1000/month)

#### Verified (kyc_verified = true)

- All Basic features: ✅
- External withdrawals: ✅ (higher limits)
- No deposit restrictions: ✅
- Higher transaction limits: ✅
- Advanced trading features: ✅

## Admin Interface Features

### KYC Verification Panel

- Filter submissions by status (pending, rejected, approved)
- Review individual KYC submissions
- Approve/reject submissions with reason option
- Batch approve function for bulk verification

### KYC Configuration Settings

- Adjustable limits for non-KYC users
- Automatic verification reminders
- Whitelist/blacklist users
- Global KYC requirement toggle

## Notifications and Communications

### Automated Messages

- Confirmation when KYC submitted
- Notification of approval/rejection
- Warning messages when limits are near
- Periodic reminders for new users to complete KYC

### User Experience

- Clear messaging when features are restricted
- Incentives for completing KYC (bonuses for verified users)
- Easy path to submit documentation
- Transparent appeals process for rejected applications

## Compliance and Legal Requirements

### Data Protection

- Secure document storage and handling
- Right to deletion for submitted documents
- Compliance with GDPR/local privacy laws
- Access logs for document review

### Documentation Retention

- Policy for document destruction timing
- Secure backup of critical verification data
- Audit trail of all verification actions

## Integration Points

### Frontend Components

- KYC status badges in user profiles
- Deposit/withdrawal restriction indicators
- KYC submission flow components
- Admin review dashboard components

### Email System

- KYC verification emails and notifications
- Approval/rejection notices
- Periodic status update emails

### Wallet API Integration

- Update user status and limits based on KYC level
- Adjust gas sponsorship eligibility based on verification status

## Security Considerations

### Document Security

- Encrypted storage of uploaded documents
- Access controls for viewing documents
- Automatic purging of documents after retention period
- Watermarking of documents to prevent misuse

### Fraud Prevention

- Suspicious activity flagging
- Duplicate submission detection
- Link analysis for identifying fake identities
- Integration with fraud databases (if required)

## Testing Requirements

### Unit Tests

- KYC status verification logic
- Restriction enforcement functions
- Document upload validation
- Tier-based functionality access

### Integration Tests

- Full KYC submission workflow
- Deposit/withdrawal restriction enforcement
- Admin review and approval process
- Feature access based on verification level

### User Journey Tests

- New user with/without KYC completion
- Transaction flow for both account types
- Admin verification workflow
- Document upload and retrieval processes

## Rollout Strategy

### Phase 1: Basic KYC Submission

- Document upload functionality
- Admin review panel
- Basic restriction enforcement
- User status dashboard

### Phase 2: Advanced Features

- Automated compliance checks
- Bulk verification tools
- Advanced restriction fine-tuning
- Integration with external verification services

### Phase 3: Optimization

- Process refinement based on user feedback
- Enhanced security features
- Improved user experience
- Additional compliance checks as needed
