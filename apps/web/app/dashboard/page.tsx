"use client"

import { useEffect, useState } from 'react'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { createClient, getUser, isAuthenticated, restoreAuth } from '@/lib/pocketbase/client'
import { useWalletPoll } from '@/hooks/use-wallet-poll'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { BuddyChain } from '@/components/dashboard/buddy-chain'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { isAutoCancelError, isNotFound } from '@/lib/pocketbase/error-handling'

export default function DashboardPage() {
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

  // Auto-polling for wallet balance (per D-11: 30 seconds)
  // user?.wallet_address or user?.wallet (support both field names for migration)
  const { balance, loading: balanceLoading, refresh: refreshBalance, error: balanceError } = useWalletPoll(user?.wallet_address || user?.wallet || '')

  // Effect: Wait for hydration then check auth state
  useEffect(() => {
    if (!isHydrated) return

    const pb = createClient()
    
    console.warn('=== Dashboard auth check ===')
    console.warn('authStore.token exists:', !!pb.authStore.token)
    console.warn('authStore.record:', pb.authStore.record)
    const userRecord = getUser()
    console.warn('getUser():', userRecord)
    console.warn('authStore.isValid:', pb.authStore.isValid)
    console.warn('isAuthenticated():', isAuthenticated())
    
    // Check 1: Immediately authenticated?
    if (pb.authStore.token && pb.authStore.record?.id) {
      console.warn('✓ User authenticated immediately:', userRecord.id)
      setUser(userRecord)
      setAuthReady(true)
      setLoading(false)
      fetchDashboardData(userRecord)
      return
    }
    
    // Check 2: Has token but no record - restore auth from server
    if (pb.authStore.token && !pb.authStore.record?.id) {
      console.warn('Has token but no record, restoring auth from server...')
      restoreAuth(pb)
        .then((success) => {
          if (success) {
            const restoredUser = getUser()
            console.warn('✓ Auth restored:', restoredUser?.id)
            setUser(restoredUser)
            setAuthReady(true)
            setLoading(false)
            fetchDashboardData(restoredUser)
          } else {
            console.warn('✗ Auth restore failed - not authenticated')
            setAuthReady(true)
            setLoading(false)
            setUser(null)
            // Will redirect via redirect effect
          }
        })
        .catch((error) => {
          console.error('Auth restore error:', error)
          setAuthReady(true)
          setLoading(false)
          setUser(null)
          // Will redirect via redirect effect
        })
      return
    }
    
    // Check 3: No token at all - listen for auth changes (OAuth flow)
    console.warn('No token, listening for auth changes...')
    const unsubscribe = pb.authStore.onChange(() => {
      console.warn('Dashboard authStore changed, token exists:', !!pb.authStore.token)
      const updatedUser = getUser()
      console.warn('getUser() in onChange:', updatedUser)
      
      if (updatedUser && updatedUser.id) {
        console.warn('Auth restored via onChange:', updatedUser.id)
        setUser(updatedUser)
        setAuthReady(true)
        setLoading(false)
        fetchDashboardData(updatedUser)
        unsubscribe()
      } else if (!pb.authStore.token) {
        // Token was cleared - user logged out
        console.warn('Auth cleared via onChange - redirecting')
        setUser(null)
        setAuthReady(true)
        setLoading(false)
        unsubscribe()
        // Force redirect
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 100)
      }
      // If we have token but no user yet, keep waiting (don't unsubscribe)
    })
    
    // Timeout fallback (5 seconds for OAuth flow)
    const timeout = setTimeout(() => {
      if (!authReady) {
        console.warn('Auth check timeout - final state:', {
          hasToken: !!pb.authStore.token,
          hasRecord: !!pb.authStore.record?.id,
          isValid: pb.authStore.isValid
        })
        // Final attempt: if token exists but no record, try restore one more time
        if (pb.authStore.token && !pb.authStore.record?.id) {
          console.warn('Timeout: trying restoreAuth as last resort...')
          restoreAuth(pb)
            .then((success) => {
              if (success) {
                const restoredUser = getUser()
                setUser(restoredUser)
              }
              setAuthReady(true)
              setLoading(false)
            })
            .catch(() => {
              setAuthReady(true)
              setLoading(false)
            })
        } else {
          // No token - mark ready (will redirect)
          setAuthReady(true)
          setLoading(false)
        }
      }
    }, 5000)
    
    return () => {
      clearTimeout(timeout)
      unsubscribe?.()
    }
  }, [isHydrated])

  // REDIRECT EFFECT - only fires if authReady && !user
  useEffect(() => {
    if (isHydrated && authReady && !user) {
      console.warn('Not authenticated, redirecting to login')
      setTimeout(() => {
        window.location.href = '/auth/login?redirectTo=/dashboard'
      }, 100)
    }
  }, [isHydrated, authReady, user])

  const fetchDashboardData = async (currentUser: any) => {
    if (!currentUser?.id) {
      console.error('Cannot fetch dashboard data: user ID is missing')
      setLoading(false)
      return
    }
    
    const pb = createClient()
    
    // Check if we have valid auth token
    if (!pb.authStore.token || !pb.authStore.isValid) {
      console.warn('No valid auth token, skipping fetch')
      setLoading(false)
      return
    }
    
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
      // Handle 403 errors gracefully - collection may not exist in production or has wrong API rules
      if (err?.status === 403) {
        console.warn('Dashboard collection access forbidden (collection may be missing fields or API rules in production):', err?.message)
        // Set default empty state
        setProfile(null)
        setStats({ totalEggs: 0, totalFood: 0, totalCommissions: 0 })
        setReferralLevels([1, 2, 3, 4].map(lvl => ({ level: lvl, count: 0, percentage: 0, commissionRate: lvl === 1 ? 0.20 : 0.10 })))
        return
      }
      console.error('Dashboard fetch error:')
      console.error('Full error:', err)
      console.error('Error status:', err?.status)
      console.error('Error message:', err?.message)
      console.error('Error data:', err?.data)
      console.error('Auth state:', { 
        token: pb.authStore.token ? `${pb.authStore.token.substring(0, 50)}...` : 'missing',
        isValid: pb.authStore.isValid,
        recordId: pb.authStore.record?.id
      })
    } finally {
      setLoading(false)
    }
  }

  // Refresh function kept for future use (manual refresh button can be re-added)
  const _handleRefresh = async () => {
    if (user?.id) {
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

  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-foreground">LOADING DASHBOARD...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-foreground">REDIRECTING TO LOGIN...</p>
      </div>
    )
  }

  const _usdtTotalEarned = parseFloat(profile?.usdt_total_earned || '0')
  const totalReferralEarnings = stats.totalCommissions

  return (
    <LayoutWithoutNav>
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
    </LayoutWithoutNav>
  )
}
