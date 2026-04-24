---
phase: 29-admin-controls-safety
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/app/admin/marketplace-control/page.tsx
  - apps/web/app/admin/monitoring/page.tsx
autonomous: true
gap_closure: true
requirements:
  - ADMIN-04
  - ADMIN-06
user_setup: []
---

<objective>
Fix 3 UAT gaps from Phase 29: runtime error in marketplace-control page, missing admin auth in monitoring page, and verify API endpoint accessibility.

Purpose: Close blocker and major gaps identified during UAT testing to make admin controls fully functional and secure.

Output: Fixed admin pages with correct auth checks, verified API endpoint connectivity.
</objective>

<execution_context>
@/Users/poom-work/tokenine/eggo-pocketbase/.qwen/get-shit-done/workflows/execute-plan.md
@/Users/poom-work/tokenine/eggo-pocketbase/.qwen/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/29-admin-controls-safety/29-UAT.md
@.planning/phases/29-admin-controls-safety/VERIFICATION.md
</context>

<interfaces>
<!-- Key patterns from existing codebase -->

From apps/web/lib/pocketbase/client.ts:

```typescript
// pb.authStore.record is a plain JS object, NOT a PocketBase Record
// Use direct property access: user.admin, NOT user.get("admin")
export function getUser() {
  const client = createClient()
  return client.authStore.record || client.authStore.model
}
```

From apps/web/hooks/use-is-hydrated.ts:

```typescript
// Required pattern for client-side auth checks
export function useIsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}
```

From apps/web/app/admin/marketplace-control/page.tsx (current broken code):

```typescript
// Line 32 - WRONG: user.get("admin") doesn't work on plain object
if (!user || !user.get("admin")) {  // ❌ Runtime error

// CORRECT: Use optional chaining on plain object
if (!user || !user?.admin) {  // ✓ Works correctly
```

From apps/web/app/admin/monitoring/page.tsx (current insufficient auth):

```typescript
// Line 59 - Only checks if auth is valid, NOT admin role
const isAuthorized = isHydrated && pb.authStore.isValid // ❌ Missing admin check

// CORRECT: Check both auth validity AND admin role
const user = pb.authStore.record
const isAdmin = user?.admin === true
const isAuthorized = isHydrated && pb.authStore.isValid && isAdmin // ✓
```

