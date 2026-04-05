"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/pocketbase/client'

/**
 * Transaction data structure per D-25
 * โครงสร้างข้อมูลธุรกรรมตาม D-25
 */
interface Transaction {
  id: string
  type: 'hatch' | 'mint_egg' | 'mint_food' | 'commission' | 'sale'
  title: string
  timestamp: string
  amount: number
  icon: string // Material Symbols name
  color: 'primary' | 'secondary' | 'tertiary'
}

/**
 * ActivityFeed Component Props
 * Props สำหรับ component ActivityFeed
 */
interface ActivityFeedProps {
  /** Array of transactions to display */
  transactions?: Transaction[]
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string | null
  /** User ID for fetching transactions */
  userId?: string
}

/**
 * Transaction type mapping per D-25
 * การจับคู่ประเภทธุรกรรมตาม D-25
 */
const TRANSACTION_TYPE_MAP: Record<string, { icon: string; color: string; titlePrefix: string }> = {
  hatch: { icon: 'egg_alt', color: 'tertiary', titlePrefix: 'Hatched Egg' },
  mint_egg: { icon: 'egg', color: 'secondary', titlePrefix: 'Minted Egg' },
  mint_food: { icon: 'shopping_cart', color: 'secondary', titlePrefix: 'Bought Food' },
  commission: { icon: 'group', color: 'primary', titlePrefix: 'Referral Commission' },
  sale: { icon: 'payments', color: 'tertiary', titlePrefix: 'NFT Sale' }
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * แปลง timestamp เป็นเวลาสัมพัทธ์
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * ActivityFeed Component
 * ฟีดแสดงกิจกรรมล่าสุดของผู้ใช้
 * 
 * Features per Jules design:
 * - Shows last 10 transactions from PocketBase
 * - Transaction categorization per D-25
 * - Colored circular icons (primary, secondary, tertiary)
 * - Slide animation on hover (hover:translate-x-2) per D-12
 * - "View All History" button in header per D-15
 * - Card structure: icon circle (left), title + timestamp (center), amount (right)
 * - No Card wrapper - returns inline content for embedding
 * 
 * @example
 * ```tsx
 * <ActivityFeed userId={user.id} />
 * ```
 */
export function ActivityFeed({ transactions: propTransactions, loading: propLoading, error: propError, userId }: ActivityFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch transactions from PocketBase
  useEffect(() => {
    if (!userId) return

    const fetchTransactions = async () => {
      setLoading(true)
      try {
        const pb = createClient()
        
        // Query transactions collection (last 10 records)
        // ดึงข้อมูลธุรกรรม 10 รายการล่าสุด
        const response = await pb.collection('transactions').getList(1, 10, {
          filter: `user = "${userId}"`,
          sort: '-created'
        })

        // Map to Transaction interface
        const mappedTransactions: Transaction[] = response.items.map((item: any) => {
          const typeMapping = TRANSACTION_TYPE_MAP[item.type] || { 
            icon: 'info', 
            color: 'primary', 
            titlePrefix: 'Transaction' 
          }

          return {
            id: item.id,
            type: item.type as Transaction['type'],
            title: `${typeMapping.titlePrefix} #${item.id?.substring(0, 8) || 'Unknown'}`,
            timestamp: item.created,
            amount: parseFloat(item.amount || '0'),
            icon: typeMapping.icon,
            color: typeMapping.color as Transaction['color']
          }
        })

        setTransactions(mappedTransactions)
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch transactions:', err)
        setError(err.message || 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [userId])

  // Use prop transactions if provided, otherwise use fetched data
  const displayTransactions = propTransactions !== undefined ? propTransactions : transactions
  const displayLoading = propLoading !== undefined ? propLoading : loading
  const displayError = propError !== undefined ? propError : error

  return (
    <div className="space-y-4">
      {displayLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="pixel-font text-sm text-on-surface-variant/60">
            Loading transactions...
          </p>
        </div>
      ) : displayError ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-destructive">{displayError}</p>
        </div>
      ) : displayTransactions.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="pixel-font text-sm text-on-surface-variant/60">
            No transactions yet
          </p>
        </div>
      ) : (
        displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className={`
              flex items-center justify-between p-4 rounded-2xl
              bg-surface-container-low
              hover:translate-x-2 transition-transform duration-300
            `}
          >
            {/* Left: Icon circle */}
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                ${transaction.color === 'primary' ? 'bg-primary-container text-on-primary-container' : 
                  transaction.color === 'secondary' ? 'bg-secondary-container text-on-secondary-container' : 
                  'bg-tertiary-container text-on-tertiary-container'}`}>
                <span className="material-symbols-outlined text-lg">{transaction.icon}</span>
              </div>
              
              {/* Center: Title + timestamp */}
              <div>
                <p className="font-bold text-sm">{transaction.title}</p>
                <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase">
                  {formatRelativeTime(transaction.timestamp)}
                </p>
              </div>
            </div>
            
            {/* Right: Amount */}
            <div className="text-right">
              <p className={`font-bold ${transaction.amount >= 0 ? 'text-tertiary' : 'text-error'}`}>
                {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} USDT
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
