# Fix LINE OAuth Flow - Use PocketBase Native OAuth2

## Phase 1: Update line-callback.html to Use Standard OAuth2 Redirect
- [ ] Change redirect format from `email+password` to `code+state`
- [ ] Keep server-side token exchange for security
- [ ] Redirect to `/auth/line` with OAuth2 params instead of credentials

## Phase 2: Rewrite /auth/line/page.tsx to Match /auth/callback Pattern
- [ ] Remove email+password param handling
- [ ] Add code+state param extraction
- [ ] Call PocketBase `/api/collections/users/auth-with-oauth2` endpoint
- [ ] Save auth token via `pb.authStore.save()`
- [ ] Handle referral application (preserve existing logic)

## Phase 3: Cleanup (Optional)
- [ ] Evaluate if `/api/auth/line-auth` endpoint can be removed
- [ ] Evaluate if `/api/auth/line-user` endpoint is still needed
- [ ] Test complete OAuth flow end-to-end

## Success Criteria
- [ ] LINE OAuth returns valid PocketBase OAuth2 token
- [ ] Dashboard API calls succeed after LINE login
- [ ] Token format matches standard PocketBase OAuth2 tokens
- [ ] Referral system still works
- [ ] No regressions in existing /auth/callback flow
