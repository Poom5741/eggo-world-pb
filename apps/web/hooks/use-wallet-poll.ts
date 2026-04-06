import { useState, useEffect, useCallback } from 'react'

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

  /**
   * Fetch wallet balance from Wallet API
   * ดึงข้อมูลยอดเงินจาก Wallet API
   */
  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      // No wallet address, set zero balance
      setBalance({ usdt: '0', native: '0' })
      return
    }

    setLoading(true)
    try {
      // Fetch from Wallet API endpoint
      const res = await fetch('http://localhost:3001/api/v1/wallet/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_address: walletAddress })
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch balance: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      if (data.success && data.data) {
        setBalance({
          usdt: data.data.usdt_balance || '0',
          native: data.data.native_balance || '0'
        })
      }
      setError(null)
    } catch (err: any) {
      // Handle error
      setError(err.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    // Initial fetch
    fetchBalance()

    // Poll every intervalMs (per D-11: 30 seconds)
    const pollInterval = setInterval(fetchBalance, intervalMs)

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval)
    }
  }, [fetchBalance, intervalMs])

  return { balance, loading, error, refresh: fetchBalance }
}
