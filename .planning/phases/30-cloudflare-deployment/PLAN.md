---
phase: 30
name: Cloudflare Pages Frontend Deployment
version: 1.0
status: planned
created: 2026-04-23
updated: 2026-04-23
type: deployment
---

# Phase 30 - Cloudflare Pages Frontend Deployment

## Executive Summary

This phase will implement automated deployments to Cloudflare Pages for the frontend application. The static export is already configured in `next.config.mjs`, so we'll focus on setting up the CI/CD pipeline via GitHub Actions, enabling preview deployments for PRs, and configuring custom domain routing.

## Implementation Plan

### Step 1: Cloudflare Pages Static Export Optimization

**Subtasks:**

1. Verify next.config.mjs is properly configured for static export optimization
2. Configure edge-side inclusion (ESI) tags where appropriate for dynamic content
3. Optimize asset delivery with proper preloading and caching headers

**Tasks:**

1. **Verify Static Export Configuration** - Review the existing `output: 'export'` configuration in `apps/web/next.config.mjs`
2. **Add Cloudflare Pages Customization** - Enhance the configuration with Cloudflare Pages specific settings if necessary

```
// Verify current settings in apps/web/next.config.mjs:
{
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true }, // Important for static exports
}
```

3. **Implement Fallback Route Handling** - Ensure SPA routes work correctly with Cloudflare Pages

### Step 2: Configure Cloudflare Pages Project

**Subtasks:**

1. Set up Cloudflare Pages project via dashboard
2. Link GitHub repository and configure build settings
3. Configure edge caching settings on Cloudflare

**Tasks:**

1. **Create Pages Project** - Log into Cloudflare dashboard and create new Pages project
2. **Connect GitHub Repository** - Configure repository linking and branch protection settings
3. **Configure Build Settings**:
   - Build command: `cd apps/web && bun install && bun run build`
   - Build output directory: `apps/web/out`
   - Root directory: repository root for monorepo support
4. **Environment Variables Setup**:
   - NEXT_PUBLIC_POCKETBASE_URL=https://pb.eggoworld.io
   - NODE_VERSION=latest (for Bun compatibility)

### Step 3: GitHub Actions CI/CD Pipeline

**Subtasks:**

1. Create GitHub Actions workflow for automated deployments
2. Implement preview deployment for PRs
3. Add production validation and health checks

**Tasks:**

