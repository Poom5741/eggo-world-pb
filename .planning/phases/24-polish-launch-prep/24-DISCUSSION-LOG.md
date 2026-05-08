# Phase 24: Polish & Launch Prep - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 24-polish-launch-prep
**Areas discussed:** Error Boundaries, Monitoring Dashboard, Performance Optimization, Onboarding Tutorial, Recruitment Bonus, Launch Checklist

---

## Error Boundaries

| Option                    | Description                                                                       | Selected |
| ------------------------- | --------------------------------------------------------------------------------- | -------- |
| Route-level boundaries    | Reuse existing error.tsx pattern for all authenticated routes                     | ✓        |
| Root-level only           | Single root error boundary in LayoutWrapper                                       |          |
| Dual-layer (root + route) | Both root-level for critical errors and route-level for context-specific recovery |          |

**User's choice:** Route-level boundaries (Recommended)

**Error Reporting:**

| Option                    | Description                                         | Selected |
| ------------------------- | --------------------------------------------------- | -------- |
| Console + Cloudflare      | Log errors to console, rely on Cloudflare analytics | ✓        |
| PocketBase collection     | Create error_logs collection for full audit trail   |          |
| External service (Sentry) | Integrate Sentry for error tracking                 |          |

**User's choice:** Console + Cloudflare (Recommended)

**Graceful Degradation:**

| Option                       | Description                                         | Selected |
| ---------------------------- | --------------------------------------------------- | -------- |
| Retry + fallback UI          | Show retry button + 'Browse anyway' fallback        | ✓        |
| Auto-redirect after failures | Redirect to /dashboard after 3 failed retries       |          |
| Minimal fallback             | Show 'Something went wrong' card with reload button |          |

**User's choice:** Retry + fallback UI (Recommended)

---

## Monitoring Dashboard

| Option                   | Description                              | Selected |
| ------------------------ | ---------------------------------------- | -------- |
| Admin page in app        | Create /admin/monitoring page in Next.js | ✓        |
| External services only   | Use Cloudflare Analytics + UptimeRobot   |          |
| Full observability stack | Integrate Grafana or Prometheus          |          |

**User's choice:** Admin page in app (Recommended)

**Metrics Scope:**

| Option                    | Description                                          | Selected |
| ------------------------- | ---------------------------------------------------- | -------- |
| Transaction success rates | Track mint, buy, feed, hatch, breed outcomes         | ✓        |
| Performance metrics       | Track page load times, API latency                   |          |
| Business metrics          | Track NFT sales, referral signups, commissions       |          |
| System health             | Track pocketbase/wallet-api health, container uptime |          |

**User's choice:** Transaction success rates (Required)

**Data Source:**

| Option                  | Description                                         | Selected |
| ----------------------- | --------------------------------------------------- | -------- |
| PocketBase collection   | Hook creates transaction_logs collection            | ✓        |
| Container log parsing   | Parse existing hook logs from Docker output         |          |
| Frontend-only analytics | Track metrics only on frontend via analytics events |          |

**User's choice:** PocketBase collection (Recommended)

---

## Performance Optimization

| Option                | Description                                          | Selected |
| --------------------- | ---------------------------------------------------- | -------- |
| next-bundle-analyzer  | Use @next/bundle-analyzer package with visual output | ✓        |
| Manual size script    | Add performance script to Makefile                   |          |
| Custom webpack config | Configure webpack-stats-plugin for detailed analysis |          |

**User's choice:** next-bundle-analyzer (Recommended)

**Budget Enforcement:**

| Option             | Description                                         | Selected |
| ------------------ | --------------------------------------------------- | -------- |
| Build-time warning | Warn in build output if bundle exceeds 200KB        | ✓        |
| CI/CD hard block   | Fail CI build if bundle exceeds budget              |          |
| Manual monitoring  | No automated check, manually monitor via Cloudflare |          |

**User's choice:** Build-time warning (Recommended)

**Optimization Techniques:**

| Option                     | Description                                           | Selected |
| -------------------------- | ----------------------------------------------------- | -------- |
| Dynamic imports for modals | Lazy load non-critical components (modals, tutorials) | ✓        |
| Image optimization         | Add next/image configuration for all NFT images       |          |
| Dead code elimination      | Remove unused shadcn/ui components                    |          |
| Dependency audit           | Remove heavy dependencies if unused                   |          |

**User's choice:** Dynamic imports for modals (Recommended)

---

## Onboarding Tutorial

