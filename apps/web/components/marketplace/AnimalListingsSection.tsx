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