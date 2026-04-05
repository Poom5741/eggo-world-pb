"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { useWalletPoll } from '@/hooks/use-wallet-poll'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Egg, Coins, TrendingUp, Wallet, RefreshCw, Flame } from 'lucide-react'
import { Header } from '@/components/header'

export default function DashboardPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalEggs: 0,
    totalCommissions: 0,
    totalFood: 0
  })
  const [loading, setLoading] = useState(true)

  // Auto-polling for wallet balance (per D-11: 30 seconds)
  const { balance, loading: balanceLoading, refresh: refreshBalance } = useWalletPoll(user?.wallet)

  useEffect(() => {
    setIsHydrated(true)
    
    const pb = createClient()
    
    console.log('=== Dashboard auth check ===')
    console.log('isAuthenticated:', isAuthenticated())
    console.log('getUser:', getUser())
    console.log('authStore.isValid:', pb.authStore.isValid)
    console.log('authStore.record:', pb.authStore.record)
    console.log('authStore.token:', pb.authStore.token ? 'present' : 'missing')
    
    if (isAuthenticated()) {
      const currentUser = getUser()
      console.log('User authenticated:', currentUser?.id)
      setUser(currentUser)
      fetchDashboardData(currentUser)
    } else {
      console.log('Not authenticated, redirecting to /auth/login')
      router.push('/auth/login')
    }

    pb.authStore.onChange(() => {
      console.log('Dashboard authStore changed')
      if (isAuthenticated()) {
        setUser(getUser())
      } else {
        setUser(null)
        router.push('/auth/login')
      }
    })
  }, [router])

  const fetchDashboardData = async (currentUser: any) => {
    const pb = createClient()
    try {
      const [profileData, eggsData, commissionsData] = await Promise.all([
        pb.collection('users').getOne(currentUser.id),
        pb.collection('egg_nfts').getList(1, 1, { filter: `owner = "${currentUser.id}"` }),
        pb.collection('commission_records').getList(1, 100, { filter: `user = "${currentUser.id}"` })
      ])

      setProfile(profileData)
      
      const totalEggs = eggsData.totalItems
      const totalFood = eggsData.items.reduce((sum: number, egg: any) => sum + (egg.food_count || 0), 0)
      const totalCommissions = commissionsData.items
        .filter((c: any) => !c.claimed)
        .reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0)

      setStats({
        totalEggs,
        totalFood,
        totalCommissions
      })
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (user) {
      await Promise.all([
        refreshBalance(),
        fetchDashboardData(user)
      ])
    }
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const usdtTotalEarned = parseFloat(profile?.usdt_total_earned || '0')

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="font-[var(--font-pixel)] text-2xl md:text-3xl text-foreground flex items-center gap-3">
                  <Wallet className="w-8 h-8 text-primary" />
                  DASHBOARD
                </h1>
                <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  WELCOME TO THE EGGOVERSE
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || balanceLoading}
                className="font-[var(--font-pixel)] text-xs"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading || balanceLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Balance Summary Card - Using BalanceCard component */}
            <BalanceCard 
              balance={balance}
              loading={balanceLoading}
              error={null}
              refresh={refreshBalance}
            />

            {/* Stats Grid - Clay widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-clay-xl">
              <Card variant="clay" className="shadow-clay-lg">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    TOTAL EGGS
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-2xl text-foreground">
                    {stats.totalEggs}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Egg className="w-3 h-3 mr-1" />
                    NFTs owned
                  </div>
                </CardContent>
              </Card>

              <Card variant="clay" className="shadow-clay-lg">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    FOOD NFTs
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-2xl text-accent">
                    {stats.totalFood}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 mr-1" />
                    Bonus from eggs
                  </div>
                </CardContent>
              </Card>

              <Card variant="clay" className="shadow-clay-lg">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    PENDING COMMISSIONS
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-2xl text-primary">
                    {stats.totalCommissions.toFixed(2)} USDT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Coins className="w-3 h-3 mr-1" />
                    Ready to claim
                  </div>
                </CardContent>
              </Card>

              <Card variant="clay" className="shadow-clay-lg">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    TOTAL EARNED
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-2xl text-foreground">
                    {usdtTotalEarned.toFixed(2)} USDT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    All time earnings
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions - Clay container */}
            <Card variant="clay-lg" className="shadow-clay-xl">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
                  QUICK ACTIONS
                </CardTitle>
                <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  Jump into the action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => router.push('/mint')}
                    variant="clay"
                    size="clay-md"
                    className="w-full"
                  >
                    <Egg className="w-4 h-4 mr-2" />
                    MINT EGG
                  </Button>
                  <Button
                    onClick={() => router.push('/mint/food')}
                    variant="clay"
                    size="clay-md"
                    className="w-full"
                  >
                    <Flame className="w-4 h-4 mr-2" />
                    BUY FOOD
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard/eggs')}
                    variant="clay"
                    size="clay-md"
                    className="w-full"
                  >
                    <Egg className="w-4 h-4 mr-2" />
                    MY EGGS
                  </Button>
                  <Button
                    onClick={() => router.push('/wallet')}
                    variant="clay"
                    size="clay-md"
                    className="w-full"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    WALLET
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <p className="font-[var(--font-pixel)] text-foreground">LOADING DASHBOARD...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
