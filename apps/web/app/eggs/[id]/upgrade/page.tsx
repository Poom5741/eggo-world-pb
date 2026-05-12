// Server Component wrapper for static export
// Required for generateStaticParams with output: 'export'

export async function generateStaticParams() {
  // Return placeholder - actual egg ID is handled client-side
  return [{ id: '0' }]
}

// Import the client component
import UpgradeEggClient from './UpgradeEggClient'

export default function UpgradeEggPage({ params }: { params: { id: string } }) {
  return <UpgradeEggClient params={params} />
}