"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { isAutoCancelError, isNotFound } from '@/lib/pocketbase/error-handling'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Egg, Wallet, CheckCircle2, AlertCircle } from 'lucide-react'
import { Header } from '@/components/header'
import { cn } from '@/lib/utils'

const MINT_PRICE = 25
const INITIAL_FOOD_COUNT = 2

export default function MintPage() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [referrerId, setReferrerId] = useState('')
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
    } catch (err: any) {
      // Suppress auto-cancel errors
      if (isAutoCancelError(err)) {
        return
      }
      // Handle 404 errors - user not found
      if (isNotFound(err)) {
        setProfile(null)
        return
      }
      // Log other errors
      console.error('Failed to fetch profile:', err)
    }
  }

  const handleMint = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const pb = createClient()
      const token = pb.authStore.token
      
      const response = await fetch('https://pb.eggoworld.io/api/v2/mint-egg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          referrer_id: referrerId || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Mint failed')
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

  const usdtBalance = parseFloat(profile?.usdt_balance || '0')
  const canMint = usdtBalance >= MINT_PRICE

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Egg className="w-16 h-16 text-primary animate-pulse" />
              </div>
              <h1 className="font-[var(--font-pixel)] text-2xl md:text-3xl text-foreground">
                MINT YOUR EGG NFT
              </h1>
              <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                OWN A PIECE OF THE EGGOVERSE
              </p>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-clay-lg mb-clay-xl">
              <div className="flex items-center gap-clay-md">
                <div className={cn(
                  'w-10 h-10 rounded-clay-full',
                  'flex items-center justify-center',
                  'font-[var(--font-pixel)] text-xs',
                  'bg-primary text-primary-foreground shadow-clay-md'
                )}>
                  1
                </div>
                <div className={cn(
                  'w-16 h-1 rounded-clay-full',
                  'bg-primary shadow-clay-sm'
                )} />
              </div>
              <div className={cn(
                'w-10 h-10 rounded-clay-full',
                'flex items-center justify-center',
                'font-[var(--font-pixel)] text-xs',
                'bg-secondary/20 text-muted-foreground shadow-clay-sm'
              )}>
                2
              </div>
            </div>

            {/* Mint Card */}
            <Card variant="clay-lg" className="w-full max-w-2xl mx-auto shadow-clay-xl">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
                  EGG MINTING
                </CardTitle>
                <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  PRICE: {MINT_PRICE} USDT
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
                    value={(usdtBalance / MINT_PRICE) * 100} 
                    className="h-3 border-2 border-primary"
                  />
                  {!canMint && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-[var(--font-pixel)] text-xs">
                        Insufficient balance. Need {MINT_PRICE - usdtBalance} more USDT.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* What You Get */}
                <div className="bg-secondary/30 border-2 border-primary/30 p-4 space-y-3">
                  <h3 className="font-[var(--font-pixel)] text-xs text-primary">
                    YOUR EGG INCLUDES:
                  </h3>
                  <ul className="space-y-2 font-[var(--font-pixel)] text-xs text-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                      1 EGG NFT (ERC-721)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                      {INITIAL_FOOD_COUNT} BONUS FOOD NFTs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                      UNIQUE RARITY SEED
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                      REFERRAL CHAIN TRACKING
                    </li>
                  </ul>
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
                  />
                  <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                    Earn rewards by inviting friends!
                  </p>
                </div>

                {/* Success Message */}
                {success && (
                  <Alert className="bg-primary/20 border-primary">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="font-[var(--font-pixel)] text-xs">
                      MINT SUCCESSFUL! Token ID: {success.token_id}
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
                  onClick={handleMint}
                  disabled={loading || !canMint || !!success}
                  className="w-full font-[var(--font-pixel)] text-sm h-12 border-4 border-primary/50 hover:border-primary transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      MINTING...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      MINTED!
                    </>
                  ) : !canMint ? (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      INSUFFICIENT BALANCE
                    </>
                  ) : (
                    <>
                      <Egg className="mr-2 h-4 w-4" />
                      MINT EGG ({MINT_PRICE} USDT)
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Info */}
            <div className="bg-secondary/20 border-2 border-primary/30 p-6 space-y-4">
              <h2 className="font-[var(--font-pixel)] text-sm text-primary">
                HOW IT WORKS
              </h2>
              <ol className="space-y-3 font-[var(--font-pixel)] text-xs text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">01</span>
                  <span>Ensure you have at least 25 USDT in your wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">02</span>
                  <span>Optional: Enter a referrer ID to join their chain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">03</span>
                  <span>Click "Mint Egg" and confirm the transaction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">04</span>
                  <span>Your Egg NFT will be minted with 2 bonus Food NFTs</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
