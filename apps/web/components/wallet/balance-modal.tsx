'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useTransactionHistory } from '@/hooks/use-transaction-history'

interface BalanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  balance?: {
    usdt: string
    pending: string
    nftValue: string
  }
}

/**
 * BalanceModal - Shows balance breakdown and transaction history
 * Modal แสดงยอดเงินและประวัติธุรกรรม
 */
export function BalanceModal({ open, onOpenChange, userId, balance }: BalanceModalProps) {
  const { transactions, loading } = useTransactionHistory(userId, 10)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'mint': return 'add_circle'
      case 'feed': return 'restaurant'
      case 'check-in': return 'emoji_events'
      case 'deposit': return 'account_balance_wallet'
      case 'withdrawal': return 'output'
      default: return 'receipt'
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'mint': return 'text-primary'
      case 'feed': return 'text-secondary'
      case 'check-in': return 'text-warning'
      case 'deposit': return 'text-green-500'
      case 'withdrawal': return 'text-error'
      default: return 'text-on-surface'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="clay" className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            Wallet Balance
          </DialogTitle>
        </DialogHeader>

        {/* Balance Breakdown */}
        <div className="space-y-3 py-4">
          <div className="bg-surface-container rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">USDT Balance</span>
              <span className="font-bold text-on-surface">{balance?.usdt || '0.00'} USDT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Pending Deposits</span>
              <Badge variant="clay" className="bg-warning/20 text-warning">
                {balance?.pending || '0.00'} USDT
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">NFT Value</span>
              <span className="font-bold text-on-surface">{balance?.nftValue || '0.00'} USDT</span>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined">history</span>
              Recent Transactions
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface-container rounded-lg p-3 animate-pulse">
                    <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-surface-container rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${getTransactionColor(tx.type)}`}>
                        {getTransactionIcon(tx.type)}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-on-surface capitalize">
                          {tx.type}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {formatTimestamp(tx.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-on-surface">
                        {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount} USDT
                      </p>
                      <Badge
                        variant="clay"
                        className={`text-xs ${
                          tx.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-500'
                            : tx.status === 'pending'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-error/20 text-error'
                        }`}
                      >
                        {tx.status}
                      </Badge>
                      {tx.tx_hash && (
                        <a
                          href={`https://bscscan.com/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline block mt-1"
                        >
                          View on BSCScan
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BalanceModal
