"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, DollarSign, Link, Copy, Check, Loader2, Wallet } from 'lucide-react'

interface DownlineUser {
  id: string
  wallet_address: string
  created: string
  egg_purchases?: number
  food_purchases?: number
  earned_for_you?: number
}

interface ReferralData {
  user: any
  g1: DownlineUser[]
  totalDirect: number
  lifetimeEarnings: number
}

export default function ReferralDashboardPage() {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const [user, setUser] = useState<any>(null)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const pb = createClient()
    
    if (isAuthenticated()) {
      const currentUser = getUser()
      setUser(currentUser)
      fetchReferralData(currentUser.id)
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

  const fetchReferralData = async (userId: string) => {
    const pb = createClient()
    try {
      setLoading(true)
      
      // Get current user
      const userData = await pb.collection('users').getOne(userId)
      
      // Get direct recruits (G1)
      const g1Recruits = await pb.collection('users').getList(1, 50, {
        filter: `referral_chain.g1 = "${userData.wallet_address}"`,
        sort: '-created'
      })
      
      setReferralData({
        user: userData,
        g1: g1Recruits.items,
        totalDirect: userData.total_direct_recruits || g1Recruits.items.length,
        lifetimeEarnings: userData.total_earned_usdt || 0
      })
    } catch (err: any) {
      console.error('Failed to fetch referral data:', err)
      setError('Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!user) return
    
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const referralLink = `${origin}/auth/sign-up?referrer=${user.id}`
    
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const truncateAddress = (address: string) => {
    if (!address) return 'Unknown'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Referral Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your downline and earnings
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-primary/30">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Direct Recruits (G1)
                    </CardDescription>
                    <CardTitle className="text-2xl text-primary">
                      {referralData?.totalDirect || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Users you directly referred
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Total Downline
                    </CardDescription>
                    <CardTitle className="text-2xl text-foreground">
                      {referralData?.g1.length || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Active G1 members
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Lifetime Earnings
                    </CardDescription>
                    <CardTitle className="text-2xl text-primary">
                      {referralData?.lifetimeEarnings.toFixed(2) || '0.00'} USDT
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Total commission earned
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Referral Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="w-5 h-5" />
                    Your Referral Link
                  </CardTitle>
                  <CardDescription>
                    Share this link to earn 20% commission on direct referrals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/sign-up?referrer=${user.id}`}
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant={copied ? 'default' : 'outline'}
                      className="min-w-[100px]"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Earn 20% on G1, 10% on G2, G3, and G4 purchases
                  </p>
                </CardContent>
              </Card>

              {/* Downline Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Direct Recruits
                  </CardTitle>
                  <CardDescription>
                    Users you directly referred (G1)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {referralData?.g1.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <Users className="w-16 h-16 mx-auto text-muted-foreground" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">No recruits yet</h3>
                        <p className="text-muted-foreground">
                          Share your referral link to start building your downline
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Wallet</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Egg Purchases</TableHead>
                          <TableHead>Food Purchases</TableHead>
                          <TableHead>Your Earnings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referralData?.g1.map((downlineUser) => (
                          <TableRow key={downlineUser.id}>
                            <TableCell className="font-mono text-sm">
                              <Badge variant="outline">
                                {truncateAddress(downlineUser.wallet_address)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(downlineUser.created)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {downlineUser.egg_purchases || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {downlineUser.food_purchases || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-primary">
                              {(downlineUser.earned_for_you || 0).toFixed(2)} USDT
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
