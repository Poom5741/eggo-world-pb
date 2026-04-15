# Coding Conventions

**Analysis Date:** 2026-04-15

## Naming Patterns

**Files:**
- React components: PascalCase (`FoodCard.tsx`, `EggCard.tsx`, `MarketplaceFilters.tsx`)
- Pages: `page.tsx` in kebab-case directories (`auth/sign-up/page.tsx`, `dashboard/deposit/page.tsx`)
- Custom hooks: `use*` prefix with camelCase (`use-is-hydrated.ts`, `use-auth-redirect.ts`, `use-mobile.ts`)
- PocketBase hooks: `NN-feature.pb.js` with sequential numbering (`01-create-wallet.pb.js`, `13-track-deposit.pb.js`)
- Contract tests: `{ContractName}.t.sol` (`EggNFT.t.sol`, `FoodNFT.t.sol`)
- Utility files: camelCase (`utils.ts`, `client.ts`)
- UI components: PascalCase in `components/ui/` (`button.tsx`, `dialog.tsx`, `card.tsx`)

**Functions:**
- React components: PascalCase (`function FoodCard()`, `export function AccountModal()`)
- Event handlers: `handle*` prefix (`handleCopy`, `handleDeposit`, `handleWithdraw`)
- Utility functions: camelCase (`cn()`, `createClient()`, `getUser()`, `truncateWallet()`)
- Hook functions: `use*` prefix (`useEggNft()`, `useIsMobile()`, `useAuthRedirect()`)
- Test helpers: `describe`, `it`, `test`, `expect`, `beforeEach`, `beforeAll`

**Variables:**
- State: camelCase with descriptive names (`isHydrated`, `isLoading`, `eggProperties`, `balance`)
- Constants: UPPER_SNAKE_CASE in hooks, camelCase in frontend
  - Backend: `MOBILE_BREAKPOINT = 768`, `MINT_PRICE = 25 * 10^18`
  - Frontend: `EGG_CONFIG`, `CONFIG` objects
- Props/Interfaces: camelCase (`isOpen`, `onClose`, `food`, `user`)

**Types:**
- Interfaces: PascalCase with descriptive suffix (`FoodCardProps`, `MintResult`, `BalanceData`)
- Type unions: PascalCase (`FoodType = 'grain' | 'fish' | 'insects' | 'herb'`)
- Records for configurations: `Record<FoodType, { label, color, icon }>`

## Code Style

