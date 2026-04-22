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