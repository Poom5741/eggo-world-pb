'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/pocketbase/client'

/**
 * Animal NFT data structure
 * โครงสร้างข้อมูล Animal NFT
 */
export interface AnimalData {
  id: string
  animal_id: number
  token_id: number
  species: string
  rarity: string
  generation: number
  rarity_upgrade_count: number
  owner: string
  contract_address: string
  minted_at: string
  parent_egg_id?: number
  parent1_animal_id?: number
  parent2_animal_id?: number
}

/**
 * Return type for useAnimalPoll hook
 * ประเภทข้อมูลที่ถูกส่งกลับจาก hook
 */
interface UseAnimalPollReturn {
  animals: AnimalData[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  polling: boolean
  lastUpdated: Date | null
}

/**
 * Auto-polling hook for animal NFTs
 * Hook สำหรับดึงข้อมูล Animal NFT อัตโนมัติทุก 30 วินาที
 * 
 * @param walletAddress - Wallet address to query animals for
 * @param intervalMs - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @returns Object with animals array, loading state, error, and refresh function
 */
export function useAnimalPoll(
  walletAddress: string | undefined,
  intervalMs: number = 30000
): UseAnimalPollReturn {
  const [animals, setAnimals] = useState<AnimalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAnimals = useCallback(async () => {
    if (!walletAddress || walletAddress === 'null' || walletAddress === '') {
      setAnimals([])
      setLoading(false)
      return
    }

    try {
      const pb = createClient()
      
      // Get user ID from wallet address
      const users = await pb.collection('users').getList(1, 1, {
        filter: `wallet = "${walletAddress}"`,
      })
      
      if (users.items.length === 0) {
        setAnimals([])
        setLoading(false)
        return
      }

      const userId = users.items[0].id

      // Fetch animal NFTs owned by user
      const records = await pb.collection('animal_nfts').getList(1, 100, {
        filter: `owner = "${userId}"`,
        sort: '-minted_at',
      })

      const animalData: AnimalData[] = records.items.map((record: any) => ({
        id: record.id,
        animal_id: record.animal_id,
        token_id: record.token_id,
        species: record.species,
        rarity: record.rarity,
        generation: record.generation,
        rarity_upgrade_count: record.rarity_upgrade_count || 0,
        owner: record.owner,
        contract_address: record.contract_address,
        minted_at: record.minted_at,
        parent_egg_id: record.parent_egg_id,
        parent1_animal_id: record.parent1_animal_id,
        parent2_animal_id: record.parent2_animal_id,
      }))

      setAnimals(animalData)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching animals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch animals')
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  // Initial fetch and set up polling
  useEffect(() => {
    setLoading(true)
    fetchAnimals()

    // Set up polling - โพลทุก 30 วินาที
    const intervalId = setInterval(() => {
      setPolling(true)
      fetchAnimals().finally(() => setPolling(false))
    }, intervalMs)

    return () => clearInterval(intervalId)
  }, [fetchAnimals, intervalMs])

  return {
    animals,
    loading,
    error,
    refresh: fetchAnimals,
    polling,
    lastUpdated,
  }
}