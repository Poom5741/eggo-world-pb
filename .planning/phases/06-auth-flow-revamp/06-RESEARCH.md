# Phase 6: Auth Flow Revamp - Research

**Researched:** 2026-04-04  
**Domain:** Next.js App Router auth UX — LINE OAuth, sessionStorage, middleware, hydration  
**Confidence:** HIGH (all findings verified from codebase source)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Eliminate intermediate click**

- `/auth/login` button "LOGIN WITH LINE" → calls `initiateLineLogin()` directly on click, no navigation to `/auth/line` first
- `/auth/sign-up` button "SIGN UP WITH LINE" → calls `initiateLineLogin()` directly on click
- The `/auth/line` route becomes a callback-only handler; no user-visible LINE button

**D-02: Shared LINE OAuth helper**

- Create `apps/web/lib/auth/line-oauth.ts`
- Export `initiateLineLogin(options: { referrer?: string; redirectTo?: string }): void`
- Function builds the LINE auth URL with state payload (random + returnUrl + referrer + redirectTo)
- Saves `redirectTo` and `referrer` to `sessionStorage` before `window.location.href = authUrl`
- `PRODUCTION_PB_URL` and `LINE_CLIENT_ID` constants live here (move from `/auth/line/page.tsx`)

**D-03: `/auth/line/page.tsx` — pure callback handler**

- On mount: read `?email=&password=` from URL params
- If both present: call `pb.collection('users').authWithPassword(email, password)`, set `pb_auth` cookie, then `router.replace(sessionStorage.getItem('redirectTo') || '/')`, clear `redirectTo` from sessionStorage
- If params missing: immediately `router.replace('/auth/login')` (guards against direct navigation)
- Never show LINE login button
- Only renders: full-screen "PROCESSING..." loading state (matches EggoWorld pixel design system)

**D-04: Middleware `redirectTo` support**

- In `middleware.ts`, when redirecting unauthenticated user to `/auth/login`, append `?redirectTo=${encodeURIComponent(pathname)}`
- Exclude `redirectTo` for public paths (already not redirected)
- Login page reads `redirectTo` from `useSearchParams()` and passes it to `initiateLineLogin()`

**D-05: Root page hydration fix**

- In `apps/web/app/page.tsx`, after `isHydrated` is true, immediately check `pb.authStore.isValid` from cookie-loaded state
- If valid: skip the intermediate loading blank, go directly to `<Dashboard />`
- The `useIsHydrated` hook already fires a microtask-fast `useEffect` — this is acceptable latency; no change needed beyond ensuring cookie is set before navigation
- If further improvement needed: use `document.cookie` check synchronously before hydration to set initial `user` state

**D-06: UI/UX Pro Max design system**

- All auth pages (`/auth/login`, `/auth/sign-up`, `/auth/line`) MUST use the existing EggoWorld design system
- Existing CSS classes: `card`, `btn-primary`, `info-error`, `label`, `font-[var(--font-pixel)]`, `bg-background`, `text-primary`, `text-accent`
- LINE green button stays: `bg-[#00C300] hover:bg-[#00a300]`
- Loading states use `animate-pulse`
- The ui-ux-pro-max skill should be consulted for any visual improvements to these pages
- Keep pixel art aesthetic consistent — no rounded corners (already border-4 pattern), no shadows

**D-07: TypeScript correctness**

- `apps/web/tsconfig.json` has `strict: true`
- All new files must be TypeScript with proper types
- No `any` except where absolutely needed (PocketBase SDK auth record)
- Use `Suspense` wrapper for all components using `useSearchParams()`

### Claude's Discretion

- Error state UI in `/auth/line` callback (e.g., `authWithPassword` fails): show inline error with retry link to `/auth/login`
- Loading animation style (pulse vs spinner — follow existing pattern: `animate-pulse`)
- Whether to show user name/avatar during "PROCESSING..." state (keep minimal, just logo + text)

### Deferred Ideas (OUT OF SCOPE)

- Magic link / email password auth
- Social auth providers other than LINE
- Remember-me persistent sessions (7-day cookie already handles this)
- Animated page transitions between auth steps
  </user_constraints>

---

## Summary

Phase 6 fixes two specific UX bugs in the LINE OAuth flow and adds `redirectTo` support. The bugs are: (1) **double-click required** — login/signup pages navigate to `/auth/line` first (one navigation), then the user must click the LINE button again; (2) **blank page flash** — after OAuth callback sets auth and calls `router.replace('/')`, the root page shows a blank "LOADING..." state while `useIsHydrated` waits for a `useEffect` tick before reading `pb.authStore`.

