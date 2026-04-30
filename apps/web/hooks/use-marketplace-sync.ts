'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getMarketplaceListings, getListingById, type MarketplaceListing } from '@/lib/pocketbase/marketplace'

/**
 * Configuration options for marketplace sync hook
 * ตัวเลือกการตั้งค่าสำหรับ hook
 */
interface UseMarketplaceSyncOptions {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  intervalMs?: number
  /** Enable/disable auto-polling (default: true) */
  enabled?: boolean
  /** Single listing ID to poll (if not provided, polls all active listings) */
  listingId?: string
}

/**
 * Return type for useMarketplaceSync hook
 * ประเภทข้อมูลที่ถูกส่งกลับจาก hook
 */
interface UseMarketplaceSyncReturn {
  /** Current listings data */
  listings: MarketplaceListing[]
  /** Loading state (true during initial fetch and refreshes) */
  loading: boolean
  /** Error message if any */
  error: string | null
  /** Manual refresh function */
  refresh: () => Promise<void>
  /** Whether currently polling (during refresh) */
  syncing: boolean
  /** Last successful update timestamp */
  lastUpdated: Date | null
  /** Number of consecutive errors (for backoff calculation) */
  errorCount: number
  /** Current polling interval (may increase due to backoff) */
  currentInterval: number
}

/**
 * Real-time marketplace status sync hook
 * Hook สำหรับ sync สถานะ marketplace แบบ real-time โดยการ poll ทุก 30 วินาที
 * 
 * Features:
 * - Auto-polling with configurable interval (default 30s)
 * - Exponential backoff on errors (max 5 retries, then 5min interval)
 * - Visibility-aware (pauses when tab is inactive)
 * - Manual refresh function
 * - Loading indicator for "Updating..." state
 * - Cleanup on unmount
 * 
 * @param options - Configuration options
 * @returns Object with listings, loading state, error, refresh function, and sync status
 * 
 * @example
 * ```typescript
 * // Poll all listings
 * const { listings, loading, syncing, refresh } = useMarketplaceSync()
 * 
 * // Poll single listing
 * const { listings, syncing } = useMarketplaceSync({ listingId: 'abc123' })
 * 
 * // Custom interval
 * const { refresh } = useMarketplaceSync({ intervalMs: 60000 })
 * ```
 */
export function useMarketplaceSync(
  options: UseMarketplaceSyncOptions = {}
): UseMarketplaceSyncReturn {
  const {
    intervalMs = 30000, // 30 seconds default
    enabled = true,
    listingId,
  } = options

  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [errorCount, setErrorCount] = useState(0)
  const [currentInterval, setCurrentInterval] = useState(intervalMs)

  // Track if component is mounted - เช็คว่า component ยัง mount อยู่หรือไม่
  const isMounted = useRef(true)

  // Track error count via ref to avoid cyclic dependency in fetchListings
  const errorCountRef = useRef(0)

  // Track if tab is visible - เช็คว่า tab ยังเปิดอยู่หรือไม่
  const [_isVisible, setIsVisible] = useState(true)

  /**
   * Fetch listings from PocketBase
   * ดึงข้อมูล listings จาก PocketBase
   */
  const fetchListings = useCallback(async () => {
    try {
      if (listingId) {
        // Fetch single listing - ดึง listing เดียว
        const listing = await getListingById(listingId)
        if (listing && isMounted.current) {
          setListings([listing])
          setError(null)
          setErrorCount(0)
          errorCountRef.current = 0
          setLastUpdated(new Date())
          setCurrentInterval(intervalMs)
        }
      } else {
        // Fetch all active listings - ดึง listings ทั้งหมด
        const fetchedListings = await getMarketplaceListings({ 
          limit: 100,
          status: 'active',
        })
        if (isMounted.current) {
          setListings(fetchedListings)
          setError(null)
          setErrorCount(0)
          errorCountRef.current = 0
          setLastUpdated(new Date())
          setCurrentInterval(intervalMs)
        }
      }
    } catch (err: any) {
      if (!isMounted.current) return

      // Handle error - จัดการข้อผิดพลาด
      setError(err.message || 'Unknown error occurred')
      
      // Exponential backoff: 30s → 60s → 120s → 240s → 480s → 5min (max)
      // per D-20: min(30000 * Math.pow(2, errorCount), 300000)
      const newErrorCount = errorCountRef.current + 1
      errorCountRef.current = newErrorCount
      setErrorCount(newErrorCount)
      const backoffInterval = Math.min(30000 * Math.pow(2, newErrorCount), 300000)
      setCurrentInterval(backoffInterval)
    } finally {
      if (isMounted.current) {
        setLoading(false)
        setSyncing(false)
      }
    }
  }, [listingId, intervalMs])

  // Initial fetch and polling setup - การดึงข้อมูลครั้งแรกและตั้งค่า polling
  useEffect(() => {
    isMounted.current = true

    if (!enabled) {
      setLoading(false)
      return
    }

    // Initial fetch - ดึงข้อมูลครั้งแรก
    fetchListings()

    // Set up polling interval - ตั้งค่า polling
    const pollIntervalId = setInterval(() => {
      // Only poll if tab is visible - โพลเฉพาะเมื่อ tab เปิดอยู่
      if (document.visibilityState === 'visible') {
        setSyncing(true)
        fetchListings()
      }
    }, currentInterval)

    // Visibility change handler - จัดการการเปลี่ยน visibility ของ tab
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
      // Immediately fetch when tab becomes visible - ดึงข้อมูลทันทีเมื่อ tab เปิด
      if (document.visibilityState === 'visible' && enabled) {
        setSyncing(true)
        fetchListings()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup on unmount - ทำความสะอาดเมื่อ unmount
    return () => {
      isMounted.current = false
      clearInterval(pollIntervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchListings, currentInterval, enabled])

  /**
   * Manual refresh function
   * ฟังก์ชัน refresh ด้วยตนเอง
   */
  const refresh = useCallback(async () => {
    if (!enabled) return
    setSyncing(true)
    await fetchListings()
  }, [fetchListings, enabled])

  return {
    listings,
    loading,
    error,
    refresh,
    syncing,
    lastUpdated,
    errorCount,
    currentInterval,
  }
}
