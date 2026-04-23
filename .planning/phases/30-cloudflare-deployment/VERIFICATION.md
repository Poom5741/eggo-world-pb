---
phase: 30
verification: checklist
status: pending
---

# Verification Checklist - Phase 30: Cloudflare Pages Frontend Deployment

## Pre-Implementation Verification

### 1. Static Export Configuration Review
- [ ] Verify `apps/web/next.config.mjs` still contains `output: 'export'`
- [ ] Confirm `trailingSlash: true` for clean URL handling 
- [ ] Verify `images: { unoptimized: true }` for static export compatibility
- [ ] Check that no API routes exist in `apps/web/app/api/` (would break static export)

### 2. Environmental Readiness  
- [ ] GitHub repository connected to Cloudflare Pages dashboard
- [ ] Cloudflare API token securely stored as GitHub secret (`CLOUDFLARE_API_TOKEN`)
- [ ] Cloudflare Account ID stored as GitHub secret (`CLOUDFLARE_ACCOUNT_ID`)
- [ ] Production PocketBase endpoint confirmed accessible via `NEXT_PUBLIC_POCKETBASE_URL`

## Implementation Verification

### 3. Cloudflare Pages Setup
- [ ] Cloudflare Pages project created with name `eggo-world-web`
- [ ] Build command set to: `cd apps/web && bun install && bun run build`
- [ ] Deployment directory set to: `apps/web/out`
- [ ] Root directory set to repository root for monorepo support
- [ ] Environment variables configured correctly:
  - [ ] `NEXT_PUBLIC_POCKETBASE_URL=https://pb.eggoworld.io`

### 4. GitHub Actions Workflow
- [ ] File `.github/workflows/deploy-web.yml` created successfully
- [ ] Workflow triggers on push to main branch
- [ ] Workflow triggers on pull request creation
- [ ] Cloudflare Pages Action integrated correctly with API token
- [ ] Workflow has access to necessary GitHub secrets

### 5. Preview Deployment Configuration
- [ ] Pull requests automatically generate preview deployments
- [ ] Preview deployment links posted to PR comments
- [ ] Preview deployments clean up after PR merge/closing
- [ ] Preview deployments use appropriate branch naming

## Post-Implementation Verification

### 6. Functional Testing
- [ ] Homepage loads correctly on Cloudflare Pages deployment
- [ ] Authentication flow works (LINE OAuth and email login)  
- [ ] User dashboard displays properly after login
- [ ] NFT marketplace features work as expected
- [ ] All routing works correctly with static export configuration
- [ ] Error handling and error pages display properly
- [ ] Service integrations with PocketBase work correctly

### 7. Performance Testing
- [ ] Page load times are acceptable (< 2 seconds)  
- [ ] Time to First Byte (TTFB) is under 200ms in major regions
- [ ] Assets (CSS, JS, images) load correctly from CDN
- [ ] All fonts are displaying properly and loaded from CDN
- [ ] Caching headers are properly configured for assets

### 8. Custom Domain Verification
- [ ] Custom domain eggoworld.io successfully points to Cloudflare Pages deployment
- [ ] SSL certificate properly issued and active for `eggoworld.io`
- [ ] Both `eggoworld.io` and `www.eggoworld.io` resolve properly
- [ ] HTTP redirects to HTTPS work correctly

### 9. Integration Verification
- [ ] All API calls to `https://pb.eggoworld.io` work correctly
- [ ] Authentication persists across page refreshes as expected
- [ ] WebSocket connections (if any) maintain external connections
- [ ] Third-party integrations function properly

### 10. Deployment Automation Verification
- [ ] Push to main branch triggers new production deployment
- [ ] Build completes successfully on Cloudflare Pages
- [ ] Previous deployment remains active until new one is ready
- [ ] Failed builds do not affect the current production deployment

### 11. Rollback Capability Verification
- [ ] Cloudflare Pages dashboard allows rolling back to previous deployment
- [ ] Manual deployment available if GitHub Actions fail
- [ ] DNS record points can be quickly redirected if needed

## Edge Caching Verification

### 12. Cache Performance
- [ ] Static assets are being served from Cloudflare edge locations
- [ ] Cache hit ratio is above 95%
- [ ] Cache TTL settings are appropriate for different content types (long for immutable assets, shorter for frequently changing content)
- [ ] HTML files with authentication state handle edge caching properly (might need different TTL or bypass cache for auth protected routes)

## Acceptance Criteria

### Must Have (Blockers)
- [ ] Production deployment accessible at configured domain
- [ ] All frontend functionality works as it did locally/previously  
- [ ] Authentication and API integrations function properly
- [ ] All tests pass (existing project tests)

### Should Have (Nice to Have)
- [ ] PR previews automatically deployed
- [ ] Global content delivery performs well (measured in multiple regions)
- [ ] PageSpeed/Lighthouse scores meet or exceed previous hosting

## Sign-off Requirements

- [ ] Lead Developer approves the implementation
- [ ] Product Owner confirms all acceptance criteria are met  
- [ ] No critical security vulnerabilities introduced
- [ ] Performance meets or exceeds previous levels