The fix architecture is clean: extract `initiateLineLogin()` to a shared helper, call it directly from login/signup buttons, convert `/auth/line` to a pure silent callback handler, pass `redirectTo` through `sessionStorage`, and initialize `user` state synchronously from `pb.authStore` immediately after hydration. All changes stay within the Next.js frontend — no backend or `line-callback.html` changes needed.

**Primary recommendation:** Follow CONTEXT.md decisions exactly. The line-callback.html contract (`returnUrl` → `/auth/line`) is immutable — the fix works around it by adding `redirectTo` as a separate sessionStorage-only field that is never read by `line-callback.html`.

---

## Current Flow Analysis (Verified from Source)

### Bug 1: Double-Click — Where It Happens

**File:** `apps/web/app/auth/login/page.tsx` line 38-46  
[VERIFIED: codebase read]

```tsx
// Current — navigates to /auth/line (click 1)
<a href="/auth/line" className="...">
  LOGIN WITH LINE
</a>
```

When user lands on `/auth/login` and clicks "LOGIN WITH LINE":

1. Browser navigates to `/auth/line` (Next.js `<a>` = full page nav)
2. `/auth/line` renders `LineLoginContent` which shows **another** LINE button
3. User must click **again** to call `handleLineLogin()` (click 2)
4. `handleLineLogin()` builds the LINE auth URL and navigates to LINE

**File:** `apps/web/app/auth/sign-up/page.tsx` line 27-29  
[VERIFIED: codebase read]

```tsx
// Current — navigates to /auth/line with referrer (click 1)
const handleSignUp = () => {
  const redirectUrl = `/auth/line${referrer ? `?referrer=${referrer}` : ""}`
  router.push(redirectUrl) // click 1 → navigates to /auth/line, user must click again
}
```

### Bug 2: Blank Page Flash — Where It Happens

**File:** `apps/web/app/page.tsx` lines 14, 19, 36-45, 54-60  
[VERIFIED: codebase read]

Flow after OAuth success:

1. `/auth/line` calls `router.replace('/')` (after `authWithPassword` succeeds, cookie set)
2. Root page mounts — `isHydrated` starts as `false`
3. Page renders `<p>LOADING...</p>` (blank state) while waiting for `useEffect` to fire
4. `useEffect` fires (async, next tick), sets `isHydrated = true`
5. `useEffect` in `PageContent` then calls `createClient()`, reads `pb.authStore.record`, sets `user`
6. **Two separate async events** = two renders before dashboard appears

**Root cause:** `user` state starts as `null` (line 15: `useState<any>(null)`). Even after `isHydrated` becomes `true`, `user` is not set until the second `useEffect` (line 19) runs and calls `setUser(pb.authStore.record ?? null)`. Both effects run in the same batch but the render order causes the blank.

**The `useIsHydrated` hook:**

```ts
// apps/web/hooks/use-is-hydrated.ts
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  return isHydrated
}
```

[VERIFIED: codebase read] — Pure `useEffect`, fires after first paint. This is standard SSR hydration guard pattern.

**Fix path (D-05):** Initialize `user` state synchronously from `pb.authStore.record` inside `useState` lazy initializer, or unify the hydration check and user read into the same `useEffect`. The `pb_auth` cookie is already set before `router.replace('/')` is called (line 45 in `/auth/line/page.tsx`), so `createClient()` on root page can read from `localStorage` immediately.

---

## Architecture Patterns

### Pattern 1: `initiateLineLogin()` Shared Helper

[VERIFIED: codebase read — derived from existing `handleLineLogin` in `/auth/line/page.tsx`]

**What to extract from `/auth/line/page.tsx`:**

- `PRODUCTION_PB_URL = 'https://pb.eggoworld.io'` (line 9)
- `LINE_CLIENT_ID = '2009441873'` (line 10)
- `generateRandomString(length)` (lines 13-21)
- The full URL-building logic in `handleLineLogin()` (lines 71-106)

**New file structure:**