**TypeScript Configuration (`apps/web/tsconfig.json`):**
```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Formatting:**
- Quotes: Single quotes for strings (`'use client'`, `'@/components/ui/button'`)
- Semicolons: Used consistently
- Trailing commas: Used in multi-line objects and function parameters
- Arrow functions: Use `=>` with parentheses for parameters

**Linting:**
- Command: `bun run lint` (runs `eslint .`)
- Configuration:
  - `@typescript-eslint/eslint-plugin`
  - `@typescript-eslint/parser`
  - `eslint-plugin-react`
  - `eslint-plugin-react-hooks`
  - `eslint-config-prettier`
- TypeScript: `strict: true` enforced
- Prettier: Available but not auto-run (manual: `prettier --write`)

## Import Organization

**Order:**
1. React and client directives (`'use client'`)
2. React imports (`import { useState, useEffect } from 'react'`)
3. External packages (`import { Card } from '@/components/ui/card'`)
4. Internal aliases (`@/components/*`, `@/lib/*`, `@/hooks/*`)
5. Icons (`import { Copy, Wallet } from 'lucide-react'`)
6. Relative imports (`./FoodCard`)

**Path Aliases (`tsconfig.json`):**
```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

Common aliases from `components.json`:
- `@/components` → `components/`
- `@/components/ui` → `components/ui/`
- `@/lib` → `lib/`
- `@/hooks` → `hooks/`

**Common imports:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { createClient, getUser } from '@/lib/pocketbase/client'
```

## Component Patterns

**shadcn/ui Components:**
- Location: `apps/web/components/ui/`
- 57 primitives available (accordion, alert-dialog, button, card, dialog, etc.)
- Import from aliased paths: `import { Button } from '@/components/ui/button'`
- Add new components: `bunx shadcn@latest add button`
- Style: `new-york` with `neutral` base color
- Icon library: `lucide-react`

**Component Structure:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconName } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsHydrated } from '@/hooks/use-is-hydrated'

interface ComponentProps {
  prop: type
  optional?: type
}

export function Component({ prop, optional }: ComponentProps) {
  const isHydrated = useIsHydrated()
  const [state, setState] = useState<Type>()
  
  // Early return if not hydrated
  if (!isHydrated) return null
  
  return (
    <Card>
      <CardContent>
        <Button onClick={handleClick}>Action</Button>
      </CardContent>
    </Card>
  )
}
```

**Icons:**
- Library: Lucide React (`lucide-react@^0.564.0`)
- Usage: `import { IconName } from 'lucide-react'`
- Sizing: Default `size-4` (16px), controlled via className or size prop
- Example: `<Copy className="w-4 h-4" />`

**Utility Pattern (`apps/web/lib/utils.ts`):**
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Hook Patterns

**Custom Hook Structure (`apps/web/hooks/use-is-hydrated.ts`):**
```typescript
import { useEffect, useState } from 'react'

export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
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

**Auth Hook Pattern (`apps/web/hooks/use-auth-redirect.ts`):**
```typescript
'use client'

import { useIsHydrated } from './use-is-hydrated'
import { isAuthenticated } from '@/lib/pocketbase/client'

export function useAuthRedirect() {
  const isHydrated = useIsHydrated()
  const auth = isHydrated ? isAuthenticated() : false

  const getRedirectPath = (path: string): string => {
    if (auth) return path
    if (path === '/dashboard') return '/join'
    return `/join?redirectTo=${encodeURIComponent(path)}`
  }

  return {
    isAuthenticated: auth,
    getRedirectPath,
  }
}
```

**API Call Pattern:**
```typescript
const fetchData = async () => {
  if (!isHydrated || !user) return
  
  try {
    const token = pb.authStore.token
    const response = await fetch(url, {
      headers: { 
        Authorization: token,
        'Content-Type': 'application/json'
      }
    })
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch:', error)
  }
}

useEffect(() => {
  if (isHydrated) {
    fetchData()
  }
}, [isHydrated])
```

## PocketBase Hook Patterns

**File Naming:**
```
NN-feature.pb.js
# NN = execution order (00-99)
# 00 = config, 01 = wallet creation, 99 = debug
# Examples:
# - 00-config.pb.js
# - 01-create-wallet.pb.js
# - 05-auth-token.pb.js
# - 13-track-deposit.pb.js
```

**Authentication (REQUIRED):**
```javascript
// ALWAYS require authentication
const { users } = e.requireAuth()
```

**Response Format:**
```javascript
// Success
e.json(200, { 
  success: true, 
  data: { ... } 
})

// Error
e.json(400, { 
  success: false, 
  error: { 
    message: "Error message", 
    code: "ERROR_CODE" 
  } 
})
```

**Endpoint Hook Structure:**
```javascript
routerAdd("POST", "/api/v2/endpoint", (e) => {
  const { users } = e.requireAuth()
  const body = e.parseBody()
  
  try {
    if (!body.field) {
      return e.json(400, { 
        success: false, 
        error: { 
          message: "Field required", 
          code: "VALIDATION_ERROR" 
        } 
      })
    }
    
    const result = await doSomething(body.field)
    e.json(200, { success: true, data: result })
  } catch (error) {
    console.error("Error:", error)
    e.json(500, { 
      success: false, 
      error: { 
        message: error.message, 
        code: "OPERATION_FAILED" 
      } 
    })
  }
}, { "requestTimeout": 30000 })
```

**Record Hook Pattern:**
```javascript
onRecordCreate("users", (e) => {
  const record = e.record
  
  // Set default fields
  e.record.set("field", value)
  
  // Call external API before commit
  try {
    const response = $http.send({
      url: apiUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    })
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      const result = response.json
      e.record.set("wallet", result.address)
    }
  } catch (error) {
    throw new Error("Operation failed: " + error.message)
  }
  
  // Commit the record
  e.next()
})
```

**Configuration Pattern (`apps/backend/pb_hooks/00-config.pb.js`):**
```javascript
const CONFIG = {
  line: {
    channelId: process.env.LINE_CHANNEL_ID || "",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "",
    authorizationUrl: "https://access.line.me/oauth2/v2.1/authorize",
    scopes: "openid profile email"
  },
  wallet: {
    masterKey: process.env.WALLET_MASTER_KEY || "development-key",
    srvUrl: process.env.WALLET_SRV_URL || "http://wallet-api:3001"
  },
  blockchain: {
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
    platformAddress: "0x...",
    platformFeePercent: 4
  }
}

// Export for use in other hooks
if (typeof globalThis !== 'undefined') {
  globalThis.EGGO_CONFIG = CONFIG
}
```

## Error Handling

**Frontend Pattern:**
```typescript
const [error, setError] = useState<string | null>(null)

try {
  const result = await someOperation()
  // Handle success
} catch (error) {
  setError(error instanceof Error ? error.message : 'Operation failed')
  toast.error('Operation failed')
  console.error('Failed:', error)
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
- `VALIDATION_ERROR` - Input validation failed

## Logging

**Frontend:**
- Limited logging in production
- Use `console.error()` for errors
- Avoid logging sensitive data (tokens, user data, wallet addresses)
- Pattern: `console.error('Failed to fetch balance:', error)`

**Backend:**
```javascript
// Info logging
console.log("Hook triggered for user:", e.record.id)
console.log("Request URL:", apiUrl)
console.log("Wallet created successfully:", address)

// Error logging
console.error("Failed to create wallet:", error)
console.error("Operation failed:", error)
```

## Comments

**Language:** English for code comments, Thai acceptable when user provides Thai context

**Style:**
- Single-line: `// Comment`
- Multi-line: `/* Comment */`
- JSDoc for exported functions when needed
- Inline comments for complex logic

**Patterns:**
```typescript
/**
 * Truncate wallet address for display
 * @param address - Full wallet address
 * @returns Truncated address (e.g., "0x742d...fE7a")
 */
