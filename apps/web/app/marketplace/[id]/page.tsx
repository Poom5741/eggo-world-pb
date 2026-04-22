// Server Component wrapper for static export
// Required for generateStaticParams with output: 'export'

export async function generateStaticParams() {
  // Return placeholder - actual listing ID is handled client-side
  return [{ id: '0' }]
}

// Import the client component
import MarketplaceDetailClient from './MarketplaceDetailClient'

export default function MarketplaceDetail({ params }: { params: { id: string } }) {
  return <MarketplaceDetailClient params={params} />
}