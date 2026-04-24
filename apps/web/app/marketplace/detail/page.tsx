// Server Component wrapper for static export
// Uses searchParams pattern to avoid generateStaticParams requirement
// The listingId is passed to client component for client-side data fetching

import MarketplaceDetailClient from '../[id]/MarketplaceDetailClient'

interface MarketplaceDetailPageProps {
  searchParams: { id?: string }
}

export default function MarketplaceDetailPage({ searchParams }: MarketplaceDetailPageProps) {
  const listingId = searchParams.id || '0'
  return <MarketplaceDetailClient listingId={listingId} />
}