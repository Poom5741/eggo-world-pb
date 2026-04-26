'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { createClient } from '@/lib/pocketbase/client'
import { type MarketplaceListing } from '@/lib/pocketbase/marketplace'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { MarketplaceFilters, type FilterState } from '@/components/marketplace/MarketplaceFilters'
import { useMarketplaceSync } from '@/hooks/use-marketplace-sync'
import { AnimalListingsSection } from '@/components/marketplace/AnimalListingsSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * Marketplace page - หน้าตลาดซื้อขาย NFT
 * 
 * Features:
 * - Browse Egg NFTs available for purchase
 * - Auth guard (redirects to login if not authenticated)
 * - Real-time data from PocketBase
 * - Filter by type, rarity, and sort options
 * - Responsive grid layout (3 cols desktop, 2 tablet, 1 mobile)
 */
export default function Marketplace() {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const pb = createClient()
  
  // Use marketplace sync hook for auto-polling - ใช้ hook สำหรับ polling อัตโนมัติ
  const { 
    listings, 
    loading, 
    error, 
    refresh,
    syncing,
    lastUpdated,
  } = useMarketplaceSync()
  
  // State for filters - สถานะสำหรับ filter
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    rarities: [],
    sortBy: 'newest',
  })
  
  // Get authenticated user (after hydration) - for future use
  const _user = isHydrated ? pb.authStore.record : null
  
  // No auth guard - marketplace browsing is public
  // Auth is only required for purchase actions (handled in detail page/buttons)
  
  /**
   * Handle filter changes - จัดการการเปลี่ยน filter
   */
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }
  
  /**
   * Apply filters to listings - ใช้ filter กับ listings
   */
  const applyFilters = (listings: MarketplaceListing[]): MarketplaceListing[] => {
    let filtered = [...listings]
    
    // Filter by type - กรองตามประเภท
    if (filters.types.length > 0) {
      filtered = filtered.filter(listing => 
        filters.types.includes(listing.nft_type)
      )
    }
    
    // Filter by rarity - กรองตามความหายาก
    if (filters.rarities.length > 0) {
      filtered = filtered.filter(listing => 
        filters.rarities.includes(listing.rarity as any)
      )
    }
    
    // Sort - เรียงลำดับ
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
        break
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price)
        break
    }
    
    return filtered
  }
  
  const filteredListings = applyFilters(listings)
  
  // Loading state - แสดงสถานะกำลังโหลด
  if (!isHydrated || loading) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton - โครงร่างส่วนหัว */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-4">
              <div className="h-16 w-80 bg-surface-container rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-surface-container rounded animate-pulse" />
            </div>
            <div className="h-20 w-48 bg-surface-container rounded-lg animate-pulse" />
          </div>
          
          {/* Filters Skeleton - โครงร่าง filter */}
          <div className="mb-8">
            <div className="h-32 bg-surface-container rounded-xl animate-pulse" />
          </div>
          
          {/* Grid Skeleton - โครงร่างตารางสินค้า */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-surface-container-lowest p-6 rounded-xl clay-card">
                <div className="h-48 bg-surface-container rounded-lg mb-6 animate-pulse" />
                <div className="h-6 w-40 bg-surface-container rounded mb-4 animate-pulse" />
                <div className="h-4 w-32 bg-surface-container rounded mb-6 animate-pulse" />
                <div className="h-10 w-full bg-surface-container-high rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </LayoutWithoutNav>
    )
  }

  // Allow browsing without auth - user can view listings
  // Purchase buttons will show login prompt if not authenticated
  
  // Error state - แสดงสถานะข้อผิดพลาด
  if (error) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-5xl font-pixel-style text-primary mb-2">Marketplace</h1>
              <p className="text-on-surface-variant max-w-md">
                Discover and purchase unique Egg NFTs from the marketplace.
              </p>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-xl p-12 clay-card text-center">
            <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
            <h2 className="text-2xl font-pixel-style text-error mb-2">Failed to Load Listings</h2>
            <p className="text-on-surface-variant mb-6">
              {error}
            </p>
            <button
              onClick={refresh}
              className="clay-button bg-primary text-on-primary py-4 px-8 rounded-xl font-black text-lg flex items-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined">refresh</span>
              Try Again
            </button>
          </div>
        </div>
      </LayoutWithoutNav>
    )
  }

  // Main content - เนื้อหาหลัก
  return (
    <LayoutWithoutNav>
      <div className="max-w-6xl mx-auto">
        {/* Page Header - ส่วนหัวของหน้า */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-pixel-style text-primary mb-2">Marketplace</h1>
            <p className="text-on-surface-variant max-w-md">
              Discover and purchase unique Eggs and Animals from the marketplace.
            </p>
            {/* Sync status indicator - ตัวบ่งชี้สถานะ sync */}
            {syncing && (
              <p className="text-xs text-primary-fixed-dim flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                Updating... | กำลังอัพเดท
              </p>
            )}
            {lastUpdated && !syncing && (
              <p className="text-xs text-on-surface-variant mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
              <div className="clay-card bg-surface-container-lowest px-6 py-4 rounded-lg flex items-center gap-4">
                <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                  storefront
                </span>
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase">Total Listings</div>
                  <div className="text-xl font-black text-primary">{listings.length}</div>
                </div>
                <button
                  onClick={refresh}
                  disabled={syncing}
                  className="ml-4 p-3 rounded-full bg-surface-container hover:bg-surface-container-high clay-button disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Refresh listings"
                >
                  <span className={`material-symbols-outlined text-primary ${syncing ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>
              </div>
        </div>

        {/* Marketplace Tabs */}
        <Tabs defaultValue="eggs" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="eggs" className="font-body">
              Eggs
            </TabsTrigger>
            <TabsTrigger value="animals" className="font-body">
              Animals
            </TabsTrigger>
          </TabsList>

          {/* Eggs Tab - existing listings */}
          <TabsContent value="eggs">
            {/* Filters Section - ส่วนกรองข้อมูล */}
            <div className="mb-8">
              <MarketplaceFilters 
                onChange={handleFilterChange}
                initialFilters={filters}
                variant="clay"
              />
            </div>
            
            {/* Empty State - กรณีไม่มีรายการ */}
            {filteredListings.length === 0 ? (
              <div className="bg-surface-container-low rounded-xl p-12 clay-card text-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">inventory_2</span>
                <h2 className="text-2xl font-pixel-style text-on-surface-variant mb-2">No Listings Available</h2>
                <p className="text-on-surface-variant mb-6">
                  There are no listings matching your filters. Try adjusting your filter criteria or check back later.
                </p>
                {filters.types.length > 0 || filters.rarities.length > 0 || filters.sortBy !== 'newest' ? (
                  <button
                    onClick={() => handleFilterChange({ types: [], rarities: [], sortBy: 'newest' })}
                    className="clay-button bg-primary text-on-primary py-4 px-8 rounded-xl font-black text-lg"
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>
            ) : (
              /* Listings Grid - ตารางแสดงรายการสินค้า */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    image={listing.image_url || '/placeholder-egg.png'}
                    name={listing.name}
                    rarity={listing.rarity as any}
                    price={listing.price}
                    seller={listing.seller_name || listing.seller}
                    polling={syncing}
                    onClick={() => router.push(`/marketplace/detail?id=${listing.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Animals Tab - new section */}
          <TabsContent value="animals">
            <AnimalListingsSection />
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWithoutNav>
  )
}