function truncateWallet(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// ===== SECTION HEADER =====
// Descriptive comment for code section
// Used in hook files
```

## Environment Variables

**Frontend (`apps/web/.env.local`):**
```bash
NEXT_PUBLIC_POCKETBASE_URL=https://pb.eggoworld.io
```

**Backend (`apps/backend/.env`):**
```bash
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_secret
WALLET_MASTER_KEY=your_master_key
WALLET_SRV_URL=http://wallet-api:3001
BSC_RPC_URL=https://bsc-dataseed.binance.org
```

**Wallet API (`wallet-api/.env`):**
```bash
PORT=3001
MIN_PASSWORD_LENGTH=12
MAX_PASSWORD_LENGTH=120
DATA_STORAGE_NETWORK=opSepolia
```

**Pattern:**
```typescript
const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
const walletUrl = process.env.WALLET_SRV_URL || 'http://wallet-api:3001'
```

## Styling Patterns

**Tailwind CSS 4:**
- Import: `@import 'tailwindcss'`
- CSS variables for theming
- Custom utilities in `globals.css`

**Custom CSS Classes:**
```css
/* Claymorphism utilities */
.clay-card {
  box-shadow: 20px 20px 40px rgba(61, 57, 5, 0.06),
              inset 4px 4px 8px rgba(255, 255, 255, 0.8),
              inset -4px -4px 8px rgba(119, 99, 0, 0.1);
}

.clay-button {
  box-shadow: 0 10px 20px rgba(119, 99, 0, 0.15),
              inset 2px 2px 4px rgba(255, 215, 9, 0.5),
              inset -2px -2px 4px rgba(119, 99, 0, 0.2);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.clay-button:active {
  transform: scale(0.95);
  box-shadow: inset 4px 4px 10px rgba(0, 0, 0, 0.1);
}
```

**Component Variants (CVA):**
```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border bg-background hover:bg-accent',
        clay: 'bg-primary shadow-clay-md hover:shadow-clay-lg',
        'clay-outline': 'bg-background shadow-clay-md border border-primary/20',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md gap-1.5 px-3',
        lg: 'h-10 rounded-md px-6',
        'clay-sm': 'h-8 rounded-clay-sm px-4',
        'clay-lg': 'h-12 rounded-clay-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

## Anti-Patterns

**DO NOT:**
- Access `window`, `localStorage`, `navigator` in initial render (hydration mismatch)
- Access `pb.authStore.record` during SSR (use `useIsHydrated()` hook first)
- Create API routes in `apps/web/app/api/` (static export incompatible)
- Import components during module-level initialization
- Use `useEffect` without hydration check
- Skip authentication in PocketBase hooks (`$apis.requireAuth(e)`)
- Use npm/yarn/pnpm (Bun only for `apps/web`)

**NEVER:**
- Commit `.next/` build artifacts
- Commit `.env` files with real secrets
- Log auth tokens, user data, or private keys
- Skip input validation before blockchain operations
- Return plaintext errors in hooks (always JSON)
- Expose wallet private keys in API responses

---

*Convention analysis: 2026-04-15*
