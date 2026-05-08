'use client'

import { useState, createElement as ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cancelListing } from '@/lib/pocketbase/marketplace'
import { useToast } from '@/hooks/use-toast'
import { Egg as EggIcon, PawPrint, Wheat, AlertTriangle } from 'lucide-react'

interface CancelListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingId: string
  nftName: string
  nftType: 'Egg' | 'Food' | 'Animal'
  price: number
  onSuccess: () => void
}

// NFT Icon mapping (replaces emoji characters)
const nftIconComponents = {
  Egg: EggIcon,
  Food: Wheat,
  Animal: PawPrint,
} as const

export function CancelListingDialog({
  open,
  onOpenChange,
  listingId,
  nftName,
  nftType,
  price,
  onSuccess,
}: CancelListingDialogProps) {
  const { toast } = useToast()
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    try {
      setIsCancelling(true)
      await cancelListing(listingId)
      
      toast({
        title: 'Listing Cancelled | ยกเลิก listing แล้ว',
        description: `${nftName} has been removed from marketplace | ${nftName} ถูกลบออกจาก marketplace`,
      })
      
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Cancel listing error:', err)
      toast({
        title: 'Cancel Failed | ยกเลิกไม่สำเร็จ',
        description: err?.message || 'Failed to cancel listing | ไม่สามารถยกเลิก listing ได้',
        variant: 'destructive',
      })
      setIsCancelling(false)
    }
  }

  const handleClose = () => {
    setIsCancelling(false)
    onOpenChange(false)
  }

  // Get the icon component for this NFT type (replaces emoji)
  const NftIcon = nftIconComponents[nftType] || EggIcon

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-pixel-style">Cancel Listing | ยกเลิก Listing</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this listing? | คุณต้องการยกเลิกหรือไม่?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-surface-container p-4 rounded-lg flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-container-high rounded-lg flex items-center justify-center">
              {ReactElement(NftIcon, { className: "w-8 h-8" })}
            </div>
            <div>
              <p className="font-bold text-on-surface">{nftName}</p>
              <Badge variant="outline" className="text-xs">
                {nftType.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-lg border border-error/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-on-surface-variant">ราคา | Price</span>
              <span className="font-mono font-bold text-on-surface">{price.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-surface-container-high">
              <span className="text-sm font-bold text-error">你将 Receive After Cancel</span>
              <span className="font-mono font-bold text-error">0.00 USDT</span>
            </div>
          </div>

          <div className="bg-error/10 p-3 rounded-lg border border-error/20">
            <p className="flex items-center gap-2 text-sm text-error font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Warning: Cancelling will remove this listing from the marketplace. You will need to create a new listing if you want to sell again.
            </p>
            <p className="flex items-center gap-2 text-sm text-error font-medium mt-1">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> คำเตือน: การยกเลิกจะลบ listing นี้จาก marketplace คุณจะต้องสร้าง listing ใหม่หากต้องการขายอีกครั้ง
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCancelling}
            className="flex-1"
          >
            No, Keep Listing | ไม่, เก็บไว้
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex-1"
          >
            {isCancelling ? (
              <>
                <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Cancelling...
              </>
            ) : (
              'Yes, Cancel Listing | ใช่, ยกเลิก'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
