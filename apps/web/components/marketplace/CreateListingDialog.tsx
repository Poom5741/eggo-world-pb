'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/pocketbase/client'

interface CreateListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nftName: string
  nftType: 'Egg' | 'Food' | 'Animal'
  tokenId: string
  onSuccess: () => void
}

const minPrices = {
  Egg: 1,
  Food: 0.5,
  Animal: 5,
}

// คำนวณส่วนแบ่ง commission 50%
// G1: 20%, G2: 10%, G3: 10%, G4: 10%, Seller: 50%
function calculateCommission(price: number) {
  const g1 = price * 0.20
  const g2 = price * 0.10
  const g3 = price * 0.10
  const g4 = price * 0.10
  const seller = price * 0.50
  
  return { g1, g2, g3, g4, seller, total: price }
}

export function CreateListingDialog({
  open,
  onOpenChange,
  nftName,
  nftType,
  tokenId,
  onSuccess,
}: CreateListingDialogProps) {
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')
  const [isCreatingListing, setIsCreatingListing] = useState(false)

  const minPrice = minPrices[nftType]

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value)
      setError('')
    }
  }

  const handleCreateListing = async () => {
    try {
      const priceNum = parseFloat(price)
      if (isNaN(priceNum) || priceNum < minPrice) {
        setError(`Minimum price is ${minPrice} USDT`)
        return
      }

      setIsCreatingListing(true)

      // Call PocketBase API to create listing
      const pb = createClient()
      const response = await fetch('/api/v2/list-animal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({
          animal_id: parseInt(tokenId),
          price: priceNum,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create listing')
      }

      setIsCreatingListing(false)
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Listing error:', err)
      setError(err.message || 'Failed to create listing')
      setIsCreatingListing(false)
    }
  }

  const handleClose = () => {
    setPrice('')
    setError('')
    setIsCreatingListing(false)
    onOpenChange(false)
  }

  const calculateReceive = () => {
    const priceNum = parseFloat(price)
    if (isNaN(priceNum)) return 0
    return (priceNum * 0.5).toFixed(2)
  }

  const commission = price ? calculateCommission(parseFloat(price)) : null

  // NFT Icon mapping
  const nftIcon = {
    Egg: '🥚',
    Food: '🍖',
    Animal: '🐾',
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-pixel-style">Create Listing</DialogTitle>
          <DialogDescription>
            List your NFT on the marketplace
          </DialogDescription>
        </DialogHeader>

        {isCreatingListing ? (
          <div className="space-y-4 py-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
            <h3 className="text-xl font-pixel-style text-on-surface">
              Creating Listing...
            </h3>
            <p className="text-on-surface-variant text-sm">
              Please wait while we create your listing
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* NFT Preview */}
            <div className="bg-surface-container p-4 rounded-lg flex items-center gap-4">
              <div className="w-16 h-16 bg-surface-container-high rounded-lg flex items-center justify-center text-3xl">
                {nftIcon[nftType]}
              </div>
              <div>
                <p className="font-bold text-on-surface">{nftName}</p>
                <Badge variant="outline" className="text-xs">
                  {nftType.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface">
                Asking Price (USDT)
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={`Min ${minPrice}`}
                  value={price}
                  onChange={handlePriceChange}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                  USDT
                </span>
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>

            {/* Commission Breakdown */}
            {price && parseFloat(price) >= minPrice && commission && (
              <div className="bg-surface-container p-4 rounded-lg space-y-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase">
                  Commission Breakdown (50%)
                </p>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">G1 (20%)</span>
                    <span className="text-on-surface font-medium">{commission.g1.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">G2 (10%)</span>
                    <span className="text-on-surface font-medium">{commission.g2.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">G3 (10%)</span>
                    <span className="text-on-surface font-medium">{commission.g3.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">G4 (10%)</span>
                    <span className="text-on-surface font-medium">{commission.g4.toFixed(2)} USDT</span>
                  </div>
                </div>

                <div className="border-t border-surface-container-high pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-primary">You'll Receive</span>
                    <span className="text-lg font-black text-primary">
                      {calculateReceive()} USDT
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-between gap-2">
          {!isCreatingListing && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateListing}
                disabled={!price || parseFloat(price) < minPrice || isCreatingListing}
                className="flex-1 bg-primary text-on-primary hover:bg-primary/90"
              >
                {isCreatingListing ? 'Creating...' : 'Create Listing'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
