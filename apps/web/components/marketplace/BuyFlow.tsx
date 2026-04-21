'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { getUser, createClient } from '@/lib/pocketbase/client'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { createPortal } from 'react-dom'

/**
 * ข้อมูลสำหรับ BuyFlow component
 * Purchase flow props
 */
export interface BuyFlowProps {
  /** ID ของ listing ที่จะซื้อ */
  listingId: string
  /** ราคาใน USDT (หน่วยปกติ เช่น 100 ไม่ใช่ wei) */
  price: number
  /** ราคาในหน่วย wei (ไม่ใช้แล้ว - เก็บไว้สำหรับ backward compat) */
  _priceWei: bigint
  /** ชื่อ NFT */
  nftName: string
  /** ประเภท NFT (egg, food, animal) */
  nftType: 'egg' | 'food' | 'animal'
  /** รูป NFT (ไม่ได้ใช้แต่มีไว้สำหรับอนาคต) */
  _nftImage: string
}

/**
 * Component สำหรับจัดการกระบวนการซื้อ NFT (Purchase flow component)
 * 
 * ใช้ PocketBase usdt_balance แทน MetaMask approval
 * Flow：
 * 1. เปิด dialog ยืนยันการซื้อ
 * 2. เรียก API /api/v2/buy-nft ของ PocketBase
 * 3. ตัดเงิน buyer, ให้เงิน seller (หัก fee 4%)
 * 4. โอน NFT ให้ buyer
 * 5. Redirect ไป inventory
 */
