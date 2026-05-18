"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle, Egg } from 'lucide-react'
import { createClient } from '@/lib/pocketbase/client'

interface BuyEggFlowProps {
  onSuccess?: (data: { eggId: number; txHash: string }) => void
  onError?: (error: Error) => void
}

const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pb.eggoworld.io'

export function BuyEggFlow({ onSuccess, onError }: BuyEggFlowProps) {
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ eggId: number; txHash: string } | null>(null)
  const pb = createClient()

  const handleApproveUSDT = async (): Promise<boolean> => {
    setApproving(true)
    try {
      // USDT approval via PocketBase backend
      const response = await fetch(`${pbUrl}/api/v2/wallet/approve-usdt`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pb.authStore.token}`
        },
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

      // Step 2: Purchase egg via PocketBase backend
      const response = await fetch(`${pbUrl}/api/v2/mint-egg`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pb.authStore.token}`
        },
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        let errorMessage = 'Purchase failed'
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
        className="w-full font-body text-sm h-12 border-4 border-primary/50 hover:border-primary"
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
          <AlertDescription className="font-body text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-primary/20 border-primary">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription className="font-body text-xs">
            Successfully purchased Egg NFT!
            <br />
            Egg ID: {success.eggId}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
