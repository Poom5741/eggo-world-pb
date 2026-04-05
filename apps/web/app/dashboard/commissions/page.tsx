"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { isAutoCancelError, isNotFound } from '@/lib/pocketbase/error-handling'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Coins, TrendingUp, Wallet, Loader2, CheckCircle2, DollarSign, RefreshCw } from 'lucide-react'
import { Header } from '@/components/header'

export default function CommissionsDashboard() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState<any>(null)
  const [stats, setStats] = useState({
    totalPending: 0,
    totalClaimed: 0,
    g1Earnings: 0,
    g2Earnings: 0,
    g3Earnings: 0,
    g4Earnings: 0
  })
  const [updating, setUpdating] = useState(false)

  // Auto-polling every 30 seconds (per D-11)
  useEffect(() => {
    if (!user) return

    const pollInterval = setInterval(() => {
      setUpdating(true)
      fetchData(user.id).finally(() => setUpdating(false))
    }, 30000)

    return () => clearInterval(pollInterval)
  }, [user])

  useEffect(() => {
    setIsHydrated(true)
    
    const pb = createClient()
    
    if (isAuthenticated()) {
      const currentUser = getUser()
      if (currentUser) {
        setUser(currentUser)
        fetchData(currentUser.id)
      }
    } else {
      router.push('/auth/login')
    }

    pb.authStore.onChange(() => {
      if (isAuthenticated()) {
        setUser(getUser())
      } else {
        setUser(null)
        router.push('/auth/login')
      }
    })
  }, [router])

  const fetchData = async (userId: string) => {
    const pb = createClient()
    try {
      const [profileData, commissionRecords] = await Promise.all([
        pb.collection('users').getOne(userId),
        pb.collection('commission_records').getList(1, 100, {
          filter: `user = "${userId}"`,
          sort: '-created'
        })
      ])

      setProfile(profileData)
      setCommissions(commissionRecords.items)

      const pending = commissionRecords.items
        .filter((c: any) => !c.claimed)
        .reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0)

      const claimed = commissionRecords.items
        .filter((c: any) => c.claimed)
        .reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0)

      const g1 = commissionRecords.items
        .filter((c: any) => c.level === 1)
        .reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0)

      const g2 = commissionRecords.items
        .filter((c: any) => c.level === 2)
        .reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0)

      const g3 = commissionRecords.items
        .filter((c: any) => c.level === 3)
        .reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0)

      const g4 = commissionRecords.items
        .filter((c: any) => c.level === 4)
        .reduce((sum: number, c: any) => sum + parseFloat(c.amount || '0'), 0)

      setStats({
        totalPending: pending,
        totalClaimed: claimed,
        g1Earnings: g1,
        g2Earnings: g2,
        g3Earnings: g3,
        g4Earnings: g4
      })
    } catch (err: any) {
      // Suppress auto-cancel errors
      if (isAutoCancelError(err)) {
        return
      }
      // Handle 404 errors - show empty state
      if (isNotFound(err)) {
        setProfile(null)
        setCommissions([])
        setStats({ totalPending: 0, totalClaimed: 0, g1Earnings: 0, g2Earnings: 0, g3Earnings: 0, g4Earnings: 0 })
        return
      }
      // Log other errors
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!user || stats.totalPending === 0) return

    setClaiming(true)
    setClaimSuccess(null)

    const pb = createClient()
    const token = pb.authStore.token

    try {
      const response = await fetch('https://pb.eggoworld.io/api/v2/claim-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Claim failed')
      }

      setClaimSuccess(result.data)
      fetchData(user.id)

      setTimeout(() => {
        setClaimSuccess(null)
      }, 5000)
    } catch (err: any) {
      console.error('Claim failed:', err)
    } finally {
      setClaiming(false)
    }
  }

  const handleRefresh = async () => {
    if (user) {
      setUpdating(true)
      await fetchData(user.id)
      setUpdating(false)
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
                  <Coins className="w-8 h-8 text-primary" />
                  COMMISSIONS
                </h1>
                <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  EARN FROM YOUR REFERRAL CHAIN
                </p>
              </div>
              <div className="flex items-center gap-2">
                {updating && (
                  <Badge variant="secondary" className="animate-pulse">
                    Updating...
                  </Badge>
                )}
                <Button
                  onClick={handleRefresh}
                  disabled={updating}
                  variant="outline"
                  size="sm"
                  className="font-[var(--font-pixel)] text-xs"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-primary/30 bg-card">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    PENDING
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-2xl text-primary">
                    {stats.totalPending.toFixed(2)} USDT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Ready to claim
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-card">
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

              <Card className="border-2 border-accent/30 bg-card">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    G1 EARNINGS (20%)
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-xl text-accent">
                    {stats.g1Earnings.toFixed(2)} USDT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    Direct referrals
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-card">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    G2-G4 EARNINGS
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-xl text-foreground">
                    {(stats.g2Earnings + stats.g3Earnings + stats.g4Earnings).toFixed(2)} USDT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    Network earnings
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Claim Card */}
            <Card className="border-4 border-primary/50 bg-card">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
                  CLAIM COMMISSIONS
                </CardTitle>
                <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  Withdraw your earned commissions to your wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.totalPending > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-[var(--font-pixel)] text-xs text-foreground">
                        AVAILABLE TO CLAIM:
                      </span>
                      <span className="font-[var(--font-pixel)] text-lg text-primary">
                        {stats.totalPending.toFixed(2)} USDT
                      </span>
                    </div>
                    <Progress value={100} className="h-3 border-2 border-primary" />
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                      No commissions available to claim
                    </p>
                  </div>
                )}

                {claimSuccess && (
                  <Alert className="bg-primary/20 border-primary">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="font-[var(--font-pixel)] text-xs">
                      Successfully claimed {claimSuccess.claimed_amount} USDT!
                      <br />
                      TX: {claimSuccess.tx_hash?.slice(0, 10)}...{claimSuccess.tx_hash?.slice(-8)}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleClaim}
                  disabled={claiming || stats.totalPending === 0}
                  className="w-full font-[var(--font-pixel)] text-sm h-12 border-4 border-primary/50 hover:border-primary transition-colors"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      CLAIM {stats.totalPending > 0 ? `${stats.totalPending.toFixed(2)} USDT` : 'COMMISSIONS'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Commission Breakdown */}
            <Card className="border-2 border-primary/30 bg-card">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
                  EARNINGS BREAKDOWN
                </CardTitle>
                <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  Commission distribution by level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground font-[var(--font-pixel)] text-xs">
                        G1
                      </Badge>
                      <span className="font-[var(--font-pixel)] text-xs text-foreground">
                        Direct referrals (20%)
                      </span>
                    </div>
                    <span className="font-[var(--font-pixel)] text-sm text-primary">
                      {stats.g1Earnings.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-secondary text-foreground font-[var(--font-pixel)] text-xs">
                        G2
                      </Badge>
                      <span className="font-[var(--font-pixel)] text-xs text-foreground">
                        Level 2 (10%)
                      </span>
                    </div>
                    <span className="font-[var(--font-pixel)] text-sm text-foreground">
                      {stats.g2Earnings.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-secondary text-foreground font-[var(--font-pixel)] text-xs">
                        G3
                      </Badge>
                      <span className="font-[var(--font-pixel)] text-xs text-foreground">
                        Level 3 (10%)
                      </span>
                    </div>
                    <span className="font-[var(--font-pixel)] text-sm text-foreground">
                      {stats.g3Earnings.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-secondary text-foreground font-[var(--font-pixel)] text-xs">
                        G4
                      </Badge>
                      <span className="font-[var(--font-pixel)] text-xs text-foreground">
                        Level 4 (10%)
                      </span>
                    </div>
                    <span className="font-[var(--font-pixel)] text-sm text-foreground">
                      {stats.g4Earnings.toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="font-[var(--font-pixel)] text-foreground">LOADING HISTORY...</p>
              </div>
            ) : commissions.length === 0 ? (
              <Card variant="clay-lg" className="border-2 border-primary/30 bg-card shadow-clay-xl">
                <CardContent className="py-12 text-center space-y-4">
                  <Coins className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="font-[var(--font-pixel)] text-lg text-foreground">
                      NO COMMISSIONS YET
                    </h3>
                    <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                      Share your referral link to start earning
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card variant="clay-lg" className="border-2 border-primary/30 bg-card shadow-clay-xl">
                <CardHeader>
                  <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
                    COMMISSION HISTORY
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {commissions.slice(0, 10).map((commission, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-clay-sm',
                          'bg-secondary/20 shadow-clay-sm'
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={commission.level === 1 ? 'clay' : 'clay-secondary'}
                              className="font-[var(--font-pixel)] text-xs"
                            >
                              G{commission.level}
                            </Badge>
                            <span className="font-[var(--font-pixel)] text-xs text-foreground">
                              {commission.amount} USDT
                            </span>
                          </div>
                          <span className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                            TX: {commission.tx_hash?.slice(0, 10)}...{commission.tx_hash?.slice(-8)}
                          </span>
                        </div>
                        <Badge
                          variant={commission.claimed ? 'clay' : 'clay-secondary'}
                          className="font-[var(--font-pixel)] text-xs"
                        >
                          {commission.claimed ? 'CLAIMED' : 'PENDING'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
