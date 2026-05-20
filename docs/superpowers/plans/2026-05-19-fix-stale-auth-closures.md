# Fix Stale Auth Closures Across All Hooks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Systematically fix all React hooks that capture stale PocketBase client instances, causing `AUTH_REQUIRED` errors after OAuth login or page refresh.

**Architecture:** Apply the same pattern used in `useTierReward` to all hooks: (1) Call `createClient()` inside callbacks instead of capturing at hook init, (2) Add explicit 401 handling with redirect to login, (3) Remove `pb` from `useCallback` dependency arrays.

**Tech Stack:** React hooks, PocketBase JS SDK, TypeScript, Next.js 16

---

## Background

### Problem

Multiple hooks in the codebase capture the PocketBase client (`pb`) instance at hook initialization time. When callbacks are invoked later (after OAuth login, page refresh, or token updates), they use a **stale closure** over the initial `pb` instance, which may not have the updated authentication token.

### Root Cause

```typescript
// ❌ ANTI-PATTERN: Captures pb at hook init
export function useMyHook() {
  const pb = createClient() // Created once

  const fetchData = useCallback(async () => {
    const token = pb.authStore.token // STALE - uses old pb instance
    // ...
  }, [pb]) // pb in deps causes re-creation but still captures stale value

  return { fetchData }
}
```

### Solution

```typescript
// ✅ CORRECT: Create client inside callback
export function useMyHook() {
  const fetchData = useCallback(async () => {
    const currentPb = createClient() // Fresh instance every call
    const token = currentPb.authStore.token // Always current

    if (!token) {
      // Handle missing auth
      return
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 401) {
      // Clear stale auth and redirect
      localStorage.removeItem("pocketbase_auth")
      document.cookie = "pb_auth=; path=/; max-age=0"
      window.location.href = "/auth/login?redirectTo=/dashboard"
      return
    }
    // ...
  }, []) // No pb in deps
}
```

### Files Already Fixed

- `apps/web/hooks/use-tier-reward.ts` ✅

### Files to Fix

Based on grep search for `pb.authStore.token`:

**Hooks (Priority 1 - Critical paths):**

1. `apps/web/hooks/use-wallet-poll.ts` - Wallet balance polling
2. `apps/web/hooks/use-egg-poll.ts` - Egg NFT polling
3. `apps/web/hooks/use-egg-nft.ts` - Egg NFT operations (mint, claim)
4. `apps/web/hooks/use-egg-feed.ts` - Egg feeding

**Components (Priority 2 - User-facing features):** 5. `apps/web/components/mint/MintEggModal.tsx` 6. `apps/web/components/marketplace/BuyFlow.tsx` 7. `apps/web/components/eggs/feed-dialog.tsx` 8. `apps/web/components/egg-nft/BurnNFTDialog.tsx` 9. `apps/web/components/buy-egg/BuyEggFlow.tsx` 10. `apps/web/components/animal-nft/ListAnimalDialog.tsx` 11. `apps/web/components/marketplace/CreateListingDialog.tsx` 12. `apps/web/components/dashboard/activity-feed.tsx` 13. `apps/web/components/dashboard/RecruitmentBonusCard.tsx` 14. `apps/web/components/account-modal.tsx` 15. `apps/web/components/ui/KYCStatusBadge.tsx` 16. `apps/web/components/PlatformStatusBanner.tsx`

**Pages (Priority 3 - Admin & special pages):** 17. `apps/web/app/mint/page.tsx` 18. `apps/web/app/eggs/[id]/hatch/HatchEggClient.tsx` 19. `apps/web/app/dashboard/withdraw/page.tsx` 20. `apps/web/app/dashboard/deposit/page.tsx` 21. `apps/web/app/dashboard/commissions/page.tsx` 22. `apps/web/app/admin/monitoring/page.tsx` 23. `apps/web/app/admin/mint/page.tsx` 24. `apps/web/app/admin/game-config/page.tsx` 25. `apps/web/app/admin/marketplace-control/page.tsx`

---

## Task Decomposition

### Task 1: Fix `use-wallet-poll.ts` (Critical - Dashboard Balance)

**Files:**

- Modify: `apps/web/hooks/use-wallet-poll.ts:53-124`

- [ ] **Step 1: Review current implementation**

Read `apps/web/hooks/use-wallet-poll.ts` and identify:

- Line 73-74: `const pb = createClient()` and `const token = pb.authStore.token`
- Line 124: `[walletAddress, errorCount, intervalMs]` deps (no `pb`, but still stale)

