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

- [x] **AUTH-01**: User can sign in with Google OAuth using PocketBase's built-in Google provider
  - **Phase:** Phase 63
  - Details: Replaced `provider: 'oidc'` → `provider: 'google'` in `google-oauth.ts`. Google OAuth2 provider must be configured in PocketBase Admin UI with Client ID + Secret.

- [x] **AUTH-02**: First-time Google signup triggers automatic wallet creation
  - **Phase:** Phase 63
  - Details: `01-create-wallet.pb.js` hook is auth-provider-agnostic — fires on user creation regardless of provider.

- [x] **AUTH-03**: Referral tracking works through Google OAuth flow
  - **Phase:** Phase 63
  - Details: State param passes referrer through OAuth popup → callback → referral applied. Logic preserved from LINE implementation.

- [x] **AUTH-04**: All LINE-specific files removed from codebase
  - **Phase:** Phase 63
  - Details: Deleted `apps/web/app/auth/line/`, `apps/backend/pb_public/line-*.html`, `line-callback-fixed.js`, `05-auth-token.pb.js`. All auth pages updated with Google branding.

---

## Traceability

| REQ-ID | Phase    | Status  |
| ------ | -------- | ------- |
| AUTH-01 | Phase 63 | Complete |
| AUTH-02 | Phase 63 | Complete |
| AUTH-03 | Phase 63 | Complete |
| AUTH-04 | Phase 63 | Complete |

**Coverage:**

- v0.9.0 requirements: 4 total
- Mapped to phases: 4
- Verified: 4

---

_Requirements defined: 2026-05-19_
_Last updated: 2026-05-19 — v0.9.0 shipped, all 4 requirements complete_
