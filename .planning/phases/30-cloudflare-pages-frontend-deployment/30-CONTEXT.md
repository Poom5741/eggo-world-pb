# Phase 30: Cloudflare Pages Frontend Deployment - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Automate frontend deployment to Cloudflare Pages with edge caching, custom domain binding, and CI/CD via GitHub Actions. Backend (PocketBase at pb.eggoworld.io) and Wallet API remain on existing VPS — no migration needed.

**In scope:**

- GitHub Actions workflow for frontend build and deploy (trigger on apps/web/\*\* changes)
- Cloudflare Pages project setup with custom domain (eggoworld.io)
- Environment variables injection at build time (NEXT_PUBLIC_POCKETBASE_URL, contract addresses)
- Preview deployments for PRs
- Build output configuration verification (static export compatibility)

**Out of scope:**

- Backend/wallet-api migration to Cloudflare Workers (remain on VPS)
- D1 database migration (future milestone consideration)
- Smart contract deployment automation
- Full serverless architecture conversion
- Domain DNS changes for existing pb.eggoworld.io subdomain

</domain>

<decisions>
## Implementation Decisions

### Build Output Configuration

- **D-01:** Keep current next.config.mjs configuration — `output: 'export'`, `distDir: 'out'`, `trailingSlash: true`, `images: { unoptimized: true }` are already correct for Cloudflare Pages static export. No changes needed.

### CI/CD Workflow Design

- **D-02:** Trigger frontend build only on `apps/web/**` changes — keeps backend and frontend deployments independent, reduces unnecessary builds.
- **D-03:** Enable Cloudflare Pages preview deployments for every PR — unique URL per PR for review, free tier supports unlimited previews.
- **D-04:** Create separate `deploy-frontend.yml` workflow — frontend/backend deployments run independently, matches existing deploy-pocketbase.yml pattern.
- **D-05:** Use `bun run build` for CI — matches local dev environment, faster than npm, Bun already configured in apps/web/package.json scripts.

### Environment Variables Handling

- **D-06:** Define `NEXT_PUBLIC_*` environment variables in Cloudflare Pages dashboard (Settings > Environment variables) — injected at build time, single source of truth, no GitHub secrets needed for NEXT_PUBLIC vars.
- **D-07:** Use hardcoded fallbacks for contract addresses (USDT_ADDRESS || BSC mainnet address) — reduces configuration burden, good for production mainnet addresses.

### Claude's Discretion

- Exact workflow job names and structure (follow deploy-pocketbase.yml pattern)
- Preview deployment naming convention (Cloudflare default: pr-{number})
- Build timeout configuration (Cloudflare default: 20 minutes)
- Error handling and rollback behavior on failed builds

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` §Phase 30 — DEPLOY-01 through DEPLOY-05 requirements (auto deploy, preview branches, edge caching, custom domain, < 3min deploy time)
- `.planning/ROADMAP.md` §Phase 30 — Cloudflare Pages Frontend Deployment entry

### Deployment Configuration

- `apps/web/next.config.mjs` — Static export configuration (output: 'export', distDir: 'out', trailingSlash: true)
- `apps/web/package.json` — Build scripts (dev, build, analyze, check-size)
- `apps/web/.env.example` — Environment variable templates (NEXT_PUBLIC_POCKETBASE_URL, contract addresses)
- `docs/CLOUDFLARE_SETUP.md` — Cloudflare DNS, SSL, security configuration guide

### Existing Workflows

- `.github/workflows/deploy-pocketbase.yml` — Backend deployment pattern to follow (build, push, deploy, health check)
- `.github/workflows/pr-checks.yml` — PR validation pattern (tests, security, build check)

### Contract Addresses

- `apps/web/lib/contracts/usdt.ts` — USDT address fallback: 0x55d398326f99059fF775485246999027B3197955 (BSC mainnet)
- `apps/web/lib/contracts/eggNft.ts` — EGG NFT address fallback
- `apps/web/lib/contracts/marketplace.ts` — Marketplace address fallback

### Prior Phase Patterns

- `.planning/phases/24-polish-launch-prep/24-CONTEXT.md` — Performance targets (bundle < 200KB, LCP < 2.5s)
- `.planning/phases/12-wallet-api-contract-integration/12-CONTEXT.md` — Production deployment patterns

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Static export config:** `apps/web/next.config.mjs` — Already configured correctly for Cloudflare Pages
- **Build scripts:** `apps/web/package.json` — `bun run build` ready to use
- **Bundle analyzer:** `@next/bundle-analyzer` installed — can verify bundle size before deploy
- **Workflow patterns:** `.github/workflows/deploy-pocketbase.yml` — Structure to follow for frontend workflow

### Established Patterns

- **NEXT*PUBLIC*\* env vars:** All frontend env vars use NEXT*PUBLIC* prefix, injected at build time
- **Fallback addresses:** Contract addresses have hardcoded BSC mainnet fallbacks
- **Bun runtime:** All frontend scripts use Bun, matches CI requirement
- **Output directory:** `apps/web/out/` contains static export artifacts after build

### Integration Points

- **New workflow:** `.github/workflows/deploy-frontend.yml` — trigger on apps/web/\*\* changes
- **Cloudflare Pages:** New project setup via dashboard or Wrangler CLI
- **Environment vars:** Configure in Cloudflare Pages Settings > Environment variables
- **Custom domain:** eggoworld.io binding in Cloudflare Pages Settings > Custom domains

### Known Gaps

- No frontend deployment workflow exists — needs creation
- No Cloudflare Pages project configured — needs setup
- No environment vars configured in Cloudflare Pages — needs manual setup
- No custom domain bound — needs configuration in Cloudflare dashboard

</code_context>

<specifics>

## Specific Ideas

- "Keep next.config.mjs unchanged — output: 'export' already correct for Cloudflare Pages static hosting"
- "Separate workflow file follows deploy-pocketbase.yml pattern — independent frontend/backend pipelines"
- "Bun in CI matches local dev — same runtime, same behavior, faster builds"
- "Cloudflare Pages dashboard for env vars — simpler than GitHub Secrets for NEXT_PUBLIC vars"
- "Preview deployments automatic — Cloudflare creates unique URL for each PR"
- "Hardcoded contract address fallbacks — BSC mainnet addresses stable, no config drift"

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within Phase 30 scope.

### Reviewed Todos (not folded)

No pending todos were reviewed for this phase.

</deferred>

---

_Phase: 30-cloudflare-pages-frontend-deployment_
_Context gathered: 2026-04-23_
