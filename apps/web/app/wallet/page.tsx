"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { useWalletPoll } from '@/hooks/use-wallet-poll'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { cn } from '@/lib/utils'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WithdrawForm } from '@/components/WithdrawForm'
import { TransactionHistory } from '@/components/TransactionHistory'
import { Loader2, RefreshCw, Wallet as WalletIcon, AlertCircle } from 'lucide-react'

export default function WalletPage() {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Get wallet balance with auto-polling
  const { balance, loading: polling, error, refresh } = useWalletPoll(user?.wallet_address || user?.wallet || '')

  useEffect(() => {
    const pb = createClient()

    if (isAuthenticated()) {
      const currentUser = getUser()
      setUser(currentUser)
      setLoading(false)
    } else {
      router.push('/auth/login')
    }

    pb.authStore.onChange(() => {
      if (isAuthenticated()) {
        setUser(getUser())
        setLoading(false)
      } else {
        setUser(null)
        router.push('/auth/login')
      }
    })
  }, [router])

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
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
              <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
                USDT BALANCE
              </CardTitle>
              <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                Real-time balance updated every 30 seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Balance Display */}
              <div className="space-y-2">
                <div className="text-4xl font-bold font-[var(--font-pixel)] text-primary">
                  {balance.usdt} USDT
                </div>
                <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  ≈ ${(parseFloat(balance.usdt) * 1.00).toFixed(2)} USD
                </p>
              </div>

              {/* Loading Indicator */}
              {polling && balance.usdt !== '0' && (
                <Badge variant="secondary" className="animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Updating...
                </Badge>
              )}

              {/* Sync Button */}
              <Button
                variant="clay"
                size="clay-md"
                onClick={refresh}
                disabled={polling}
                className="font-[var(--font-pixel)] text-xs"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", polling && "animate-spin")} />
                {polling ? 'Syncing...' : 'Sync Wallet'}
              </Button>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Card className="border-2 border-destructive/50">
              <CardContent className="pt-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-[var(--font-pixel)] text-xs">
                    Failed to load balance.{' '}
                    <Button variant="link" onClick={refresh} className="p-0 h-auto">
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Withdraw Section */}
          <WithdrawForm balance={balance.usdt} />

          {/* Transaction History */}
          <TransactionHistory userId={user.id} />
        </div>
      </main>
    </div>
  )
}
