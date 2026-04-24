// Server Component wrapper for static export
// Uses searchParams pattern to avoid generateStaticParams requirement
// The listingId is passed to client component for client-side data fetching

import { redirect } from 'next/navigation'
import MarketplaceDetailClient from '../[id]/MarketplaceDetailClient'

interface MarketplaceDetailPageProps {
  searchParams: { id?: string }
}

export default function MarketplaceDetailPage({ searchParams }: MarketplaceDetailPageProps) {
  const id = searchParams.id

  // Redirect to marketplace for invalid IDs instead of showing error
  if (!id || id === '0' || id === '' || id === 'undefined') {
    redirect('/marketplace')
  }

  return <MarketplaceDetailClient listingId={id} />
}