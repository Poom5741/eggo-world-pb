"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { createClient, getUser, restoreAuth } from '@/lib/pocketbase/client'
import { useWalletPoll } from '@/hooks/use-wallet-poll'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { BuddyChain } from '@/components/dashboard/buddy-chain'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { isAutoCancelError, isNotFound } from '@/lib/pocketbase/error-handling'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ReferralLinkCard } from '@/components/dashboard/referral-link-card'
import { TierSection } from '@/components/dashboard/tier-section'
import dynamic from 'next/dynamic'

// Dynamically import the onboarding tutorial to avoid SSR issues and reduce initial bundle
const OnboardingTutorial = dynamic(() => import('@/components/tutorial/OnboardingTutorial'), {
  loading: () => null,
})

export default function DashboardPage() {
  const router = useRouter()
  const pb = createClient()
  const isHydrated = useIsHydrated()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalEggs: 0,
    totalCommissions: 0,
    totalFood: 0
  })
  const [referralLevels, setReferralLevels] = useState<Array<{ level: number; count: number; percentage: number; commissionRate: number }>>([])
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false);

  // Initialize the tutorial on first visit
  useEffect(() => {
    if (!isHydrated) return;

    const completed = localStorage.getItem("tutorial_completed");
    if (!completed) {
      setShowTutorial(true);
    }
  }, [isHydrated]);

  // Auto-polling for wallet balance (per D-11: 30 seconds)
  // user?.wallet_address or user?.wallet (support both field names for migration)
  const { balance, loading: balanceLoading, refresh: refreshBalance, error: balanceError } = useWalletPoll(user?.wallet_address || user?.wallet || '')

  useEffect(() => {
    if (!isHydrated) return

    const pb = createClient()
    restoreAuth(pb).then((success) => {
      if (success) {
        const u = getUser()
        setUser(u)
        setAuthReady(true)
        setLoading(false)
        if (u) fetchDashboardData(u)
      } else {
        setAuthReady(true)
        setLoading(false)
      }
    })
  }, [isHydrated])

  // REDIRECT EFFECT - only fires if authReady && !user
  useEffect(() => {
    if (isHydrated && authReady && !user) {
      router.push('/auth/login?redirectTo=/dashboard')
    }
  }, [isHydrated, authReady, user])

  const fetchDashboardData = async (currentUser: any) => {
    if (!currentUser?.id) {
      console.error('Cannot fetch dashboard data: user ID is missing')
      setLoading(false)
      return
    }
    
    // Check if we have valid auth token
    if (!pb.authStore.token || !pb.authStore.isValid) {
      console.warn('No valid auth token, skipping fetch')
      setLoading(false)
      return
    }
    
    try {
      // Fetch critical data first — profile and eggs must never be blanked by a commission fetch failure
      const [profileData, eggsData] = await Promise.all([
        pb.collection('users').getOne(currentUser.id),
        pb.collection('egg_nfts').getList(1, 1, { filter: `owner = "${currentUser.id}"` }),
      ])

      setProfile(profileData)

      const totalEggs = eggsData.totalItems
      const totalFood = eggsData.items.reduce((sum: number, egg: any) => sum + (egg.food_count || 0), 0)

      // Commission data in isolated fetch — failure only zeros the commission section
      let commissionItems: any[] = []
      try {
        commissionItems = await pb.collection('commission_records').getFullList({
          filter: `user = "${currentUser.id}"`
        })
      } catch (commErr: any) {
        if (!isAutoCancelError(commErr)) {
          console.warn('Commission records unavailable:', commErr?.status, commErr?.message)
        }
      }

      const totalCommissions = commissionItems
        .filter((c: any) => !c.claimed)
        .reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0)

      setStats({ totalEggs, totalFood, totalCommissions })

      // Deduplicate buddy count by distinct egg mints (from_egg) per level
      const eggSets: Record<number, Set<string>> = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() }
      commissionItems.forEach((record: any) => {
        const level = record.level
        if (level >= 1 && level <= 4 && record.from_egg) {
          eggSets[level].add(record.from_egg)
        }
      })
      const levelCounts: Record<number, number> = {
        1: eggSets[1].size, 2: eggSets[2].size, 3: eggSets[3].size, 4: eggSets[4].size
      }

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
      // Handle 404 / 400 / 403 for the critical profile+eggs fetch
      if (isNotFound(err) || err?.status === 400 || err?.status === 403) {
        console.warn(`Dashboard fetch issue (${err?.status}):`, err?.message)
        setProfile(null)
        setStats({ totalEggs: 0, totalFood: 0, totalCommissions: 0 })
        setReferralLevels([1, 2, 3, 4].map(lvl => ({ level: lvl, count: 0, percentage: 0, commissionRate: lvl === 1 ? 0.20 : 0.10 })))
        return
      }
      console.error('Dashboard fetch error:', err?.status, err?.message)
      console.error('Auth state:', {
        token: pb.authStore.token ? `${pb.authStore.token.substring(0, 50)}...` : 'missing',
        isValid: pb.authStore.isValid,
        recordId: pb.authStore.record?.id
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-foreground">LOADING...</p>
      </div>
    )
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-foreground">LOADING DASHBOARD...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-foreground">REDIRECTING TO LOGIN...</p>
      </div>
    )
  }

  return (
    <LayoutWithoutNav>
      <header className="flex justify-between items-center mb-10 px-2 lg:px-0">
        <div>
          <h2 className="pixel-font text-3xl lg:text-4xl text-on-surface-variant">Dashboard</h2>
          <p className="text-on-surface-variant/60 font-medium">Welcome back, {user?.name || 'User'} #{user?.id?.substring(0, 8)}</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Deposit button */}
          <button
            onClick={() => router.push('/dashboard/deposit')}
            className="hidden md:flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:scale-105 transition-transform pixel-font"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit</span>
          </button>
          
          {/* Withdraw button */}
          <button
            onClick={() => router.push('/dashboard/withdraw')}
            className="hidden md:flex items-center space-x-2 px-4 py-2 bg-surface-container-high border-2 border-primary/30 rounded hover:scale-105 transition-transform pixel-font"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
          
          {/* User avatar */}
          <div className="w-10 h-10 rounded-full bg-secondary-container overflow-hidden flex items-center justify-center">
            {user?.picture ? (
              <img 
                className="w-full h-full object-cover" 
                src={user?.picture?.includes('http') ? user.picture : `${pb.baseURL}/api/files/${user.collectionId}/${user.id}/${user.picture}`}
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null // Prevent infinite retries
                  currentTarget.src = '/default-avatar.png'
                }} 
                alt="Avatar"
              />
            ) : (
              <span className="material-symbols-outlined text-on-secondary-container">person</span>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Balance */}
        <BalanceCard 
          balance={balance}
          loading={balanceLoading}
          error={balanceError}
          refresh={refreshBalance}
        />

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

        {/* Card 3: Tier Progress */}
        <TierSection userId={user?.id} compact />
      </div>

      {/* Referral Earnings Summary */}
      <Card className="bg-surface-container-lowest p-6 rounded-xl clay-card mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">
              Pending Commissions
            </p>
            <h3 className="pixel-font text-3xl text-secondary">
              {stats.totalCommissions.toFixed(2)} USDT
            </h3>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="material-symbols-outlined text-2xl">groups</span>
            <span>{referralLevels.reduce((sum, lvl) => sum + lvl.count, 0)} buddies</span>
          </div>
        </div>
      </Card>

      {/* Referral Link Share Card */}
      {profile?.referral_code && (
        <div className="mb-8">
          <ReferralLinkCard referralCode={profile.referral_code} />
        </div>
      )}

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

      {/* Onboarding Tutorial - Appears on first visit */}
      {showTutorial && (
        <OnboardingTutorial onDismiss={() => setShowTutorial(false)} />
      )}
    </LayoutWithoutNav>
  )
}
