'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/pocketbase/client'
import { toast } from 'sonner'

/**
 * Breeding result data structure
 */
export interface BreedingResult {
  breeding_egg_id: string
  token_id: number
  generation: number
  parent1_animal_id: number
  parent2_animal_id: number
  tx_hash: string
  fee_deducted: number
}

/**
 * Return type for useBreeding hook
 */
interface UseBreedingReturn {
  loading: boolean
  error: string | null
  breedAnimals: (parent1AnimalId: number, parent2AnimalId: number) => Promise<BreedingResult | null>
  clearError: () => void
}

/**
 * Breeding cooldown duration in milliseconds (48 hours)
 */
export const BREEDING_COOLDOWN_MS = 48 * 60 * 60 * 1000 // 48 hours

/**
 * Calculate remaining cooldown time
 * @param lastBredAt - ISO string of last breeding time
 * @returns Remaining cooldown in milliseconds (0 if cooldown has passed)
 */
export function calculateCooldownRemaining(lastBredAt: string | null | undefined): number {
  if (!lastBredAt) return 0
  
  const lastBred = new Date(lastBredAt).getTime()
  const now = Date.now()
  const elapsed = now - lastBred
  
  return Math.max(0, BREEDING_COOLDOWN_MS - elapsed)
}

/**
 * Format cooldown remaining as human-readable string
 * @param remainingMs - Remaining milliseconds
 * @returns Formatted string like "2h 30m" or "Ready"
 */
export function formatCooldownRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return 'Ready'
  
  const hours = Math.floor(remainingMs / (60 * 60 * 1000))
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Check if an animal is on breeding cooldown
 * @param lastBredAt - ISO string of last breeding time
 * @returns boolean indicating if animal is on cooldown
 */
export function isOnCooldown(lastBredAt: string | null | undefined): boolean {
  return calculateCooldownRemaining(lastBredAt) > 0
}

/**
 * Hook for breeding animals
 * Provides breedAnimals function with loading/error states
 */
export function useBreeding(): UseBreedingReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const breedAnimals = useCallback(async (
    parent1AnimalId: number,
    parent2AnimalId: number
  ): Promise<BreedingResult | null> => {
    setLoading(true)
    setError(null)

    try {
      const pb = createClient()
      
      const response = await pb.send('/api/v2/breed-animals', {
        method: 'POST',
        body: {
          parent1_animal_id: parent1AnimalId,
          parent2_animal_id: parent2AnimalId,
        },
      })

      if (!response.success) {
        let errorMessage = 'Failed to breed animals'
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error
          } else if (typeof response.error === 'object' && response.error !== null) {
            if (typeof response.error.message === 'string') {
              errorMessage = response.error.message
            } else if (response.error.message && typeof response.error.message === 'object') {
              errorMessage = JSON.stringify(response.error.message)
            } else {
              errorMessage = JSON.stringify(response.error)
            }
          }
        }
        throw new Error(errorMessage)
      }

      toast.success('Breeding successful! A new egg has been created.')
      return response.data as BreedingResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error(`Breeding failed: ${errorMessage}`)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    breedAnimals,
    clearError,
  }
}
