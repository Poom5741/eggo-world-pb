# Learnings: fix-auth-redirects

## Project Conventions
- Testing: Bun test, colocated `*.test.tsx` files
- Frontend: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Bun
- TypeScript: strict: true, path alias `@/*` in `apps/web`
- Hydration safety: Use `useIsHydrated()` hook pattern
- PocketBase client: `@/lib/pocketbase/client`

## Patterns Found
- Auth check: `isAuthenticated()` from pocketbase client
- Link component: Next.js `Link` from `next/link`

## Decisions
- TDG approach: RED → GREEN → REFACTOR
- Hook location: `apps/web/hooks/use-auth-redirect.ts`
- Component location: `apps/web/components/auth/AuthLink.tsx`
