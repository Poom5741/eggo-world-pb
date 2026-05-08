'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import MarketplaceDetailClient from '../[id]/MarketplaceDetailClient'
import ResaleDetailClient from './ResaleDetailClient'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { Loader2 } from 'lucide-react'

/**
 * Client wrapper for marketplace detail page
 * Uses useSearchParams() hook for static export compatibility
 * In Next.js 16 with static export, we can't use async searchParams
 * Supports both marketplace_listings (eggs) and resale_listings (animals)
 */
export default function MarketplaceDetailWrapper() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [listingType, setListingType] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Get ID and type from searchParams client-side
    const paramId = searchParams.get('id')
    const paramType = searchParams.get('type') // 'animal' for resale listings
    
    // Validate ID
    if (!paramId || paramId === '0' || paramId === '' || paramId === 'undefined') {
      // Redirect to marketplace for invalid IDs
      router.push('/marketplace')
      return
    }
    
    setId(paramId)
    setListingType(paramType)
    setChecked(true)
  }, [searchParams, router])

  // Show loading while checking params
  if (!checked || !id) {
    return (
      <LayoutWithoutNav>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-on-surface-variant">Loading...</p>
          </div>
        </div>
      </LayoutWithoutNav>
    )
  }

  // Render appropriate detail client based on listing type
  // type=animal -> resale_listings, default -> marketplace_listings
  if (listingType === 'animal') {
    return <ResaleDetailClient listingId={id} />
  }

  return <MarketplaceDetailClient listingId={id} />
}