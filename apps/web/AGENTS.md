# apps/web - Frontend Application

**Generated:** 2026-03-29
**Parent:** See root `AGENTS.md`

## OVERVIEW

Next.js 16 frontend with Bun runtime, React 19, shadcn/ui, and Tailwind CSS 4. Static export for Cloudflare Pages deployment.

## STRUCTURE

```
apps/web/
├── app/                 # App Router pages and layouts
├── components/          # React components (colocate tests)
├── components/ui/       # shadcn/ui primitives
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and SDK clients
├── public/              # Static assets
├── styles/              # Global styles (Tailwind)
├── middleware.ts        # Edge auth middleware
└── package.json         # Dependencies (Bun)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add page | `app/{route}/page.tsx` | App Router, use layout.tsx |
| Add component | `components/` | PascalCase, colocate test |
| Add UI component | `components/ui/` | Run `bunx shadcn@latest add` |
| Add hook | `hooks/use-{name}.ts` | camelCase with use prefix |
| Add utility | `lib/` | Pure functions, clients |
| Modify auth | `middleware.ts` | Edge runtime, LINE OAuth |
| Modify PocketBase client | `lib/pocketbase/client.ts` | SDK wrapper |

## CONVENTIONS

**Hydration Safety (CRITICAL):**
```typescript
const isHydrated = useIsHydrated()
// ALWAYS check before accessing browser APIs
if (!isHydrated) return null

const user = isHydrated ? pb.authStore.record : null
```

**Component Structure:**
- Functional components with TypeScript
- `"use client"` directive for browser APIs
- Export default for pages, named for components

**Path Aliases:**
- `@/*` → `apps/web/*`
- `@/components/*` → `apps/web/components/*`
- `@/lib/*` → `apps/web/lib/*`

**Testing:**
- `bun test` (no config needed)
- Colocated: `component.test.tsx`
- File content assertions with `readFileSync`

## ANTI-PATTERNS (THIS PROJECT)

**DO NOT:**
- Access `window`, `localStorage` in initial render
- Access `pb.authStore.record` during SSR
- Create API routes in `app/api/` (static export incompatible)
- Import components during module-level initialization
- Use `useEffect` without hydration check

**NEVER:**
- Commit `.next/` build artifacts
- Use npm/yarn/pnpm (Bun only)
- Log auth tokens or user data

## UNIQUE STYLES

**Auth Pattern:**
```typescript
// Check hydration first
const isHydrated = useIsHydrated()
const user = isHydrated ? pb.authStore.record : null

// Redirect if not authenticated
useEffect(() => {
  if (isHydrated && !user) {
    router.push('/auth/login')
  }
}, [isHydrated, user])
```

**API Call Pattern:**
```typescript
const fetchData = async () => {
  if (!isHydrated || !user) return
  
  try {
    const token = pb.authStore.token
    const response = await fetch(url, {
      headers: { "Authorization": token }
    })
    // Handle response
  } catch (error) {
    // Error handling
  }
}

useEffect(() => {
  if (isHydrated) {
    fetchData()
  }
}, [isHydrated])
```

**Avatar URL Pattern:**
```typescript
const avatarUrl = isHydrated && avatarPath
  ? `https://pb.eggoworld.io/api/files/${avatarPath}`
  : '/default-avatar.png'
```

## COMMANDS

```bash
bun run dev              # Start dev (bun --hot)
bun run build            # Build for production
bun run test             # Run tests
bun run test:coverage    # With coverage
bun run lint             # ESLint

# Add shadcn/ui component
bunx shadcn@latest add button
```

## NOTES

**Deployment:** Static export to Cloudflare Pages (`output: 'export'`)

**PocketBase URL:** `https://pb.eggoworld.io` (production)

**Test Files:** Use `.test.tsx` extension, colocate with components

**shadcn/ui:** New-york style, Lucide icons, neutral base color
