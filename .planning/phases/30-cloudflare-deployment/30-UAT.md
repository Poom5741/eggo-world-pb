---
phase: 30
uat: user acceptance testing
status: pending
created: 2026-04-23
---

# User Acceptance Testing - Phase 30: Cloudflare Pages Frontend Deployment

## UAT Scenario: Successful Cloudflare Pages Deployment

As a developer and platform maintainer, I want to confirm that the frontend application is successfully deployed to Cloudflare Pages with proper automation, caching, and custom domain setup, so that end users experience fast, reliable access to the platform.

## Acceptance Criteria

### AC-30.1: Static Export Functionality

**Given**: The Next.js app is configured with static export
**When**: I check the build configuration and deployment
**Then**: The frontend is properly exported as static files and serves correctly on Cloudflare Pages

**Test Steps:**

- [ ] Verify next.config.mjs contains `output: 'export'` for static export
- [ ] Confirm build generates static assets in apps/web/out directory
- [ ] Validate that the site functions without server-side rendering capabilities
- [ ] Test all routes work correctly in static export mode

**Expected Result**: All pages load correctly with no SSR errors.

### AC-30.2: Automated Deployment Pipeline

**Given**: GitHub Actions workflow is configured
**When**: I push changes to main branch or create PR
**Then**: The deployment pipeline executes automatically to Cloudflare Pages

**Test Steps:**

- [ ] Push a small change to main branch and verify automatic deployment
- [ ] Create a PR and verify preview deployment is generated
- [ ] Check GitHub Actions workflow executes successfully
- [ ] Verify deployment status is reported back to GitHub

**Expected Result**: Both production and preview deployments complete automatically without manual intervention.

### AC-30.3: Custom Domain Routing

**Given**: Custom domain eggoworld.io is configured
**When**: I visit the domain
**Then**: The site loads properly from Cloudflare Pages CDN

**Test Steps:**

- [ ] Navigate to eggoworld.io in browser
- [ ] Verify correct SSL certificate is served
- [ ] Check that all resources load from the correct domain
- [ ] Test both with and without www subdomain

**Expected Result**: Custom domain correctly resolves to Cloudflare Pages deployment.

### AC-30.4: Backend API Integration

**Given**: Frontend is deployed to Cloudflare Pages
**When**: Users access the application
**Then**: All API calls to PocketBase backend work correctly

**Test Steps:**

- [ ] Test user authentication (both LINE OAuth and email)
- [ ] Verify NFT dashboard functionality
- [ ] Check that wallet connections work properly
- [ ] Access and modify user-specific data

**Expected Result**: API calls to https://pb.eggoworld.io function properly from CF Pages deployment.

### AC-30.5: Performance and Edge Caching

**Given**: Site is served from Cloudflare Pages
**When**: Users access from various geographic locations
**Then**: Pages load with acceptable performance and proper caching

**Test Steps:**

- [ ] Measure load times from different geographic regions
- [ ] Verify static assets are served with proper caching headers
- [ ] Check that HTML response is optimized
- [ ] Validate that caching is working as expected

**Expected Result**: Consistent performance improvements with global edge availability.

## Exploratory Testing Areas

### Security Validation

- [ ] Verify no sensitive environment variables are leaked to frontend
- [ ] Confirm API endpoints are properly protected
- [ ] Check that there are no XSS vulnerabilities in static content

### Error Handling

- [ ] Test graceful error handling for failed API calls
- [ ] Verify 404 pages for invalid routes work properly
- [ ] Check how app behaves with PocketBase downtime

### Cross-Browser Compatibility

- [ ] Test in latest Chrome, Firefox, Safari, Edge
- [ ] Validate responsive design on various screen sizes
- [ ] Check that all functionality works across browsers

## Success Definition

This phase passes UAT if all acceptance criteria in AC-30.1 through AC-30.5 are satisfied, the frontend is successfully deployed to Cloudflare Pages, custom domain routing is functional, and GitHub Actions CI/CD pipeline operates correctly with auto-generated PR previews.

## Sign-off

- [ ] Development team approves deployment functionality
- [ ] Product owner validates custom domain and performance requirements
- [ ] Security review passed (no sensitive data exposure)
