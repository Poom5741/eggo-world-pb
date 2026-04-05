'use client'

import { useState, useCallback } from 'react'
import { getSigner, getEggNftContract, getFoodCount, parseEggHatchedEvent, Rarity, Species } from '@/lib/contracts/eggNft'
import { useToast } from '@/hooks/use-toast'

/**
 * Animal NFT data structure (หลังฟักไข่)
 * ข้อมูล Animal NFT ที่ได้หลังฟักไข่
 */
export interface AnimalData {
  token_id: number
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  species: string
  element: string
  generation: number
}

/**
 * Return type for useEggHatch hook
 * ประเภทข้อมูลที่ถูกส่งกลับจาก hook
 */
export interface UseEggHatchReturn {
  hatchEggTransaction: (eggId: number) => Promise<AnimalData | null>
  loading: boolean
  error: string | null
}

/**
 * Hook for managing egg hatching flow
 * Hook สำหรับจัดการกระบวนการฟักไข่
 * 
 * Handles:
 * - Verifying egg has 10 food items
 * - Calling hatchEgg contract function
 * - Waiting for transaction confirmation
 * - Fetching Animal NFT metadata post-hatch
 * 
 * @returns Object with hatch function, loading state, and error
 * 
 * @example
 * ```typescript
 * const { hatchEggTransaction, loading, error } = useEggHatch()
 * const animal = await hatchEggTransaction(eggId)
 * ```
 */
export function useEggHatch(): UseEggHatchReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  /**
   * Hatch an egg and return Animal NFT data
   * ฟักไข่และส่งกลับข้อมูล Animal NFT
   * 
   * @param eggId - The egg ID to hatch (must have 10 food items)
   * @returns AnimalData if successful, null if failed
   */
  const hatchEggTransaction = useCallback(async (eggId: number): Promise<AnimalData | null> => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Verify egg is ready (ต้องมีอาหาร 10 ชิ้น)
      const signer = await getSigner()
      const foodCount = await getFoodCount(signer, eggId)
      
      if (foodCount < 10) {
        throw new Error('Egg needs 10 food items before hatching')
      }

      // Step 2: Call hatchEgg contract function
      const contract = getEggNftContract(signer)
      toast({
        title: 'Hatching...',
        description: 'Wait for blockchain confirmation',
      })

      const tx = await contract.hatchEgg(eggId)
      
      // Step 3: Wait for transaction confirmation
      toast({
        title: 'Transaction submitted',
        description: 'Waiting for confirmation...',
      })

      const receipt = await tx.wait()
      
      // Parse EggHatched event to get animal token ID and properties
      const event = parseEggHatchedEvent(receipt)
      
      if (!event) {
        throw new Error('Failed to parse EggHatched event')
      }

      toast({
        title: 'Hatch successful!',
        description: `Your ${Rarity[event.rarity]} ${Species[event.species]} is ready!`,
        variant: 'default',
      })

      // Step 4: Return Animal metadata
      // แมป rarity จาก enum เป็น string
      const rarityMap: Record<number, 'Common' | 'Rare' | 'Epic' | 'Legendary'> = {
        0: 'Common',
        1: 'Rare',
        2: 'Epic',
        3: 'Legendary',
      }

      // แมป species เป็น element
      const elementMap: Record<Species, string> = {
        [Species.Chicken]: 'Fire',
        [Species.Quail]: 'Earth',
        [Species.Duck]: 'Water',
        [Species.Peacock]: 'Earth',
        [Species.Swan]: 'Water',
        [Species.Turkey]: 'Fire',
        [Species.Phoenix]: 'Fire',
        [Species.GoldenChicken]: 'Earth',
        [Species.SilverDuck]: 'Water',
        [Species.Dragon]: 'Fire',
        [Species.Unicorn]: 'Earth',
        [Species.Gryphon]: 'Aero',
      }

      const animalData: AnimalData = {
        token_id: event.animalId,
        rarity: rarityMap[event.rarity] || 'Common',
        species: Species[event.species],
        element: elementMap[event.species] || 'Normal',
        generation: 0, // First generation
      }

      return animalData
    } catch (err: any) {
      // Handle errors
      setError(err.message)
      toast({
        title: 'Hatch failed',
        description: err.message || 'Unknown error occurred',
        variant: 'destructive',
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    hatchEggTransaction,
    loading,
    error,
  }
}
