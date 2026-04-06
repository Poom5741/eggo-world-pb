'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { getSigner } from '@/lib/contracts/eggNft'
import { 
  checkAllowance, 
  approveUSDT,
} from '@/lib/contracts/usdt'
import { 
  buyNFT,
  MARKETPLACE_ADDRESS 
} from '@/lib/contracts/marketplace'
import { ApprovalDialog } from '@/components/marketplace/ApprovalDialog'

/**
 * ข้อมูลสำหรับ BuyFlow component
 * Purchase flow props
 */
export interface BuyFlowProps {
  /** ID ของ listing ที่จะซื้อ */
  listingId: string
  /** ราคาใน USDT (หน่วยปกติ เช่น 100 ไม่ใช่ wei) */
  price: number
  /** ราคาในหน่วย wei */
  priceWei: bigint
  /** ชื่อ NFT */
  nftName: string
  /** รูป NFT (ไม่ได้ใช้แต่มีไว้สำหรับอนาคต) */
  _nftImage: string
}

/**
 * Component สำหรับจัดการกระบวนการซื้อ NFT (Purchase flow component)
 * 
 * Handles:
 * - ตรวจสอบ USDT allowance
 * - แสดง approval dialog
 * - ดำเนินการซื้อ NFT
 * - แสดง progress indicators
 * - Toast notifications
 * - Redirect ไป inventory หลังสำเร็จ
 * 
 * Two-step flow:
 * 1. Approve USDT ( allowance + approve transaction)
 * 2. Buy NFT ( buyNFT transaction )
 * 
 * @example
 * ```tsx
 * <BuyFlow
 *   listingId="123"
 *   price={100}
 *   priceWei={parseUnits("100", 18)}
 *   nftName="Golden Chicken #42"
 *   nftImage="/images/nft/chicken.png"
 * />
 * ```
 */
export function BuyFlow({ 
  listingId, 
  price, 
  priceWei, 
  nftName,
  _nftImage 
}: BuyFlowProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalComplete, setApprovalComplete] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  
  // Error state (ไม่ได้ใช้แต่เก็บไว้สำหรับอนาคต)
  const [_error, setError] = useState<string | null>(null)

  /**
   * ตรวจสอบ USDT allowance ก่อน purchase
   * Check USDT allowance before purchase
   */
  const checkAllowanceAndShowDialog = useCallback(async () => {
    try {
      setError(null)
      setIsDialogOpen(true)
      setIsApproving(true)
      setApprovalComplete(false)
      
      const signer = await getSigner()
      const userAddress = await signer.getAddress()
      
      // ตรวจสอบ allowance ปัจจุบัน
      const allowance = await checkAllowance(signer, userAddress, MARKETPLACE_ADDRESS)
      
      // ถ้า allowance ไม่พอ ต้อง approve ใหม่
      if (allowance < priceWei) {
        // ต้อง approve
        setIsApproving(true)
        setApprovalComplete(false)
      } else {
        // มี allowance พอแล้ว ข้ามไป purchase เลย
        setApprovalComplete(true)
        setIsApproving(false)
      }
    } catch (err: unknown) {
      console.error('Allowance check error:', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setIsApproving(false)
    }
  }, [priceWei])

  /**
   * ดำเนินการ approve USDT
   * Execute USDT approval
   */
  const handleApprove = useCallback(async () => {
    try {
      setIsApproving(true)
      setError(null)
      
      const signer = await getSigner()
      
      // Approve USDT
      await approveUSDT(signer, MARKETPLACE_ADDRESS, priceWei)
      
      // Approval successful
      setApprovalComplete(true)
      setIsApproving(false)
      
      toast({
        title: 'Approval Successful',
        description: 'USDT ถูกอนุมัติเรียบร้อยแล้ว',
        variant: 'default',
      })
    } catch (err: unknown) {
      console.error('Approval error:', err)
      setIsApproving(false)
      const message = err instanceof Error ? err.message : 'Unknown error'
      throw new Error(message) // ให้ ApprovalDialog จัดการ error display
    }
  }, [priceWei, toast])

  /**
   * ไปสู่ขั้นตอน purchase
   * Proceed to purchase step
   */
  const handleNext = useCallback(async () => {
    try {
      setIsPurchasing(true)
      
      const signer = await getSigner()
      
      toast({
        title: 'Purchasing...',
        description: 'Step 2/2: Purchasing NFT...',
      })
      
      // ซื้อ NFT
      await buyNFT(signer, listingId, priceWei)
      
      // Purchase successful
      toast({
        title: 'Purchase Successful!',
        description: `คุณได้รับ ${nftName} แล้ว`,
        variant: 'default',
      })
      
      // ปิด dialog
      setIsDialogOpen(false)
      setIsPurchasing(false)
      
      // Redirect ไป inventory
      router.push('/inventory')
    } catch (err: unknown) {
      console.error('Purchase error:', err)
      setIsPurchasing(false)
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการซื้อ NFT'
      
      toast({
        title: 'Purchase Failed',
        description: message,
        variant: 'destructive',
      })
    }
  }, [listingId, priceWei, nftName, toast, router])

  /**
   * ปิด dialog
   * Close dialog
   */
  const handleClose = useCallback(() => {
    setIsDialogOpen(false)
    setError(null)
  }, [])

  return (
    <>
      {/* ปุ่มซื้อ NFT */}
      <button
        onClick={checkAllowanceAndShowDialog}
        disabled={isPurchasing}
        className="w-full clay-button bg-primary text-on-primary py-4 px-6 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined">shopping_cart</span>
        {isPurchasing ? 'Purchasing...' : `Buy for ${price.toFixed(2)} USDT`}
      </button>

      {/* Approval Dialog */}
      <ApprovalDialog
        isOpen={isDialogOpen}
        amount={price}
        spenderName={MARKETPLACE_ADDRESS || 'Marketplace Contract'}
        isApproving={isApproving}
        approvalComplete={approvalComplete}
        onClose={handleClose}
        onApprove={handleApprove}
        onNext={handleNext}
      />
    </>
  )
}

export default BuyFlow
