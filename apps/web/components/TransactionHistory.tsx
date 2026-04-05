"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/pocketbase/client'
import { isAutoCancelError, isNotFound } from '@/lib/pocketbase/error-handling'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

interface Transaction {
  id: string
  type: string // mint_egg, mint_food, buy_nft, sell_nft, commission, withdraw
  amount_usdt: number
  status: string // confirmed, pending
  created: string
  tx_hash?: string
}

interface TransactionHistoryProps {
  userId: string
}

/**
 * Transaction history component
 * แสดงประวัติการทำรายการต่างๆ
 */
export function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const pb = createClient()
        const result = await pb.collection('transactions').getList(1, 10, {
          filter: `user.id = "${userId}"`,
          sort: '-created'
        })
        setTransactions(result.items as Transaction[])
      } catch (error: any) {
        // Suppress auto-cancel errors
        if (isAutoCancelError(error)) {
          return
        }
        // Handle 404 errors gracefully
        if (isNotFound(error)) {
          setTransactions([])
          return
        }
        // Log other errors
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [userId])

  /**
   * Get human-readable label for transaction type
   * แปลงประเภทการทำรายการเป็นข้อความที่อ่านง่าย
   */
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mint_egg: 'Mint Egg',
      mint_food: 'Mint Food',
      buy_nft: 'Purchase',
      sell_nft: 'Sale',
      commission: 'Commission',
      withdraw: 'Withdrawal'
    }
    return labels[type] || type
  }

  /**
   * Get badge variant for status
   * กำหนดสีของ badge ตามสถานะ
   */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary'> = {
      confirmed: 'default',
      pending: 'secondary'
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="font-[var(--font-pixel)] text-xs">
        {status}
      </Badge>
    )
  }

  /**
   * Format TX hash for display
   * ตัด hash ให้สั้นลงสำหรับแสดงผล
   */
  const formatTxHash = (hash: string) => {
    if (!hash) return '-'
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  if (loading) {
    return (
      <Card className="border-4 border-primary/50 bg-card">
        <CardHeader>
          <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
            TRANSACTION HISTORY
          </CardTitle>
          <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
            Loading transactions...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-[var(--font-pixel)] text-xs text-muted-foreground text-center py-8">
            LOADING...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="clay-lg" className="border-4 border-primary/50 bg-card shadow-clay-xl">
      <CardHeader>
        <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
          TRANSACTION HISTORY
        </CardTitle>
        <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
          Last 10 transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="font-[var(--font-pixel)] text-xs text-muted-foreground text-center py-8">
            No transactions yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:shadow-clay-sm">
                  <TableHead className="font-[var(--font-pixel)] text-xs">Date</TableHead>
                  <TableHead className="font-[var(--font-pixel)] text-xs">Type</TableHead>
                  <TableHead className="font-[var(--font-pixel)] text-xs">Amount</TableHead>
                  <TableHead className="font-[var(--font-pixel)] text-xs">Status</TableHead>
                  <TableHead className="font-[var(--font-pixel)] text-xs">TX Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:shadow-clay-sm">
                    <TableCell className="font-[var(--font-pixel)] text-xs">
                      {new Date(tx.created).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-[var(--font-pixel)] text-xs">
                      {getTypeLabel(tx.type)}
                    </TableCell>
                    <TableCell className="font-[var(--font-pixel)] text-xs font-medium">
                      {tx.type === 'commission' || tx.type === 'sell_nft' ? '+' : ''}
                      {tx.amount_usdt} USDT
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tx.status)}
                    </TableCell>
                    <TableCell className="font-[var(--font-pixel)] text-xs">
                      {tx.tx_hash ? (
                        <a
                          href={`https://bscscan.com/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline inline-flex items-center gap-1"
                        >
                          {formatTxHash(tx.tx_hash)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
