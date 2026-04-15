'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Loader2, ArrowLeft, User, Tag, Calendar } from 'lucide-react'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { useMarketplaceSync } from '@/hooks/use-marketplace-sync'
import { CancelListingDialog } from '@/components/marketplace/CancelListingDialog'
import { UpdatePriceDialog } from '@/components/marketplace/UpdatePriceDialog'
import { BuyFlow } from '@/components/marketplace/BuyFlow'
import { parseUnits } from 'ethers'

interface PageProps {
  params: { id: string }
}

export default function ProductDetail({ params }: PageProps) {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const unwrappedParams = use(params)
  const listingId = unwrappedParams.id

  // Use marketplace sync hook for single listing - ใช้ hook สำหรับ listing เดียว
  const { 
    listings, 
    loading, 
    error, 
    refresh,
    syncing,
    lastUpdated,
  } = useMarketplaceSync({ listingId })

  const [user, setUser] = useState<any>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showUpdatePriceDialog, setShowUpdatePriceDialog] = useState(false)

  // Get single listing from synced data - ดึง listing เดียวจากข้อมูลที่ sync
  const listing = listings.length > 0 ? listings[0] : null

  // ดึงข้อมูล user เมื่อ hydrate เสร็จ
  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser())
    }

    const pb = createClient()
    pb.authStore.onChange(() => {
      if (isAuthenticated()) {
        setUser(getUser())
      } else {
        setUser(null)
      }
    })
  }, [])

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

  const calculateCommissions = (price: number) => {
    const totalCommission = price * 0.5
    const g1Commission = price * 0.2
    const g2Commission = price * 0.1
    const g3Commission = price * 0.1
    const g4Commission = price * 0.1
    const sellerReceives = price * 0.5

    return {
      totalCommission,
      g1: g1Commission,
      g2: g2Commission,
      g3: g3Commission,
      g4: g4Commission,
      seller: sellerReceives,
    }
  }

  if (!isHydrated || loading) {
    return (
      <LayoutWithoutNav>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-on-surface-variant">กำลังโหลดข้อมูล...</p>
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
            กลับสู่ Marketplace | Back to Marketplace
          </Button>

          <Card className="border-2 border-error">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <p className="text-2xl font-bold text-error">{error || 'ไม่พบข้อมูล | Product not found'}</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => router.push('/marketplace')}>
                    กลับสู่ Marketplace | Back to Marketplace
                  </Button>
                  <Button variant="outline" onClick={refresh}>
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry | ลองใหม่
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </LayoutWithoutNav>
    )
  }

  const commissions = calculateCommissions(listing.price)
  const isSold = listing.status === 'sold'
  const isCancelled = listing.status === 'cancelled'
  const isOwnedByUser = user && listing.seller === user.id
  const canCancel = isOwnedByUser && !isSold && !isCancelled

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
            กลับสู่ Marketplace | Back to Marketplace
          </Button>
          <div>
            <h1 className="text-4xl font-pixel-style text-primary">
              {listing?.name || 'Loading...'}
            </h1>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card variant="clay" className="shadow-clay-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="font-[var(--font-pixel)] text-lg">
                รูปภาพ NFT | NFT Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-square min-h-[400px] rounded-lg overflow-hidden bg-surface-container-low">
                {listing.image_url ? (
                  <Image
                    src={listing.image_url}
                    alt={listing.name}
                    fill
                    className="object-contain p-8"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Tag className="h-32 w-32 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex gap-3 flex-wrap">
              <Badge className={getRarityColor(listing.rarity)}>
                {listing.rarity.toUpperCase()}
              </Badge>
              {isSold && (
                <Badge className="bg-red-600 text-white">
                  SOLD | ขายแล้ว
                </Badge>
              )}
              {!isSold && (
                <Badge className="bg-green-600 text-white">
                  AVAILABLE | พร้อมขาย
                </Badge>
              )}
            </div>

            <Card variant="clay" className="shadow-clay-md border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-3xl text-primary font-pixel-style">
                  {listing.price.toFixed(2)} USDT
                </CardTitle>
                <p className="text-sm text-on-surface-variant">
                  ราคา: ~${listing.price.toFixed(2)} USD
                </p>
              </CardHeader>
              <CardContent>
                {isSold ? (
                  <>
                    <Button
                      disabled
                      className="w-full py-6 text-lg font-bold"
                      size="lg"
                    >
                      ขายแล้ว | SOLD
                    </Button>
                    <p className="text-sm text-center text-muted-foreground mt-2">
                      สินค้านี้ขายแล้ว | This item has been sold
                    </p>
                  </>
                ) : (
                  <BuyFlow
                    listingId={listing.id}
                    price={listing.price}
                    priceWei={parseUnits(listing.price.toString(), 18)}
                    nftName={listing.name}
                    _nftImage={listing.image_url || ''}
                  />
                )}
              </CardContent>
            </Card>

            <Card variant="clay" className="shadow-clay-md">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-sm flex items-center gap-2">
                  <User className="h-5 w-5" />
                  เจ้าของ | Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium">
                  {listing.seller_name || listing.seller || 'Unknown | ไม่ทราบ'}
                </p>
                {canCancel && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setShowUpdatePriceDialog(true)}
                      className="w-full"
                    >
                      แก้ไขราคา | Edit Price
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      className="w-full"
                    >
                      Cancel Listing | ยกเลิก Listing
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card variant="clay" className="shadow-clay-md">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-sm">
                  ส่วนแบ่งและค่าธรรมเนียม | Commission Breakdown
                </CardTitle>
                <p className="text-xs text-on-surface-variant">
                  50% ของราคาขายแบ่งเป็น 4 ระดับ
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-surface-container-highest">
                  <span className="text-sm font-bold text-primary">G1 (20%)</span>
                  <span className="font-mono font-bold">{commissions.g1.toFixed(2)} USDT</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-surface-container-highest">
                  <span className="text-sm font-bold text-secondary">G2 (10%)</span>
                  <span className="font-mono font-bold">{commissions.g2.toFixed(2)} USDT</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-surface-container-highest">
                  <span className="text-sm font-bold text-secondary">G3 (10%)</span>
                  <span className="font-mono font-bold">{commissions.g3.toFixed(2)} USDT</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-surface-container-highest">
                  <span className="text-sm font-bold text-secondary">G4 (10%)</span>
                  <span className="font-mono font-bold">{commissions.g4.toFixed(2)} USDT</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-t-2 border-primary">
                  <span className="text-base font-black text-primary">รวมค่าธรรมเนียม | Total</span>
                  <span className="font-mono font-black text-primary text-lg">
                    {commissions.totalCommission.toFixed(2)} USDT (50%)
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 bg-surface-container-low rounded-lg px-4">
                  <span className="text-sm font-bold text-on-surface">ผู้ขายได้รับ | Seller Receives</span>
                  <span className="font-mono font-bold text-on-surface text-lg">
                    {commissions.seller.toFixed(2)} USDT (50%)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="clay" className="shadow-clay-sm">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-xs">
                  ข้อมูลเพิ่มเติม | Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-[var(--font-pixel)] text-xs flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    ประเภท | Type
                  </span>
                  <span className="font-bold">{listing.nft_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-[var(--font-pixel)] text-xs flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    อัพเดท | Updated
                  </span>
                  <span className="font-[var(--font-pixel)] text-xs">
                    {new Date(listing.updated).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-[var(--font-pixel)] text-xs flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    ID
                  </span>
                  <span className="font-mono font-[var(--font-pixel)] text-xs truncate max-w-[200px]">
                    {listing.id}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <CancelListingDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          listingId={listing.id}
          nftName={listing.name}
          nftType={listing.nft_type}
          price={listing.price}
          onSuccess={() => {
            router.push('/marketplace')
          }}
        />

        <UpdatePriceDialog
          open={showUpdatePriceDialog}
          onOpenChange={setShowUpdatePriceDialog}
          listingId={listing.id}
          currentPrice={listing.price}
          nftType={listing.nft_type}
          nftName={listing.name}
          onSuccess={() => {
            refresh()
          }}
        />
      </div>
    </LayoutWithoutNav>
  )
}
