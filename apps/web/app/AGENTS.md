# apps/web/app - App Router Pages

**Generated:** 2026-03-29
**Parent:** See `apps/web/AGENTS.md`

## OVERVIEW

Next.js 16 App Router pages with authentication flows, landing page, and role-based dashboards.

## STRUCTURE

```
apps/web/app/
├── page.tsx             # Landing page
├── layout.tsx           # Root layout
├── globals.css          # Global styles
└── auth/
    ├── login/
    │   └── page.tsx     # Login page
    ├── sign-up/
    │   └── page.tsx     # Signup page
    ├── callback/
    │   └── page.tsx     # OAuth callback
    ├── line/
    │   └── page.tsx     # LINE OAuth redirect
    └── error/
        └── page.tsx     # Error page
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add public page | `app/{route}/page.tsx` | Create directory, add page.tsx |
| Add protected page | `app/{route}/page.tsx` | Check auth in component |
| Add layout | `app/{route}/layout.tsx` | Nested layouts |
| Modify auth flow | `app/auth/` | LINE OAuth integration |
| Modify landing | `app/page.tsx` | Entry point |

## CONVENTIONS

**Page Structure:**
```typescript
// Always use "use client" for interactive pages
"use client"

export default function Page() {
  const isHydrated = useIsHydrated()
  const user = isHydrated ? pb.authStore.record : null
  
  if (!isHydrated) return <Loading />
  if (!user) return <LoginRedirect />
  
  return <Dashboard />
}
```

**File Naming:**
- Pages: `page.tsx` (required by App Router)
- Layouts: `layout.tsx` (optional)
- Loading: `loading.tsx` (optional)
- Error: `error.tsx` (optional)

**Route Groups:**
- Use `(group)` for organization (doesn't affect URL)
- Use `[param]` for dynamic segments

## ANTI-PATTERNS

**DO NOT:**
- Create `app/api/` routes (static export incompatible)
- Access browser APIs without hydration check
- Use `getServerSideProps` or `getStaticProps` (App Router)
- Create nested `app/app` structure (keep flat)

**NEVER:**
- Export components as default in non-page files
- Use client-side routing for auth redirects (use server)
- Hardcode PocketBase URLs (use env vars)

## UNIQUE STYLES

**Auth Check Pattern:**
```typescript
const isHydrated = useIsHydrated()
const user = isHydrated ? pb.authStore.record : null

useEffect(() => {
  if (isHydrated && !user) {
    router.push('/auth/login')
  }
}, [isHydrated, user])
```

**OAuth Callback Pattern:**
```typescript
// In callback/page.tsx
useEffect(() => {
  const handleCallback = async () => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    try {
      await pb.collection('users').authWithOAuth2({
        code,
        state,
      })
      router.push('/')
    } catch (error) {
      router.push('/auth/error')
    }
  }
  
  if (isHydrated) {
    handleCallback()
  }
}, [isHydrated])
```

## COMMANDS

```bash
# Run dev server
bun run dev

# Build
bun run build

# Test pages
bun test app/
```

## NOTES

**Entry points:** `/` (landing), `/auth/login`, `/auth/sign-up`

**OAuth flow:** Google → `/auth/callback` → Google redirect → `/auth/callback`

**Static export:** All pages pre-rendered, no SSR

**PocketBase:** Connects to `https://pb.eggoworld.io`
