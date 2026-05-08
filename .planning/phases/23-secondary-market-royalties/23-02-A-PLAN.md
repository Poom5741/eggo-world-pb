---
phase: 23-secondary-market-royalties
plan: 02-A
type: execute
wave: 2
depends_on:
  - 23-01-PLAN.md
files_modified:
  - apps/web/components/animal-nft/ListAnimalDialog.tsx
  - apps/web/components/animal-nft/AnimalCard.tsx
autonomous: true
requirements:
  - RESALE-01
must_haves:
  truths:
    - User can open listing dialog from AnimalCard "Sell" button
    - Dialog shows price input with confirmation step
    - Dialog displays fee breakdown (85% seller, 10% royalty, 4% platform)
    - AnimalCard shows "Listed by [username]" badge in marketplace context
  artifacts:
    - path: apps/web/components/animal-nft/ListAnimalDialog.tsx
      provides: Listing creation modal with price input and confirmation
      exports:
        - ListAnimalDialog component
    - path: apps/web/components/animal-nft/AnimalCard.tsx
      provides: Modified card with "Listed by" badge variant
      contains: ListedByBadge prop variant
  key_links:
    - from: ListAnimalDialog
      to: POST /api/v2/list-animal
      via: fetch with Authorization header
      pattern: fetch('/api/v2/list-animal', { method: 'POST', body: { animal_id, price } })
---

<objective>
Create UI components for Animal NFT listing dialog and AnimalCard modification with "Listed by" badge.

Purpose: Enable users to list Animal NFTs with price confirmation flow per RESALE-01, and display marketplace context in AnimalCard per D-14.
Output: ListAnimalDialog with two-step flow, AnimalCard with listedBy/listingPrice props.
</objective>

<execution_context>
@/Users/poom-work/tokenine/eggo-pocketbase/.qwen/get-shit-done/workflows/execute-plan.md
@/Users/poom-work/tokenine/eggo-pocketbase/.qwen/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/23-secondary-market-royalties/23-CONTEXT.md
@.planning/phases/23-secondary-market-royalties/23-RESEARCH.md

## Reference Patterns

### Dialog Pattern (from FeedDialog.tsx)

```typescript
// Use Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
// Price input with number validation
// Confirmation step before submission
```

### AnimalCard Component (existing)

```typescript
// apps/web/components/animal-nft/AnimalCard.tsx
export interface AnimalCardProps {
  animal: AnimalData
  onSell?: (animal: AnimalData) => void
  onBreed?: (animal: AnimalData) => void
  // Add: listedBy?: string for "Listed by" badge per D-14
}
```

### Species Options (from animal_nfts.json)

- Chicken, Duck, Pig, Cow, Sheep, Dog, Cat, Rabbit (8 types)
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Create ListAnimalDialog Component</name>
  <files>apps/web/components/animal-nft/ListAnimalDialog.tsx</files>
  <read_first>
    - apps/web/components/egg/FeedDialog.tsx — dialog pattern with confirmation
    - apps/web/components/ui/dialog.tsx — shadcn/ui Dialog components
    - apps/web/components/ui/input.tsx — shadcn/ui Input component
    - apps/web/components/animal-nft/AnimalCard.tsx — existing onSell handler location
    - apps/web/lib/pocketbase/client.ts — PocketBase client and auth patterns
  </read_first>
  <action>Create the ListAnimalDialog component at apps/web/components/animal-nft/ListAnimalDialog.tsx:

```typescript
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/pocketbase/client"
import { Loader2, AlertCircle, CheckCircle2, DollarSign } from "lucide-react"

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

const speciesConfig: Record<string, { icon: string }> = {
  Chicken: { icon: "🐔" },
  Duck: { icon: "🦆" },
  Pig: { icon: "🐷" },
  Cow: { icon: "🐄" },
  Sheep: { icon: "🐑" },
  Dog: { icon: "🐕" },
  Cat: { icon: "🐱" },
  Rabbit: { icon: "🐰" },
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
  const [listingId, setListingId] = useState<string | null>(null)

  const pb = createClient()

  if (!animal) return null

  const species = speciesConfig[animal.species] || { icon: "🐾" }
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
    setPrice("")
    setStep("input")
    setError(null)
    setListingId(null)
    onOpenChange(false)
  }

  const priceNum = parseFloat(price) || 0
  const sellerAmount = priceNum * 0.85 // 85% after fees
  const platformFee = priceNum * 0.04
  const royaltyFee = priceNum * 0.10

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-pixel)] flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            List Animal for Sale
          </DialogTitle>
          <DialogDescription>
            Set your price and list this Animal NFT on the marketplace
          </DialogDescription>
        </DialogHeader>

        {/* Animal Info */}
        <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
          <span className="text-3xl">{species.icon}</span>
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
              <Label htmlFor="price" className="font-[var(--font-pixel)] text-xs">
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
              disabled={!price || parseFloat(price) <= 0}
              className="w-full font-[var(--font-pixel)]"
            >
              Continue to Confirmation
            </Button>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-[var(--font-pixel)] text-sm mb-3">Fee Breakdown</h4>
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
                className="font-[var(--font-pixel)]"
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
            <h3 className="font-[var(--font-pixel)] text-lg">Listing Created!</h3>
            <p className="text-muted-foreground">
              Your {animal.species} #{animal.animal_id} is now listed for ${priceNum.toFixed(2)} USDT
            </p>
            <Badge variant="clay" className="font-[var(--font-pixel)]">
              Active on Marketplace
            </Badge>
            <Button onClick={handleClose} className="w-full font-[var(--font-pixel)]">
              Done
            </Button>
          </div>
        )}

        {/* Step: Error */}
        {step === "error" && (
          <div className="text-center py-6 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h3 className="font-[var(--font-pixel)] text-lg text-destructive">Listing Failed</h3>
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
```

