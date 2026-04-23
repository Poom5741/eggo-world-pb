"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/pocketbase/client"
import { Loader2, AlertCircle, CheckCircle2, DollarSign } from "lucide-react"
import { SpeciesIcon, type SpeciesType } from "@/components/icons/species-icons"

export interface AnimalData {
  animal_id: number
  species: string
  rarity: string
  generation: number
  owner: string
}

interface ListAnimalDialogProps {
  animal: AnimalData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (listingId: string) => void
}

const speciesConfig: Record<string, SpeciesType> = {
  Chicken: "Chicken",
  Duck: "Duck",
  Pig: "Pig",
  Cow: "Cow",
  Sheep: "Sheep",
  Dog: "Dog",
  Cat: "Cat",
  Rabbit: "Rabbit",
}

const rarityConfig: Record<string, { label: string; color: string }> = {
  Common: { label: "COMMON", color: "text-primary" },
  Rare: { label: "RARE", color: "text-secondary" },
  Epic: { label: "EPIC", color: "text-tertiary" },
  Legendary: { label: "LEGENDARY", color: "text-warning" },
}

export function ListAnimalDialog({ animal, open, onOpenChange, onSuccess }: ListAnimalDialogProps) {
  const [price, setPrice] = useState<string>("")
  const [step, setStep] = useState<"input" | "confirm" | "success" | "error">("input")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_listingId, setListingId] = useState<string | null>(null)
  const [hasActiveListing, setHasActiveListing] = useState(false)
  const [checkingListing, setCheckingListing] = useState(true)

  const pb = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!animal || !open) return
    
    const checkExistingListing = async () => {
      setCheckingListing(true)
      try {
        const token = pb.authStore.token
        if (!token) {
          setCheckingListing(false)
          return
        }
        
        const response = await fetch(`/api/v2/list-animal?animal_id=${animal.animal_id}`, {
          method: 'GET',
          headers: {
            'Authorization': token
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          // Check if any active listing exists for this animal
          const hasActive = result.data?.some?.(
            (listing: any) => listing.animal_id === animal.animal_id && listing.status === 'active'
          )
          setHasActiveListing(hasActive || false)
        }
      } catch (err) {
        console.error('Failed to check existing listings:', err)
      } finally {
        setCheckingListing(false)
      }
    }
    
    checkExistingListing()
  }, [animal, open, pb.authStore.token])

  if (!animal) return null

  const speciesType: SpeciesType | null = speciesConfig[animal.species] ?? null
  const rarity = rarityConfig[animal.rarity] || { label: "COMMON", color: "text-primary" }

  const handlePriceChange = (value: string) => {
    // Validate numeric input with up to 2 decimal places
    const numericRegex = /^\d*\.?\d{0,2}$/
    if (numericRegex.test(value) || value === "") {
      setPrice(value)
      setError(null)
    }
  }

  const handleSubmitPrice = () => {
    const priceNum = parseFloat(price)
    if (!price || priceNum <= 0) {
      setError("Please enter a valid price greater than 0")
      return
    }
    setStep("confirm")
  }

  const handleConfirmListing = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = pb.authStore.token
      if (!token) {
        throw new Error("Not authenticated")
      }

      const response = await fetch("/api/v2/list-animal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify({
          animal_id: animal.animal_id,
          price: parseFloat(price)
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Listing failed")
      }

      setListingId(result.data.listing_id)
      setStep("success")
      onSuccess?.(result.data.listing_id)

    } catch (err: any) {
      setError(err.message)
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    const wasSuccess = step === "success"
    setPrice("")
    setStep("input")
    setError(null)
    setListingId(null)
    onOpenChange(false)
    if (wasSuccess) {
      router.push('/marketplace')
    }
  }

  const priceNum = parseFloat(price) || 0
  const sellerAmount = priceNum * 0.85 // 85% after fees
  const platformFee = priceNum * 0.04
  const royaltyFee = priceNum * 0.10

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-body flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            List Animal for Sale
          </DialogTitle>
          <DialogDescription>
            Set your price and list this Animal NFT on the marketplace
          </DialogDescription>
        </DialogHeader>

        {/* Animal Info */}
        <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
          {speciesType ? (
            <SpeciesIcon species={speciesType} size="lg" />
          ) : (
            <span className="text-3xl">🐾</span>
          )}
          <div>
            <p className="font-medium">{animal.species} #{animal.animal_id}</p>
            <p className={cn("text-xs font-bold", rarity.color)}>
              {rarity.label} • Gen {animal.generation}
            </p>
          </div>
        </div>

        {/* Step: Price Input */}
        {step === "input" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="price" className="font-body text-xs">
                Price (USDT)
              </Label>
              <Input
                id="price"
                type="text"
                placeholder="0.00"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="mt-2 text-lg font-bold"
                disabled={loading}
              />
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}
            </div>

            <Button
              onClick={handleSubmitPrice}
              disabled={!price || parseFloat(price) <= 0 || hasActiveListing || checkingListing}
              className="w-full font-body"
            >
              {hasActiveListing ? "Already Listed" : checkingListing ? "Checking..." : "Continue to Confirmation"}
            </Button>

            {hasActiveListing && (
              <p className="text-xs text-warning flex items-center gap-1 mt-2">
                This animal already has an active listing on the marketplace.
              </p>
            )}
          </div>
        )}

        {/* Step: Confirmation */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-body text-sm mb-3">Fee Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Listed Price</span>
                  <span className="font-bold">${priceNum.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Fee (4%)</span>
                  <span>-${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Royalty to Referrers (10%)</span>
                  <span>-${royaltyFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Misc Fee (1%)</span>
                  <span>-${(priceNum * 0.01).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-primary">
                  <span>You Receive</span>
                  <span>${sellerAmount.toFixed(2)} USDT</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Listing stays active until sold or manually cancelled
            </p>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmListing}
                disabled={loading}
                className="font-body"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    LISTING...
                  </>
                ) : (
                  `List for $${priceNum.toFixed(2)} USDT`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
            <h3 className="font-body text-lg">Listing Created!</h3>
            <p className="text-muted-foreground">
              Your {animal.species} #{animal.animal_id} is now listed for ${priceNum.toFixed(2)} USDT
            </p>
            <Badge variant="clay" className="font-body">
              Active on Marketplace
            </Badge>
            <Button onClick={handleClose} className="w-full font-body">
              Done
            </Button>
          </div>
        )}

        {/* Step: Error */}
        {step === "error" && (
          <div className="text-center py-6 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h3 className="font-body text-lg text-destructive">Listing Failed</h3>
            <p className="text-muted-foreground">{error}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("input")}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ListAnimalDialog