```yaml
# File: .github/workflows/deploy-web.yml
name: Deploy Web Frontend to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: cd apps/web && bun install

      - name: Build project
        run: cd apps/web && bun run build
        env:
          NEXT_PUBLIC_POCKETBASE_URL: ${{ vars.NEXT_PUBLIC_POCKETBASE_URL || 'https://pb.eggoworld.io' }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: eggo-world-web
          directory: apps/web/out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

2. **Add Secrets to GitHub Repository** - Add CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
3. **Test Initial Deployment** - Run the workflow manually to validate configuration

### Step 4: Preview Branch Configuration

**Subtasks:**

1. Configure preview branch settings for Cloudflare Pages
2. Enable automatic preview deployments on PR
3. Verify PR comments and deployment links

**Tasks:**

1. **PR Status Checks** - Enable status checks to validate preview builds
2. **Automate Deployment Link Comments** - Configure PR comments to include preview URLs
3. **Cleanup Policy** - Set up automatic cleanup of preview deployments after PR merge/closure

### Step 5: Custom Domain Setup

**Subtasks:**

1. Configure eggoworld.io/custom domain for frontend
2. Set up SSL certificate via Cloudflare
3. Configure DNS records for proper routing

**Tasks:**

1. **Add Custom Domain** - Add eggoworld.io domain in Cloudflare Pages dashboard
2. **SSL Certificate** - Enable SSL/TLS with Full encryption mode
3. **DNS Configuration** - Update DNS records at domain registrar to point to Cloudflare

### Step 6: Edge Caching Configuration

**Subtasks:**

1. Define cache rules for optimal performance
2. Configure cache TTL for different content types
3. Set up cache warming strategies

**Tasks:**

1. **Cache Optimization** - Configure static asset caching to maximize edge hit ratio
2. **Asset Compression** - Ensure all assets are compressed (gzip/brotli) at edge
3. **Performance Monitoring** - Implement basic performance metrics tracking

### Step 7: Validation and Testing

**Subtasks:**

1. Test frontend functionality on Cloudflare Pages
2. Verify all external service integrations work properly
3. Validate edge performance improvements

**Tasks:**

1. **Functional Testing** - Verify all frontend features work as expected
2. **Integration Testing** - Ensure PocketBase authentication and API calls work
3. **Performance Baseline** - Document load times and performance metrics from edge locations
4. **Rollback Mechanism** - Test ability to rollback using Cloudflare dashboard

## Deliverables

### Primary

1. Operational Cloudflare Pages deployment of frontend application
2. Automated CI/CD pipeline for deployments
3. Preview deployments for pull requests
4. Custom domain (eggoworld.io) properly routed
5. Validated edge caching configuration

### Secondary

1. GitHub Actions workflow files
2. Cloudflare Pages documentation
3. Deployment validation test results

## Environment Variables

| Variable                   | Value                                  | Secret? | Purpose                       |
| -------------------------- | -------------------------------------- | ------- | ----------------------------- |
| CLOUDFLARE_API_TOKEN       | Cloudflare API key                     | Yes     | Access token for Pages API    |
| CLOUDFLARE_ACCOUNT_ID      | Account ID for your Cloudflare project | Yes     | Cloudflare account identifier |
| NEXT_PUBLIC_POCKETBASE_URL | https://pb.eggoworld.io                | No      | Production backend URL        |

## Constraints & Limitations

1. **Static Export Only** - Next.js app is configured for static export (`output: 'export'`) - no server-side rendering
2. **External API Dependency** - Frontend relies on external PocketBase backend at `https://pb.eggoworld.io`
3. **Monorepo Support** - Build needs to handle the monorepo structure with `cd apps/web/` command
4. **No Backend Migration** - PocketBase and wallet-api remain on current VPS hosting

## Success Criteria

1. ✅ Frontend deploys automatically on pushes to main
2. ✅ PRs generate preview deployments automatically
3. ✅ Custom domain properly resolves and serves content
4. ✅ All frontend functionality remains intact
5. ✅ Average edge latency under 200ms globally
6. ✅ Rollback capabilities are validated
7. ✅ Environment variables are properly configured

## Risks & Mitigation

| Risk                                     | Impact | Probability | Mitigation Strategy                             |
| ---------------------------------------- | ------ | ----------- | ----------------------------------------------- |
| Build failures affecting deploys         | High   | Medium      | Comprehensive testing before main branch merges |
| DNS propagation delays during migration  | Medium | Low         | Staged DNS migration with verification          |
| SSL certificate issues for custom domain | Medium | Low         | Early SSL certificate testing and validation    |
| Incorrect API endpoint configuration     | High   | Low         | Configuration checking and integration testing  |
| Edge caching misconfiguration            | Medium | Low         | Gradual roll-out and monitoring                 |

## Rollback Plan

1. **Immediate Rollback** - Use Cloudflare Pages dashboard to revert to previous deployment if needed
2. **GitHub Action Disable** - Temporarily disable the workflow to stop automated deployments
3. **Manual Deployment** - Alternative manual deployment via Wrangler CLI if GH Actions break
4. **DNS Failover** - Have backup DNS configuration to temporarily revert to old hosting

## Notes

- The `next.config.mjs` already has `output: 'export'` configuration which is required for static hosting
- Backend services remain on current VPS infrastructure at `https://pb.eggoworld.io`
- Consider setting up branch-based deployments (dev, staging) if additional environments are needed
- Implement basic analytics or performance monitoring after successful deployment
