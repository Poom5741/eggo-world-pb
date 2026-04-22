# Phase 24: Polish & Launch Prep - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Production hardening for launch readiness: error boundaries with graceful degradation, monitoring dashboard for transaction success rates, performance optimization (bundle < 200KB, LCP < 2.5s), onboarding tutorial for first-time users, recruitment bonus system for downline rewards, and consolidated launch checklist for go-live verification.

**In scope:**

- Production error boundaries extending existing route-level pattern
- Admin monitoring page showing transaction success rates
- Bundle analysis with build-time warnings for performance budget
- Overlay onboarding tutorial triggered on first dashboard visit
- Recruitment bonus hook for Food NFT rewards (thresholds: 10/100/1,000/10,000)
- Markdown launch checklist for technical readiness verification

**Out of scope:**

- Smart contract changes for recruitment bonus
- USDT cash bonuses for recruitment (defer to future phase)
- External monitoring services (Sentry, Grafana)
- Full observability stack (Prometheus, etc.)
- CI/CD hard blocks for performance budget
- Legal/compliance checklist items (Phase 25+)

</domain>

<decisions>
## Implementation Decisions

### Error Boundaries & Graceful Degradation

- **D-01:** Route-level error boundaries — extend existing `error.tsx` pattern to all authenticated routes (dashboard, eggs, marketplace, mint, referrals, commissions, tiers, breeding)
- **D-02:** Error reporting via console + Cloudflare Analytics — structured console logs with error type/context, rely on Cloudflare for aggregation, no backend error_logs collection needed
- **D-03:** Graceful degradation: retry button + fallback UI — reuse marketplace/error.tsx pattern (retry + "Browse anyway" alternative action), claymorphism styling for error cards

### Monitoring Dashboard

- **D-04:** Admin page in app — create `/admin/monitoring` route with transaction metrics display, accessible to authenticated users (or admin-only if PocketBase role system exists)
- **D-05:** Metrics scope: transaction success rates — track mint, buy, feed, hatch, breed outcomes with status (success/failed/pending), timestamp, tx_hash
- **D-06:** Data source: PocketBase `transaction_logs` collection — hooks log tx outcomes on completion, dashboard queries collection for display, no external service dependency

### Performance Optimization

- **D-07:** Bundle analysis via `@next/bundle-analyzer` — add to package.json dev scripts, generates visual output during build for size breakdown
- **D-08:** Build-time warning for 200KB budget — warn in console if bundle exceeds target, allow deployment (no CI hard block)
- **D-09:** Optimization priority: dynamic imports for modals — lazy load BreedingDialog, TierClaimModal, MintEggModal, OnboardingTutorial using `next/dynamic`

### Onboarding Tutorial

- **D-10:** Tutorial type: overlay walkthrough — modal-based step-by-step guide with navigation arrows, dismissable, progress indicator, matches existing dialog pattern
- **D-11:** Trigger: first dashboard visit after OAuth — check localStorage on dashboard page load, show tutorial if `tutorial_completed` not set
- **D-12:** Storage: localStorage — hydration-safe `tutorial_completed: true` flag, no PocketBase migration needed, cleared on browser clear
- **D-13:** Content scope: dashboard overview — show dashboard layout, balance card, referral chain section, navigation tabs (eggs/marketplace), quick action buttons, dismiss after completion

### Recruitment Bonus System

- **D-14:** Implementation: PocketBase hook only — check `total_direct_recruits` field on registration, grant Food NFTs if threshold reached, no wallet-api endpoint needed
- **D-15:** Distribution: automatic on threshold — seamless UX, no claim button, increment when recruit count crosses 10/100/1,000/10,000
- **D-16:** Reward scope: Food NFTs only — defer USDT cash bonuses to Phase 25+, functional spec bonus table for Food items implemented

### Launch Checklist

- **D-17:** Checklist format: markdown file — `24-LAUNCH-CHECKLIST.md` in phases directory, follows 20-UAT.md pattern with checkboxes and verification notes
- **D-18:** Categories: technical readiness — error boundaries deployed, monitoring dashboard live, performance targets met (< 200KB bundle, < 2.5s LCP), health checks verified, all E2E flows tested
- **D-19:** Verification: manual execution — developer runs through checklist before deployment, marks items complete, no automated CI checks

### Claude's Discretion

