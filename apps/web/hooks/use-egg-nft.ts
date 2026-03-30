"use client"

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/pocketbase/client'

interface EggProperties {
  egg_id: number
  owner: string
  food_count: number
  is_hatched: boolean
  rarity_seed: number
  referral_chain: string[]
}

interface MintResult {
  token_id: number
  egg_id: number
  tx_hash: string
  food_count: number
  is_hatched: boolean
  rarity_seed: number
  referral_chain: string[]
}

interface ClaimResult {
  claimed_amount: string
  tx_hash: string
  records_count: number
}

export function useEggNft() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mintEgg = useCallback(async (referrerId?: string): Promise<MintResult | null> => {
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
          referrer_id: referrerId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Mint failed')
      }

      return result.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getEggProperties = useCallback(async (tokenId: number): Promise<EggProperties | null> => {
    try {
      const pb = createClient()
      const records = await pb.collection('egg_nfts').getList(1, 1, {
        filter: `token_id = ${tokenId}`
      })

      if (records.items.length === 0) {
        return null
      }

      const egg = records.items[0]
      return {
        egg_id: egg.egg_id,
        owner: egg.owner,
        food_count: egg.food_count,
        is_hatched: egg.is_hatched,
        rarity_seed: egg.rarity_seed,
        referral_chain: egg.referral_chain || []
      }
    } catch (err) {
      console.error('Failed to get egg properties:', err)
      return null
    }
  }, [])

  const getCommissionBalance = useCallback(async (address: string): Promise<number> => {
    try {
      // This would call the contract directly via wallet-api
      // For now, we fetch from PocketBase
      const pb = createClient()
      const records = await pb.collection('commission_records').getList(1, 100, {
        filter: `user.wallet = "${address}" && claimed = false`
      })

      return records.items.reduce((sum: number, record: any) => {
        return sum + parseFloat(record.amount || '0')
      }, 0)
    } catch (err) {
      console.error('Failed to get commission balance:', err)
      return 0
    }
  }, [])

  const claimCommission = useCallback(async (): Promise<ClaimResult | null> => {
    setLoading(true)
    setError(null)

    try {
      const pb = createClient()
      const token = pb.authStore.token

      const response = await fetch('https://pb.eggoworld.io/api/v2/claim-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Claim failed')
      }

      return result.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getUserEggs = useCallback(async (userId: string) => {
    try {
      const pb = createClient()
      const records = await pb.collection('egg_nfts').getList(1, 50, {
        filter: `owner = "${userId}"`,
        sort: '-minted_at'
      })

      return records.items
    } catch (err) {
      console.error('Failed to get user eggs:', err)
      return []
    }
  }, [])

  const getUserCommissions = useCallback(async (userId: string) => {
    try {
      const pb = createClient()
      const records = await pb.collection('commission_records').getList(1, 100, {
        filter: `user = "${userId}"`,
        sort: '-created'
      })

      return records.items
    } catch (err) {
      console.error('Failed to get user commissions:', err)
      return []
    }
  }, [])

  return {
    loading,
    error,
    mintEgg,
    getEggProperties,
    getCommissionBalance,
    claimCommission,
    getUserEggs,
    getUserCommissions
  }
}
