# Phase 6: Auth Flow Revamp - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning
**Source:** User discussion + plan analysis

<domain>
## Phase Boundary

This phase fixes the frontend authentication UX in `apps/web/`. It touches only the Next.js frontend auth pages, shared auth helper utilities, and middleware. No backend PocketBase changes are needed — the `line-callback.html` on PocketBase already works correctly (redirects back with `?email=&password=` params).

**What this phase delivers:**

- Single-click LINE OAuth initiation from login and signup pages
- Clean silent callback handler at `/auth/line`
- Post-auth redirect to intended destination (via `redirectTo`)
- No blank page flash after OAuth
- UI/UX Pro Max design system applied to auth pages for visual polish

**What this phase does NOT touch:**

- PocketBase backend hooks
- `line-callback.html` (already correct)
- Wallet creation flow
- Contract interactions

</domain>

<decisions>
## Implementation Decisions

### D-01: Eliminate intermediate click

- `/auth/login` button "LOGIN WITH LINE" → calls `initiateLineLogin()` directly on click, no navigation to `/auth/line` first
- `/auth/sign-up` button "SIGN UP WITH LINE" → calls `initiateLineLogin()` directly on click
- The `/auth/line` route becomes a callback-only handler; no user-visible LINE button

### D-02: Shared LINE OAuth helper

- Create `apps/web/lib/auth/line-oauth.ts`
- Export `initiateLineLogin(options: { referrer?: string; redirectTo?: string }): void`
- Function builds the LINE auth URL with state payload (random + returnUrl + referrer + redirectTo)
- Saves `redirectTo` and `referrer` to `sessionStorage` before `window.location.href = authUrl`
- `PRODUCTION_PB_URL` and `LINE_CLIENT_ID` constants live here (move from `/auth/line/page.tsx`)

### D-03: `/auth/line/page.tsx` — pure callback handler

- On mount: read `?email=&password=` from URL params
- If both present: call `pb.collection('users').authWithPassword(email, password)`, set `pb_auth` cookie, then `router.replace(sessionStorage.getItem('redirectTo') || '/')`; clear `redirectTo` from sessionStorage
- If params missing: immediately `router.replace('/auth/login')` (guards against direct navigation)
- Never show LINE login button
- Only renders: full-screen "PROCESSING..." loading state (matches EggoWorld pixel design system)

### D-04: Middleware `redirectTo` support

- In `middleware.ts`, when redirecting unauthenticated user to `/auth/login`, append `?redirectTo=${encodeURIComponent(pathname)}`
- Exclude `redirectTo` for public paths (already not redirected)
- Login page reads `redirectTo` from `useSearchParams()` and passes it to `initiateLineLogin()`

### D-05: Root page hydration fix

- In `apps/web/app/page.tsx`, after `isHydrated` is true, immediately check `pb.authStore.isValid` from cookie-loaded state
- If valid: skip the intermediate loading blank, go directly to `<Dashboard />`
- The `useIsHydrated` hook already fires a microtask-fast `useEffect` — this is acceptable latency; no change needed beyond ensuring cookie is set before navigation
- If further improvement needed: use `document.cookie` check synchronously before hydration to set initial `user` state

### D-06: UI/UX Pro Max design system

- All auth pages (`/auth/login`, `/auth/sign-up`, `/auth/line`) MUST use the existing EggoWorld design system
- Existing CSS classes: `card`, `btn-primary`, `info-error`, `label`, `font-[var(--font-pixel)]`, `bg-background`, `text-primary`, `text-accent`
- LINE green button stays: `bg-[#00C300] hover:bg-[#00a300]`
- Loading states use `animate-pulse`
- The ui-ux-pro-max skill should be consulted for any visual improvements to these pages
- Keep pixel art aesthetic consistent — no rounded corners (already border-4 pattern), no shadows

### D-07: TypeScript correctness

- `apps/web/tsconfig.json` has `strict: true`
- All new files must be TypeScript with proper types
- No `any` except where absolutely needed (PocketBase SDK auth record)
- Use `Suspense` wrapper for all components using `useSearchParams()`

### Claude's Discretion

- Error state UI in `/auth/line` callback (e.g., `authWithPassword` fails): show inline error with retry link to `/auth/login`
- Loading animation style (pulse vs spinner — follow existing pattern: `animate-pulse`)
- Whether to show user name/avatar during "PROCESSING..." state (keep minimal, just logo + text)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth files (READ BEFORE TOUCHING)

- `apps/web/app/auth/login/page.tsx` — current login page (replace <a> with button)
- `apps/web/app/auth/sign-up/page.tsx` — current signup page (replace navigate flow)
- `apps/web/app/auth/line/page.tsx` — current intermediate page (revamp to callback handler)
- `apps/web/app/auth/callback/page.tsx` — reference: how PocketBase OAuth callback works
- `apps/web/middleware.ts` — add redirectTo param
- `apps/web/app/page.tsx` — root page hydration guard

### Shared utilities

- `apps/web/lib/pocketbase/client.ts` — `createClient()`, `isAuthenticated()`, `logout()`
- `apps/web/hooks/use-is-hydrated.ts` — hydration guard pattern

### Design system reference

- `apps/web/styles/globals.css` — CSS custom properties, card/btn-primary/label classes
- `apps/web/app/auth/callback/page.tsx` — loading/success/error state pattern to follow

### Backend (READ ONLY, do not modify)

- `apps/backend/pb_public/line-callback.html` — redirects back with ?email=&password= params
- `apps/backend/pb_hooks/05-auth-token.pb.js` — line-exchange endpoint

### Design system

- Consult ui-ux-pro-max skill for visual polish recommendations

</canonical_refs>

<specifics>
## Specific Ideas

### LINE OAuth state payload (keep consistent with line-callback.html expectations)

```js
const stateData = {
  random: generateRandomString(16),
  returnUrl: `${window.location.origin}/auth/line`, // must stay /auth/line (callback handler)
  referrer: referrer || "",
  redirectTo: redirectTo || "", // NEW: add this field
}
const state = btoa(JSON.stringify(stateData))
```

### line-callback.html already reads `returnUrl` from state

The PocketBase callback page reads `stateData.returnUrl` and redirects to:
`${returnUrl}?email=...&password=...`
So `returnUrl` MUST always be `${window.location.origin}/auth/line` — DO NOT change this.
The `redirectTo` in state is for the frontend to read AFTER authWithPassword succeeds.

### Cookie pattern (match existing)

```js
document.cookie = `pb_auth=${authData.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
```

### `redirectTo` flow

1. Middleware redirects `/dashboard` → `/auth/login?redirectTo=%2Fdashboard`
2. Login page: `const redirectTo = searchParams.get('redirectTo')`
3. Login page saves: `sessionStorage.setItem('redirectTo', redirectTo)`
4. `initiateLineLogin({ redirectTo })` — also stores in sessionStorage
5. After OAuth: `/auth/line` reads `sessionStorage.getItem('redirectTo')` → redirects there
6. Clear `redirectTo` from sessionStorage after use

</specifics>

<deferred>
## Deferred Ideas

- Magic link / email password auth (not in scope)
- Social auth providers other than LINE
- Remember-me persistent sessions (7-day cookie already handles this)
- Animated page transitions between auth steps

</deferred>

---

_Phase: 06-auth-flow-revamp_
_Context gathered: 2026-04-04 via user discussion + plan analysis_
