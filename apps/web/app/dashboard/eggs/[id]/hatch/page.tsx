"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { createClient, isAuthenticated } from '@/lib/pocketbase/client'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Egg, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/header'
import { 
  getSigner, 
  getEggNftContract, 
  parseEggHatchedEvent,
  Rarity,
  Species,
} from '@/lib/contracts/eggNft'
import { HatchReveal } from '@/components/HatchReveal'

const MAX_FOOD_COUNT = 10

export default function HatchEggPage() {
  const router = useRouter()
  const params = useParams()
  const isHydrated = useIsHydrated()
  
  const [user, setUser] = useState<any>(null)
  const [egg, setEgg] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hatchedAnimal, setHatchedAnimal] = useState<{
    animalId: number
    rarity: Rarity
    species: Species
    generation: number
  } | null>(null)

  // Check authentication and load egg data
  useEffect(() => {
    if (!isHydrated) return

    const pb = createClient()
    
    if (!isAuthenticated()) {
      router.push('/auth/login')
      return
    }

    const currentUser = pb.authStore.record
    setUser(currentUser)
    
    if (currentUser) {
      fetchEggData(currentUser.id)
    }

    pb.authStore.onChange(() => {
      if (isAuthenticated()) {
        setUser(pb.authStore.record)
      } else {
        setUser(null)
        router.push('/auth/login')
      }
    })
  }, [isHydrated, router, params.id])

  const fetchEggData = async (userId: string) => {
    try {
      const pb = createClient()
      const eggs = await pb.collection('egg_nfts').getList(1, 1, {
        filter: `token_id = ${params.id} && owner.id = "${userId}"`,
      })
      
      if (eggs.items.length > 0) {
        setEgg(eggs.items[0])
      } else {
        setError('Egg not found or you do not own it')
      }
    } catch (err: any) {
      console.error('Failed to fetch egg data:', err)
      setError('Failed to load egg data')
    }
  }

  const handleHatch = async () => {
    if (!user || !egg) return
    
    setLoading(true)
    setError(null)

    try {
      // Get signer and create contract instance
      const signer = await getSigner()
      const contract = getEggNftContract(signer)

      // Call hatchEgg function
      const tx = await contract.hatchEgg(egg.token_id)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      // Parse the EggHatched event
      const event = parseEggHatchedEvent(receipt)
      
      // Update PocketBase record (optional - backend hook should handle this)
      try {
        const pb = createClient()
        const token = pb.authStore.token
        await fetch(`https://pb.eggoworld.io/api/v2/sync-hatched-egg`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            egg_token_id: egg.token_id,
            animal_token_id: event.animalId,
            rarity: event.rarity,
            species: event.species,
            tx_hash: receipt.hash
          })
        })
      } catch (err) {
        console.error('Failed to sync hatched egg:', err)
        // Continue anyway - the animal was minted successfully
      }

      // Set hatched animal data for reveal
      setHatchedAnimal({
        animalId: event.animalId,
        rarity: event.rarity,
        species: event.species,
        generation: egg.generation || 0
      })
    } catch (err: any) {
      console.error('Hatch failed:', err)
      
      // User-friendly error messages
      let errorMessage = 'Failed to hatch egg. Please try again.'
      
      if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected. Please try again.'
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas. Please add BNB to your wallet.'
      } else if (err.message?.includes('Not enough food')) {
        errorMessage = 'Egg needs 10 food items before hatching. Feed it more!'
      } else if (err.message?.includes('already hatched')) {
        errorMessage = 'This egg has already been hatched.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = () => {
    router.push('/dashboard/nfts')
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

  // Check if egg has enough food
  const foodCount = egg?.food_count || 0
  const canHatch = foodCount >= MAX_FOOD_COUNT

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/eggs/${params.id}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Egg
            </Button>

            {/* Hatch Card */}
            {!hatchedAnimal ? (
              <Card className="border-4 border-primary/50 bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Egg className="w-12 h-12 text-primary animate-pulse" />
                    <div>
                      <CardTitle className="font-[var(--font-pixel)] text-xl text-foreground">
                        HATCH YOUR EGG
                      </CardTitle>
                      <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                        Egg #{egg?.token_id || params.id}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Food Count Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-[var(--font-pixel)] text-xs text-foreground">
                        FOOD CONSUMED
                      </span>
                      <Badge variant={canHatch ? 'default' : 'secondary'}>
                        {foodCount} / {MAX_FOOD_COUNT}
                      </Badge>
                    </div>
                    <Progress 
                      value={(foodCount / MAX_FOOD_COUNT) * 100} 
                      className="h-3 border-2 border-primary"
                    />
                  </div>

                  {/* Validation Error */}
                  {!canHatch && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-[var(--font-pixel)] text-xs">
                        Your egg needs {MAX_FOOD_COUNT - foodCount} more food items before it can hatch.
                        Go feed it first!
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* What Happens */}
                  {canHatch && (
                    <div className="bg-secondary/30 border-2 border-primary/30 p-4 space-y-3">
                      <h3 className="font-[var(--font-pixel)] text-xs text-primary">
                        WHAT HAPPENS NEXT:
                      </h3>
                      <ul className="space-y-2 font-[var(--font-pixel)] text-xs text-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary mt-0.5" />
                          <span>Your egg will hatch into a random Animal NFT</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary mt-0.5" />
                          <span>Rarity: Common (60%), Rare (25%), Epic (12%), or Legendary (3%)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary mt-0.5" />
                          <span>Species determined by food distribution</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary mt-0.5" />
                          <span>Animal will be added to your inventory</span>
                        </li>
                      </ul>
                    </div>
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
                    onClick={handleHatch}
                    disabled={loading || !canHatch}
                    variant="clay"
                    size="clay-xl"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        HATCHING...
                      </>
                    ) : (
                      <>
                        <Egg className="mr-2 h-4 w-4" />
                        HATCH EGG
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              // Show Reveal
              <HatchReveal 
                animal={{
                  animalId: hatchedAnimal.animalId,
                  rarity: hatchedAnimal.rarity,
                  species: hatchedAnimal.species,
                  generation: hatchedAnimal.generation,
                }}
                onClaim={handleClaim}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
