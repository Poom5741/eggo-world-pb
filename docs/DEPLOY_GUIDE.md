# Frontend Deployment Guide — Cloudflare Pages

**Last Updated:** 2026-04-23
**Phase:** 30 - Cloudflare Pages Frontend Deployment

---

## Overview

This guide documents the deployment setup for the EggoWorld frontend to Cloudflare Pages. Backend (PocketBase) and Wallet API remain on VPS at `204.168.144.14`.

---

## Cloudflare Pages Project Setup (DEPLOY-03, DEPLOY-04)

### 1. Create Pages Project

1. Go to Cloudflare Dashboard → Pages → Create project
2. Connect to GitHub repository: `tokenine/eggo-pocketbase`
3. Project configuration:
   - **Project name:** `eggo-world-web` (existing Cloudflare Pages project)
   - **Production branch:** `main`
   - **Build command:** `cd apps/web && bun install && bun run build`
   - **Build output directory:** `apps/web/out`

### 2. Environment Variables (Production)

Configure in Pages → Settings → Environment variables:

| Variable                          | Value                                        | Description                        |
| --------------------------------- | -------------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_POCKETBASE_URL`      | `https://pb.eggoworld.io`                    | PocketBase API endpoint            |
| `NEXT_PUBLIC_USDT_ADDRESS`        | `0x55d398326f99059fF775485246999027B3197955` | BSC Mainnet USDT                   |
| `NEXT_PUBLIC_CHAIN_ID`            | `56`                                         | BSC Mainnet chain ID               |
| `NEXT_PUBLIC_EGG_NFT_ADDRESS`     | `0x...`                                      | EggNFT contract (if deployed)      |
| `NEXT_PUBLIC_MARKETPLACE_ADDRESS` | `0x...`                                      | Marketplace contract (if deployed) |

### 3. Custom Domain Binding (DEPLOY-04)

1. Go to Pages → Settings → Custom domains
2. Add domain: `eggoworld.io`
3. DNS configuration:
   - If using Cloudflare DNS: CNAME `eggoworld.io` → `eggo-world-web.pages.dev` (proxy enabled)
   - If using external DNS: CNAME `eggoworld.io` → `eggo-world-web.pages.dev`

### 4. Edge Caching (DEPLOY-03)

Cloudflare Pages provides automatic edge caching via the `_headers` file in `apps/web/public/_headers`:

**Current configuration:**

- Static assets (JS, CSS, fonts): 1 year immutable cache
- Images (PNG, JPG, SVG): 24 hour cache
- HTML pages: No cache (must-revalidate)

**Security headers included:**

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

---

## GitHub Repository Setup (DEPLOY-01, DEPLOY-02, DEPLOY-05)

### 1. Required Secrets

Configure in GitHub → Settings → Secrets and variables → Actions:

| Secret                  | Description                    | How to obtain                                                                          |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | API token for Pages deployment | Cloudflare Dashboard → My Profile → API Tokens → Create Token (Pages:Edit permissions) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID          | Cloudflare Dashboard → Overview (right sidebar, 32-char hex)                           |

### 2. Required Variables

Configure in GitHub → Settings → Secrets and variables → Actions → Variables tab:

| Variable                  | Value                                        |
| ------------------------- | -------------------------------------------- |
| `CLOUDFLARE_PAGES_PB_URL` | `https://pb.eggoworld.io`                    |
| `USDT_ADDRESS`            | `0x55d398326f99059fF775485246999027B3197955` |
| `CHAIN_ID`                | `56`                                         |

### 3. Workflow Permissions

Configure in GitHub → Settings → Actions → General:

- **Workflow permissions:** Read and write permissions
- **Allow GitHub Actions to create and approve pull requests:** ✓ Enabled

---

## Preview Deployments (DEPLOY-02)

Cloudflare Pages automatically creates preview deployments for every PR:

- **URL format:** `https://{branch}.eggo-world-web.pages.dev`
- **Branch:** Uses PR branch name
- **Environment variables:** Uses preview environment (configure separately if needed)

Preview deployments allow testing changes before merging to production.

---

## Deployment Time Target (DEPLOY-05)

Expected deployment times:

- **Build step:** ~1.5 minutes (Bun + Next.js static export)
- **Deploy step:** ~30 seconds (Cloudflare Pages API)
- **Total:** < 3 minutes ✓

---

## Workflow Files

- **Production deployment:** `.github/workflows/deploy-web.yml`
- **PR build check:** `.github/workflows/pr-checks.yml`

---

## Post-Deployment Verification

### Manual Checklist

1. ✓ `https://eggoworld.io` loads without errors
2. ✓ Login flow works (LINE OAuth → `https://pb.eggoworld.io/api/...`)
3. ✓ Wallet connection works on BSC Mainnet (Chain ID 56)
4. ✓ Dashboard displays user balance correctly
5. ✓ Marketplace pages load without 404 errors

### Automated Checks

The `deploy-frontend.yml` workflow includes:

- Build verification before deploy
- Artifact upload for rollback
- Preview deployment for PRs

---

## Troubleshooting

### Build Failures

1. Check `bun install` output for dependency issues
2. Verify `NEXT_PUBLIC_*` environment variables are set
3. Check Next.js build logs for missing pages

### DNS Issues

1. Verify CNAME record points to `eggoworld.pages.dev`
2. Check Cloudflare DNS proxy status (should be orange cloud)
3. Wait 5-10 minutes for DNS propagation

### API Connection Issues

1. Verify `pb.eggoworld.io` is accessible from browser
2. Check CORS settings on PocketBase
3. Verify SSL certificate is valid

---

## Rollback Procedure

1. Go to Cloudflare Pages → Deployments
2. Find the last successful deployment
3. Click "Rollback to this deployment"
4. Verify site loads correctly

---

## Architecture Summary

| Component            | Host                 | URL                                      |
| -------------------- | -------------------- | ---------------------------------------- |
| Frontend (Next.js)   | Cloudflare Pages     | `https://eggoworld.io`                   |
| Backend (PocketBase) | VPS (204.168.144.14) | `https://pb.eggoworld.io`                |
| Wallet API           | VPS (204.168.144.14) | `https://wallet.eggoworld.io` (internal) |
| Smart Contracts      | BSC Mainnet          | Chain ID: 56                             |

---

_Last updated: 2026-04-23 — Phase 30 deployment guide_