- Exact error card layout specifics (follow marketplace/error.tsx claymorphism pattern)
- Monitoring dashboard visual design (use existing dashboard card patterns)
- Tutorial overlay styling (claymorphism modal, Material Symbols icons for steps)
- Tutorial step transition timing and animation
- Recruitment bonus notification message wording
- Exact bundle analyzer script configuration
- Launch checklist item granularity

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` §Phase 24 — POLISH-01 through POLISH-05 requirements (error boundaries, monitoring, performance, onboarding, recruitment bonus)
- `.planning/ROADMAP.md` §Phase 24 — Polish & Launch Prep milestone entry
- `docs/NFT_Marketplace_Functional_Spec.md` §5.3 — Recruitment bonus table with thresholds (10/100/1,000/10,000 recruits)

### Prior Phase Patterns

- `.planning/phases/20-gap-closure-uat-execution/20-CONTEXT.md` — Multi-layer validation pattern, UAT checklist format
- `.planning/phases/21-breeding-system/21-CONTEXT.md` — Dialog pattern for modal components
- `.planning/phases/22-tier-rewards-badges/22-CONTEXT.md` — Tier thresholds, reward distribution patterns
- `.planning/phases/23-secondary-market-royalties/23-CONTEXT.md` — Transaction logging patterns

### Error Handling

- `apps/web/app/marketplace/error.tsx` — Existing error boundary pattern with retry + fallback UI
- `apps/web/lib/error-utils.ts` — extractErrorMessage utility for safe error extraction
- `apps/web/lib/pocketbase/error-handling.ts` — isAutoCancelError, isNotFound, handlePocketBaseError utilities

### Performance & Deployment

- `apps/web/docs/DESIGN_SYSTEM.md` §Performance — Performance goals (Lighthouse 90+, FCP < 1.5s, bundle < 250KB)
- `docs/DEPLOY_RUNBOOK.md` §Monitoring — Health checks, metrics to monitor, alert configuration
- `docs/00-architecture.md` §Monitoring and Observability — Logging, metrics, health checks overview

### Recruitment Tracking

- `apps/backend/pb_hooks/07-register-user.pb.js` — Increments `total_direct_recruits` on registration
- `apps/backend/collections/users.json` — `total_direct_recruits` field definition
- `apps/web/app/referrals/page.tsx` — Referral dashboard showing downline count

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Error boundaries:** `apps/web/app/marketplace/error.tsx`, `apps/web/app/eggs/error.tsx` — Pattern to extend to other routes
- **Error utilities:** `apps/web/lib/error-utils.ts`, `apps/web/lib/pocketbase/error-handling.ts` — Console logging + Cloudflare pattern ready
- **Modal patterns:** `apps/web/components/egg/FeedDialog.tsx`, `apps/web/components/breeding/BreedingDialog.tsx` — Overlay walkthrough can reuse dialog structure
- **Dashboard layout:** `apps/web/app/dashboard/page.tsx` — Tutorial trigger point, existing card structure for monitoring
- **Registration hook:** `apps/backend/pb_hooks/07-register-user.pb.js` — Already increments `total_direct_recruits`, add bonus check

### Established Patterns

- **Route-level error.tsx:** Next.js convention for page-level error boundaries, already in marketplace/eggs
- **Claymorphism styling:** All error cards use `clay-card`, `shadow-clay-*`, rounded corners, Material Symbols icons
- **localStorage for client state:** Used for auth hydration checks, tutorial flag follows same pattern
- **Dynamic imports:** `next/dynamic` for lazy loading, apply to heavy modal components
- **PocketBase hooks:** Naming convention `NN-feature.pb.js`, response format `e.json(200, { success: true, data: {...} })`

### Integration Points

- **Error.tsx extension:** Add to `/dashboard`, `/mint`, `/referrals`, `/commissions`, `/tiers`, `/breeding` routes
- **Monitoring dashboard:** New `/admin/monitoring` route, query `transaction_logs` collection (new)
- **Bundle analyzer:** Add to `apps/web/package.json` dev scripts, run before deploy
- **Tutorial overlay:** New `OnboardingTutorial.tsx` component, triggered from `apps/web/app/dashboard/page.tsx`
- **Recruitment bonus:** Modify `07-register-user.pb.js` to check thresholds and grant Food NFTs
- **Launch checklist:** New `24-LAUNCH-CHECKLIST.md` in phases directory

### Known Gaps

- No transaction_logs collection exists — needs creation for monitoring dashboard
- No OnboardingTutorial component exists — needs creation
- No bundle analyzer configured — needs package addition and script
- No admin monitoring route exists — needs creation
- Recruitment bonus logic not implemented — needs hook modification

</code_context>

<specifics>

## Specific Ideas

- "Reuse marketplace error card pattern — users already understand retry + fallback UX, consistent styling"
- "Monitoring dashboard should feel like dashboard — same card layout, same claymorphism, familiar UX"
- "Tutorial as overlay keeps landing page clean — modal-based approach doesn't clutter marketing content"
- "localStorage for tutorial avoids backend migration — hydration-safe, no PocketBase schema change"
- "Recruitment bonus on registration hook — single point of logic, no extra wallet-api endpoint"
- "Food NFTs only for MVP recruitment bonus — USDT cash adds CoinStor complexity, defer"
- "Markdown checklist follows 20-UAT pattern — proven format, easy to review and update"

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within Phase 24 scope.

### Reviewed Todos (not folded)

No pending todos were reviewed for this phase.

</deferred>

---

_Phase: 24-polish-launch-prep_
_Context gathered: 2026-04-22_
