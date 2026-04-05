'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListForSaleModal } from '@/components/ListForSaleModal'
import Image from 'next/image'
import { Loader2, ShoppingBag, User, Package, Layers, Tag } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { parseUnits } from 'ethers'
import { getSigner } from '@/lib/contracts/eggNft'
import { getUSDTContract } from '@/lib/contracts/usdt'
import { getMarketplaceContract, MARKETPLACE_ADDRESS } from '@/lib/contracts/marketplace'

interface NftData {
  id: string
  name: string
  type: string
  rarity: string
  species?: string
  food_count?: number
  generation?: number
  owner?: string
  owner_model?: any
  listed_price?: number
  is_listed?: boolean
  image?: string
  created: string
  token_id?: number
}

export default function NftDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const nftId = params.nftId as string
  
  const [nft, setNft] = useState<NftData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [purchasing, setPurchasing] = useState(false)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  useEffect(() => {
    const pb = createClient()
    
    if (isAuthenticated()) {
      const currentUser = getUser()
      setUser(currentUser)
    }

    pb.authStore.onChange(() => {
      if (isAuthenticated()) {
        setUser(getUser())
      } else {
        setUser(null)
      }
    })
  }, [])

  useEffect(() => {
    if (!isHydrated || !nftId) return

    const fetchNft = async () => {
      const pb = createClient()
      try {
        setLoading(true)
        const nftData = await pb.collection('nfts').getOne(nftId, {
          expand: 'owner'
        })
        setNft(nftData as unknown as NftData)
        
        // Check ownership
        if (user && nftData.owner === user.id) {
          setIsOwner(true)
        }
      } catch (err: any) {
        console.error('Failed to fetch NFT:', err)
        if (err.status === 404) {
          setError('NFT not found')
        } else {
          setError('Failed to load NFT details')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchNft()
  }, [isHydrated, nftId, user, refreshKey])

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 'bg-gray-400 text-gray-900'
      case 'rare':
        return 'bg-blue-500 text-white'
      case 'epic':
        return 'bg-purple-500 text-white'
      case 'legendary':
        return 'bg-yellow-500 text-yellow-900'
      default:
        return 'bg-secondary text-foreground'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'egg':
        return 'bg-orange-500 text-white'
      case 'food':
        return 'bg-green-500 text-white'
      case 'animal':
        return 'bg-pink-500 text-white'
      default:
        return 'bg-secondary text-foreground'
    }
  }

  const handleBuyNow = async () => {
    if (!nft || !nft.listed_price || !user) return
    
    setPurchasing(true)
    setError(null)

    try {
      // Step 1: Get signer and contracts
      const signer = await getSigner()
      const usdtContract = getUSDTContract(signer)
      const marketplace = getMarketplaceContract(signer)

      // Step 2: Approve USDT spending
      const priceInWei = parseUnits(nft.listed_price.toString(), 18)
      const approveTx = await usdtContract.approve(MARKETPLACE_ADDRESS, priceInWei)
      await approveTx.wait()

      // Step 3: Buy NFT
      const buyTx = await marketplace.buyNFT(nft.token_id)
      await buyTx.wait()

      // Step 4: Success - update PocketBase
      try {
        const pb = createClient()
        const token = pb.authStore.token
        await fetch('https://pb.eggoworld.io/api/v2/sync-nft-sale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            nft_id: nft.id,
            token_id: nft.token_id,
            seller: nft.owner,
            buyer: user.id,
            price: nft.listed_price,
            tx_hash: buyTx.hash
          })
        })
      } catch (err) {
        console.error('Failed to sync NFT sale:', err)
        // Continue anyway - the purchase was successful
      }

      // Step 5: Show success and redirect
      toast.success('NFT purchased successfully!')
      router.push('/dashboard/nfts')
    } catch (error: any) {
      console.error('Buy error:', error)
      let errorMessage = 'Purchase failed. Please try again.'
      
      if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected. Please try again.'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient USDT balance for this purchase.'
      } else if (error.message?.includes('allowance')) {
        errorMessage = 'Approval failed. Please try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setPurchasing(false)
    }
  }

  const _handleListForSale = () => {
    // Handled by ListForSaleModal component
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (loading || !nft) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card>
              <CardContent className="py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{nft.name}</h1>
            <div className="flex gap-2">
              <Badge className={getTypeColor(nft.type)}>
                {nft.type.toUpperCase()}
              </Badge>
              <Badge className={getRarityColor(nft.rarity)}>
                {nft.rarity.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Image */}
            <Card>
              <CardHeader>
                <CardTitle>NFT Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square relative rounded-lg overflow-hidden bg-secondary">
                  {nft.image ? (
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right column - Details */}
            <div className="space-y-6">
              {/* Price Card */}
              {nft.is_listed && nft.listed_price && (
                <Card className="border-2 border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary">
                      {nft.listed_price.toFixed(2)} USDT
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!isOwner ? (
                      <>
                        <Button 
                          onClick={handleBuyNow} 
                          disabled={purchasing}
                          className="w-full" 
                          size="lg"
                        >
                          {purchasing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Purchasing...
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="mr-2 h-4 w-4" />
                              Buy Now
                            </>
                          )}
                        </Button>
                        {error && (
                          <p className="text-sm text-destructive text-center">{error}</p>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Your NFT is listed for sale
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Not listed state */}
              {!nft.is_listed && (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground">
                        {isOwner ? 'This NFT is not listed for sale' : 'This NFT is not for sale'}
                      </p>
                      {!nft.is_listed && (
                      <ListForSaleModal nftId={nftId} onSuccess={handleRefresh} />
                    )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats Grid */}
              <Card>
                <CardHeader>
                  <CardTitle>NFT Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="text-sm">Owner</span>
                      </div>
                      <p className="font-medium">
                        {nft.owner_model?.username || nft.owner || 'Unknown'}
                      </p>
                    </div>

                    {nft.food_count !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span className="text-sm">Food Count</span>
                        </div>
                        <p className="font-medium">{nft.food_count}/10</p>
                      </div>
                    )}

                    {nft.generation !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Layers className="h-4 w-4" />
                          <span className="text-sm">Generation</span>
                        </div>
                        <p className="font-medium">#{nft.generation}</p>
                      </div>
                    )}

                    {nft.species && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Tag className="h-4 w-4" />
                          <span className="text-sm">Species</span>
                        </div>
                        <p className="font-medium">{nft.species}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card variant="clay" className="shadow-clay-md">
                <CardHeader>
                  <CardTitle className="font-[var(--font-pixel)] text-xs">Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-[var(--font-pixel)] text-xs">Token ID</span>
                    <span className="font-mono font-[var(--font-pixel)] text-xs">{nft.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-[var(--font-pixel)] text-xs">Created</span>
                    <span className="font-[var(--font-pixel)] text-xs">{new Date(nft.created).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
