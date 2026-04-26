// Marketplace Detail Page - Static Export Compatible
// Uses client-side searchParams via useSearchParams() hook
// This is required for Next.js 16 with output: 'export' (static export)

import MarketplaceDetailWrapper from './MarketplaceDetailWrapper'

// For static export, we export a client component that handles searchParams client-side
export default function MarketplaceDetailPage() {
  return <MarketplaceDetailWrapper />
}