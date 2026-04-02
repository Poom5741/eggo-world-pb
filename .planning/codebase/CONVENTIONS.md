# Coding Conventions

**Analysis Date:** 2026-04-02

## Naming Patterns

**Files:**
- React components: PascalCase (`FoodCard.tsx`, `EggCard.tsx`)
- Pages: `page.tsx` in kebab-case directories (`auth/sign-up/page.tsx`)
- Custom hooks: `use*` prefix with camelCase (`use-mobile.ts`, `use-egg-nft.ts`)
- PocketBase hooks: `NN-feature.pb.js` with sequential numbering (`01-create-wallet.pb.js`)
- Contract tests: `{ContractName}.t.sol` (`EggNFT.t.sol`)
- Utility files: camelCase (`utils.ts`, `client.ts`)

**Functions:**
- React components: PascalCase (`function FoodCard()`)
- Event handlers: `handle*` prefix (`handleSignUp`, `handleCallback`)
- Utility functions: camelCase (`cn()`, `createClient()`)
- Hook functions: `use*` prefix (`useEggNft()`, `useIsMobile()`)

**Variables:**
- State: camelCase with descriptive names (`isHydrated`, `isLoading`, `eggProperties`)
- Constants: UPPER_SNAKE_CASE (`MOBILE_BREAKPOINT = 768`, `MINT_PRICE = 25 * 10^18`)
- Type definitions: PascalCase (`FoodCardProps`, `EggProperties`)

**Types:**
- Interfaces: PascalCase with descriptive suffix (`FoodCardProps`, `MintResult`)
- Type unions: PascalCase (`FoodType = 'grain' | 'fish' | 'insects' | 'herb'`)
- Records for configurations: `foodTypeConfig: Record<FoodType, { label, color, icon }>`

## Code Style

**TypeScript Configuration (`apps/web/tsconfig.json`):**
```json
{
  "strict": true,
  "noEmit": true,
  "moduleResolution": "bundler",
  "jsx": "react-jsx"
}
```

**Formatting:**
- No explicit ESLint/Prettier config detected - relies on Next.js defaults
- Semicolons: Optional (mixed usage observed)
- Quotes: Single quotes for strings (`'use client'`)
- Trailing commas: Used in multi-line objects

**Linting:**
- Command: `bun run lint` (runs `eslint .`)
- TypeScript: `strict: true` enforced

## Import Organization

**Order:**
1. React and client directives (`'use client'`)
2. External packages (`import { Card } from '@/components/ui/card'`)
3. Internal aliases (`@/components/*`, `@/lib/*`, `@/hooks/*`)
4. Relative imports (`./FoodCard`)

**Path Aliases (`tsconfig.json`):**
```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

**Common imports:**
```typescript
'use client'
import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
```

## Component Patterns

**shadcn/ui Components:**
- Location: `apps/web/components/ui/`
- 50+ primitives available (accordion, button, dialog, etc.)
- Import from aliased paths: `import { Button } from '@/components/ui/button'`
- Add new components: `bunx shadcn@latest add button`

**Component Structure:**
```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ComponentProps {
  prop: type
}

export function Component({ prop }: ComponentProps) {
  return (
    <Card>
      <CardContent>Content</CardContent>
    </Card>
  )
}
```

**Icons:**
- Library: Lucide React (`lucide-react@^0.564.0`)
- Usage: `import { IconName } from 'lucide-react'`

**Utility Pattern (`apps/web/lib/utils.ts`):**
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Hook Patterns

**Custom Hook Structure (`apps/web/hooks/use-mobile.ts`):**
```typescript
import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
```

**Hydration Safety (CRITICAL):**
```typescript
const isHydrated = useIsHydrated()
const user = isHydrated ? pb.authStore.record : null

// ALWAYS check before accessing browser APIs
if (!isHydrated) return null

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
      headers: { Authorization: token }
    })
    return await response.json()
  } catch (error) {
    // Error handling
  }
}
```

## PocketBase Hook Patterns

**File Naming:**
```
NN-feature.pb.js
# NN = execution order (00-99)
# 00 = config, 99 = debug
```

**Authentication (REQUIRED):**
```javascript
const { users } = e.requireAuth()
```

**Response Format:**
```javascript
// Success
e.json(200, { success: true, data: { ... } })

// Error
e.json(400, { 
  success: false, 
  error: { message: "...", code: "..." } 
})
```

**Hook Structure:**
```javascript
routerAdd("POST", "/api/v2/endpoint", (e) => {
  const { users } = e.requireAuth()
  const body = e.parseBody()
  
  try {
    // Operation
    e.json(200, { success: true, data: result })
  } catch (error) {
    console.error("Error:", error)
    e.json(500, { 
      success: false, 
      error: { message: error.message, code: "OPERATION_FAILED" } 
    })
  }
}, { "requestTimeout": 30000 })
```

**Record Hook:**
```javascript
onRecordCreate("users", (e) => {
  const record = e.record
  // Operation
  e.next()
})
```

## Error Handling

**Frontend Pattern:**
```typescript
try {
  const result = await someOperation()
  // Handle success
} catch (error) {
  setError(error instanceof Error ? error.message : 'Operation failed')
  toast.error('Operation failed')
}
```

**Backend Pattern:**
```javascript
try {
  // Operation
} catch (error) {
  console.error("Operation failed:", error)
  e.json(500, {
    success: false,
    error: { message: error.message, code: "OPERATION_FAILED" }
  })
}
```

**Error Codes:**
- `AUTH_REQUIRED` - Missing authentication
- `WALLET_NOT_FOUND` - Wallet missing
- `BALANCE_NATIVE_FAILED` - Balance query failed
- `INSUFFICIENT_BALANCE` - Not enough funds
- `NETWORK_ERROR` - External API failure

## Logging

**Frontend:**
- Limited logging in production
- Use `console.error()` for errors
- Avoid logging sensitive data (tokens, user data)

**Backend:**
```javascript
console.log("Hook triggered for user:", e.record.id)
console.log("Request URL:", apiUrl)
console.error("Failed:", error)
```

## Comments

**Language:** Thai comments when user speaks Thai

**Style:**
- Single-line: `// Comment`
- JSDoc for exported functions when needed
- Inline comments for complex logic

## Environment Variables

**Frontend (`apps/web/.env.local`):**
- `NEXT_PUBLIC_POCKETBASE_URL` - PocketBase endpoint

**Backend (`apps/backend/.env`):**
- `LINE_CHANNEL_ID` - LINE OAuth channel ID
- `LINE_CHANNEL_SECRET` - LINE OAuth secret
- `WALLET_SRV_URL` - Wallet service URL

**Wallet API (`wallet-api/.env`):**
- `WALLET_MASTER_KEY` - Encryption key (32 chars)

**Pattern:**
```typescript
const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
```

## Anti-Patterns

**DO NOT:**
- Access `window`, `localStorage` in initial render (hydration mismatch)
- Access `pb.authStore.record` during SSR (use `useIsHydrated()` hook)
- Create API routes in `apps/web/app/api/` (static export incompatible)
- Import components during module-level initialization
- Use `useEffect` without hydration check

**NEVER:**
- Commit `.next/` build artifacts
- Use npm/yarn/pnpm (Bun only for `apps/web`)
- Log auth tokens or user data
- Commit `.env` files with real secrets
- Skip `e.requireAuth()` in PocketBase hooks

---

*Convention analysis: 2026-04-02*
