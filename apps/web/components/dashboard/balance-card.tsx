"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * ค่าคงที่สำหรับ component BalanceCard
 */
const POLLING_INTERVAL = 30000 // 30 seconds per D-11

/**
 * BalanceCard Component Props
 * Props สำหรับ component BalanceCard
 */
interface BalanceCardProps {
  /** USDT balance from wallet */
  balance: {
    usdt: string
    native: string
  }
  /** Loading state from useWalletPoll */
  loading: boolean
  /** Error state from useWalletPoll */
  error: string | null
  /** Refresh function from useWalletPoll */
  refresh: () => Promise<void>
}

/**
 * Dashboard Balance Card with auto-polling
 * การ์ดแสดงยอดเงินใน Dashboard พร้อม auto-polling ทุก 30 วินาที
 * 
 * Features:
 * - Gradient background (from-primary/20 via-primary/10 to-transparent)
 * - Material Symbols icon (payments)
 * - "Updating..." badge with pulse animation
 * - Error state with retry button
 * - Claymorphism styling (clay-xl variant)
 */
export function BalanceCard({ balance, loading, error, refresh }: BalanceCardProps) {
  // Parse balance value - handle empty state gracefully
  const usdtBalance = parseFloat(balance?.usdt || '0')

  return (
    <Card 
      variant="clay-xl" 
      className={cn(
        'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent',
        'shadow-clay-2xl'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            {/* Material Symbols icon - payments */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                USDT BALANCE
              </CardDescription>
            </div>
          </div>
          
          {/* "Updating..." badge with pulse animation - shows when loading */}
          {loading && (
            <Badge variant="secondary" className="animate-pulse">
              Updating...
            </Badge>
          )}
        </div>
        
        {/* Balance display - 2 decimal places */}
        <CardTitle className="font-[var(--font-pixel)] text-4xl text-primary">
          {usdtBalance.toFixed(2)} USDT
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Error state - show message and retry button */}
        {error ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive font-[var(--font-pixel)]">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="font-[var(--font-pixel)] text-xs"
            >
              Retry
            </Button>
          </div>
        ) : (
          /* Success state - show available balance info */
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="material-symbols-outlined mr-1 text-sm">account_balance_wallet</span>
            Available for minting and purchases
          </div>
        )}
      </CardContent>
    </Card>
  )
}
