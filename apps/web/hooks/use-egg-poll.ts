import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/pocketbase/client'

/**
 * Egg NFT data structure
 * โครงสร้างข้อมูล Egg NFT
 */
export interface EggData {
  id: string
  egg_id: number
  food_count: number
  is_hatched: boolean
  token_id: string
  minted_at: string
  rarity_seed?: number
  element_type?: string
  owner?: string
}

/**
 * Return type for useEggPoll hook
 * ประเภทข้อมูลที่ถูกส่งกลับจาก hook
 */
interface UseEggPollReturn {
  eggs: EggData[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  polling: boolean
  lastUpdated: Date | null
}

/**
 * Auto-polling hook for egg NFTs
 * Hook สำหรับดึงข้อมูล Egg NFT อัตโนมัติทุก 30 วินาที
 * 
 * @param userId - User ID to query eggs for (PocketBase user ID, not wallet address)
 * @param intervalMs - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @returns Object with eggs array, loading state, error, and refresh function
 * 
 * @example
 * ```typescript
 * const { eggs, loading, error, refresh } = useEggPoll(user?.id, 30000)
 * ```
 */
export function useEggPoll(
  userId: string | undefined,
  intervalMs: number = 30000 // 30 seconds per D-16
): UseEggPollReturn {
  const [eggs, setEggs] = useState<EggData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollInterval, setPollInterval] = useState(intervalMs)
  const [errorCount, setErrorCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  /**
   * Fetch egg NFTs from PocketBase
   * ดึงข้อมูล Egg NFT จาก PocketBase
   */
  const fetchEggs = useCallback(async () => {
    // No user ID, empty string, or "null" string - skip fetch
    if (!userId || userId === '' || userId === 'null') {
      return
    }

    setLoading(true)
    try {
      // Get PocketBase client
      const pb = createClient()
      
      // Fetch from egg_nfts collection with filter and sort
      // กรองตามเจ้าของและเรียงตาม food_count (มากไปน้อย)
      const records = await pb.collection('egg_nfts').getList(1, 100, {
        filter: `owner = "${userId}" && is_hatched = false`,
        sort: '-food_count', // Sort by food_count descending (eggs closest to hatching first)
      })

      setEggs(records.items as EggData[])
      setError(null)
      setErrorCount(0) // Reset error count on success - รีเซ็ตจำนวนข้อผิดพลาดเมื่อสำเร็จ
      setLastUpdated(new Date())
      setPollInterval(intervalMs) // Reset to normal interval - รีเซ็ตเป็นช่วงเวลาปกติ
    } catch (err: any) {
      // Handle error - จัดการข้อผิดพลาด
      setError(err.message || 'Unknown error occurred')
      
      // Exponential backoff: 30s → 60s → 120s → 5min (max)
      // per D-20: min(30000 * Math.pow(2, errorCount), 300000)
      const newErrorCount = errorCount + 1
      setErrorCount(newErrorCount)
      const backoffInterval = Math.min(30000 * Math.pow(2, newErrorCount), 300000)
      setPollInterval(backoffInterval)
    } finally {
      setLoading(false)
    }
  }, [userId, errorCount, intervalMs])

  useEffect(() => {
    // Initial fetch on mount
    fetchEggs()

    // Poll every pollInterval (per D-16: 30 seconds, with exponential backoff on errors per D-20)
    // โพลทุกๆ pollInterval (30 วินาทีตาม D-16, มี exponential backoff เมื่อมีข้อผิดพลาดตาม D-20)
    const pollIntervalId = setInterval(fetchEggs, pollInterval)

    // Cleanup on unmount
    return () => {
      clearInterval(pollIntervalId)
    }
  }, [fetchEggs, pollInterval])

  return { eggs, loading, error, refresh: fetchEggs, polling: loading, lastUpdated }
}