```typescript
// apps/web/lib/auth/line-oauth.ts

const PRODUCTION_PB_URL = 'https://pb.eggoworld.io'
const LINE_CLIENT_ID = '2009441873'

function generateRandomString(length: number): string { ... }

export function initiateLineLogin(options: {
  referrer?: string
  redirectTo?: string
}): void {
  const { referrer, redirectTo } = options

  // returnUrl ต้องเป็น /auth/line เสมอ — line-callback.html อ่านค่านี้เพื่อ redirect กลับ
  const returnUrl = `${window.location.origin}/auth/line`
  const stateData = {
    random: generateRandomString(16),
    returnUrl,              // DO NOT CHANGE — consumed by line-callback.html
    referrer: referrer || '',
    redirectTo: redirectTo || ''  // NEW — for frontend post-auth redirect only
  }
  const state = btoa(JSON.stringify(stateData))

  // บันทึก redirectTo ใน sessionStorage ก่อนออกจาก app
  if (redirectTo) sessionStorage.setItem('redirectTo', redirectTo)
  if (referrer) sessionStorage.setItem('referrer', referrer)
  sessionStorage.setItem('oauth_state', state)

  const redirectUri = `${PRODUCTION_PB_URL}/line-callback.html`
  const authUrl = `https://access.line.me/oauth2/v2.1/authorize` +
    `?response_type=code` +
    `&client_id=${LINE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid%20profile%20email` +
    `&state=${encodeURIComponent(state)}`

  window.location.href = authUrl
}
```

### Pattern 2: `/auth/line` as Pure Callback Handler

[VERIFIED: derived from existing callback logic lines 37-53 of `/auth/line/page.tsx`]

The existing page already has the callback logic — the revamp removes the login button entirely:

```tsx
// ✅ KEEP: callback handler on mount (lines 31-68 current)
// ✅ KEEP: loading state UI
// ✅ KEEP: error handling
// ❌ REMOVE: handleLineLogin function (lines 71-106)
// ❌ REMOVE: idle state render with LINE button (lines 134-173)
// ➕ ADD: guard — if no email/password params, router.replace('/auth/login')
// ➕ ADD: read sessionStorage.getItem('redirectTo') and redirect there after auth
// ➕ ADD: sessionStorage.removeItem('redirectTo') after use
```

**Key: `redirectTo` is NOT in `stateData` for `line-callback.html`** — it IS in `stateData` so it's available in state, but `line-callback.html` only uses `returnUrl`. The `redirectTo` in sessionStorage is the primary mechanism; the one in `stateData` is a fallback (state is passed through LINE but line-callback.html ignores unknown fields).

### Pattern 3: Middleware `redirectTo` Injection

[VERIFIED: codebase read — `middleware.ts` lines 12-14]

**Current code:**

```ts
if (!isAuthenticated && !isPublicPath) {
  return NextResponse.redirect(new URL("/auth/login", request.url))
}
```

**After fix:**

```ts
if (!isAuthenticated && !isPublicPath) {
  const loginUrl = new URL("/auth/login", request.url)
  loginUrl.searchParams.set("redirectTo", pathname)
  return NextResponse.redirect(loginUrl)
}
```

Note: `pathname` is already available from `request.nextUrl` (line 4).

### Pattern 4: Login Page with `useSearchParams` + `redirectTo`

[VERIFIED: codebase — sign-up page already uses `useSearchParams` with Suspense wrapper]

Login page needs to:

1. Wrap inner content in `Suspense` (D-07 — required for `useSearchParams`)
2. Read `redirectTo = searchParams.get('redirectTo')`
3. On button click: `initiateLineLogin({ redirectTo: redirectTo ?? undefined })`

**Note:** Login page currently does NOT use `useSearchParams` at all — it only has `useEffect` + `isAuthenticated()` check. Adding `useSearchParams` will require adding `Suspense` wrapper (like sign-up already has).

### Pattern 5: Root Page Hydration Fix

[VERIFIED: codebase — `page.tsx` lines 15, 39]

**Current problem:**

```tsx
const [user, setUser] = useState<any>(null) // always null on first render
// ...
useEffect(() => {
  const pb = createClient()
  setUser(pb.authStore.record ?? null) // async — causes extra render
}, [searchParams, router])
```

**Fix options (both acceptable per D-05):**

Option A — Lazy initializer (preferred, synchronous):

```tsx
const [user, setUser] = useState<any>(() => {
  // เรียก createClient() ทันทีเพื่อโหลด auth จาก localStorage ก่อน render
  if (typeof window === "undefined") return null
  return createClient().authStore.record ?? null
})
```

Option B — Synchronous `document.cookie` check:

```tsx
const [user, setUser] = useState<any>(() => {
  if (typeof window === "undefined") return null
  // ตรวจ cookie pb_auth ก่อน hydration
  return document.cookie.includes("pb_auth=") ? (createClient().authStore.record ?? null) : null
})
```

Option A is cleaner. The `createClient()` singleton is safe to call synchronously — it checks `typeof window !== 'undefined'` already (lines 12-36 of `client.ts`).

---

## line-callback.html Contract (IMMUTABLE)

[VERIFIED: `apps/backend/pb_public/line-callback.html` lines 61-70, 197-209]

**What `line-callback.html` reads from state:**

```js
const stateData = JSON.parse(atob(state))
returnUrl = stateData.returnUrl // ONLY this field is read
```

**What it does with `returnUrl`:**

```js
// Line 203-208: redirects to returnUrl with email+password+user as query params
const redirectWithAuth = `${returnUrl}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&user=${encodeURIComponent(JSON.stringify({...}))}`;
window.location.href = redirectWithAuth;
```

**Critical constraint:** `returnUrl` MUST be `${window.location.origin}/auth/line` — this is read by `line-callback.html` and is the URL it redirects back to. Adding `redirectTo` as an additional field in `stateData` is safe — `line-callback.html` ignores unknown fields. [VERIFIED: codebase]

**What `/auth/line` currently receives back:**

- `?email=<encoded>&password=<generated_password>&user=<encoded_json>`
- The `password` is the generated 32-char hex password used to create the user account
- The existing callback logic (lines 37-53) handles this correctly — just needs `redirectTo` support added

---

## Existing Test Infrastructure

[VERIFIED: codebase — found test files via filesystem scan]

**Test runner:** Bun test (`bun test`)  
**Config:** `bunfig.toml` with `[test] preload = ["./test-setup.ts"]`  
**Pattern:** File-content tests (static analysis via `readFileSync`) — not RTL component tests

**Existing auth tests that will BREAK after revamp:**

| File                           | Test                                                                                  | Will Break? | Why                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `app/auth/login/login.test.ts` | `contains LINE login button` + `expect content.toContain('/auth/line')`               | ✅ YES      | After fix, login won't have `href="/auth/line"` — will call `initiateLineLogin()` directly |
| `app/auth/line/line.test.ts`   | `contains LOGIN title` + `contains CONTINUE WITH LINE` + `contains LINE login button` | ✅ YES      | After fix, `/auth/line` won't have any login button or those strings                       |
| `app/auth/line/line.test.ts`   | `uses production PocketBase URL` + `PRODUCTION_PB_URL`                                | ✅ YES      | Constants move to `lib/auth/line-oauth.ts`                                                 |

**Tests that stay valid:**
| File | Test | Status |
|------|------|--------|
| `login.test.ts` | No email/password state, no Turnstile | ✅ Still valid |
| `sign-up.test.ts` | (need to check content) | Need to verify |

**Wave 0 gap:** All 3 existing auth tests need updating. New tests should verify:

- `login/page.tsx` contains `initiateLineLogin` import
- `line/page.tsx` does NOT contain `handleLineLogin` or LINE button
- `lib/auth/line-oauth.ts` exports `initiateLineLogin`
- `middleware.ts` contains `redirectTo` in redirect URL

---

## CSS / Design System Inventory

[VERIFIED: `apps/web/styles/globals.css` read]

**Available component classes:**

```css
.card          → bg-card rounded-lg shadow-sm (NOT pixel art — has rounded corners!)
.card--primary → card border-4 border-primary/50 p-6
.card--secondary → card border-2 border-primary/30 p-6
.btn-action    → h-12 px-6 font-[var(--font-pixel)] text-xs transition-colors
.page-title    → text-2xl md:text-3xl font-[var(--font-pixel)] text-primary
```

**Important finding:** The `.card` class has `rounded-lg` — the existing auth pages use `className="card"` directly. Per D-06, no rounded corners (pixel art aesthetic). The existing usage in auth pages does NOT add `rounded-none` override. This is a pre-existing inconsistency. **Do not change** `.card` class globally — just be consistent with existing auth page patterns.

**Classes used in existing auth pages (match these):**

```
font-[var(--font-pixel)]   → pixel font
bg-background              → page background
text-primary               → primary text color
text-accent                → accent (used for errors)
label                      → label text class (defined elsewhere — not in globals.css)
info-error                 → error info box (defined elsewhere)
animate-pulse              → loading animation
bg-[#00C300] hover:bg-[#00a300]  → LINE green button
```

**Note:** `label` and `info-error` and `btn-primary` classes are NOT defined in `globals.css`. They must be defined in another CSS file or Tailwind config. [ASSUMED — not verified which file] Planner should check for `@layer components` in other CSS files or Tailwind plugins.

---

## TypeScript Constraints

[VERIFIED: `apps/web/tsconfig.json`]

- `strict: true` — all new code must be fully typed
- `moduleResolution: "bundler"` — Bun-compatible resolution
- `@/*` path alias maps to `./` (root of `apps/web/`)
- So `lib/auth/line-oauth.ts` is importable as `@/lib/auth/line-oauth`

**Type for `initiateLineLogin` options:**

```typescript
interface LineLoginOptions {
  referrer?: string
  redirectTo?: string
}
```

**`authWithPassword` return type:** PocketBase SDK returns `RecordAuthResponse<RecordModel>`. The `authData.token` is `string`. No `any` needed here unless accessing custom fields on `record`.

**`useSearchParams()` + `Suspense` requirement:** [VERIFIED: D-07, existing sign-up page pattern]
Login page will need to be split into an inner component (like `SignUpContent`) wrapped by a `Suspense` boundary. The sign-up page already demonstrates this pattern (lines 77-87 of `sign-up/page.tsx`).

---

## Don't Hand-Roll

| Problem                  | Don't Build          | Use Instead                                           | Why                                                 |
| ------------------------ | -------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| URL state encoding       | Custom base64 scheme | Already using `btoa(JSON.stringify(...))`             | Consistent with `line-callback.html` expectations   |
| Cookie setting           | Custom cookie parser | Existing pattern: `document.cookie = \`pb_auth=...\`` | Already works, middleware reads it                  |
| Redirect after auth      | Complex router state | `sessionStorage` key `redirectTo`                     | Simple, survives page navigation, cleared after use |
| Auth state subscription  | Custom pub/sub       | `pb.authStore.onChange()`                             | Already wired in `client.ts`, used in `page.tsx`    |
| Random string generation | `Math.random()`      | `crypto.getRandomValues()`                            | Already done correctly in current code              |

---

## Common Pitfalls

### Pitfall 1: Breaking `line-callback.html` Contract

**What goes wrong:** Changing `returnUrl` from `${window.location.origin}/auth/line` to something else (e.g., to include `redirectTo` in the URL).  
**Why it happens:** Temptation to encode `redirectTo` in `returnUrl` to avoid sessionStorage.  
**How to avoid:** `returnUrl` in `stateData` is ONLY for `line-callback.html`'s redirect. `redirectTo` goes in `sessionStorage` (and optionally in `stateData` as an extra field that `line-callback.html` ignores).  
**Warning signs:** If `line-callback.html` redirects to a URL other than `/auth/line`, the callback handler won't receive `?email=&password=`.

### Pitfall 2: `sessionStorage` Not Available During SSR

**What goes wrong:** TypeScript error or runtime crash when accessing `sessionStorage` in server context.  
**Why it happens:** `initiateLineLogin()` is called from a click handler (client-only), but if imported at module level it could cause SSR issues.  
**How to avoid:** `initiateLineLogin()` uses `window.location.href` — this function is inherently client-only. Ensure it's only called from event handlers or inside `useEffect`. The file does NOT need `'use client'` pragma since it exports a function (not a component), but the calling components must be client components.  
**Warning signs:** Build errors mentioning `window is not defined` or `sessionStorage is not defined`.

### Pitfall 3: Existing Tests Will Fail After Revamp

**What goes wrong:** `bun test` fails because `login.test.ts` still expects `href="/auth/line"` and `line.test.ts` still expects the LINE login button and `PRODUCTION_PB_URL` constant to be in `/auth/line/page.tsx`.  
**Why it happens:** Tests are file-content assertions — they check specific strings in the source files.  
**How to avoid:** Update tests in the same task as the source changes. Tests to update:

- `app/auth/login/login.test.ts` — change `/auth/line` assertion to `initiateLineLogin`
- `app/auth/line/line.test.ts` — rewrite to test callback handler behavior, not login button
  **Warning signs:** `bun test` fails in `apps/web`.

### Pitfall 4: `redirectTo` Not Cleared After Use

**What goes wrong:** User logs in, gets redirected to `/dashboard`, logs out, logs back in and gets redirected to `/dashboard` again (stale sessionStorage).  
**Why it happens:** `sessionStorage.removeItem('redirectTo')` is forgotten in the callback handler.  
**How to avoid:** Clear `redirectTo` from sessionStorage immediately after reading it in `/auth/line/page.tsx`, before calling `router.replace(redirectTo || '/')`.

### Pitfall 5: Login Page Needs `Suspense` After Adding `useSearchParams`

**What goes wrong:** Build fails with "useSearchParams() should be wrapped in a suspense boundary at the page level".  
**Why it happens:** Login page currently doesn't use `useSearchParams()` — adding it without `Suspense` breaks the static export build.  
**How to avoid:** Extract `LoginContent` inner component, wrap in `Suspense` exactly like sign-up page (lines 77-87 of `sign-up/page.tsx`).

### Pitfall 6: `password` Parameter Expiry

**What goes wrong:** User bookmarks `/auth/line?email=...&password=...` and tries to use it later.  
**Why it happens:** The `password` in the URL is a one-time generated hex string for `authWithPassword`. It's not a real user-facing password.  
**How to avoid:** The callback handler should `router.replace('/auth/line')` without params after processing (already done with `router.replace()` which strips params). Not a risk for normal flow but good to note.

---

## Code Examples

### `initiateLineLogin` — Full Implementation

```typescript
// apps/web/lib/auth/line-oauth.ts
// Source: Extracted from apps/web/app/auth/line/page.tsx lines 9-105

const PRODUCTION_PB_URL = "https://pb.eggoworld.io"
const LINE_CLIENT_ID = "2009441873"

// สร้าง random string สำหรับ state parameter ใช้ crypto.getRandomValues (ปลอดภัยกว่า Math.random)
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues, (v) => chars[v % chars.length]).join("")
}

export interface LineLoginOptions {
  referrer?: string
  redirectTo?: string
}

export function initiateLineLogin(options: LineLoginOptions = {}): void {
  const { referrer, redirectTo } = options

  // returnUrl ต้องเป็น /auth/line เสมอ — line-callback.html อ่านค่านี้เพื่อ redirect กลับ
  // ห้ามเปลี่ยน! ดู apps/backend/pb_public/line-callback.html บรรทัด 65
  const returnUrl = `${window.location.origin}/auth/line`

  const stateData = {
    random: generateRandomString(16),
    returnUrl, // consumed by line-callback.html
    referrer: referrer ?? "",
    redirectTo: redirectTo ?? "", // ค่านี้ line-callback.html ไม่ได้ใช้ แต่เก็บไว้ใน state
  }
  const state = btoa(JSON.stringify(stateData))

  // บันทึกใน sessionStorage ก่อนออกจาก app (เพราะ window.location.href จะทำให้ page unload)
  sessionStorage.setItem("oauth_state", state)
  if (redirectTo) sessionStorage.setItem("redirectTo", redirectTo)
  if (referrer) sessionStorage.setItem("referrer", referrer)

  const redirectUri = `${PRODUCTION_PB_URL}/line-callback.html`
  const authUrl =
    "https://access.line.me/oauth2/v2.1/authorize" +
    "?response_type=code" +
    `&client_id=${LINE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&scope=openid%20profile%20email" +
    `&state=${encodeURIComponent(state)}`

  window.location.href = authUrl
}
```

### Login Page After Fix

```tsx
// apps/web/app/auth/login/page.tsx (สรุปการเปลี่ยนแปลง)
"use client"

import { isAuthenticated } from "@/lib/pocketbase/client"
import { initiateLineLogin } from "@/lib/auth/line-oauth" // NEW import
import { useRouter, useSearchParams } from "next/navigation" // NEW: useSearchParams
import { useEffect, Suspense } from "react"
import Image from "next/image"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams() // NEW
  const redirectTo = searchParams.get("redirectTo") // NEW

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/")
    }
  }, [router])

  const handleLineLogin = () => {
    // เรียก LINE OAuth โดยตรง — ไม่ต้อง navigate ไป /auth/line ก่อน
    initiateLineLogin({ redirectTo: redirectTo ?? undefined })
  }

  return (
    // ... existing layout ...
    <button onClick={handleLineLogin} className="...">
      LOGIN WITH LINE
    </button>
    // REMOVE: <a href="/auth/line" ...>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>LOADING...</div>}>
      {" "}
      {/* NEW: required for useSearchParams */}
      <LoginContent />
    </Suspense>
  )
}
```

### `/auth/line` Callback Handler After Fix

```tsx
// Key changes to apps/web/app/auth/line/page.tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const email = params.get("email")
  const password = params.get("password")

  // ถ้าไม่มี email/password → redirect ไป login (direct navigation guard)
  if (!email || !password) {
    router.replace("/auth/login")
    return
  }

  setStatus("loading")
  const pb = createClient()
  pb.collection("users")
    .authWithPassword(email, password)
    .then((authData) => {
      document.cookie = `pb_auth=${authData.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`

      // อ่าน redirectTo จาก sessionStorage และลบออกหลังใช้งาน
      const redirectTo = sessionStorage.getItem("redirectTo") || "/"
      sessionStorage.removeItem("redirectTo")

      router.replace(redirectTo)
    })
    .catch((_err) => {
      setError("Authentication failed. Please try again.")
      setStatus("idle") // → shows error state with retry link
    })
}, [router])

