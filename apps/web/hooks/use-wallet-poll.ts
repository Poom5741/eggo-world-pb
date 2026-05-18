import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/pocketbase/client'

/**
 * Wallet balance data structure
 * โครงสร้างข้อมูลยอดเงินในกระเป๋า
 */
interface WalletBalance {
  usdt: string
  native: string
}

/**
 * Return type for useWalletPoll hook
 * ประเภทข้อมูลที่ถูกส่งกลับจาก hook
 */
interface UseWalletPollReturn {
  balance: WalletBalance
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Auto-polling hook for wallet balance
 * Hook สำหรับดึงข้อมูลยอดเงินในกระเป๋าอัตโนมัติทุก 30 วินาที
 * 
 * Routes through PocketBase (architecture: Frontend → PocketBase → wallet-api → blockchain)
 * 
 * @param walletAddress - Wallet address to query
 * @param intervalMs - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @returns Object with balance, loading state, error, and refresh function
 * 
 * @example
 * ```typescript
 * const { balance, loading, error, refresh } = useWalletPoll(user?.wallet, 30000)
 * ```
 */
export function useWalletPoll(
  walletAddress: string | undefined,
  intervalMs: number = 30000 // 30 seconds per D-11
): UseWalletPollReturn {
  const [balance, setBalance] = useState<WalletBalance>({ usdt: '0', native: '0' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollInterval, setPollInterval] = useState(intervalMs)
  const [errorCount, setErrorCount] = useState(0)

  /**
   * Fetch wallet balance from PocketBase hook (routes to wallet-api internally)
   * ดึงข้อมูลยอดเงินจาก PocketBase hook (ส่งต่อไปยัง wallet-api ภายใน)
   */
  const fetchBalance = useCallback(async () => {
    // Guard against undefined, null, empty string, or literal "null" string
    if (!walletAddress || walletAddress === 'null' || walletAddress === 'undefined' || walletAddress === '') {
      // No wallet address, set zero balance
      setBalance({ usdt: '0', native: '0' })
      setError(null)
      setErrorCount(0) // Reset error count when not polling
      return
    }

    // Validate EVM wallet address format (0x + 40 hex chars)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setBalance({ usdt: '0', native: '0' })
      setError(null)
      setErrorCount(0)
      return
    }

    setLoading(true)
    try {
      const pb = createClient()
      const token = pb.authStore.token
      if (!token) {
        throw new Error('Authentication required')
      }

      const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
      const res = await fetch(`${baseUrl}/api/v2/hot-wallet/balance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_address: walletAddress }),
      })

      // Handle 4xx errors gracefully — wallet may not exist yet
      if (res.status >= 400 && res.status < 500) {
        setBalance({ usdt: '0', native: '0' })
        setError(null)
        setErrorCount(0)
        setPollInterval(intervalMs)
        return
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch balance: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      if (data.success && data.data) {
        setBalance({
          usdt: String(data.data.usdt_balance ?? data.data.withdrawable ?? '0'),
          native: '0'
        })
      }
      setError(null)
      setErrorCount(0) // Reset error count on success 
      setPollInterval(intervalMs) // Reset to normal interval 
    } catch (err: any) {
      // Handle error
      setError(err.message || 'Unknown error occurred')
      
      // Exponential backoff: 30s → 60s → 120s → 5min (max)
      const newErrorCount = errorCount + 1
      setErrorCount(newErrorCount)
      const backoffInterval = Math.min(30000 * Math.pow(2, newErrorCount), 300000)
      setPollInterval(backoffInterval)
    } finally {
      setLoading(false)
    }
  }, [walletAddress, errorCount, intervalMs])

  useEffect(() => {
    // Initial fetch
    fetchBalance()

    // Poll every pollInterval (with exponential backoff on errors)
    const pollIntervalId = setInterval(fetchBalance, pollInterval)

    // Cleanup on unmount
    return () => {
      clearInterval(pollIntervalId)
    }
  }, [fetchBalance, pollInterval])

  return { balance, loading, error, refresh: fetchBalance }
}
