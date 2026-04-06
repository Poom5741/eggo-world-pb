"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { useWalletPoll } from '@/hooks/use-wallet-poll'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { BuddyChain } from '@/components/dashboard/buddy-chain'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import LayoutWrapper from '@/components/LayoutWrapper'
import { isAutoCancelError, isNotFound } from '@/lib/pocketbase/error-handling'

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
  const { balance, loading: balanceLoading, refresh: refreshBalance } = useWalletPoll(user?.wallet || '')

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
      if (currentUser?.id) {
        fetchDashboardData(currentUser)
      }
    } else {
      console.log('Not authenticated, redirecting to /auth/login')
      router.push('/auth/login')
    }

    pb.authStore.onChange(() => {
      console.log('Dashboard authStore changed')
      const updatedUser = getUser()
      if (isAuthenticated() && updatedUser?.id) {
        setUser(updatedUser)
        fetchDashboardData(updatedUser)
      } else {
        setUser(null)
        router.push('/auth/login')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchDashboardData = async (currentUser: any) => {
    if (!currentUser?.id) {
      console.error('Cannot fetch dashboard data: user ID is missing')
      setLoading(false)
      return
    }
    
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
    } catch (err: any) {
      // Suppress auto-cancel errors (normal during navigation)
      if (isAutoCancelError(err)) {
        return
      }
      // Handle 404 errors gracefully - show empty state
      if (isNotFound(err)) {
        // Set default empty state
        setProfile(null)
        setStats({ totalEggs: 0, totalFood: 0, totalCommissions: 0 })
        setReferralLevels([1, 2, 3, 4].map(lvl => ({ level: lvl, count: 0, percentage: 0, commissionRate: lvl === 1 ? 0.20 : 0.10 })))
        return
      }
      // Log other errors
      console.error('Failed to fetch dashboard data:', err.message || err)
    } finally {
      setLoading(false)
    }
  }

  // Refresh function kept for future use (manual refresh button can be re-added)
  const _handleRefresh = async () => {
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

  const usdtBalance = parseFloat(balance?.usdt || '0')
  const _usdtTotalEarned = parseFloat(profile?.usdt_total_earned || '0')
  const totalReferralEarnings = stats.totalCommissions

  return (
    <LayoutWrapper>
      {/* Header per Jules design */}
      <header className="flex justify-between items-center mb-10 px-2 lg:px-0">
        <div>
          <h2 className="pixel-font text-3xl lg:text-4xl text-on-surface-variant">Dashboard</h2>
          <p className="text-on-surface-variant/60 font-medium">Welcome back, {user?.name || 'User'} #{user?.id?.substring(0, 8)}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="hidden md:flex items-center space-x-2 px-6 py-3 bg-surface-container-high rounded-full font-bold text-primary hover:scale-105 transition-transform clay-card">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span>{user?.wallet ? `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}` : 'Connect Wallet'}</span>
          </button>
          <div className="w-12 h-12 rounded-full bg-secondary-container clay-card flex items-center justify-center overflow-hidden">
            {user?.picture ? (
              <img 
                className="w-full h-full object-cover" 
                src={user.picture} 
                alt="Avatar"
              />
            ) : (
              <span className="material-symbols-outlined text-on-secondary-container">person</span>
            )}
          </div>
        </div>
      </header>

      {/* Top 3-Card Grid per Jules design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Balance */}
        <div className="bg-surface-container-lowest p-8 rounded-xl clay-card relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform">
            <span className="material-symbols-outlined text-5xl text-primary">payments</span>
          </div>
          <p className="text-sm font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">Balance</p>
          <h3 className="pixel-font text-4xl text-primary">
            {balanceLoading ? '...' : usdtBalance.toFixed(2)}
          </h3>
          <p className="text-xs font-bold text-tertiary flex items-center mt-2">
            <span className="material-symbols-outlined text-sm mr-1">trending_up</span> 
            {balanceLoading ? 'Updating...' : 'USDT'}
          </p>
        </div>

        {/* Card 2: Active Eggs */}
        <div className="bg-surface-container-lowest p-8 rounded-xl clay-card relative group overflow-hidden border-t-8 border-primary-container">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-5xl text-primary">egg</span>
          </div>
          <p className="text-sm font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">Active Eggs</p>
          <h3 className="pixel-font text-4xl text-primary">{stats.totalEggs}</h3>
          <div className="flex mt-4 -space-x-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className={`
                  w-8 h-8 rounded-full bg-primary-container border-2 border-white
                  flex items-center justify-center
                `}
              >
                <span className="material-symbols-outlined text-xs">egg</span>
              </div>
            ))}
            {stats.totalEggs > 3 && (
              <div className="w-8 h-8 rounded-full bg-surface-container border-2 border-white flex items-center justify-center text-[10px] font-bold">
                +{stats.totalEggs - 3}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Referral Earnings */}
        <div className="bg-surface-container-lowest p-8 rounded-xl clay-card relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:-translate-y-2 transition-transform">
            <span className="material-symbols-outlined text-5xl text-secondary">groups</span>
          </div>
          <p className="text-sm font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">Referral Earnings</p>
          <h3 className="pixel-font text-4xl text-secondary">{totalReferralEarnings.toFixed(2)}</h3>
          <p className="text-xs font-bold text-on-surface-variant/60 mt-2">
            {referralLevels.reduce((sum, lvl) => sum + lvl.count, 0)} active buddies
          </p>
        </div>
      </div>

      {/* Split Section: Quick Actions + Buddy Chain */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
        {/* Left: Quick Actions (4 cols) */}
        <div className="xl:col-span-4 flex flex-col space-y-4">
          <h4 className="pixel-font text-xl px-2">Quick Actions</h4>
          <QuickActions />
        </div>

        {/* Right: Buddy Chain (8 cols) */}
        <div className="xl:col-span-8 bg-surface-container-lowest p-8 rounded-xl clay-card">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h4 className="pixel-font text-xl">Buddy Chain</h4>
              <p className="text-sm text-on-surface-variant/60 font-medium">4-Level Growth Insights</p>
            </div>
            <button className="text-primary font-bold text-sm flex items-center">
              Invite more <span className="material-symbols-outlined ml-1">add_circle</span>
            </button>
          </div>
          <BuddyChain levels={referralLevels} loading={loading} />
        </div>
      </div>

      {/* Bottom: Recent Activity (full width) */}
      <div className="bg-surface-container-lowest p-8 rounded-xl clay-card">
        <div className="flex justify-between items-center mb-6">
          <h4 className="pixel-font text-xl">Recent Activity</h4>
          <button className="text-xs font-bold text-primary-dim py-2 px-4 bg-primary-container/30 rounded-full hover:bg-primary-container/50 transition-colors">
            View All History
          </button>
        </div>
        <ActivityFeed userId={user?.id} />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="pixel-font text-on-surface-variant">LOADING DASHBOARD...</p>
        </div>
      )}
    </LayoutWrapper>
  )
}
