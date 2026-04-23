"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/pocketbase/client'
import { AlertCircle, CheckCircle2, Tag } from 'lucide-react'

interface ListForSaleModalProps {
  nftId: string
  onSuccess?: () => void
}

/**
 * Modal component for listing NFT for sale
 * ส่วนประกอบโมดอลสำหรับลงขาย NFT
 */
export function ListForSaleModal({ nftId, onSuccess }: ListForSaleModalProps) {
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleList = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const priceNum = parseFloat(price)
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Invalid price. Please enter a valid number greater than 0.')
      }

      // Update NFT in PocketBase
      await createClient().collection('nfts').update(nftId, {
        is_listed: true,
        listed_price: priceNum
      })

      setSuccess(true)
      setPrice('')

      // Close modal after 2 seconds
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        onSuccess?.()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to list NFT for sale')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-body text-sm border-2 border-primary/50 hover:border-primary">
          <Tag className="w-4 h-4 mr-2" />
          List for Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-body text-lg text-foreground">
            List NFT for Sale
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="font-body text-xs text-foreground">
              Price (USDT)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="font-body text-xs border-2 border-primary/50 bg-background"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Set your asking price in USDT
            </p>
          </div>

          {success && (
            <Alert className="bg-primary/20 border-primary">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="font-body text-xs">
                NFT listed successfully!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-body text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleList}
            disabled={loading || !price}
            variant="clay"
            size="clay-md"
            className="w-full"
          >
            {loading ? (
              <>
                <Tag className="mr-2 h-4 w-4 animate-spin" />
                Listing...
              </>
            ) : (
              <>
                <Tag className="mr-2 h-4 w-4" />
                List for Sale
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
