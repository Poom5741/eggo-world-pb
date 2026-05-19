---
milestone: v0.9.0
milestone_name: Google OAuth Migration
created: 2026-05-19
status: active
total_requirements: 4
---

# Milestone v0.9.0 Requirements

**Defined:** 2026-05-19
**Core Value:** Gamified NFT marketplace on BSC where users buy eggs, feed with food NFTs, hatch animals, and trade on marketplace with 4-level MLM referral commissions
**Branch:** `dev`

Replace LINE OAuth with Google OAuth across the entire stack. PocketBase has built-in Google OAuth2 — no custom token exchange code needed. Frontend calls `authWithOAuth2({ provider: 'google' })` and PocketBase handles the rest.

---

## Authentication (AUTH)

- [ ] **AUTH-01**: User can sign in with Google OAuth using PocketBase's built-in Google provider
  - **Phase:** Phase 63
  - Details: Replace `provider: 'oidc'` → `provider: 'google'` in `apps/web/lib/auth/line-oauth.ts` (rename to `google-oauth.ts`). Configure Google OAuth2 provider in PocketBase Admin UI with Client ID + Secret.

- [ ] **AUTH-02**: First-time Google signup triggers automatic wallet creation
  - **Phase:** Phase 63
  - Details: Verify `onRecordCreate` hook (`01-create-wallet.pb.js`) fires for Google OAuth users identical to LINE flow. Wallet fields (`wallet`, `daccPublickey`, `pin`) populated automatically.

- [ ] **AUTH-03**: Referral tracking works through Google OAuth flow
  - **Phase:** Phase 63
  - Details: State param passes referrer through Google OAuth popup → callback → referral chain applied for new users via `/api/referrals/apply`.

- [ ] **AUTH-04**: All LINE-specific files removed from codebase
  - **Phase:** Phase 63
  - Details: Delete `apps/web/app/auth/line/`, `apps/backend/pb_public/line-*.html`, `apps/backend/pb_public/line-callback-fixed.js`, `apps/backend/pb_hooks/05-auth-token.pb.js` (deprecated). Replace LINE branding in login/signup/join pages with Google branding.

---

## Traceability

| REQ-ID | Phase    | Status  |
| ------ | -------- | ------- |
| AUTH-01 | Phase 63 | Pending |
| AUTH-02 | Phase 63 | Pending |
| AUTH-03 | Phase 63 | Pending |
| AUTH-04 | Phase 63 | Pending |

**Coverage:**

- v0.9.0 requirements: 4 total
- Mapped to phases: 4
- Unmapped: 0

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| User data migration between LINE and Google accounts | New auth method — users with LINE accounts must re-auth with Google; wallet data persists since it's keyed by PocketBase user record, not auth provider |
| Multi-provider linking (same user with both LINE + Google) | Too complex for initial migration; can add later if needed |
| LINE login preserved alongside Google | Goal is replacement, not coexistence |
| v0.8.0 remaining phases (59-62) | Deferred to future milestone |

---

_Requirements defined: 2026-05-19_