Key implementation details per D-01, D-02, D-26:

- Two-step flow: price input → confirmation with fee breakdown
- Shows 85% seller amount, 10% royalty, 4% platform fee
- Calls POST /api/v2/list-animal with Authorization header
- Success state shows listing confirmation
- Error handling for cooldown, ownership, validation failures</action>
  <verify>
  <automated>grep -q "export function ListAnimalDialog" apps/web/components/animal-nft/ListAnimalDialog.tsx && grep -q "/api/v2/list-animal" apps/web/components/animal-nft/ListAnimalDialog.tsx && grep -q "sellerAmount.*0.85" apps/web/components/animal-nft/ListAnimalDialog.tsx && grep -q "royaltyFee.*0.10" apps/web/components/animal-nft/ListAnimalDialog.tsx && grep -q "platformFee.*0.04" apps/web/components/animal-nft/ListAnimalDialog.tsx && grep -q "step.*confirm" apps/web/components/animal-nft/ListAnimalDialog.tsx && grep -q "speciesConfig" apps/web/components/animal-nft/ListAnimalDialog.tsx</automated>
  </verify>
  <done>ListAnimalDialog.tsx exists with two-step flow (input → confirm), fee breakdown display (85% seller, 10% royalty, 4% platform), POST /api/v2/list-animal call, success/error states per D-01, D-02, D-26</done>
  </task>

<task type="auto">
  <name>Task 2: Add "Listed by" Badge to AnimalCard</name>
  <files>apps/web/components/animal-nft/AnimalCard.tsx</files>
  <read_first>
    - apps/web/components/animal-nft/AnimalCard.tsx — existing component to modify
    - apps/web/components/ui/badge.tsx — Badge component for listed variant
    - apps/web/components/marketplace/AnimalListingsSection.tsx — reference for badge styling
  </read_first>
  <action>Modify AnimalCard.tsx to add the `listedBy` prop for displaying "Listed by [user]" badge:

Add to the AnimalCardProps interface:

```typescript
export interface AnimalCardProps {
  animal: AnimalData
  onSell?: (animal: AnimalData) => void
  onBreed?: (animal: AnimalData) => void
  polling?: boolean
  showBreedButton?: boolean
  showCooldown?: boolean
  cooldownHours?: number
  /** Show "Listed by [user]" badge for marketplace context */
  listedBy?: string
  /** Marketplace price display */
  listingPrice?: number
}
```

In the component body, after the rarity badge section (around line 98), add the listedBy badge:

```typescript
{/* Listed by badge (D-14) - for marketplace context */}
{listedBy && (
  <Badge variant="outline" className="text-xs mt-2">
    Listed by {listedBy}
  </Badge>
)}

{/* Marketplace price display */}
{listingPrice && (
  <div className="flex items-baseline gap-1 mb-4">
    <span className="text-2xl font-bold text-primary">
      ${listingPrice.toFixed(2)}
    </span>
    <span className="text-sm text-muted-foreground">USDT</span>
  </div>
)}
```

Update the component signature to accept the new props:

```typescript
export function AnimalCard({
  animal,
  onSell,
  onBreed,
  polling,
  showBreedButton = false,
  showCooldown = false,
  cooldownHours = 48,
  listedBy,
  listingPrice,
}: AnimalCardProps) {
```

Full modification:

1. Add `listedBy?: string` and `listingPrice?: number` to AnimalCardProps interface (line 23)
2. Add props to function signature
3. Add listedBy badge rendering after the rarity upgrade badge section (around line 100)
4. Add listingPrice display section before the action buttons</action>
   <verify>
   <automated>grep -q "listedBy.*string" apps/web/components/animal-nft/AnimalCard.tsx && grep -q "listingPrice.*number" apps/web/components/animal-nft/AnimalCard.tsx && grep -q "Listed by" apps/web/components/animal-nft/AnimalCard.tsx</automated>
   </verify>
   <done>AnimalCard.tsx has listedBy and listingPrice props with "Listed by" badge and price display for marketplace context per D-14</done>
   </task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary              | Description                                         |
| --------------------- | --------------------------------------------------- |
| Frontend → Backend    | PocketBase auth token required for listing creation |
| Frontend → PocketBase | Collection query with user-scoped access rules      |

## STRIDE Threat Register

| Threat ID | Category    | Component   | Disposition | Mitigation Plan                              |
| --------- | ----------- | ----------- | ----------- | -------------------------------------------- |
| T-23-08   | Spoofing    | Dialog auth | mitigate    | Authorization header from pb.authStore.token |
| T-23-09   | Tampering   | Price input | mitigate    | Numeric validation with regex, > 0 check     |
| T-23-10   | Information | Seller name | accept      | Username display is public information       |

</threat_model>

<verification>
1. ListAnimalDialog renders: Import and mount in test page
2. AnimalCard has listedBy badge: Test with marketplace listing data
</verification>

<success_criteria>

- ListAnimalDialog.tsx exists with two-step flow, fee breakdown, POST /api/v2/list-animal call
- AnimalCard.tsx has listedBy and listingPrice props for marketplace context
  </success_criteria>

<output>
After completion, create `.planning/phases/23-secondary-market-royalties/23-02-A-SUMMARY.md`
</output>