</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Fix runtime error in marketplace-control page</name>
  <files>apps/web/app/admin/marketplace-control/page.tsx</files>
  <behavior>
    - Test 1: Admin user with user.admin=true can access page
    - Test 2: Non-admin user is redirected to /auth/login
    - Test 3: Unauthenticated user is redirected to /auth/login
  </behavior>
  <action>
    Fix the incorrect API usage at line 32 where `user.get("admin")` is called on a plain JavaScript object.

    **Root Cause:** `pb.authStore.record` returns a plain JavaScript object (not a PocketBase Record model), so the `.get()` method doesn't exist. This causes "user.get is not a function" runtime error.

    **Fix:**
    1. Locate line 32 in `apps/web/app/admin/marketplace-control/page.tsx`:
       ```typescript
       // CURRENT (broken):
       if (!user || !user.get("admin")) {
       ```

    2. Change to direct property access with optional chaining:
       ```typescript
       // FIXED:
       if (!user || !user?.admin) {
       ```

    3. Also fix line 118 where `_user` is cast (not causing error but verify pattern is correct):
       ```typescript
       const _user = pb.authStore.record as any
       // This is fine - just casting, no .get() usage
       ```

    **Why this works:** PocketBase SDK stores the auth record as a plain object with direct properties (id, email, admin, etc.). The `.get()` method only exists on Record objects returned from `collection().getOne()` etc., not on `authStore.record`.

  </action>
  <verify>
    <automated>cd apps/web && bun run build && echo "Build successful - no runtime error"</automated>
  </verify>
  <done>
    - marketplace-control page loads without "user.get is not a function" error
    - Admin users see the marketplace controls UI
    - Non-admin users are redirected to /auth/login
    - Unauthenticated users are redirected to /auth/login
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add admin auth check to monitoring page</name>
  <files>apps/web/app/admin/monitoring/page.tsx</files>
  <behavior>
    - Test 1: Admin user can access monitoring page and see all tabs
    - Test 2: Non-admin user sees "Access Denied" message with redirect to login
    - Test 3: Unauthenticated user is redirected to /auth/login
  </behavior>
  <action>
    Add admin role verification to the monitoring page. Currently, the page only checks `pb.authStore.isValid` which allows any authenticated user to access the admin dashboard.

    **Fix Pattern (matching marketplace-control but using correct syntax):**

    1. In the `useEffect` at line 61-68, add admin check:
       ```typescript
       // CURRENT (lines 61-68):
       useEffect(() => {
         if (!isHydrated) return

         const fetchData = async () => {
           if (!isHydrated || !pb?.authStore?.isValid) {
             router.push('/auth/login')
             return
           }
           // ... rest of fetch
         }
         fetchData()
       }, [isHydrated, router])

       // FIXED:
       useEffect(() => {
         if (!isHydrated) return

         const fetchData = async () => {
           const user = pb.authStore.record
           if (!isHydrated || !pb?.authStore?.isValid || !user?.admin) {
             router.push('/auth/login')
             return
           }
           // ... rest of fetch
         }
         fetchData()
       }, [isHydrated, router])
       ```

    2. Update the `isAuthorized` check at line 59:
       ```typescript
       // CURRENT:
       const isAuthorized = isHydrated && pb.authStore.isValid

       // FIXED:
       const user = pb.authStore.record
       const isAdmin = user?.admin === true
       const isAuthorized = isHydrated && pb.authStore.isValid && isAdmin
       ```

    3. Update the "Access Denied" message at lines 353-364 to clarify admin requirement:
       ```typescript
       // CURRENT:
       <h2 className="text-2xl font-pixel-style mb-4">Access Denied</h2>
       <p className="mb-6">Please log in to access the monitoring dashboard.</p>

       // FIXED:
       <h2 className="text-2xl font-pixel-style mb-4">Admin Access Required</h2>
       <p className="mb-6">This dashboard is restricted to admin users only.</p>
       ```

    **Security Note:** This closes the elevation-of-privilege vulnerability where any authenticated user could view admin transaction logs and CoinStor controls.

  </action>
  <verify>
    <automated>cd apps/web && bun run build && echo "Build successful"</automated>
  </verify>
  <done>
    - Non-admin authenticated users see "Admin Access Required" message
    - Only users with user.admin=true can access monitoring dashboard
    - CoinStor admin tabs protected from unauthorized access
    - Transaction logs only visible to admin users
  </done>
</task>

<task type="auto">
  <name>Task 3: Verify API endpoint connectivity and PocketBase hook deployment</name>
  <files>apps/backend/pb_hooks/29-platform-control.pb.js</files>
  <action>
    Verify that the PocketBase platform control hooks are deployed and accessible. The UAT reported `/api/v2/platform/status` returns 404 through frontend proxy.

    **Diagnostic Steps:**

    1. Verify hook file exists (confirmed: `apps/backend/pb_hooks/29-platform-control.pb.js`)

    2. Check hook structure - the hook uses `routerAdd()` which is correct:
       ```javascript
       routerAdd("GET", "/api/v2/platform/status", (e) => { ... })
       ```

    3. Verify frontend is using correct PocketBase URL:
       - Frontend calls `${pb.baseURL}/api/v2/platform/status`
       - `pb.baseURL` comes from `NEXT_PUBLIC_POCKETBASE_URL` env var
       - Production: `https://pb.eggoworld.io`
       - Dev: `http://localhost:8090`

    4. **Potential causes of 404:**
       - PocketBase not running on production server
       - Hook file not deployed to production `pb_hooks/` directory
       - PocketBase needs restart to load new hooks

    5. **Verification commands to run:**
       ```bash
       # Check if PocketBase is accessible
       curl -I https://pb.eggoworld.io/api/health

       # Check if platform status endpoint exists (requires auth)
       # Will return 401 if endpoint exists, 404 if not
       curl -I https://pb.eggoworld.io/api/v2/platform/status
       ```

    6. **If 404 persists:** Document deployment instructions:
       - SSH to production server: `root@204.168.144.14`
       - Copy hook file: `scp apps/backend/pb_hooks/29-platform-control.pb.js root@204.168.144.14:/root/eggo-world-pb/pb_hooks/`
       - Restart PocketBase: `systemctl restart pocketbase` or `./pocketbase serve`
       - Verify hook loaded: Check PocketBase logs for hook registration

    7. **If endpoint returns 401:** Hook is working correctly - requires auth token.

    **Note:** The hook code itself is correct (uses `$app.findRecordById()` which returns PocketBase Record with `.get()` method). The issue is deployment/infrastructure, not code.

  </action>
  <verify>
    <automated>curl -s -o /dev/null -w "%{http_code}" https://pb.eggoworld.io/api/v2/platform/status || echo "PocketBase not reachable - requires manual deployment verification"</automated>
  </verify>
  <done>
    - Confirmed hook file exists in pb_hooks directory
    - Verified hook syntax is correct for PocketBase routerAdd
    - Documented deployment steps if hook not loaded on production
    - API endpoint returns 401 (auth required) if deployed correctly, NOT 404
  </done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary              | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| Client → PocketBase   | Frontend admin pages must verify user.admin before showing controls |
