'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/pocketbase/client'

interface Transaction {
  id: string
  type: 'mint' | 'feed' | 'check-in' | 'deposit' | 'withdrawal'
  amount: string
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: string
  tx_hash?: string
  description: string
}

interface UseTransactionHistoryReturn {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook to fetch user's transaction history
 * Hook สำหรับดึงประวัติธุรกรรมของผู้ใช้
 */
export function useTransactionHistory(userId: string | undefined, limit: number = 10): UseTransactionHistoryReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const pb = createClient()
      
      // Fetch from transactions collection (or derive from multiple sources)
      const records = await pb.collection('transactions').getList(1, limit, {
        filter: `user = "${userId}"`,
        sort: '-created',
      })

      const mappedTransactions: Transaction[] = records.items.map((record: any) => ({
        id: record.id,
        type: record.type || 'mint',
        amount: record.amount || '0',
        status: record.status || 'pending',
        timestamp: record.created,
        tx_hash: record.tx_hash,
        description: record.description || `${record.type} transaction`,
      }))

      setTransactions(mappedTransactions)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      // Don't error if collection doesn't exist yet
      setTransactions([])
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    loading,
    error,
    refresh: fetchTransactions,
  }
}

export default useTransactionHistory
