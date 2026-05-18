'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/pocketbase/client'
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'

type NftType = 'egg' | 'food' | 'animal'

interface BurnNFTDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (txHash: string) => void
  initialNftId?: string
  initialNftType?: NftType
}

export function BurnNFTDialog({
  open,
  onOpenChange,
  onSuccess,
  initialNftId = '',
  initialNftType = 'egg',
}: BurnNFTDialogProps) {
  const pb = createClient()
  const [nftId, setNftId] = useState(initialNftId)
  const [nftType, setNftType] = useState<NftType>(initialNftType)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const handleBurn = async () => {
    if (!nftId.trim()) {
      setError('Please enter an NFT ID')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/v2/burn-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({
          nft_id: nftId.trim(),
          nft_type: nftType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTxHash(data.data.transaction_hash)
        setSuccess(true)
        onSuccess?.(data.data.transaction_hash)
      } else {
        setError(data.error?.message || 'Burn failed')
      }
    } catch {
      setError('Network error — failed to burn NFT')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNftId('')
    setNftType('egg')
    setError('')
    setSuccess(false)
    setTxHash('')
    setConfirmed(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Burn NFT
          </DialogTitle>
          <DialogDescription>
            This action is <strong>irreversible</strong>. Once burned, the NFT cannot be recovered.
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <>
            <div className="space-y-4 py-4">
              {/* Warning Alert */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Burning permanently destroys this NFT. The token will be removed from circulation.
                </AlertDescription>
              </Alert>

              {/* NFT Type Selection */}
              <div className="space-y-2">
                <Label>NFT Type</Label>
                <div className="flex gap-2">
                  {(['egg', 'food', 'animal'] as NftType[]).map((type) => (
                    <Button
                      key={type}
                      variant={nftType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNftType(type)}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* NFT ID Input */}
              <div className="space-y-2">
                <Label htmlFor="nft-id">NFT ID</Label>
                <Input
                  id="nft-id"
                  value={nftId}
                  onChange={(e) => setNftId(e.target.value)}
                  placeholder="Enter NFT token ID"
                  className="font-mono"
                />
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-burn"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="confirm-burn" className="text-sm text-red-600">
                  I understand this action cannot be undone
                </Label>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleBurn}
                disabled={loading || !confirmed || !nftId.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Burning...
                  </>
                ) : (
                  'Burn NFT'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold">NFT Burned Successfully</h3>
              {txHash && (
                <p className="text-sm text-on-surface-variant font-mono break-all">
                  TX: {txHash}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
