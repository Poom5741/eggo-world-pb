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
import { approveNFTForMarketplace, createListing } from '@/lib/contracts/marketplace'
import { getSigner } from '@/lib/contracts/eggNft'
import { parseUnits } from 'ethers'

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
  const [isApproving, setIsApproving] = useState(false)
  const [isCreatingListing, setIsCreatingListing] = useState(false)
  const [step, setStep] = useState<'input' | 'approve' | 'listing'>('input')

  const minPrice = minPrices[nftType]

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value)
      setError('')
    }
  }

  const handleApproveAndList = async () => {
    try {
      const priceNum = parseFloat(price)
      if (isNaN(priceNum) || priceNum < minPrice) {
        setError(`Minimum price is ${minPrice} USDT`)
        return
      }

      const signer = await getSigner()
      
      // Step 1: Approve NFT transfer
      setIsApproving(true)
      setStep('approve')
      await approveNFTForMarketplace(signer)
      setIsApproving(false)

      // Step 2: Create listing
      setIsCreatingListing(true)
      setStep('listing')
      const priceWei = parseUnits(priceNum.toString(), 18)
      await createListing(signer, nftType, tokenId, priceWei)
      setIsCreatingListing(false)

      // Success
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Listing error:', err)
      setError(err.message || 'Failed to create listing')
      setIsApproving(false)
      setIsCreatingListing(false)
      setStep('input')
    }
  }

  const handleClose = () => {
    setPrice('')
    setError('')
    setIsApproving(false)
    setIsCreatingListing(false)
    setStep('input')
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

        {step === 'input' && (
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

            {/* Info Box */}
            <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface-container-high">
              <div className="flex items-start gap-2">
                <span className="text-xs text-on-surface-variant">
                  <strong>Note:</strong> Two-step process required:
                  <br />
                  1. Approve NFT transfer
                  <br />
                  2. Create marketplace listing
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 'approve' && (
          <div className="space-y-4 py-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
            <h3 className="text-xl font-pixel-style text-on-surface">
              Step 1/2: Approving NFT
            </h3>
            <p className="text-on-surface-variant text-sm">
              Please confirm the transaction in your wallet
            </p>
            <p className="text-xs text-on-surface-variant">
              This allows the marketplace to transfer your NFT when sold
            </p>
          </div>
        )}

        {step === 'listing' && (
          <div className="space-y-4 py-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
            <h3 className="text-xl font-pixel-style text-on-surface">
              Step 2/2: Creating Listing
            </h3>
            <p className="text-on-surface-variant text-sm">
              Please confirm the listing transaction
            </p>
          </div>
        )}

        <DialogFooter className="sm:justify-between gap-2">
          {step === 'input' ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveAndList}
                disabled={!price || parseFloat(price) < minPrice || isApproving || isCreatingListing}
                className="flex-1 bg-primary text-on-primary hover:bg-primary/90"
              >
                {isApproving ? 'Approving...' : isCreatingListing ? 'Creating...' : 'Create Listing'}
              </Button>
            </>
          ) : (
            <div className="w-full text-center text-sm text-on-surface-variant">
              Please wait for the transaction to complete...
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