// REMOVE: handleLineLogin function entirely
// REMOVE: idle state render with LINE button
// KEEP: loading state with PROCESSING...
// ADD: error state with retry link to /auth/login (Claude's discretion)
```

### Middleware After Fix

```typescript
// apps/web/middleware.ts
if (!isAuthenticated && !isPublicPath) {
  const loginUrl = new URL("/auth/login", request.url)
  // เพิ่ม redirectTo เพื่อให้ login page redirect กลับมาหลัง auth สำเร็จ
  loginUrl.searchParams.set("redirectTo", pathname)
  return NextResponse.redirect(loginUrl)
}
```

### Root Page Hydration Fix

```tsx
// apps/web/app/page.tsx — fix blank flash
// เปลี่ยนจาก useState<any>(null) เป็น lazy initializer
const [user, setUser] = useState<any>(() => {
  // โหลด auth จาก localStorage ทันที (sync) แทนการรอ useEffect
  if (typeof window === "undefined") return null
  return createClient().authStore.record ?? null
})
```

---

## Files to Create/Modify

| Action | File                                    | What Changes                                                                 |
| ------ | --------------------------------------- | ---------------------------------------------------------------------------- |
| CREATE | `apps/web/lib/auth/line-oauth.ts`       | New shared helper with `initiateLineLogin()`                                 |
| MODIFY | `apps/web/app/auth/login/page.tsx`      | `<a>` → `<button onClick={handleLineLogin}>`, add `useSearchParams`+Suspense |
| MODIFY | `apps/web/app/auth/sign-up/page.tsx`    | `router.push('/auth/line')` → `initiateLineLogin({ referrer, redirectTo })`  |
| MODIFY | `apps/web/app/auth/line/page.tsx`       | Remove login button+handler, add guard, add `redirectTo` read+clear          |
| MODIFY | `apps/web/middleware.ts`                | Add `redirectTo` param to login redirect                                     |
| MODIFY | `apps/web/app/page.tsx`                 | Fix `user` state initialization (lazy initializer)                           |
| MODIFY | `apps/web/app/auth/login/login.test.ts` | Update assertions for new button pattern                                     |
| MODIFY | `apps/web/app/auth/line/line.test.ts`   | Rewrite for callback-handler behavior                                        |

---

## Validation Architecture

### Test Framework

| Property           | Value                               |
| ------------------ | ----------------------------------- |
| Framework          | Bun test (built-in)                 |
| Config file        | `apps/web/bunfig.toml`              |
| Quick run command  | `cd apps/web && bun test app/auth/` |
| Full suite command | `cd apps/web && bun test`           |

### Phase Requirements → Test Map

| Behavior                                             | Test Type       | Command                    | File                             |
| ---------------------------------------------------- | --------------- | -------------------------- | -------------------------------- |
| `login/page.tsx` calls `initiateLineLogin` directly  | Static analysis | `bun test app/auth/login/` | Update `login.test.ts`           |
| `line/page.tsx` has no LINE login button             | Static analysis | `bun test app/auth/line/`  | Update `line.test.ts`            |
| `lib/auth/line-oauth.ts` exports `initiateLineLogin` | Static analysis | `bun test app/auth/`       | New test in line.test.ts         |
| `middleware.ts` appends `redirectTo` param           | Static analysis | `bun test`                 | New middleware.test.ts or inline |
| `sessionStorage.removeItem('redirectTo')` present    | Static analysis | `bun test app/auth/line/`  | Update line.test.ts              |

### Wave 0 Gaps

- [ ] `app/auth/login/login.test.ts` — remove `/auth/line` href assertion, add `initiateLineLogin` assertion
- [ ] `app/auth/line/line.test.ts` — rewrite for callback-only handler (no button, no PRODUCTION_PB_URL in this file)
- [ ] Consider `lib/auth/line-oauth.test.ts` — verify `initiateLineLogin` signature and exports

---

## Project Constraints (from CLAUDE.md)

| Directive                                                   | Impact on Phase 6                                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Use Bun (NOT npm/yarn)                                      | `bun add`, `bun test`, `bun run dev`                                                                         |
| Thai comments in code                                       | All new code must have Thai comments per convention                                                          |
| App Router only, no Pages Router                            | All routes stay in `apps/web/app/`                                                                           |
| Server Components — use client components for interactivity | Auth pages are `'use client'` — correct                                                                      |
| shadcn/ui — import from `@/components/ui/*`                 | No shadcn changes in this phase                                                                              |
| NEVER commit secrets                                        | `LINE_CLIENT_ID` and `PRODUCTION_PB_URL` are public (hardcoded in frontend — OK)                             |
| Static export for Cloudflare Pages                          | Cannot use server-side cookies/headers — middleware reads cookies via `request.cookies` (Edge-compatible) ✅ |

**Static export constraint detail:** [VERIFIED: `config.json` — `static-export-cloudflare`] Next.js static export (`output: 'export'`) does NOT support middleware in the traditional sense. However, Cloudflare Pages uses Cloudflare Workers for middleware (Next.js on Cloudflare Pages adapter). Verify that `middleware.ts` is currently working (it is, per STATE.md — "All 17 routes rendering correctly"). The `redirectTo` addition is the same pattern — safe. [ASSUMED that current middleware deployment works on Cloudflare — not verified in this session]

---

## Assumptions Log

| #   | Claim                                                                                                                     | Section            | Risk if Wrong                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `label` and `info-error` CSS classes are defined somewhere (not in `globals.css`)                                         | CSS/Design System  | Low — these classes already work in production; just don't redefine them                                                                             |
| A2  | Cloudflare Pages middleware (Edge runtime) supports `searchParams.set()` on URL                                           | Middleware Pattern | Low — standard Web API, widely supported in Edge runtimes                                                                                            |
| A3  | PocketBase `authWithPassword` in `/auth/line` callback will succeed with the generated password from `line-callback.html` | Core flow          | Medium — if PB resets password between account creation and login, flow breaks. But this was fixed in BUG-006 (2026-04-04) and is currently working. |

---

## Sources

### Primary (HIGH confidence)

- `apps/web/app/auth/login/page.tsx` — current login page, double-click bug location
- `apps/web/app/auth/sign-up/page.tsx` — current signup page, double-navigate bug location
- `apps/web/app/auth/line/page.tsx` — current intermediate page, full handler code
- `apps/web/app/auth/callback/page.tsx` — reference pattern for loading/success/error states
- `apps/web/middleware.ts` — current redirect logic, redirectTo addition point
- `apps/web/app/page.tsx` — root page, blank flash source location
- `apps/web/lib/pocketbase/client.ts` — authStore.onChange pattern, cookie sync
- `apps/web/hooks/use-is-hydrated.ts` — hydration guard implementation
- `apps/backend/pb_public/line-callback.html` — immutable contract (lines 61-70, 197-209)
- `apps/web/styles/globals.css` — design system CSS classes
- `apps/web/tsconfig.json` — strict: true confirmed
- `.planning/config.json` — Bun, static-export-cloudflare confirmed
- `CLAUDE.md` — working agreements (Thai comments, Bun, App Router)

### Secondary (MEDIUM confidence)

- `apps/web/app/auth/login/login.test.ts` — existing tests that will need updating
- `apps/web/app/auth/line/line.test.ts` — existing tests that will need updating
- `apps/web/bunfig.toml` — test runner configuration

---

## Metadata

**Confidence breakdown:**

- Current flow analysis: HIGH — read directly from source files
- Fix patterns: HIGH — derived from existing patterns in the codebase
- line-callback.html contract: HIGH — read from source, critical section annotated
- Test impact: HIGH — test files read directly
- CSS/design system: MEDIUM — `label`/`info-error`/`btn-primary` not found in globals.css

**Research date:** 2026-04-04  
**Valid until:** 2026-05-04 (stable — all findings from codebase, not external sources)

---

## RESEARCH COMPLETE
