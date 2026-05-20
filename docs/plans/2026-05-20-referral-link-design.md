# Referral Link Auto-Fill Design

**Date:** 2026-05-20
**Feature:** Referral Link System with Auto-Fill on Mint Page

## Problem

Users need a way to share referral links that automatically credit them when new users mint eggs.

## Design Decisions

### 1. Referral Link Format
- **Option B (Selected):** Short referral CODE (6 chars like `EGG4XYZ`)
- Stored in `users.referral_code` field
- Excludes ambiguous characters (0/O, 1/I/L) to prevent copy errors

### 2. Share UX
- **Option A (Selected):** Copy button on dashboard
- Shows full referral link with one-click copy
- User pastes anywhere (LINE, Messenger, etc.)

### 3. Auto-fill UX
- **Option A (Selected):** Hidden field auto-process
- Referrer code comes from URL param `?ref=CODE`
- Auto-fills on page load with confirmation banner
- "Minting with referral from [username]"

## Data Model

### Schema Change: `users` Collection

```json
{
  "referral_code": {
    "type": "text",
    "name": "referral_code",
    "required": true,
    "options": { "min": 6, "max": 8 },
    "pattern": "^[A-Z2-9]{6,8}$"
  }
}
```

### Index
```sql
CREATE UNIQUE INDEX `idx_users_referral_code` ON `users` (`referral_code`)
```

## URL Structure

**Format:** `https://app.eggoworld.io/mint?ref=EGG4XYZ`

### Flow
1. Mint page reads `?ref=` param on mount
2. Validate format (6-8 uppercase alphanumeric via regex)
3. Lookup `referral_code` in users collection via PocketBase API
4. If valid, display confirmation banner
5. Submit `referrer_id` along with mint transaction

### Key Details
- Case-insensitive validation
- Invalid codes silently ignored (no referral credit)
- No localStorage - clean URL-based approach
- Network errors silently ignored, proceed without referral

## Components

### Dashboard: ReferralLinkCard
- Shows referral link with copy button
- Green confirmation when copied
- Only shows if user has `referral_code`

### Mint Page: ReferralBanner
- Green banner: "Minting with referral from [username]"
- Only shows when valid referrer found
- Hidden during loading states

## Implementation Tasks

1. Add `referral_code` field to users.json schema
2. Generate referral_code on user creation in `01-create-wallet.pb.js`
3. Add ReferralLinkCard to dashboard
4. Add ReferralBanner to mint page with URL param parsing