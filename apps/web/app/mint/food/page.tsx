"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Flame, Wallet, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react'
import { Header } from '@/components/header'

const FOOD_PRICE = 0.50
const MAX_QUANTITY = 100
const FOOD_TYPES = [
  { value: 'all', label: 'Mixed', emoji: '🎁' },
  { value: 'grain', label: 'Grain', emoji: '🌾' },
  { value: 'fish', label: 'Fish', emoji: '🐟' },
  { value: 'insects', label: 'Insects', emoji: '🦗' },
  { value: 'herb', label: 'Herbs', emoji: '🌿' }
]

export default function BuyFoodPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [quantity, setQuantity] = useState<number>(10)
  const [foodType, setFoodType] = useState<string>('all')
  const [referrerId, setReferrerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<any>(null)

  useEffect(() => {
    setIsHydrated(true)
    
    const pb = createClient()
    
    if (isAuthenticated()) {
      const currentUser = getUser()
      setUser(currentUser)
      fetchProfile(currentUser.id)
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

  const fetchProfile = async (userId: string) => {
    const pb = createClient()
    try {
      const data = await pb.collection('users').getOne(userId)
      setProfile(data)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  const handleBuyFood = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const pb = createClient()
      const token = pb.authStore.token
      
      const response = await fetch('https://pb.eggoworld.io/api/v2/mint-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          quantity,
          food_type: foodType !== 'all' ? foodType : undefined,
          referrer_id: referrerId || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Purchase failed')
      }

      setSuccess(result.data)
      
      setTimeout(() => {
        router.push('/dashboard/eggs')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  const totalCost = quantity * FOOD_PRICE
  const usdtBalance = parseFloat(profile?.usdt_balance || '0')
  const canAfford = usdtBalance >= totalCost

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Flame className="w-16 h-16 text-primary animate-pulse" />
              </div>
              <h1 className="font-[var(--font-pixel)] text-2xl md:text-3xl text-foreground">
                BUY FOOD NFTs
              </h1>
              <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                0.50 USDT each • Feed your eggs to hatch
              </p>
            </div>

            {/* Purchase Card */}
            <Card className="border-4 border-primary/50 bg-card">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
                  FOOD NFT PURCHASE
                </CardTitle>
                <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  Choose quantity and food type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Balance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-[var(--font-pixel)] text-xs text-foreground">
                      YOUR USDT BALANCE
                    </Label>
                    <span className="font-[var(--font-pixel)] text-xs text-primary">
                      {usdtBalance.toFixed(2)} USDT
                    </span>
                  </div>
                  <Progress 
                    value={(usdtBalance / totalCost) * 100} 
                    className="h-3 border-2 border-primary"
                  />
                  {!canAfford && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-[var(--font-pixel)] text-xs">
                        Insufficient balance. Need {(totalCost - usdtBalance).toFixed(2)} more USDT.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="font-[var(--font-pixel)] text-xs text-foreground">
                    QUANTITY
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={MAX_QUANTITY}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(MAX_QUANTITY, Math.max(1, parseInt(e.target.value) || 0)))}
                      className="font-[var(--font-pixel)] text-xs border-2 border-primary/50 bg-background"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQuantity(10)}
                      className="font-[var(--font-pixel)] text-xs"
                      disabled={loading}
                    >
                      10
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQuantity(50)}
                      className="font-[var(--font-pixel)] text-xs"
                      disabled={loading}
                    >
                      50
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQuantity(100)}
                      className="font-[var(--font-pixel)] text-xs"
                      disabled={loading}
                    >
                      MAX
                    </Button>
                  </div>
                  <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    Maximum {MAX_QUANTITY} NFTs per transaction
                  </p>
                </div>

                {/* Food Type Selector */}
                <div className="space-y-2">
                  <Label className="font-[var(--font-pixel)] text-xs text-foreground">
                    FOOD TYPE
                  </Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {FOOD_TYPES.map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={foodType === type.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFoodType(type.value)}
                        className="font-[var(--font-pixel)] text-xs flex flex-col h-auto py-2"
                        disabled={loading}
                      >
                        <span className="text-lg">{type.emoji}</span>
                        <span className="text-xs mt-1">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                  <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    Select "Mixed" for random distribution
                  </p>
                </div>

                {/* Total Cost */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-[var(--font-pixel)] text-xs text-foreground">
                      TOTAL COST
                    </Label>
                    <Badge className="bg-primary text-primary-foreground font-[var(--font-pixel)] text-sm">
                      {totalCost.toFixed(2)} USDT
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-[var(--font-pixel)] text-xs text-foreground">
                      PRICE PER NFT
                    </Label>
                    <span className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                      {FOOD_PRICE.toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                {/* Referrer Input */}
                <div className="space-y-2">
                  <Label htmlFor="referrer" className="font-[var(--font-pixel)] text-xs text-foreground">
                    REFERRER ID (OPTIONAL)
                  </Label>
                  <Input
                    id="referrer"
                    value={referrerId}
                    onChange={(e) => setReferrerId(e.target.value)}
                    placeholder="Enter referrer's user ID"
                    className="font-[var(--font-pixel)] text-xs border-2 border-primary/50 bg-background"
                    disabled={loading}
                  />
                  <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    Support other players by using their referral
                  </p>
                </div>

                {/* Success Message */}
                {success && (
                  <Alert className="bg-primary/20 border-primary">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="font-[var(--font-pixel)] text-xs">
                      PURCHASE SUCCESSFUL! {success.food_ids?.length || quantity} Food NFTs minted
                      <br />
                      Redirecting to your eggs...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-[var(--font-pixel)] text-xs">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleBuyFood}
                  disabled={loading || !canAfford || !!success}
                  className="w-full font-[var(--font-pixel)] text-sm h-12 border-4 border-primary/50 hover:border-primary transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PURCHASING...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      PURCHASED!
                    </>
                  ) : !canAfford ? (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      INSUFFICIENT BALANCE
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      BUY {quantity} FOOD NFT{quantity > 1 ? 'S' : ''} ({totalCost.toFixed(2)} USDT)
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* What You Get */}
            <Card className="border-2 border-primary/30 bg-card">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-lg text-primary">
                  WHAT YOU GET
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 font-[var(--font-pixel)] text-xs text-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    {quantity} Food NFT(s) added to your inventory
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    Use food to feed your Egg NFTs (10 food = 1 hatch)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    4 types: Grain 🌾, Fish 🐟, Insects 🦗, Herbs 🌿
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    Each food type provides different bonuses
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Info */}
            <div className="bg-secondary/20 border-2 border-primary/30 p-6 space-y-4">
              <h2 className="font-[var(--font-pixel)] text-sm text-primary">
                HOW IT WORKS
              </h2>
              <ol className="space-y-3 font-[var(--font-pixel)] text-xs text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">01</span>
                  <span>Ensure you have enough USDT balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">02</span>
                  <span>Choose quantity (1-100) and food type</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">03</span>
                  <span>Optional: Enter referrer ID to support them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">04</span>
                  <span>Click "Buy Food" and confirm the transaction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">05</span>
                  <span>Food NFTs will be added to your inventory</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
