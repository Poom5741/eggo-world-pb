# Phase 30: Cloudflare Pages Frontend Deployment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 30-cloudflare-pages-frontend-deployment
**Areas discussed:** Build output configuration, CI/CD workflow design, Environment variables handling

---

## Build Output Configuration

| Option                        | Description                                                                                    | Selected |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| Keep current config           | output: 'export', distDir: 'out', trailingSlash: true, images: unoptimized — no changes needed | ✓        |
| Change distDir to root-level  | Output to 'dist' for easier Cloudflare config                                                  |          |
| Add Cloudflare-specific files | headers.json, \_redirects, \_headers for routing/caching                                       |          |

**User's choice:** Keep current config (Recommended)
**Notes:** Existing next.config.mjs already configured correctly for static export. No modifications needed.

---

## CI/CD Workflow Design

### Trigger Strategy

| Option                           | Description                                 | Selected |
| -------------------------------- | ------------------------------------------- | -------- |
| Trigger on apps/web/\*\* changes | Independent frontend/backend pipelines      | ✓        |
| Trigger on all pushes to main    | Simpler but rebuilds frontend unnecessarily |          |
| Manual trigger only              | Full control, more friction                 |          |

**User's choice:** Trigger on apps/web/\*\* changes (Recommended)

### Preview Deployments

| Option                       | Description                          | Selected |
| ---------------------------- | ------------------------------------ | -------- |
| Enable PR previews           | Cloudflare creates unique URL per PR | ✓        |
| Production only, no previews | Simpler, requires local testing      |          |

**User's choice:** Enable PR previews (Recommended)

### Workflow Structure

| Option                   | Description                                   | Selected |
| ------------------------ | --------------------------------------------- | -------- |
| Separate workflow file   | deploy-frontend.yml, independent from backend | ✓        |
| Extend existing workflow | Single deploy-pocketbase.yml handles both     |          |

**User's choice:** Separate workflow file (Recommended)

### Build Command

| Option        | Description                        | Selected |
| ------------- | ---------------------------------- | -------- |
| Bun run build | Matches local dev, faster          | ✓        |
| npm run build | More universally supported, slower |          |

**User's choice:** Bun run build (Recommended)

**Notes:** User selected all recommended options for CI/CD — clean separation of concerns, Bun runtime consistency.

---

## Environment Variables Handling

### Variable Source

| Option                              | Description                                              | Selected |
| ----------------------------------- | -------------------------------------------------------- | -------- |
| Cloudflare Pages dashboard          | Settings > Environment variables, injected at build time | ✓        |
| GitHub Secrets + workflow injection | More portable, requires extra workflow config            |          |
| Commit .env.production file         | Simple but exposes values publicly                       |          |

**User's choice:** Cloudflare Pages dashboard (Recommended)

### Contract Addresses

| Option                       | Description                      | Selected |
| ---------------------------- | -------------------------------- | -------- | ----------------------------------- | --- |
| Hardcoded fallbacks          | USDT_ADDRESS                     |          | BSC mainnet address, reduces config | ✓   |
| Require all env vars         | Explicit configuration, stricter |          |
| Only PocketBase URL required | Minimal config                   |          |

**User's choice:** Hardcoded fallbacks (Recommended)
**Notes:** BSC mainnet addresses are stable and hardcoded in contract files already.

---

## Claude's Discretion

- Exact workflow job names and structure
- Preview deployment naming convention
- Build timeout configuration
- Error handling and rollback behavior

---

## Deferred Ideas

None — discussion stayed within Phase 30 scope.