- [ ] **Step 2: Apply fix to fetchBalance callback**

Modify lines 53-124 in `apps/web/hooks/use-wallet-poll.ts`:

```typescript
const fetchBalance = useCallback(async () => {
  // Guard against undefined, null, empty string, or literal "null" string
  if (
    !walletAddress ||
    walletAddress === "null" ||
    walletAddress === "undefined" ||
    walletAddress === ""
  ) {
    setBalance({ usdt: "0", native: "0" })
    setError(null)
    setErrorCount(0)
    return
  }

  // Validate EVM wallet address format (0x + 40 hex chars)
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    setBalance({ usdt: "0", native: "0" })
    setError(null)
    setErrorCount(0)
    return
  }

  setLoading(true)
  try {
    // Always use the latest client instance to get current auth state
    const currentPb = createClient()
    const token = currentPb.authStore.token

    if (!token) {
      setBalance({ usdt: "0", native: "0" })
      setError(null)
      setErrorCount(0)
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://localhost:8090"
    const res = await fetch(`${baseUrl}/api/v2/hot-wallet/balance`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_address: walletAddress }),
    })

    // Handle 401 Unauthorized - clear stale auth and redirect
    if (res.status === 401) {
      localStorage.removeItem("pocketbase_auth")
      document.cookie = "pb_auth=; path=/; max-age=0"
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login?redirectTo=/dashboard"
      }
      return
    }

    // Handle 4xx errors gracefully — wallet may not exist yet
    if (res.status >= 400 && res.status < 500) {
      setBalance({ usdt: "0", native: "0" })
      setError(null)
      setErrorCount(0)
      setPollInterval(intervalMs)
      return
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch balance: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    if (data.success && data.data) {
      setBalance({
        usdt: String(data.data.usdt_balance ?? data.data.withdrawable ?? "0"),
        native: "0",
      })
    }
    setError(null)
    setErrorCount(0)
    setPollInterval(intervalMs)
  } catch (err: any) {
    setError(err.message || "Unknown error occurred")

    // Exponential backoff: 30s → 60s → 120s → 5min (max)
    const newErrorCount = errorCount + 1
    setErrorCount(newErrorCount)
    const backoffInterval = Math.min(30000 * Math.pow(2, newErrorCount), 300000)
    setPollInterval(backoffInterval)
  } finally {
    setLoading(false)
  }
}, [walletAddress, errorCount, intervalMs])
```

- [ ] **Step 3: Verify no other changes needed**

The `useEffect` at lines 126-137 doesn't need changes (it just calls `fetchBalance`).

- [ ] **Step 4: Test the fix**

Run: `cd apps/web && bun run dev`
Expected: Dev server starts without errors

Manually test:

1. Login with Google OAuth
2. Navigate to `/dashboard`
3. Verify wallet balance loads without `AUTH_REQUIRED` errors
4. Refresh page, verify balance still loads

- [ ] **Step 5: Commit**

```bash
cd apps/web
git add hooks/use-wallet-poll.ts
git commit -m "fix: resolve stale auth closure in useWalletPoll hook

- Call createClient() inside fetchBalance callback
- Add 401 handling with redirect to login
- Prevents AUTH_REQUIRED errors after OAuth login"
```

---

### Task 2: Fix `use-egg-poll.ts` (Critical - Egg NFTs)

**Files:**

- Modify: `apps/web/hooks/use-egg-poll.ts:70-115`

- [ ] **Step 1: Review current implementation**

Read `apps/web/hooks/use-egg-poll.ts` and identify:

- Line 80: `const pb = createClient()`
- Line 93: `'Authorization': \`Bearer ${pb.authStore.token}\``
- Line 115: `[userId, errorCount, intervalMs]` deps

- [ ] **Step 2: Apply fix to fetchEggs callback**

Modify lines 70-115 in `apps/web/hooks/use-egg-poll.ts`:

```typescript
const fetchEggs = useCallback(async () => {
  // No user ID, empty string, or "null" string - skip fetch
  if (!userId || userId === "" || userId === "null") {
    setLoading(false)
    return
  }

  setLoading(true)
  try {
    // Always use the latest client instance to get current auth state
    const currentPb = createClient()

    // Ensure auth is restored before making API call
    await restoreAuth(currentPb)

    const token = currentPb.authStore.token

    if (!token) {
      setEggs([])
      setError(null)
      setErrorCount(0)
      setLoading(false)
      return
    }

    // Use retry logic via direct fetch with the retry utility
    const url = `${currentPb.baseUrl}/api/collections/egg_nfts/records`
    const queryString = `filter=owner="${userId}" && is_hatched=false&sort=-food_count&page=1&perPage=100`

    const response = await fetchJsonWithRetry(url + (queryString ? "?" + queryString : ""), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    setEggs(response.items as EggData[])
    setError(null)
    setErrorCount(0)
    setLastUpdated(new Date())
    setPollInterval(intervalMs)
  } catch (err: any) {
    // Handle 401 Unauthorized - clear stale auth and redirect
    if (err.message?.includes("401") || err.status === 401) {
      localStorage.removeItem("pocketbase_auth")
      document.cookie = "pb_auth=; path=/; max-age=0"
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login?redirectTo=/dashboard"
      }
      return
    }

    setError(err.message || "Unknown error occurred")

    // Exponential backoff: 30s → 60s → 120s → 5min (max)
    const newErrorCount = errorCount + 1
    setErrorCount(newErrorCount)
    const backoffInterval = Math.min(30000 * Math.pow(2, newErrorCount), 300000)
    setPollInterval(backoffInterval)
  } finally {
    setLoading(false)
  }
}, [userId, errorCount, intervalMs])
```

- [ ] **Step 3: Test the fix**

Manually test:

1. Login with Google OAuth
2. Navigate to `/dashboard`
3. Verify egg NFTs load without auth errors
4. Refresh page, verify eggs still load

- [ ] **Step 4: Commit**

```bash
cd apps/web
git add hooks/use-egg-poll.ts
git commit -m "fix: resolve stale auth closure in useEggPoll hook

- Call createClient() inside fetchEggs callback
- Add 401 handling with redirect to login
- Pass fresh client to restoreAuth"
```

---

### Task 3: Fix `use-egg-nft.ts` (Critical - Mint & Claim)

**Files:**

- Modify: `apps/web/hooks/use-egg-nft.ts:35-86` (mintEgg)
- Modify: `apps/web/hooks/use-egg-nft.ts:132-180` (claimCommission)

- [ ] **Step 1: Fix mintEgg callback**

Modify lines 35-86 in `apps/web/hooks/use-egg-nft.ts`:

