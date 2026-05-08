---
phase: 23-secondary-market-royalties
plan: 02-B
type: execute
wave: 3
depends_on:
  - 23-02-A-PLAN.md
files_modified:
  - apps/web/hooks/use-animal-marketplace.ts
  - apps/web/components/marketplace/AnimalListingsSection.tsx
  - apps/web/app/marketplace/page.tsx
autonomous: true
requirements:
  - RESALE-05
must_haves:
  truths:
    - Marketplace displays Animal NFTs in separate section/tab
    - Filters include rarity (Common/Rare/Epic/Legendary)
    - Price sorting (ascending/descending) available
    - "Listed by [username]" badge displayed on Animal marketplace cards
    - Empty state shown when no Animal listings available
  artifacts:
    - path: apps/web/hooks/use-animal-marketplace.ts
      provides: Hook for fetching and filtering resale listings
      exports:
        - useAnimalMarketplace hook
    - path: apps/web/components/marketplace/AnimalListingsSection.tsx
      provides: Animal NFT grid with filtering
    - path: apps/web/app/marketplace/page.tsx
      provides: Marketplace page with Animals tab
      contains: Tabs with Eggs and Animals sections
  key_links:
    - from: AnimalListingsSection
      to: resale_listings collection
      via: useAnimalMarketplace hook
      pattern: pb.collection('resale_listings').getList(filter, sort)
    - from: use-animal-marketplace
      to: resale_listings collection
      via: filter query with rarity/species parameters
---

<objective>
Create marketplace integration components for Animal NFT display with filters, sorting, and "Listed by" badges.

Purpose: Enable browsing of Animal resale listings with rarity/species filtering per RESALE-05.
Output: useAnimalMarketplace hook, AnimalListingsSection component, marketplace page with Animals tab.
</objective>

<execution_context>
@/Users/poom-work/tokenine/eggo-pocketbase/.qwen/get-shit-done/workflows/execute-plan.md
@/Users/poom-work/tokenine/eggo-pocketbase/.qwen/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/23-secondary-market-royalties/23-CONTEXT.md
@.planning/phases/23-secondary-market-royalties/23-RESEARCH.md
@.planning/phases/23-secondary-market-royalties/23-02-A-SUMMARY.md

## Reference Patterns

### MarketplaceFilters Component (existing)

```typescript
// apps/web/components/marketplace/MarketplaceFilters.tsx
export interface FilterState {
  types: ItemType[] // 'Egg' | 'Food' | 'Animal'
  rarities: RarityType[] // 'Common' | 'Rare' | 'Epic' | 'Legendary'
  sortBy: SortOption // 'newest' | 'price_asc' | 'price_desc'
}
```

### Marketplace Page Structure (existing)

```typescript
// apps/web/app/marketplace/page.tsx
// Currently shows Egg listings only
// Add: AnimalListingsSection component for Animal tab/section
```

### Species Options (from animal_nfts.json)

- Chicken, Duck, Pig, Cow, Sheep, Dog, Cat, Rabbit (8 types)
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Create useAnimalMarketplace Hook</name>
  <files>apps/web/hooks/use-animal-marketplace.ts</files>
  <read_first>
    - apps/web/hooks/use-marketplace-sync.ts — existing marketplace hook pattern
    - apps/web/lib/pocketbase/client.ts — PocketBase client creation
    - apps/backend/collections/resale_listings.json — collection structure for queries
  </read_first>
  <action>Create the useAnimalMarketplace hook at apps/web/hooks/use-animal-marketplace.ts:

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/pocketbase/client"
import type { RarityType, SortOption } from "@/components/marketplace/MarketplaceFilters"

export interface ResaleListing {
  id: string
  animal_id: number
  seller_id: string
  seller_name?: string
  price: number
  rarity: RarityType
  species: string
  generation: number
  status: string
  listed_at: string
}

