"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle, Egg } from 'lucide-react'

interface BuyEggFlowProps {
  onSuccess?: (data: { eggId: number; txHash: string }) => void
  onError?: (error: Error) => void
}

export function BuyEggFlow({ onSuccess, onError }: BuyEggFlowProps) {
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ eggId: number; txHash: string } | null>(null)

  const handleApproveUSDT = async (): Promise<boolean> => {
    setApproving(true)
    try {
      // Mock USDT approval - in real implementation, this would call wallet API
      const response = await fetch('/api/wallet/approve-usdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error('USDT approval failed')
      }
      
      return true
    } catch (err: any) {
      setError(err.message || 'USDT approval failed')
      onError?.(err)
      return false
    } finally {
      setApproving(false)
    }
  }

  const handlePurchase = async () => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Approve USDT
      const approved = await handleApproveUSDT()
      if (!approved) return

      // Step 2: Purchase egg
      const response = await fetch('/api/v2/mint-egg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Purchase failed')
      }

      setSuccess({ eggId: result.data.egg_id, txHash: result.data.tx_hash })
      onSuccess?.({ eggId: result.data.egg_id, txHash: result.data.tx_hash })
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePurchase}
        disabled={loading || approving || !!success}
        className="w-full font-[var(--font-pixel)] text-sm h-12 border-4 border-primary/50 hover:border-primary"
      >
        {approving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            APPROVING USDT...
          </>
        ) : loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            PURCHASING...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            PURCHASED!
          </>
        ) : (
          <>
            <Egg className="mr-2 h-4 h-4" />
            BUY EGG (25 USDT)
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-[var(--font-pixel)] text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-primary/20 border-primary">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription className="font-[var(--font-pixel)] text-xs">
            Successfully purchased Egg NFT!
            <br />
            Egg ID: {success.eggId}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
