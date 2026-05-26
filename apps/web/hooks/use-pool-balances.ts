'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useMetaMask } from './use-metamask'

interface PoolBalanceResponse {
  wei: string
  usdt: string
}

interface PoolBalancesData {
  treasury: PoolBalanceResponse
  coinstor: PoolBalanceResponse
}

interface FormattedBalances {
  total: string
  treasury: string
  coinstor: string
}

interface UsePoolBalancesReturn {
  balances: FormattedBalances | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  autoRefreshAfterWithdrawal: () => Promise<void>
}

/**
 * Format USDT balance as currency with dollar sign, thousands separators, and 2 decimal places
 * per D-18: "$1,234.56 USDT"
 */
function formatUSDT(balance: string): string {
  const amount = parseFloat(balance)
  if (isNaN(amount)) return '$0.00 USDT'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' USDT'
}

/**
 * usePoolBalances - Custom React hook for fetching pool balance data
 *
 * Fetches from Phase 64 endpoint: GET /api/v2/admin/pool-balances
 * Returns formatted balances per D-18: "$1,234.56 USDT"
 * Handles loading states per D-19: skeleton during fetch
 * Handles errors per D-30: shows alert but keeps previous data visible
 * Auto-refresh per D-28: exposes autoRefreshAfterWithdrawal function
 *
 * @example
 * ```tsx
 * const { balances, loading, error, refetch, autoRefreshAfterWithdrawal } = usePoolBalances()
 * ```
 */
export function usePoolBalances(): UsePoolBalancesReturn {
  const { address, isConnected, chainId } = useMetaMask()
  const [balances, setBalances] = useState<FormattedBalances | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  // Determine target chain based on environment
  const targetChainId = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 7117 // Testnet for local dev
    : 56    // Mainnet for production

  /**
   * Fetch pool balances from Phase 64 endpoint
   */
  const fetchBalances = useCallback(async () => {
    // Skip fetch if not connected or wrong chain
    if (!isConnected || !address || chainId !== targetChainId) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090'
      const response = await fetch(
        `${pbUrl}/api/v2/admin/pool-balances?wallet=${encodeURIComponent(address)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch pool balances')
      }

      const poolData: PoolBalancesData = data.data

      // Calculate total = treasury + coinstor
      const treasuryUSDT = parseFloat(poolData.treasury.usdt)
      const coinstorUSDT = parseFloat(poolData.coinstor.usdt)
      const totalUSDT = treasuryUSDT + coinstorUSDT

      // Format all balances per D-18
      const formattedBalances: FormattedBalances = {
        total: formatUSDT(totalUSDT.toString()),
        treasury: formatUSDT(poolData.treasury.usdt),
        coinstor: formatUSDT(poolData.coinstor.usdt),
      }

      if (mountedRef.current) {
        setBalances(formattedBalances)
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        // Keep previous balance data visible per D-30
        console.error('Failed to fetch pool balances:', errorMessage)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [address, isConnected, chainId, targetChainId])

  /**
   * Manual refresh function per D-28
   */
  const refetch = useCallback(async () => {
    await fetchBalances()
  }, [fetchBalances])

  /**
   * Auto-refresh after successful withdrawal per D-28
   */
  const autoRefreshAfterWithdrawal = useCallback(async () => {
    await fetchBalances()
  }, [fetchBalances])

  // Initial fetch when wallet connects
  useEffect(() => {
    if (isConnected && address && chainId === targetChainId) {
      fetchBalances()
    } else {
      // Clear balances if not connected
      setBalances(null)
      setError(null)
    }

    return () => {
      mountedRef.current = false
    }
  }, [isConnected, address, chainId, targetChainId, fetchBalances])

  return {
    balances,
    loading,
    error,
    refetch,
    autoRefreshAfterWithdrawal,
  }
}