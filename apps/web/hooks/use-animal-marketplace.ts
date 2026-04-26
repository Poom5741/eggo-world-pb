"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  const isMounted = useRef(true)

  const fetchListings = useCallback(async () => {
    if (!isMounted.current) return
    setLoading(true)
    setError(null)

    try {
      const pb = createClient()
      
      // Build filter string for PocketBase
      let filter = 'status = "active"'

      // PocketBase schema defines capitalized values but actual data is stored lowercase
      // So we convert filter to lowercase to match the stored data
      if (rarities.length > 0) {
        const rarityFilter = rarities.map((r) => `rarity = '${r.toLowerCase()}'`).join(" || ")
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

      // Query resale_listings collection with requestKey: null to disable auto-cancellation
      const result = await pb.collection("resale_listings").getList(1, 100, {
        filter: filter,
        sort: sort,
        expand: "seller_id", // Expand to get seller info
        requestKey: null, // Disable auto-cancellation
      })

      if (!isMounted.current) return

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

      if (isMounted.current) {
        setListings(transformedListings)
      }
    } catch (err: any) {
      // Don't log auto-cancellation errors (expected on unmount/filter change)
      if (err && typeof err === 'object' && 'isCanceled' in err && err.isCanceled) {
        return
      }
      console.error("Failed to fetch animal listings:", err)
      if (isMounted.current) {
        setError(err.message || "Failed to load listings")
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [rarities, sortBy])

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

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