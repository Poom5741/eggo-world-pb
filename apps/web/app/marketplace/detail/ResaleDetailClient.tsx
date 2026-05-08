'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/pocketbase/client'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, User, Tag, Calendar } from 'lucide-react'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'

interface ResaleDetailClientProps {
  listingId: string
}

interface ResaleListing {
  id: string
  animal_id: number
  seller_id: string
  seller_name?: string
  price: number
  rarity: string
  species: string
  generation: number
  status: string
  listed_at: string
}

export default function ResaleDetailClient({ listingId }: ResaleDetailClientProps) {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const [listing, setListing] = useState<ResaleListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      const pb = createClient()
      try {
        const result = await pb.collection('resale_listings').getOne(listingId, {
          expand: 'seller_id',
        })
        
        setListing({
          id: result.id,
          animal_id: result.animal_id,
          seller_id: result.seller_id,
          seller_name: result.expand?.seller_id?.username || undefined,
          price: result.price,
          rarity: result.rarity,
          species: result.species,
          generation: result.generation,
          status: result.status,
          listed_at: result.listed_at,
        })
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load listing')
        setListing(null)
      } finally {
        setLoading(false)
      }
    }

    if (listingId && isHydrated) {
      fetchListing()
    }
  }, [listingId, isHydrated])

  const getRarityColor = (rarity: string) => {
    const normalizedRarity = rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase()
    switch (normalizedRarity) {
      case 'Common':
        return 'bg-gray-400 text-gray-900'
      case 'Rare':
        return 'bg-blue-500 text-white'
      case 'Epic':
        return 'bg-purple-500 text-white'
      case 'Legendary':
        return 'bg-yellow-500 text-yellow-900'
      default:
        return 'bg-secondary text-foreground'
    }
  }

  const getRarityLabel = (rarity: string) => {
    return rarity.toUpperCase()
  }

  if (!isHydrated || loading) {
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

  if (error || !listing) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-4xl mx-auto space-y-8">
          <Button
            variant="outline"
            onClick={() => router.push('/marketplace')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>

          <Card className="border-2 border-error">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <p className="text-2xl font-bold text-error">{error || 'Product not found'}</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => router.push('/marketplace')}>
                    Back to Marketplace
                  </Button>
                  <Button variant="outline" onClick={() => { setLoading(true); setError(null); }}>
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </LayoutWithoutNav>
    )
  }

  const isSold = listing.status === 'sold'
  const isCancelled = listing.status === 'cancelled'

  return (
    <LayoutWithoutNav>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/marketplace')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
          <div>
            <h1 className="text-4xl font-pixel-style text-primary">
              {listing.species} #{listing.animal_id}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card variant="clay" className="shadow-clay-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="font-body text-lg">
                Animal Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-square min-h-[400px] rounded-lg overflow-hidden bg-surface-container-low">
                <div className="flex items-center justify-center h-full">
                  <Tag className="h-32 w-32 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex gap-3 flex-wrap">
              <Badge className={getRarityColor(listing.rarity)}>
                {getRarityLabel(listing.rarity)}
              </Badge>
              <Badge className="bg-green-600 text-white">
                {listing.species}
              </Badge>
              {isSold && (
                <Badge className="bg-red-600 text-white">
                  SOLD
                </Badge>
              )}
              {!isSold && !isCancelled && (
                <Badge className="bg-green-600 text-white">
                  AVAILABLE
                </Badge>
              )}
            </div>

            <Card variant="clay" className="shadow-clay-md border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-3xl text-primary font-pixel-style">
                  {listing.price.toFixed(2)} USDT
                </CardTitle>
                <p className="text-sm text-on-surface-variant">
                  Price: ~${listing.price.toFixed(2)} USD
                </p>
              </CardHeader>
              <CardContent>
                {isSold ? (
                  <Button
                    disabled
                    className="w-full py-6 text-lg font-bold"
                    size="lg"
                  >
                    SOLD
                  </Button>
                ) : isCancelled ? (
                  <Button
                    disabled
                    className="w-full py-6 text-lg font-bold"
                    size="lg"
                  >
                    CANCELLED
                  </Button>
                ) : (
                  <Button
                    className="w-full py-6 text-lg font-bold bg-primary text-on-primary"
                    size="lg"
                  >
                    Buy Animal
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card variant="clay" className="shadow-clay-md">
              <CardHeader>
                <CardTitle className="font-body text-sm flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Seller
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium">
                  {listing.seller_name || listing.seller_id || 'Unknown'}
                </p>
              </CardContent>
            </Card>

            <Card variant="clay" className="shadow-clay-sm">
              <CardHeader>
                <CardTitle className="font-body text-xs">
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-body text-xs flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Species
                  </span>
                  <span className="font-bold">{listing.species}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-body text-xs flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Generation
                  </span>
                  <span className="font-bold">{listing.generation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-body text-xs flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Listed
                  </span>
                  <span className="font-body text-xs">
                    {new Date(listing.listed_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-body text-xs flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    ID
                  </span>
                  <span className="font-mono font-body text-xs truncate max-w-[200px]">
                    {listing.id}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutWithoutNav>
  )
}