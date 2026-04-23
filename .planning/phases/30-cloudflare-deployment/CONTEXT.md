---
phase: 30
name: Cloudflare Pages Frontend Deployment
milestone: v0.0.9
depends_on: 29 (admin controls)
priority: P0 (deployment critical)
status: not_started
created: 2026-04-23
---

# CONTEXT.md — Cloudflare Pages Frontend Deployment

## Problem Statement

Frontend needs optimized deployment to Cloudflare Pages with CI/CD automation. Backend (PocketBase) and Wallet API are already hosted on VPS (root@204.168.144.14) and do NOT need migration.

## Deployment Goals

1. **Frontend** - Cloudflare Pages
   - Static export optimization (already configured: `output: 'export'`)
   - Edge caching for global performance
   - Preview branches on PR
   - Custom domain (eggoworld.io)
   - Automated CI/CD via GitHub Actions

2. **Backend APIs** - ALREADY HOSTED (no changes needed)
   - PocketBase: `https://pb.eggoworld.io` (VPS Docker Compose)
   - Wallet API: VPS deployment (same or separate server)
   - No Cloudflare Workers migration needed

## Current Deployment Status

**Frontend:**
- Already configured for static export (`output: 'export'` in next.config.mjs)
- Currently deployed to Cloudflare Pages (production)
- Build: `bun run build` → `apps/web/out/` static files
- Manual deployment process

**Backend (ALREADY HOSTED):**
- PocketBase on VPS: `root@204.168.144.14:/root/eggo-world-pb`
- Docker Compose deployment
- wallet-api on same VPS
- No changes needed

**Issues:**
- No CI/CD pipeline for automated frontend deployment
- No preview deployments on PR
- Manual deployment process

## Implementation Plan

| Plan | Description |
|------|-------------|
| 30-01 | Cloudflare Pages: Static export optimization, edge caching, custom domain binding |
| 30-02 | CI/CD: GitHub Actions workflow, preview branches on PR, production pipeline |

## Reference Files

- Next.js config: `apps/web/next.config.mjs`
- GitHub Actions: `.github/workflows/` (create new workflow)
- Cloudflare Pages config: Dashboard (wrangler.toml optional)

## Implementation Decisions (Pre-locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| D-01: Frontend host | Cloudflare Pages | Edge caching, free tier, preview branches |
| D-02: Backend host | Keep on VPS | Already working, no migration needed |
| D-03: Wallet API host | Keep on VPS | Already working, no migration needed |
| D-04: CI/CD | GitHub Actions | Native integration with Cloudflare Pages |

## Technical Configuration

### Cloudflare Pages Settings
- Build command: `cd apps/web && bun run build`
- Output directory: `apps/web/out`
- Root directory: `/` (monorepo root)
- Environment variables: `NEXT_PUBLIC_POCKETBASE_URL`, etc.

### GitHub Actions Workflow
```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd apps/web && bun install && bun run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: eggo-world
          directory: apps/web/out
```

## Acceptance Criteria

1. Frontend deploys automatically on push to main
2. Preview deployments created for PRs
3. Edge caching enabled globally
4. Custom domain bound (eggoworld.io)
5. Deployment time < 3 minutes
6. Rollback via Cloudflare dashboard

## Out of Scope

- Backend/Wallet API migration (already hosted)
- D1 database (not applicable)
- Cloudflare Workers (not needed)
- Smart contract deployment automation

---

_User correction: Frontend only - backend/wallet-api already hosted on VPS_