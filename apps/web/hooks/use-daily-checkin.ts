'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/pocketbase/client'

interface CheckInData {
  streak: number
  lastCheckIn: string | null
  checkInCount: number
  canClaim: boolean
  countdownSeconds: number
}

interface UseDailyCheckinReturn {
  checkInData: CheckInData | null
  loading: boolean
  error: string | null
  claimCheckin: () => Promise<void>
  countdown: string // Format: "HH:MM:SS"
}

/**
 * Hook for daily check-in functionality
 * Hook สำหรับระบบ check-in รายวัน
 * 
 * Features:
 * - Fetches user's check-in status from user_stats collection
 * - Countdown timer to next available check-in
 * - Claim check-in reward (calls /api/v2/check-in)
 * - Streak tracking with auto-reset if day missed
 */
export function useDailyCheckin(userId: string | undefined): UseDailyCheckinReturn {
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdownSeconds, setCountdownSeconds] = useState(0)

  // Fetch check-in status from PocketBase
  const fetchCheckInStatus = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const pb = createClient()
      
      // Get user_stats record for this user
      const stats = await pb.collection('user_stats').getFirstListItem(
        `user = "${userId}"`,
        {
          expand: 'user',
        }
      )

      const lastCheckIn = stats.last_check_in || null
      const streak = stats.check_in_streak || 0
      const checkInCount = stats.check_in_count || 0

      // Calculate if can claim (24 hours since last check-in)
      let canClaim = false
      let secondsUntilNext = 0

      if (lastCheckIn) {
        const lastCheckInDate = new Date(lastCheckIn)
        const now = new Date()
        const hoursSinceLast = (now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceLast >= 24) {
          canClaim = true
          secondsUntilNext = 0
        } else {
          canClaim = false
          secondsUntilNext = Math.ceil((24 * 60 * 60 * 1000) - (now.getTime() - lastCheckInDate.getTime())) / 1000
        }
      } else {
        // Never checked in before
        canClaim = true
        secondsUntilNext = 0
      }

      setCheckInData({
        streak,
        lastCheckIn,
        checkInCount,
        canClaim,
        countdownSeconds: secondsUntilNext,
      })

      setCountdownSeconds(secondsUntilNext)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch check-in status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load check-in data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Claim daily check-in reward
  const claimCheckin = useCallback(async () => {
    if (!userId || !checkInData?.canClaim) {
      return
    }

    try {
      setLoading(true)
      const pb = createClient()
      
      // Call PocketBase check-in endpoint
      const response = await pb.send('/api/v2/check-in', {
        method: 'POST',
        body: {},
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Check-in failed')
      }

      // Refresh check-in status
      await fetchCheckInStatus()
    } catch (err) {
      console.error('Check-in claim failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim check-in reward')
      throw err
    } finally {
      setLoading(false)
    }
  }, [userId, checkInData?.canClaim, fetchCheckInStatus])

  // Countdown timer effect
  useEffect(() => {
    if (countdownSeconds <= 0) return

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // Refresh status when countdown reaches zero
          fetchCheckInStatus()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [countdownSeconds, fetchCheckInStatus])

  // Initial fetch
  useEffect(() => {
    fetchCheckInStatus()
  }, [fetchCheckInStatus])

  // Format countdown as HH:MM:SS
  const countdown = (() => {
    const hours = Math.floor(countdownSeconds / 3600)
    const minutes = Math.floor((countdownSeconds % 3600) / 60)
    const seconds = countdownSeconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })()

  return {
    checkInData,
    loading,
    error,
    claimCheckin,
    countdown,
  }
}

export default useDailyCheckin