export function BuyFlow({ 
  listingId, 
  price, 
  _priceWei,
  nftName,
  nftType,
  _nftImage 
}: BuyFlowProps) {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const { toast } = useToast()
  const user = getUser()
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // ป้องกัน hydration mismatch
  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  /**
   * เปิด confirmation dialog
   */
  const handleBuyClick = useCallback(() => {
    console.log('[BuyFlow] Buy button clicked', { 
      isHydrated, 
      user, 
      userWallet: user?.wallet,
      userKeys: user ? Object.keys(user) : [],
      allUserFields: user ? JSON.stringify(user, null, 2) : 'no user'
    })
    
    if (!isHydrated) {
      console.error('[BuyFlow] Not hydrated yet')
      toast({
        title: 'Loading...',
        description: 'Please wait for the page to load',
        variant: 'destructive',
      })
      return
    }
    
    if (!user) {
      console.error('[BuyFlow] User not authenticated')
      toast({
        title: 'Authentication Required',
        description: 'Please login to purchase NFTs',
        variant: 'destructive',
      })
      router.push('/auth/login')
      return
    }
    
    // Check for wallet field - try multiple possible field names
    const walletAddress = user.wallet || user.wallet_address || user.daccPublickey
    
    if (!walletAddress) {
      console.error('[BuyFlow] User has no wallet. Available fields:', Object.keys(user))
      toast({
        title: 'Wallet Not Found',
        description: 'Your wallet is not set up. Please contact support.',
        variant: 'destructive',
      })
      return
    }
    
    setError(null)
    setIsDialogOpen(true)
  }, [isHydrated, user, toast, router])

/**
 * ดำเนินการซื้อ NFT ผ่าน PocketBase API
 * Calls PocketBase /api/v2/marketplace/buy endpoint
 */
  const handlePurchase = useCallback(async () => {
    try {
      setIsPurchasing(true)
      setError(null)
      
      // Get fresh user data at time of purchase
      const currentUser = getUser()
      const pb = createClient()
      
      console.log('Purchase attempt:', { 
        nftType, 
        listingId, 
        currentUser,
        hasToken: !!pb.authStore.token,
        nftName 
      })
      
      if (!isHydrated) {
        throw new Error('Not hydrated yet - please wait')
      }
      
      if (!currentUser) {
        throw new Error('Not authenticated - please login')
      }
      
      if (!nftType) {
        throw new Error('NFT type is required')
      }
      
      if (!listingId) {
        throw new Error('Listing ID is required')
      }
      
      // Check for wallet field - try multiple possible field names
      const walletAddress = currentUser.wallet || currentUser.wallet_address || currentUser.daccPublickey
      
      console.log('[BuyFlow] Wallet check:', {
        wallet_field: currentUser.wallet,
        wallet_address_field: currentUser.wallet_address,
        daccPublickey_field: currentUser.daccPublickey,
        final_wallet: walletAddress
      })
      
      if (!walletAddress) {
        console.error('[BuyFlow] No wallet found. User fields:', Object.keys(currentUser))
        throw new Error('Wallet not found in user record. Please contact support.')
      }
      
      console.log('[BuyFlow] Using wallet address:', walletAddress)
      
      toast({
        title: 'Processing Purchase...',
        description: 'กรุณารอสักครู่',
      })
      
      // เรียก PocketBase API
      const response = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/v2/marketplace/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token
        },
        body: JSON.stringify({
          listing_id: listingId,
          buyer_address: walletAddress
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Purchase failed')
      }
      
      // Purchase successful
      toast({
        title: 'Purchase Successful!',
        description: `คุณได้รับ ${nftName} แล้ว`,
        variant: 'default',
      })
      
      setIsDialogOpen(false)
      setIsPurchasing(false)
      
      // Redirect ไป inventory
      router.push('/inventory')
    } catch (err: unknown) {
      console.error('Purchase error:', err)
      setIsPurchasing(false)
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการซื้อ NFT'
      setError(message)
      
      toast({
        title: 'Purchase Failed',
        description: message,
        variant: 'destructive',
      })
    }
  }, [listingId, nftType, nftName, isHydrated, toast, router])

  /**
   * ปิด dialog
   * Close dialog
   */
  const _handleClose = useCallback(() => {
    setIsDialogOpen(false)
    setError(null)
  }, [])

  return (
    <>
      {/* ปุ่มซื้อ NFT */}
      <button
        onClick={handleBuyClick}
        disabled={isPurchasing}
        className="w-full clay-button bg-primary text-on-primary py-4 px-6 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined">shopping_cart</span>
        {isPurchasing ? 'Purchasing...' : `Buy for ${price.toFixed(2)} USDT`}
      </button>

      {/* Purchase Confirmation Dialog - ใช้ Portal เพื่อป้องกัน layout collapse */}
      {mounted && isDialogOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDialogOpen(false)}
          />
          <div className="relative bg-surface-container-low rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl clay-card z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <span className="material-symbols-outlined text-3xl text-primary">shopping_cart</span>
            </div>
            <h2 className="text-2xl font-pixel-style text-on-surface mb-2">Confirm Purchase</h2>
            <p className="text-on-surface-variant text-sm">ยืนยันการซื้อ NFT</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-surface-container p-4 rounded-xl">
              <div className="text-sm text-on-surface-variant mb-1">Item</div>
              <div className="text-on-surface font-bold">{nftName}</div>
            </div>

            <div className="bg-surface-container p-4 rounded-xl">
              <div className="text-sm text-on-surface-variant mb-1">Price</div>
              <div className="text-2xl font-black text-primary">
                {price.toFixed(2)} USDT
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-base mt-0.5">info</span>
                <div className="text-xs text-on-surface-variant">
                  <p className="font-bold mb-1">Platform Fee (4%)</p>
                  <p>4% will be deducted as platform fee. Seller receives {(price * 0.96).toFixed(2)} USDT.</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-error-container p-4 rounded-xl border border-error">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-error text-base mt-0.5">error</span>
                  <div className="text-sm text-error">{error}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('[BuyFlow] Cancel button clicked')
                setIsDialogOpen(false)
              }}
              disabled={isPurchasing}
              className="flex-1 clay-button bg-surface-container-high text-on-surface py-4 px-6 rounded-xl font-black text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handlePurchase()
              }}
              disabled={isPurchasing}
              className="flex-1 clay-button bg-primary text-on-primary py-4 px-6 rounded-xl font-black text-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">thumb_up</span>
              {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  )
}

export default BuyFlow
