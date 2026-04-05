"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { useWalletPoll } from '@/hooks/use-wallet-poll'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { BuddyChain } from '@/components/dashboard/buddy-chain'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { ActiveEggsCard } from '@/components/dashboard/active-eggs-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
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
  const [referralLevels, setReferralLevels] = useState<Array<{ level: number; count: number; percentage: number; commissionRate: number }>>([])
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

      // Calculate referral levels from commission records
      // Group commissions by referrer level (G1-G4)
      const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
      commissionsData.items.forEach((record: any) => {
        const level = record.level // Assuming commission_records has a 'level' field (1-4)
        if (level >= 1 && level <= 4) {
          levelCounts[level]++
        }
      })

      // Target: 50 buddies per level for percentage calculation
      const TARGET_BUDDIES = 50
      const levels = [1, 2, 3, 4].map((lvl) => ({
        level: lvl,
        count: levelCounts[lvl],
        percentage: (levelCounts[lvl] / TARGET_BUDDIES) * 100,
        commissionRate: lvl === 1 ? 0.20 : 0.10,
      }))

      setReferralLevels(levels)
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
                  <span className="material-symbols-outlined text-4xl text-primary">account_balance_wallet</span>
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

            {/* Buddy Chain Referral Visualization */}
            <BuddyChain levels={referralLevels} loading={loading} />

            {/* Quick Actions and Activity Feed - Jules layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Left column: QuickActions (xl:col-span-4) */}
              <div className="xl:col-span-4">
                <QuickActions />
              </div>
              
              {/* Right column: ActivityFeed (xl:col-span-8) */}
              <div className="xl:col-span-8">
                <ActivityFeed userId={user?.id} />
              </div>
            </div>

            {/* Active Eggs Card with stats */}
            <ActiveEggsCard count={stats.totalEggs} />

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