interface UseAnimalMarketplaceOptions {
  rarities?: RarityType[]
  sortBy?: SortOption
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseAnimalMarketplaceReturn {
  listings: ResaleListing[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAnimalMarketplace(
  options: UseAnimalMarketplaceOptions = {}
): UseAnimalMarketplaceReturn {
  const { rarities = [], sortBy = "newest", autoRefresh = true, refreshInterval = 30000 } = options

  const [listings, setListings] = useState<ResaleListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pb = createClient()

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build filter string for PocketBase
      let filter = 'status = "active"'

      if (rarities.length > 0) {
        const rarityFilter = rarities.map((r) => `rarity = "${r}"`).join(" || ")
        filter = `(${filter}) && (${rarityFilter})`
      }

      // Build sort string
      let sort = "-listed_at" // newest first (default)
      switch (sortBy) {
        case "price_asc":
          sort = "price"
          break
        case "price_desc":
          sort = "-price"
          break
        case "newest":
          sort = "-listed_at"
          break
      }

      // Query resale_listings collection
      const result = await pb.collection("resale_listings").getList(1, 100, {
        filter: filter,
        sort: sort,
        expand: "seller_id", // Expand to get seller info
      })

      // Transform results
      const transformedListings: ResaleListing[] = result.items.map((item: any) => ({
        id: item.id,
        animal_id: item.animal_id,
        seller_id: item.seller_id,
        seller_name: item.expand?.seller_id?.username || undefined,
        price: item.price,
        rarity: item.rarity as RarityType,
        species: item.species,
        generation: item.generation,
        status: item.status,
        listed_at: item.listed_at,
      }))

      setListings(transformedListings)
    } catch (err: any) {
      console.error("Failed to fetch animal listings:", err)
      setError(err.message || "Failed to load listings")
    } finally {
      setLoading(false)
    }
  }, [rarities, sortBy, pb])

  // Initial fetch
  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchListings, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchListings])

  return {
    listings,
    loading,
    error,
    refresh: fetchListings,
  }
}

export default useAnimalMarketplace
```

Key implementation details:

- Fetches from resale_listings collection with status="active" filter
- Supports rarity filtering via PocketBase filter string
- Supports sort by newest/price_asc/price_desc
- Expands seller_id to get username for "Listed by" badge
- Auto-refresh with configurable interval (default 30s)
- Returns transformed ResaleListing objects</action>
  <verify>
  <automated>grep -q "export function useAnimalMarketplace" apps/web/hooks/use-animal-marketplace.ts && grep -q "resale_listings" apps/web/hooks/use-animal-marketplace.ts && grep -q "status.\*active" apps/web/hooks/use-animal-marketplace.ts && grep -q "RarityType" apps/web/hooks/use-animal-marketplace.ts && grep -q "price_asc" apps/web/hooks/use-animal-marketplace.ts && grep -q "seller_name" apps/web/hooks/use-animal-marketplace.ts</automated>
  </verify>
  <done>use-animal-marketplace.ts exists with resale_listings query, rarity filtering, price sorting, seller expansion for username, and auto-refresh per RESALE-05</done>
  </task>

<task type="auto">
  <name>Task 2: Create AnimalListingsSection Component</name>
  <files>apps/web/components/marketplace/AnimalListingsSection.tsx</files>
  <read_first>
    - apps/web/app/marketplace/page.tsx — existing marketplace structure and grid pattern
    - apps/web/components/marketplace/ListingCard.tsx — existing card pattern to modify
    - apps/web/components/marketplace/MarketplaceFilters.tsx — existing filter component
    - apps/web/components/animal-nft/AnimalCard.tsx — Animal card base structure (modified in 02-A)
    - apps/web/hooks/use-animal-marketplace.ts — hook from Task 1
  </read_first>
  <action>Create the AnimalListingsSection component at apps/web/components/marketplace/AnimalListingsSection.tsx:

```typescript
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/pocketbase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAnimalMarketplace } from "@/hooks/use-animal-marketplace"
import type { RarityType, SortOption } from "@/components/marketplace/MarketplaceFilters"

const speciesConfig: Record<string, { icon: string }> = {
  Chicken: { icon: "🐔" },
  Duck: { icon: "🦆" },
  Pig: { icon: "🐷" },
  Cow: { icon: "🐄" },
  Sheep: { icon: "🐑" },
  Dog: { icon: "🐕" },
  Cat: { icon: "🐱" },
  Rabbit: { icon: "🐰" },
}

const rarityConfig: Record<string, { label: string; color: string }> = {
  Common: { label: "COMMON", color: "text-primary" },
  Rare: { label: "RARE", color: "text-secondary" },
  Epic: { label: "EPIC", color: "text-tertiary" },
  Legendary: { label: "LEGENDARY", color: "text-warning" },
}

interface AnimalListingCardProps {
  listing: {
    id: string
    animal_id: number
    seller_id: string
    seller_name?: string
    price: number
    rarity: RarityType
    species: string
    generation: number
    status: string
    listed_at: string
  }
  onClick?: () => void
}

