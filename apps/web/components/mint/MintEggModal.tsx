"use client"

import { useState } from 'react'
import { createClient } from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Egg, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const MINT_PRICE = 25

interface MintEggModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MintEggModal({ isOpen, onClose, onSuccess }: MintEggModalProps) {
  const [loading, setLoading] = useState(false)
  const [referrerId, setReferrerId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleMint = async () => {
    setLoading(true)
    setError(null)

    try {
      const pb = createClient()
      const token = pb.authStore.token
      
      const response = await fetch('https://pb.eggoworld.io/api/v2/mint-egg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          referrer_id: referrerId || undefined
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        let errorMessage = 'Mint failed'
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMessage = result.error
          } else if (typeof result.error === 'object' && result.error !== null) {
            if (typeof result.error.message === 'string') {
              errorMessage = result.error.message
            } else if (result.error.message && typeof result.error.message === 'object') {
              errorMessage = JSON.stringify(result.error.message)
            } else {
              errorMessage = JSON.stringify(result.error)
            }
          }
        }
        throw new Error(errorMessage)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        variant="clay" 
        className="max-w-md rounded-[2rem] shadow-clay-lg bg-[var(--surface-container)]"
      >
        <DialogHeader variant="clay">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-[var(--primary-container)] rounded-[2rem] flex items-center justify-center shadow-clay-md">
              <Egg className="w-10 h-10 text-[var(--on-primary-container)]" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-[var(--on-surface)] text-center">
            Mint Your Egg NFT
          </DialogTitle>
          <DialogDescription className="text-center">
            Start your collection with this exclusive NFT membership
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="clay-card-inset bg-[var(--surface)] rounded-[2rem] p-6 text-center">
            <p className="text-sm text-[var(--on-surface-variant)] mb-2">Price</p>
            <p className="text-4xl font-bold text-[var(--primary)]">
              {MINT_PRICE} FOOD
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referrer" className="text-[var(--on-surface-variant)]">
              Referrer ID (Optional)
            </Label>
            <Input
              id="referrer"
              placeholder="Enter referrer ID"
              value={referrerId}
              onChange={(e) => setReferrerId(e.target.value)}
              className="clay-input rounded-2xl border-[var(--outline-variant)] bg-[var(--surface-bright)] text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]/50"
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-2xl bg-[var(--error-container)] border-none">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-[var(--on-error-container)]">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--tertiary)]" />
            <span>Egg NFT will be minted to your wallet</span>
          </div>
        </div>

        <DialogFooter variant="clay">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl font-bold border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMint}
            disabled={loading}
            className="rounded-2xl font-bold bg-[var(--primary-container)] text-[var(--on-primary-container)] hover:scale-105 transition-transform shadow-clay-md disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <Egg className="w-4 h-4 mr-2" />
                Mint Egg
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
