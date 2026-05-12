// Server Component wrapper for static export
// Required for generateStaticParams with output: 'export'

export async function generateStaticParams() {
  return [{ id: '0' }]
}

import BreedAnimalsClient from './BreedAnimalsClient'

export default function BreedAnimalsPage() {
  return <BreedAnimalsClient />
}