function AnimalListingCard({ listing, onClick }: AnimalListingCardProps) {
  const species = speciesConfig[listing.species] || { icon: "🐾" }
  const rarity = rarityConfig[listing.rarity] || { label: "COMMON", color: "text-primary" }

  return (
    <Card
      className={cn(
        "bg-surface-container-lowest clay-card hover:-translate-y-2 transition-transform duration-300 cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Animal Image Section */}
      <div className="bg-surface-container h-48 rounded-lg mb-6 flex items-center justify-center inner-dip overflow-hidden relative">
        <div className="text-7xl pixelated">
          {species.icon}
        </div>
      </div>

      {/* Animal Info */}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-pixel-style text-xl text-on-surface">
              {listing.species} #{listing.animal_id}
            </CardTitle>
            <p className={cn("text-xs font-bold", rarity.color)}>
              {rarity.label} • Gen {listing.generation}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Listed by badge (D-14) */}
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Listed by {listing.seller_name || `User #${listing.seller_id.slice(0, 8)}`}
          </Badge>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">
            ${listing.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">USDT</span>
        </div>

        {/* Listed date */}
        <div className="text-xs text-muted-foreground">
          Listed: {new Date(listing.listed_at).toLocaleDateString()}
        </div>

        {/* Buy button */}
        <Button
          className="w-full font-[var(--font-pixel)] bg-primary text-on-primary"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

interface AnimalListingsSectionProps {
  className?: string
}

export function AnimalListingsSection({ className }: AnimalListingsSectionProps) {
  const router = useRouter()

  const [filters, setFilters] = useState<{
    rarities: RarityType[]
    sortBy: SortOption
  }>({
    rarities: [],
    sortBy: 'newest'
  })

  const { listings, loading, error, refresh } = useAnimalMarketplace({
    rarities: filters.rarities,
    sortBy: filters.sortBy
  })

  // Filter by rarity if selected (additional client-side filter)
  const filteredListings = listings.filter(listing => {
    if (filters.rarities.length === 0) return true
    return filters.rarities.includes(listing.rarity)
  })

  // Sort listings (additional client-side sort)
  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest':
        return new Date(b.listed_at).getTime() - new Date(a.listed_at).getTime()
      case 'price_asc':
        return a.price - b.price
      case 'price_desc':
        return b.price - a.price
      default:
        return 0
    }
  })

  const handleCardClick = (listing: any) => {
    // Navigate to detail page or open buy dialog
    router.push(`/marketplace/animal/${listing.id}`)
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-xl clay-card">
              <div className="h-48 bg-surface-container rounded-lg mb-6 animate-pulse" />
              <div className="h-6 w-40 bg-surface-container rounded mb-4 animate-pulse" />
              <div className="h-4 w-32 bg-surface-container rounded mb-6 animate-pulse" />
              <div className="h-10 w-full bg-surface-container-high rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-destructive">{error}</p>
        <Button onClick={refresh} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters - only Rarity and Sort */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <h2 className="font-[var(--font-pixel)] text-lg text-on-surface">
          Animal Listings ({sortedListings.length})
        </h2>

        <div className="flex flex-wrap gap-3">
          {/* Rarity filter checkboxes */}
          {(['Common', 'Rare', 'Epic', 'Legendary'] as RarityType[]).map((rarity) => (
            <Badge
              key={rarity}
              variant={filters.rarities.includes(rarity) ? "clay" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                const newRarities = filters.rarities.includes(rarity)
                  ? filters.rarities.filter(r => r !== rarity)
                  : [...filters.rarities, rarity]
                setFilters({ ...filters, rarities: newRarities })
              }}
            >
              {rarity}
            </Badge>
          ))}

          {/* Clear filters */}
          {filters.rarities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ ...filters, rarities: [] })}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Sort dropdown */}
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as SortOption })}
          className="px-3 py-2 rounded-md bg-surface-container border border-outline"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Listings Grid or Empty State */}
      {sortedListings.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl p-12 clay-card text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">pets</span>
          <h3 className="text-2xl font-pixel-style text-on-surface-variant mb-2">
            No Animal Listings
          </h3>
          <p className="text-on-surface-variant mb-6">
            No Animals are currently listed for sale. Check back later or list your own!
          </p>
          <Button
            onClick={() => router.push('/animals')}
            className="font-[var(--font-pixel)]"
          >
            View Your Animals
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedListings.map((listing) => (
            <AnimalListingCard
              key={listing.id}
              listing={listing}
              onClick={() => handleCardClick(listing)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AnimalListingsSection
```

Key implementation details per RESALE-05, D-14:

- Rarity filter with clickable badges (Common/Rare/Epic/Legendary)
- Price sorting dropdown (newest, low→high, high→low)
- "Listed by [username]" badge on each card
- Empty state with CTA to view own animals
- Grid layout matching existing marketplace pattern</action>
  <verify>
  <automated>grep -q "export function AnimalListingsSection" apps/web/components/marketplace/AnimalListingsSection.tsx && grep -q "Listed by" apps/web/components/marketplace/AnimalListingsSection.tsx && grep -q "Common.*Rare.*Epic.\*Legendary" apps/web/components/marketplace/AnimalListingsSection.tsx && grep -q "price_asc" apps/web/components/marketplace/AnimalListingsSection.tsx && grep -q "price_desc" apps/web/components/marketplace/AnimalListingsSection.tsx && grep -q "No Animal Listings" apps/web/components/marketplace/AnimalListingsSection.tsx && grep -q "speciesConfig" apps/web/components/marketplace/AnimalListingsSection.tsx</automated>
  </verify>
  <done>AnimalListingsSection.tsx exists with rarity filter badges, price sorting dropdown, "Listed by" badge, empty state, and grid layout per RESALE-05, D-14</done>
  </task>

<task type="auto">
  <name>Task 3: Add Animal Section to Marketplace Page</name>
  <files>apps/web/app/marketplace/page.tsx</files>
  <read_first>
    - apps/web/app/marketplace/page.tsx — existing marketplace page to modify
    - apps/web/components/marketplace/AnimalListingsSection.tsx — component to add
    - apps/web/components/ui/tabs.tsx — shadcn/ui Tabs for tab-based navigation
  </read_first>
  <action>Modify marketplace/page.tsx to add an Animal listings section/tab:

Add import for AnimalListingsSection:

```typescript
import { AnimalListingsSection } from "@/components/marketplace/AnimalListingsSection"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
```

Add Tabs structure after the header section (around line 216):

```typescript
{/* Marketplace Tabs */}
<Tabs defaultValue="eggs" className="w-full">
  <TabsList className="mb-6">
    <TabsTrigger value="eggs" className="font-[var(--font-pixel)]">
      Eggs
    </TabsTrigger>
    <TabsTrigger value="animals" className="font-[var(--font-pixel)]">
      Animals
    </TabsTrigger>
  </TabsList>

  {/* Eggs Tab - existing listings */}
  <TabsContent value="eggs">
    {/* Filters Section */}
    <div className="mb-8">
      <MarketplaceFilters
        onChange={handleFilterChange}
        initialFilters={filters}
        variant="clay"
      />
    </div>

    {/* Existing Egg listings grid */}
    {filteredListings.length === 0 ? (
      // ... existing empty state
    ) : (
      // ... existing grid
    )}
  </TabsContent>

  {/* Animals Tab - new section */}
  <TabsContent value="animals">
    <AnimalListingsSection />
  </TabsContent>
</Tabs>
```

Replace the current single-section layout with this tabbed structure. The Eggs tab preserves all existing functionality, while the Animals tab uses the new AnimalListingsSection component.</action>
<verify>
<automated>grep -q "AnimalListingsSection" apps/web/app/marketplace/page.tsx && grep -q "Tabs" apps/web/app/marketplace/page.tsx && grep -q "TabsTrigger.*eggs" apps/web/app/marketplace/page.tsx && grep -q "TabsTrigger.*animals" apps/web/app/marketplace/page.tsx && grep -q "TabsContent.\*animals" apps/web/app/marketplace/page.tsx</automated>
</verify>
<done>marketplace/page.tsx has Tabs with Eggs and Animals sections, AnimalListingsSection integrated for Animal NFT display per RESALE-05</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary              | Description                                         |
| --------------------- | --------------------------------------------------- |
| Frontend → Backend    | PocketBase auth token required for listing creation |
| Frontend → PocketBase | Collection query with user-scoped access rules      |

## STRIDE Threat Register

| Threat ID | Category    | Component   | Disposition | Mitigation Plan                        |
| --------- | ----------- | ----------- | ----------- | -------------------------------------- |
| T-23-10   | Information | Seller name | accept      | Username display is public information |

</threat_model>

<verification>
1. AnimalListingsSection queries resale_listings: Verify PocketBase collection access
2. Marketplace page has Animals tab: Navigate to /marketplace and click Animals
3. Hook queries correctly: Test useAnimalMarketplace with mock data
</verification>

<success_criteria>

- use-animal-marketplace.ts exists with resale_listings query and auto-refresh
- AnimalListingsSection.tsx exists with rarity filter, price sorting, "Listed by" badge
- marketplace/page.tsx has Tabs with Eggs and Animals sections
  </success_criteria>

<output>
After completion, create `.planning/phases/23-secondary-market-royalties/23-02-B-SUMMARY.md`
</output>
