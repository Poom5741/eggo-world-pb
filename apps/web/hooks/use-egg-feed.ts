'use client'

import { useState, useCallback } from 'react'
import { upgradeEggRarity, getSigner } from '@/lib/contracts/eggNft'
import { useToast } from '@/hooks/use-toast'

/**
 * Interface สำหรับค่าที่ return จาก useEggFeed hook
 */
interface UseEggFeedReturn {
  /** ฟังก์ชันให้อาหารไข่ รับ eggId และ foodIds */
  feedEgg: (eggId: number, foodIds: number[]) => Promise<boolean>
  /** สถานะกำลังทำธุรกรรม */
  loading: boolean
  /** ข้อความ error หากเกิดข้อผิดพลาด */
  error: string | null
}

/**
 * Hook สำหรับจัดการการให้อาหารไข่ NFT
 * ตรวจสอบว่าต้องให้อาหารครบ 10 ชิ้น และเรียก smart contract upgradeEggRarity
 * @returns UseEggFeedReturn - feedEgg function, loading state, error
 */
export function useEggFeed(): UseEggFeedReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  /**
   * ให้อาหารไข่ด้วย food items 10 ชิ้น
   * ต้องให้อาหารครบ 10 ชิ้นเท่านั้น (ตาม EGG-03)
   * @param eggId - Egg NFT Token ID
   * @param foodIds - Array ของ Food NFT IDs (ต้องมี exactly 10 ชิ้น)
   * @returns boolean - true ถ้าสำเร็จ, false ถ้าล้มเหลว
   */
  const feedEgg = useCallback(async (eggId: number, foodIds: number[]): Promise<boolean> => {
    // ตรวจสอบว่าต้องให้อาหารครบ 10 ชิ้น
    if (foodIds.length !== 10) {
      const errorMsg = `Must feed exactly 10 food items (got ${foodIds.length})`
      setError(errorMsg)
      toast({
        title: 'Feed Failed',
        description: errorMsg,
        variant: 'destructive',
      })
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // ดึง signer จาก window.ethereum
      const signer = await getSigner()
      
      // เรียก upgradeEggRarity contract function
      const txHash = await upgradeEggRarity(signer, eggId, foodIds)
      
      // แสดง toast ว่ากำลังรอ confirmation
      toast({
        title: 'Feeding Submitted',
        description: 'Waiting for blockchain confirmation...',
      })

      // รอ transaction receipt (poll ทุก 2 วินาที)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new (await import('ethers')).BrowserProvider((window as any).ethereum)
        const receipt = await provider.waitForTransaction(txHash)
        
        if (receipt.status === 1) {
          // สำเร็จ
          toast({
            title: 'Success!',
            description: 'Egg fed successfully! 10 food items added',
          })
          return true
        } else {
          throw new Error('Transaction failed')
        }
      }
      
      return true
    } catch (err: any) {
      // เกิด error
      const errorMsg = err.message || 'Feed transaction failed'
      setError(errorMsg)
      toast({
        title: 'Feed Failed',
        description: errorMsg,
        variant: 'destructive',
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    feedEgg,
    loading,
    error,
  }
}
