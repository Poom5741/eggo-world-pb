"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Egg, Flame, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import { Header } from '@/components/header'
import { EggCard } from '@/components/egg-nft/EggCard'

export default function EggsDashboard() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [eggs, setEggs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEggs: 0,
    hatchedEggs: 0,
    totalFood: 0,
    totalValue: 0
  })

  useEffect(() => {
    setIsHydrated(true)
    
    const pb = createClient()
    
    if (isAuthenticated()) {
      const currentUser = getUser()
      setUser(currentUser)
      fetchEggs(currentUser.id)
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

  const fetchEggs = async (userId: string) => {
    const pb = createClient()
    try {
      const records = await pb.collection('egg_nfts').getList(1, 50, {
        filter: `owner = "${userId}"`,
        sort: '-minted_at'
      })

      setEggs(records.items)
      
      const totalEggs = records.items.length
      const hatchedEggs = records.items.filter((egg: any) => egg.is_hatched).length
      const totalFood = records.items.reduce((sum: number, egg: any) => sum + (egg.food_count || 0), 0)

      setStats({
        totalEggs,
        hatchedEggs,
        totalFood,
        totalValue: totalEggs * 25
      })
    } catch (err) {
      console.error('Failed to fetch eggs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleHatch = async (tokenId: number) => {
    const pb = createClient()
    const token = pb.authStore.token
    
    try {
      const response = await fetch(`https://pb.eggoworld.io/api/v2/hatch-egg/${tokenId}`, {
        method: 'POST',
        headers: {
          'Authorization': token
        }
      })

      if (response.ok) {
        if (user) {
          fetchEggs(user.id)
        }
      }
    } catch (err) {
      console.error('Failed to hatch egg:', err)
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
                  <Egg className="w-8 h-8 text-primary" />
                  MY EGG NFTs
                </h1>
                <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  MANAGE YOUR EGGOVERSE COLLECTION
                </p>
              </div>
              <Button
                onClick={() => router.push('/mint')}
                className="font-[var(--font-pixel)] text-sm border-4 border-primary/50 hover:border-primary"
              >
                <Egg className="w-4 h-4 mr-2" />
                MINT NEW EGG
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-primary/30 bg-card">
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

              <Card className="border-2 border-accent/30 bg-card">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    HATCHED
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-2xl text-accent">
                    {stats.hatchedEggs}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 mr-1" />
                    Eggs hatched
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-card">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    FOOD NFTs
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-2xl text-primary">
                    {stats.totalFood}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Bonus NFTs
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-card">
                <CardHeader className="pb-3">
                  <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    TOTAL VALUE
                  </CardDescription>
                  <CardTitle className="font-[var(--font-pixel)] text-2xl text-foreground">
                    {stats.totalValue} USDT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Wallet className="w-3 h-3 mr-1" />
                    At mint price
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Eggs Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="font-[var(--font-pixel)] text-foreground">LOADING EGGS...</p>
              </div>
            ) : eggs.length === 0 ? (
              <Card className="border-2 border-primary/30 bg-card">
                <CardContent className="py-12 text-center space-y-4">
                  <Egg className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <h3 className="font-[var(--font-pixel)] text-lg text-foreground">
                      NO EGGS YET
                    </h3>
                    <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                      Mint your first Egg NFT to start collecting
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/mint')}
                    className="font-[var(--font-pixel)] text-sm border-4 border-primary/50 hover:border-primary"
                  >
                    <Egg className="w-4 h-4 mr-2" />
                    MINT YOUR FIRST EGG
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eggs.map((egg) => (
                  <EggCard
                    key={egg.token_id}
                    egg={egg}
                    onHatch={() => handleHatch(egg.token_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