| Option                    | Description                                                | Selected |
| ------------------------- | ---------------------------------------------------------- | -------- |
| Overlay walkthrough       | Step-by-step modal covering dashboard → eggs → marketplace | ✓        |
| Inline tooltips           | Add 'info' icon tooltips to key UI elements                |          |
| Animated landing carousel | Replace static 'How To' section with interactive carousel  |          |

**User's choice:** Overlay walkthrough (Recommended)

**Trigger:**

| Option                   | Description                                                | Selected |
| ------------------------ | ---------------------------------------------------------- | -------- |
| First dashboard visit    | Show tutorial on first /dashboard visit after OAuth        | ✓        |
| First landing page visit | Show tutorial on landing page for unauthenticated visitors |          |
| Explicit help button     | Add 'Help' button in navigation, tutorial opens on click   |          |

**User's choice:** First dashboard visit (Recommended)

**Storage:**

| Option                     | Description                                      | Selected |
| -------------------------- | ------------------------------------------------ | -------- |
| localStorage               | Store tutorial_completed flag in localStorage    | ✓        |
| PocketBase user field      | Add tutorial_completed field to users collection |          |
| Hybrid (localStorage + PB) | Check both localStorage and PocketBase           |          |

**User's choice:** localStorage (Recommended)

**Content Scope:**

| Option               | Description                                          | Selected |
| -------------------- | ---------------------------------------------------- | -------- |
| Dashboard overview   | Show dashboard layout, balance, referral, navigation | ✓        |
| Egg management flow  | Show egg list, feed dialog, hatch button             |          |
| Marketplace browsing | Show marketplace tabs, buy now flow                  |          |
| Rewards system       | Show tier badges, referral link                      |          |

**User's choice:** Dashboard overview (Required)

---

## Recruitment Bonus

| Option                     | Description                                         | Selected |
| -------------------------- | --------------------------------------------------- | -------- |
| PocketBase hook only       | Hook checks total_direct_recruits, grants Food NFTs | ✓        |
| Smart contract integration | Contract handles bonus distribution                 |          |
| Hook + wallet-api          | Hook validates and calls wallet-api endpoint        |          |

**User's choice:** PocketBase hook only (Recommended)

**Distribution Timing:**

| Option                 | Description                                          | Selected |
| ---------------------- | ---------------------------------------------------- | -------- |
| Automatic on threshold | Grant Food NFTs when recruit count crosses threshold | ✓        |
| Manual claim           | Show notification badge, user clicks 'Claim Bonus'   |          |
| On next purchase       | Notify user, grant on next egg purchase              |          |

**User's choice:** Automatic on threshold (Recommended)

**USDT Bonus:**

| Option               | Description                                        | Selected |
| -------------------- | -------------------------------------------------- | -------- |
| Food NFTs only       | Implement only Food NFT rewards, defer USDT        | ✓        |
| Include USDT rewards | Include USDT cash bonus alongside Food NFTs        |          |
| Track + claim both   | Track eligibility, distribute both on manual claim |          |

**User's choice:** Food NFTs only (Recommended)

---

## Launch Checklist

| Option                | Description                                               | Selected |
| --------------------- | --------------------------------------------------------- | -------- |
| Markdown file         | Create 24-LAUNCH-CHECKLIST.md following 20-UAT.md pattern | ✓        |
| Admin UI checklist    | Create /admin/launch page with checklist items            |          |
| CI/CD pipeline checks | Add pre-deploy CI step that validates items               |          |

**User's choice:** Markdown file (Recommended)

**Categories:**

| Option                 | Description                                              | Selected |
| ---------------------- | -------------------------------------------------------- | -------- |
| Technical readiness    | Error boundaries, monitoring, performance, health checks | ✓        |
| User flow verification | All user flows verified (auth → mint → marketplace)      |          |
| Security verification  | Smart contract audits, gas sponsorship, wallet security  |          |
| Legal/compliance       | Terms acceptance UI, privacy policy, LINE OAuth consent  |          |

**User's choice:** Technical readiness (Required)

**Verification:**

| Option                 | Description                                            | Selected |
| ---------------------- | ------------------------------------------------------ | -------- |
| Manual execution       | Developer runs through checklist before deployment     | ✓        |
| Automated tests        | Run E2E tests against checklist scenarios              |          |
| Hybrid (auto + manual) | Auto tests for technical items, manual for UX/business |          |

**User's choice:** Manual execution (Recommended)

---

## Claude's Discretion

- Exact error card layout specifics
- Monitoring dashboard visual design
- Tutorial overlay styling
- Tutorial step transition timing
- Recruitment bonus notification wording
- Bundle analyzer script configuration
- Launch checklist item granularity

## Deferred Ideas

None — discussion stayed within Phase 24 scope.