```typescript
const mintEgg = useCallback(async (referrerId?: string): Promise<MintResult | null> => {
  setLoading(true)
  setError(null)

  try {
    // Always use the latest client instance to get current auth state
    const currentPb = createClient()
    const token = currentPb.authStore.token

    if (!token) {
      setError("Not authenticated")
      return null
    }

    const response = await fetch("https://pb.eggoworld.io/api/v2/mint-egg", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        referrer_id: referrerId,
      }),
    })

    // Handle 401 Unauthorized - clear stale auth and redirect
    if (response.status === 401) {
      localStorage.removeItem("pocketbase_auth")
      document.cookie = "pb_auth=; path=/; max-age=0"
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login?redirectTo=/dashboard"
      }
      setError("Authentication expired. Please log in again.")
      return null
    }

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `HTTP ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      let errorMessage = "Mint failed"
      if (result.error) {
        if (typeof result.error === "string") {
          errorMessage = result.error
        } else if (typeof result.error === "object" && result.error !== null) {
          if (typeof result.error.message === "string") {
            errorMessage = result.error.message
          } else if (result.error.message && typeof result.error.message === "object") {
            errorMessage = JSON.stringify(result.error.message)
          } else {
            errorMessage = JSON.stringify(result.error)
          }
        }
      }
      throw new Error(errorMessage)
    }

    return result.data
  } catch (err: any) {
    setError(err.message)
    return null
  } finally {
    setLoading(false)
  }
}, [])
```

- [ ] **Step 2: Fix claimCommission callback**

Modify lines 132-180 in `apps/web/hooks/use-egg-nft.ts`:

```typescript
const claimCommission = useCallback(async (): Promise<ClaimResult | null> => {
  setLoading(true)
  setError(null)

  try {
    // Always use the latest client instance to get current auth state
    const currentPb = createClient()
    const token = currentPb.authStore.token

    if (!token) {
      setError("Not authenticated")
      return null
    }

    const response = await fetch("https://pb.eggoworld.io/api/v2/claim-commission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    // Handle 401 Unauthorized - clear stale auth and redirect
    if (response.status === 401) {
      localStorage.removeItem("pocketbase_auth")
      document.cookie = "pb_auth=; path=/; max-age=0"
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login?redirectTo=/dashboard"
      }
      setError("Authentication expired. Please log in again.")
      return null
    }

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `HTTP ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      let errorMessage = "Claim failed"
      if (result.error) {
        if (typeof result.error === "string") {
          errorMessage = result.error
        } else if (typeof result.error === "object" && result.error !== null) {
          if (typeof result.error.message === "string") {
            errorMessage = result.error.message
          } else if (result.error.message && typeof result.error.message === "object") {
            errorMessage = JSON.stringify(result.error.message)
          } else {
            errorMessage = JSON.stringify(result.error)
          }
        }
      }
      throw new Error(errorMessage)
    }

    return result.data
  } catch (err: any) {
    setError(err.message)
    return null
  } finally {
    setLoading(false)
  }
}, [])
```

- [ ] **Step 3: Test the fix**

Manually test:

1. Login with Google OAuth
2. Navigate to mint page
3. Verify mint button works without auth errors
4. Test commission claim

- [ ] **Step 4: Commit**

```bash
cd apps/web
git add hooks/use-egg-nft.ts
git commit -m "fix: resolve stale auth closure in useEggNft hook

- Call createClient() inside mintEgg and claimCommission callbacks
- Add 401 handling with redirect to login
- Prevents AUTH_REQUIRED errors during mint/claim operations"
```

---

### Task 4: Fix `use-egg-feed.ts` (Critical - Feeding)

**Files:**

- Modify: `apps/web/hooks/use-egg-feed.ts:19-101`

- [ ] **Step 1: Fix feedEgg callback**

Modify lines 19-101 in `apps/web/hooks/use-egg-feed.ts`:

```typescript
const feedEgg = useCallback(
  async (eggId: number, foodIds: number[]): Promise<boolean> => {
    if (foodIds.length !== 10) {
      const errorMsg = `Must feed exactly 10 food items (got ${foodIds.length})`
      setError(errorMsg)
      toast({
        title: "Feed Failed",
        description: errorMsg,
        variant: "destructive",
      })
      return false
    }

    setLoading(true)
    setError(null)

    try {
      if (useBackendApi) {
        // Always use the latest client instance to get current auth state
        const currentPb = createClient()
        const token = currentPb.authStore.token

        if (!token) {
          setError("Not authenticated")
          toast({
            title: "Feed Failed",
            description: "Please log in to feed eggs",
            variant: "destructive",
          })
          return false
        }

        const apiUrl =
          currentPb.baseUrl || process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://localhost:8090"

        const response = await fetch(`${apiUrl}/api/v2/feed-egg`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            egg_token_id: eggId,
            food_ids: foodIds,
          }),
        })

        // Handle 401 Unauthorized - clear stale auth and redirect
        if (response.status === 401) {
          localStorage.removeItem("pocketbase_auth")
          document.cookie = "pb_auth=; path=/; max-age=0"
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login?redirectTo=/dashboard"
          }
          setError("Authentication expired. Please log in again.")
          toast({
            title: "Feed Failed",
            description: "Authentication expired. Please log in again.",
            variant: "destructive",
          })
          return false
        }

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || "Feed API failed")
        }

        toast({
          title: "Success!",
          description: "Egg fed successfully! 10 food items added",
        })
        return true
      }

      const signer = await getSigner()
      const txHash = await upgradeEggRarity(signer, eggId, foodIds)

      toast({
        title: "Feeding Submitted",
        description: "Waiting for blockchain confirmation...",
      })

      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new (await import("ethers")).BrowserProvider((window as any).ethereum)
        const receipt = await provider.waitForTransaction(txHash)

        if (receipt.status === 1) {
          toast({
            title: "Success!",
            description: "Egg fed successfully! 10 food items added",
          })
          return true
        } else {
          throw new Error("Transaction failed")
        }
      }

      return true
    } catch (err: any) {
      const errorMsg = err.message || "Feed transaction failed"
      setError(errorMsg)
      toast({
        title: "Feed Failed",
        description: errorMsg,
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  },
  [toast, useBackendApi]
)
```

- [ ] **Step 2: Test the fix**

Manually test:

1. Login with Google OAuth
2. Navigate to egg feeding page
3. Feed an egg with 10 food items
4. Verify no auth errors

- [ ] **Step 3: Commit**

```bash
cd apps/web
git add hooks/use-egg-feed.ts
git commit -m "fix: resolve stale auth closure in useEggFeed hook

- Call createClient() inside feedEgg callback
- Add 401 handling with redirect to login
- Prevents AUTH_REQUIRED errors during feeding"
```

---

### Task 5: Fix Components (Priority 2)

**Files:** All 16 component files listed above

For each component, apply the same pattern:

1. Find all instances of `const pb = createClient()` followed by `pb.authStore.token`
2. Move `createClient()` inside the callback/function that uses the token
3. Add 401 handling where appropriate
4. Remove `pb` from dependency arrays

**Template for component fixes:**

```typescript
// ❌ Before
const handleAction = async () => {
  const pb = createClient()
  const token = pb.authStore.token
  // ...
}

// ✅ After
const handleAction = async () => {
  const currentPb = createClient()
  const token = currentPb.authStore.token

  if (!token) {
    // Handle missing auth
    return
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401) {
    localStorage.removeItem("pocketbase_auth")
    document.cookie = "pb_auth=; path=/; max-age=0"
    window.location.href = "/auth/login?redirectTo=/dashboard"
    return
  }
  // ...
}
```

- [ ] **Step 1: Fix MintEggModal.tsx**

Modify: `apps/web/components/mint/MintEggModal.tsx`

- Find `pb.authStore.token` usage
- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in MintEggModal"`

- [ ] **Step 2: Fix BuyFlow.tsx**

Modify: `apps/web/components/marketplace/BuyFlow.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in marketplace BuyFlow"`

- [ ] **Step 3: Fix feed-dialog.tsx**

Modify: `apps/web/components/eggs/feed-dialog.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in feed-dialog"`

- [ ] **Step 4: Fix BurnNFTDialog.tsx**

Modify: `apps/web/components/egg-nft/BurnNFTDialog.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in BurnNFTDialog"`

- [ ] **Step 5: Fix BuyEggFlow.tsx**

Modify: `apps/web/components/buy-egg/BuyEggFlow.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in BuyEggFlow"`

- [ ] **Step 6: Fix ListAnimalDialog.tsx**

Modify: `apps/web/components/animal-nft/ListAnimalDialog.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in ListAnimalDialog"`

- [ ] **Step 7: Fix CreateListingDialog.tsx**

Modify: `apps/web/components/marketplace/CreateListingDialog.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in CreateListingDialog"`

- [ ] **Step 8: Fix activity-feed.tsx**

Modify: `apps/web/components/dashboard/activity-feed.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in activity-feed"`

- [ ] **Step 9: Fix RecruitmentBonusCard.tsx**

Modify: `apps/web/components/dashboard/RecruitmentBonusCard.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in RecruitmentBonusCard"`

- [ ] **Step 10: Fix account-modal.tsx**

Modify: `apps/web/components/account-modal.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in account-modal"`

- [ ] **Step 11: Fix KYCStatusBadge.tsx**

Modify: `apps/web/components/ui/KYCStatusBadge.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in KYCStatusBadge"`

- [ ] **Step 12: Fix PlatformStatusBanner.tsx**

Modify: `apps/web/components/PlatformStatusBanner.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in PlatformStatusBanner"`

---

### Task 6: Fix Pages (Priority 3)

**Files:** All 9 page files listed above

Apply the same pattern to each page. Focus on:

- Event handlers that call APIs
- useEffect hooks that fetch data
- Any function that uses `pb.authStore.token`

- [ ] **Step 1: Fix mint/page.tsx**

Modify: `apps/web/app/mint/page.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in mint page"`

- [ ] **Step 2: Fix HatchEggClient.tsx**

Modify: `apps/web/app/eggs/[id]/hatch/HatchEggClient.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in HatchEggClient"`

- [ ] **Step 3: Fix withdraw/page.tsx**

Modify: `apps/web/app/dashboard/withdraw/page.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in withdraw page"`

- [ ] **Step 4: Fix deposit/page.tsx**

Modify: `apps/web/app/dashboard/deposit/page.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in deposit page"`

- [ ] **Step 5: Fix commissions/page.tsx**

Modify: `apps/web/app/dashboard/commissions/page.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in commissions page"`

- [ ] **Step 6: Fix admin/monitoring/page.tsx**

Modify: `apps/web/app/admin/monitoring/page.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in admin monitoring page"`

- [ ] **Step 7: Fix admin/mint/page.tsx**

Modify: `apps/web/app/admin/mint/page.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in admin mint page"`

- [ ] **Step 8: Fix admin/game-config/page.tsx**

Modify: `apps/web/app/admin/game-config/page.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in admin game-config page"`

- [ ] **Step 9: Fix admin/marketplace-control/page.tsx**

Modify: `apps/web/app/admin/marketplace-control/page.tsx`

- Apply pattern
- Commit: `git commit -m "fix: resolve stale auth closure in admin marketplace-control page"`

---

### Task 7: Final Verification & Documentation

- [ ] **Step 1: Verify no remaining stale closures**

Run: `grep -rn "const pb = createClient()" apps/web/hooks/ apps/web/components/ apps/web/app/ | grep -v "node_modules"`
Expected: All instances should be inside callbacks/functions, not at component/hook top level

- [ ] **Step 2: Run linting**

Run: `cd apps/web && bun run lint`
Expected: No errors

- [ ] **Step 3: Build verification**

Run: `cd apps/web && bun run build`
Expected: Build succeeds without errors

- [ ] **Step 4: Create knowledge base entry**

Create: `docs/superpowers/knowledge-base/stale-auth-closure-prevention.md`

````markdown
# Stale Auth Closure Prevention Pattern

## Problem

React hooks that capture PocketBase client instances at initialization cause `AUTH_REQUIRED` errors after OAuth login or page refresh.

## Solution

Always call `createClient()` inside callbacks that need auth tokens, not at hook initialization.

## Pattern

```typescript
// ✅ CORRECT
const fetchData = useCallback(async () => {
  const currentPb = createClient() // Fresh instance
  const token = currentPb.authStore.token

  if (!token) return

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401) {
    localStorage.removeItem("pocketbase_auth")
    document.cookie = "pb_auth=; path=/; max-age=0"
    window.location.href = "/auth/login?redirectTo=/dashboard"
    return
  }
  // ...
}, []) // No pb in deps
```
````

## Files Fixed

- apps/web/hooks/use-tier-reward.ts
- apps/web/hooks/use-wallet-poll.ts
- apps/web/hooks/use-egg-poll.ts
- apps/web/hooks/use-egg-nft.ts
- apps/web/hooks/use-egg-feed.ts
- [Add all component/page files]

## Reference

- Issue: AUTH_REQUIRED errors after Google OAuth login
- Fix date: 2026-05-19

````

- [ ] **Step 5: Final commit**

```bash
git add docs/superpowers/knowledge-base/stale-auth-closure-prevention.md
git commit -m "docs: add stale auth closure prevention pattern to knowledge base"
````

---

## Testing Strategy

### Manual Testing Checklist

After all fixes are applied, test the following user journeys:

1. **Google OAuth Login → Dashboard**
   - Login with Google
   - Navigate to `/dashboard`
   - Verify: Balance loads, eggs load, no `AUTH_REQUIRED` errors
   - Refresh page
   - Verify: Everything still loads

2. **Mint Flow**
   - Login with Google
   - Navigate to `/mint`
   - Click "Mint Egg"
   - Verify: Mint succeeds without auth errors

3. **Feed Flow**
   - Login with Google
   - Navigate to an egg
   - Feed with 10 food items
   - Verify: Feed succeeds without auth errors

4. **Marketplace**
   - Login with Google
   - Navigate to marketplace
   - Buy/list NFT
   - Verify: Transaction succeeds without auth errors

5. **Tier Rewards**
   - Login with Google
   - Navigate to `/dashboard/tiers`
   - Verify: Tier status loads without auth errors

### Regression Testing

- All existing tests should pass
- No new console errors
- No auth-related errors in browser console

---

## Rollback Plan

If any fix causes issues:

1. Identify the problematic file
2. Revert with: `git checkout HEAD~1 -- <file>`
3. Commit revert: `git commit -m "revert: fix for <file> caused regression"`
4. Investigate and re-apply with corrections

---

## Success Criteria

- [ ] All 25 files fixed with dynamic client instantiation
- [ ] All 25 files have 401 handling with redirect
- [ ] No `AUTH_REQUIRED` errors in console after OAuth login
- [ ] Manual testing checklist passes
- [ ] Build succeeds
- [ ] Linting passes
- [ ] Knowledge base entry created

---

## Notes

- This fix addresses a systemic anti-pattern across the codebase
- The pattern was identified in `useTierReward` and applies universally
- Each fix is atomic and can be committed independently
- Priority order: Hooks → Components → Pages
- Total estimated time: 2-3 hours for all 25 files
