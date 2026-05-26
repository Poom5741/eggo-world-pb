'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { usePoolBalances } from '@/hooks/use-pool-balances'
import { RefreshCw } from 'lucide-react'

/**
 * PoolBalanceCard - Display USDT pool balances (Treasury + CoinStor + Total)
 *
 * Implements D-17: Total emphasized at top with large font, Treasury/CoinStor below as supporting details
 * Implements D-18: Currency format with $ signs, thousands separators, 2 decimal places
 * Implements D-19: Skeleton during load, Alert with retry on error
 * Implements D-28: Manual refresh button in card header
 * Implements D-29: Skeleton during manual refresh
 * Implements D-30: Error handling keeps previous data visible, refresh button remains enabled
 *
 * @example
 * ```tsx
 * <PoolBalanceCard />
 * ```
 */
export function PoolBalanceCard() {
  const { balances, loading, error, refetch } = usePoolBalances()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pool Balances</CardTitle>
            <CardDescription>
              USDT held in Treasury and CoinStor reserves
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error state per D-30: show error but keep previous data visible */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading state per D-19: Skeleton placeholders during fetch */}
        {loading && !balances ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
        ) : (
          <>
            {/* Balance display per D-17: Total emphasized at top */}
            {balances ? (
              <div className="space-y-6">
                {/* Total Balance - Large emphasized font */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Total Pool Balance</p>
                  <p className="text-3xl font-bold text-primary">
                    {balances.total}
                  </p>
                </div>

                {/* Breakdown: Treasury and CoinStor */}
                <div className="space-y-4 pt-4 border-t">
                  {/* Treasury Balance */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Treasury (46%/6%)</p>
                    <p className="text-xl font-semibold">
                      {balances.treasury}
                    </p>
                  </div>

                  {/* CoinStor Balance */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">CoinStor Reserve (4%)</p>
                    <p className="text-xl font-semibold">
                      {balances.coinstor}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // No data state
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to view pool balances
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}