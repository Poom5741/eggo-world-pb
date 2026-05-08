'use client'

import { useState, useCallback } from 'react'
import { upgradeEggRarity, getSigner } from '@/lib/contracts/eggNft'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/pocketbase/client'

interface UseEggFeedReturn {
  feedEgg: (eggId: number, foodIds: number[]) => Promise<boolean>
  loading: boolean
  error: string | null
}

export function useEggFeed(useBackendApi?: boolean): UseEggFeedReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const feedEgg = useCallback(async (eggId: number, foodIds: number[]): Promise<boolean> => {
    if (foodIds.length !== 10) {
      const errorMsg = `Must feed exactly 10 food items (got ${foodIds.length})`
      setError(errorMsg)
      toast({
        title: 'Feed Failed',
        description: errorMsg,
        variant: 'destructive',
      })
      return false
    }

    setLoading(true)
    setError(null)

    try {
      if (useBackendApi) {
        const pb = createClient()
        const token = pb.authStore.token
        const apiUrl = pb.baseUrl || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'

        const response = await fetch(`${apiUrl}/api/v2/feed-egg`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            egg_token_id: eggId,
            food_ids: foodIds,
          }),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || 'Feed API failed')
        }

        toast({
          title: 'Success!',
          description: 'Egg fed successfully! 10 food items added',
        })
        return true
      }

      const signer = await getSigner()
      const txHash = await upgradeEggRarity(signer, eggId, foodIds)

      toast({
        title: 'Feeding Submitted',
        description: 'Waiting for blockchain confirmation...',
      })

      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new (await import('ethers')).BrowserProvider((window as any).ethereum)
        const receipt = await provider.waitForTransaction(txHash)

        if (receipt.status === 1) {
          toast({
            title: 'Success!',
            description: 'Egg fed successfully! 10 food items added',
          })
          return true
        } else {
          throw new Error('Transaction failed')
        }
      }

      return true
    } catch (err: any) {
      const errorMsg = err.message || 'Feed transaction failed'
      setError(errorMsg)
      toast({
        title: 'Feed Failed',
        description: errorMsg,
        variant: 'destructive',
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast, useBackendApi])

  return {
    feedEgg,
    loading,
    error,
  }
}
