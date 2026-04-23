'use client'

import { useState, createElement as ReactElement } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { updateListingPrice } from '@/lib/pocketbase/marketplace'
import { Egg as EggIcon, PawPrint, Wheat } from 'lucide-react'

interface UpdatePriceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingId: string
  currentPrice: number
  nftType: 'Egg' | 'Food' | 'Animal'
  nftName: string
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

export function UpdatePriceDialog({
  open,
  onOpenChange,
  listingId,
  currentPrice,
  nftType,
  nftName,
  onSuccess,
}: UpdatePriceDialogProps) {
  const { toast } = useToast()
  const [price, setPrice] = useState(currentPrice.toString())
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const minPrice = minPrices[nftType]

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value)
      setError('')
    }
  }

  const handleUpdatePrice = async () => {
    try {
      const priceNum = parseFloat(price)
      if (isNaN(priceNum) || priceNum < minPrice) {
        setError(`Minimum price is ${minPrice} USDT`)
        return
      }

      setIsUpdating(true)
      
      await updateListingPrice(listingId, priceNum)
      
      toast({
        title: 'อัปเดตราคาสำเร็จ | Price Updated',
        description: `ราคาใหม่: ${priceNum.toFixed(2)} USDT`,
      })
      
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Update price error:', err)
      toast({
        title: 'เกิดข้อผิดพลาด | Error',
        description: err.message || 'ไม่สามารถอัปเดตราคาได้ | Failed to update price',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    setPrice(currentPrice.toString())
    setError('')
    setIsUpdating(false)
    onOpenChange(false)
  }

  const calculateReceive = () => {
    const priceNum = parseFloat(price)
    if (isNaN(priceNum)) return 0
    return (priceNum * 0.5).toFixed(2)
  }

  const commission = price ? calculateCommission(parseFloat(price)) : null
  const priceNum = parseFloat(price)
  const isValidPrice = !isNaN(priceNum) && priceNum >= minPrice

  // NFT Icon mapping (replaces emoji characters)
  const nftIconComponents = {
    Egg: EggIcon,
    Food: Wheat,
    Animal: PawPrint,
  } as const

  const NftIconComponent = nftIconComponents[nftType] || EggIcon

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-pixel-style">แก้ไขราคา | Edit Price</DialogTitle>
          <DialogDescription>
            ปรับราคา listing ของคุณ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* NFT Preview */}
          <div className="bg-surface-container p-4 rounded-lg flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-container-high rounded-lg flex items-center justify-center">
              {ReactElement(NftIconComponent, { className: "w-8 h-8" })}
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
              ราคาใหม่ (USDT) | New Price (USDT)
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder={`Min ${minPrice}`}
                value={price}
                onChange={handlePriceChange}
                className="pr-12"
                disabled={isUpdating}
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
          {isValidPrice && commission && (
            <div className="bg-surface-container p-4 rounded-lg space-y-3">
              <p className="text-xs font-bold text-on-surface-variant uppercase">
                ส่วนแบ่งและค่าธรรมเนียม | Commission Breakdown (50%)
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
                  <span className="text-sm font-bold text-primary">คุณจะได้รับ | You'll Receive</span>
                  <span className="text-lg font-black text-primary">
                    {calculateReceive()} USDT
                  </span>
                </div>
              </div>

              {/* Price Change Indicator */}
              {priceNum !== currentPrice && (
                <div className="bg-surface-container-lowest p-2 rounded-lg mt-2">
                  <p className="text-xs text-on-surface-variant text-center">
                    ราคาเดิม: {currentPrice.toFixed(2)} USDT → ราคาใหม่: {priceNum.toFixed(2)} USDT
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface-container-high">
            <div className="flex items-start gap-2">
              <span className="text-xs text-on-surface-variant">
                <strong>หมายเหตุ | Note:</strong> การแก้ไขราคาจะไม่ส่งผลต่อ listing ที่ขายแล้ว
                <br />
                <strong>Note:</strong> Price changes do not affect sold listings
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isUpdating}
          >
            ยกเลิก | Cancel
          </Button>
          <Button
            onClick={handleUpdatePrice}
            disabled={!price || parseFloat(price) < minPrice || isUpdating || (parseFloat(price) === currentPrice)}
            className="flex-1 bg-primary text-on-primary hover:bg-primary/90"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                กำลังอัปเดต | Updating...
              </>
            ) : (
              'อัปเดตราคา | Update Price'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
