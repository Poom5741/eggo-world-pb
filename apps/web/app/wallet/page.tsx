"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useWalletPoll } from '@/hooks/use-wallet-poll'
import { cn } from '@/lib/utils'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { WithdrawForm } from '@/components/WithdrawForm'
import { TransactionHistory } from '@/components/TransactionHistory'
import { Loader2, RefreshCw, Wallet as WalletIcon, AlertCircle } from 'lucide-react'

export default function WalletPage() {
  return (
    <AuthGuard redirectTo="/auth/login">
      {(user) => <WalletContent user={user} />}
    </AuthGuard>
  )
}

function WalletContent({ user }: { user: any }) {
  // Get wallet balance with auto-polling
  const { balance, loading, error, refresh } = useWalletPoll(user?.wallet_address || user?.wallet || '')

  // Track initial load completion — differentiates initial fetch from background polls
  // Prevents skeleton flashing on every 30s poll (Pitfall 1)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  useEffect(() => {
    if (!loading && !initialLoadComplete) {
      // Use requestAnimationFrame to ensure CSS transition triggers properly
      // Prevents fade-in not triggering on first load (Pitfall 2)
      requestAnimationFrame(() => setInitialLoadComplete(true))
    }
  }, [loading, initialLoadComplete])

  // === Initial Loading State: Skeleton Card (per D-01) ===
  if (!initialLoadComplete && loading) {
    return (
      <LayoutWithoutNav>
        <div className="space-y-6">
          {/* Page Header — identical to loaded state */}
          <div className="space-y-2">
            <h1 className="font-[var(--font-pixel)] text-2xl md:text-3xl text-foreground flex items-center gap-3">
              <WalletIcon className="w-8 h-8 text-primary" />
              MY WALLET
            </h1>
            <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
              Manage your USDT balance and withdrawals
            </p>
          </div>

          {/* Skeleton Card — matches exact layout of real balance card per UI-SPEC spacing scale */}
          <Card variant="clay-xl" className={cn(
            'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent',
            'shadow-clay-2xl'
          )}>
            <CardHeader>
              <Skeleton className="h-4 w-32 mb-2" />  {/* USDT BALANCE title area */}
              <Skeleton className="h-3 w-48" />        {/* description line */}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-10 w-64" />     {/* balance number area */}
                <Skeleton className="h-3 w-24" />      {/* USD line */}
              </div>
              <Skeleton className="h-12 w-32 rounded-clay-md" /> {/* Sync button area */}
            </CardContent>
          </Card>

          <WithdrawForm balance="0" />
          <TransactionHistory userId={user.id} />
        </div>
      </LayoutWithoutNav>
    )
  }

  // === Loaded or Error State: Real Content with Fade-In ===
  return (
    <LayoutWithoutNav>
      <div className="animate-fade-in duration-500">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="font-[var(--font-pixel)] text-2xl md:text-3xl text-foreground flex items-center gap-3">
              <WalletIcon className="w-8 h-8 text-primary" />
              MY WALLET
            </h1>
            <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
              Manage your USDT balance and withdrawals
            </p>
          </div>

          {/* Balance Card - Clay XL variant with maximum depth */}
          <Card variant="clay-xl" className={cn(
            'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent',
            'shadow-clay-2xl'
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
                  USDT BALANCE
                </CardTitle>
                {/* "Updating..." badge — only during background polls (D-03) */}
                {initialLoadComplete && loading && balance.usdt !== '0' && (
                  <Badge variant="secondary" className="animate-pulse">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Updating...
                  </Badge>
                )}
              </div>
              <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                Real-time balance updated every 30 seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Balance Display */}
              <div className="space-y-2">
                <div className="text-4xl font-bold font-[var(--font-pixel)] text-primary">
                  {parseFloat(balance.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </div>
                <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  ≈ ${(parseFloat(balance.usdt) * 1.00).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
              </div>

              {/* Error State — inline within card (above sync button) */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-[var(--font-pixel)] text-xs">
                    Failed to load balance
                  </AlertTitle>
                  <AlertDescription className="font-[var(--font-pixel)] text-xs">
                    The wallet service may be temporarily unavailable.{' '}
                    <Button
                      variant="link"
                      onClick={refresh}
                      className="p-0 h-auto font-[var(--font-pixel)] text-xs"
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Sync Button */}
              <Button
                variant="clay"
                size="clay-md"
                onClick={refresh}
                disabled={loading}
                className="font-[var(--font-pixel)] text-xs"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                {loading ? 'Syncing...' : 'Sync Wallet'}
              </Button>
            </CardContent>
          </Card>

          {/* Withdraw Section */}
          <WithdrawForm balance={balance.usdt} />

          {/* Transaction History */}
          <TransactionHistory userId={user.id} />
        </div>
      </div>
    </LayoutWithoutNav>
  )
}
