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

interface SellDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nftName: string
  nftType: 'egg' | 'food' | 'animal'
  onConfirm: (price: number) => void
}

const minPrices = {
  egg: 1,
  food: 0.5,
  animal: 5,
}

const nftTypeLabels = {
  egg: 'Egg',
  food: 'Food',
  animal: 'Animal',
}

export function SellDialog({ open, onOpenChange, nftName, nftType, onConfirm }: SellDialogProps) {
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  const minPrice = minPrices[nftType]
  const typeLabel = nftTypeLabels[nftType]

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value)
      setError('')
    }
  }

  const handleConfirm = () => {
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < minPrice) {
      setError(`Minimum price is ${minPrice} USDT`)
      return
    }
    onConfirm(priceNum)
    setPrice('')
    setError('')
    onOpenChange(false)
  }

  const handleClose = () => {
    setPrice('')
    setError('')
    onOpenChange(false)
  }

  const calculateReceive = () => {
    const priceNum = parseFloat(price)
    if (isNaN(priceNum)) return 0
    return (priceNum * 0.5).toFixed(2)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-pixel-style">Sell {typeLabel}</DialogTitle>
          <DialogDescription>
            List {nftName} on the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* NFT Preview */}
          <div className="bg-surface-container p-4 rounded-lg flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-container-high rounded-lg flex items-center justify-center text-3xl">
              {nftType === 'animal' ? '🐾' : nftType === 'egg' ? '🥚' : '🍖'}
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

          {/* Commission Preview */}
          {price && parseFloat(price) >= minPrice && (
            <div className="bg-surface-container p-4 rounded-lg space-y-2">
              <p className="text-xs text-on-surface-variant">After 50% commission:</p>
              <p className="text-xl font-black text-primary">
                {calculateReceive()} USDT
              </p>
              <p className="text-xs text-on-surface-variant">
                Commission: 50% (G1: 20%, G2-G4: 10% each)
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!price || parseFloat(price) < minPrice}
            className="flex-1 bg-primary text-on-primary hover:bg-primary/90"
          >
            List for Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}