| Authenticated → Admin | Only users with admin=true can access admin endpoints               |

## STRIDE Threat Register

| Threat ID   | Category               | Component                    | Disposition | Mitigation Plan                                     |
| ----------- | ---------------------- | ---------------------------- | ----------- | --------------------------------------------------- |
| T-29-GAP-01 | Elevation of Privilege | monitoring/page.tsx          | mitigate    | Add user?.admin check before rendering admin UI     |
| T-29-GAP-02 | Spoofing               | marketplace-control/page.tsx | mitigate    | Fix auth check using correct property access syntax |
| T-29-GAP-03 | Information Disclosure | CoinStor tabs                | mitigate    | Only visible to admin users after fix               |

## Gap Mitigation Summary

| Gap   | Severity | Threat Mitigated                           | Fix                          |
| ----- | -------- | ------------------------------------------ | ---------------------------- |
| Gap 1 | BLOCKER  | Runtime crash prevents all admin access    | Fix user.get() → user?.admin |
| Gap 2 | MAJOR    | Any authenticated user can view admin data | Add admin role check         |
| Gap 3 | MAJOR    | API unreachable blocks admin controls      | Verify PocketBase deployment |

</threat_model>

<verification>
## Build Verification

```bash
cd apps/web && bun run build
# Should complete without errors
```

## Manual Verification (after fixes)

```bash
# 1. Login as admin user (user.admin=true in PocketBase)
# 2. Navigate to http://localhost:3000/admin/marketplace-control
# 3. Verify page loads without runtime error
# 4. Verify platform status badge shows ACTIVE or PAUSED
# 5. Navigate to http://localhost:3000/admin/monitoring
# 6. Verify admin dashboard shows transaction logs

# 7. Login as non-admin user
# 8. Navigate to /admin/marketplace-control
# 9. Verify redirect to /auth/login
# 10. Navigate to /admin/monitoring
# 11. Verify "Admin Access Required" message
```

## API Endpoint Verification

```bash
# Check if endpoint exists on production
curl -I https://pb.eggoworld.io/api/v2/platform/status

# Expected: 401 Unauthorized (endpoint exists, auth required)
# Problem: 404 Not Found (hook not deployed)
```

</verification>

<success_criteria>

- marketplace-control page loads without "user.get is not a function" error
- Admin users can access both /admin/marketplace-control and /admin/monitoring
- Non-admin authenticated users are blocked from admin pages
- Unauthenticated users redirected to login
- API endpoint /api/v2/platform/status returns 401 (not 404) when called without auth
- All fixes use correct syntax: user?.admin (NOT user.get("admin"))
  </success_criteria>

<output>
After completion, create `.planning/phases/29-admin-controls-safety/29-04-SUMMARY.md` with:
- Fixed files and line changes
- Verification results for each gap
- API endpoint accessibility status
- Deployment instructions if PocketBase hooks not loaded
</output>
