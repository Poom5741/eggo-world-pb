'use client'

import React from 'react'
import { AnimalData } from '@/hooks/use-animal-poll'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Props for BreedingConfirmation component
 */
interface BreedingConfirmationProps {
  /** First parent animal */
  parent1: AnimalData | null
  /** Second parent animal */
  parent2: AnimalData | null
  /** Whether breeding is in progress */
  loading: boolean
  /** Breeding fee in USDT */
  breedingFee: number
  /** Callback when user confirms breeding */
  onConfirm: () => void
  /** Callback when user goes back to selection */
  onBack: () => void
}

const speciesConfig: Record<string, { icon: string; color: string }> = {
  Chicken: { icon: '🐔', color: 'text-orange-500' },
  Duck: { icon: '🦆', color: 'text-blue-400' },
  Pig: { icon: '🐷', color: 'text-pink-400' },
  Cow: { icon: '🐄', color: 'text-amber-700' },
  Sheep: { icon: '🐑', color: 'text-gray-300' },
  Dog: { icon: '🐕', color: 'text-amber-600' },
  Cat: { icon: '🐱', color: 'text-orange-300' },
  Rabbit: { icon: '🐰', color: 'text-pink-300' },
}

const rarityConfig: Record<string, { label: string; color: string }> = {
  Common: { label: 'COMMON', color: 'text-primary' },
  Rare: { label: 'RARE', color: 'text-secondary' },
  Epic: { label: 'EPIC', color: 'text-tertiary' },
  Legendary: { label: 'LEGENDARY', color: 'text-warning' },
}

/**
 * BreedingConfirmation component - Shows selected parents and confirms breeding
 * 
 * Displays the two selected parent animals side by side with a heart icon
 * Shows breeding fee and generation calculation
 */
export function BreedingConfirmation({
  parent1,
  parent2,
  loading,
  breedingFee,
  onConfirm,
  onBack,
}: BreedingConfirmationProps) {
  const canBreed = parent1 && parent2 && !loading

  // Calculate child generation
  const childGeneration = parent1 && parent2 
    ? Math.max(parent1.generation, parent2.generation) + 1
    : 0

  const renderParentCard = (animal: AnimalData | null, label: string) => {
    if (!animal) {
      return (
        <div className="bg-surface-container-low rounded-xl p-6 clay-card flex flex-col items-center justify-center min-h-[180px]">
          <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">
            pets
          </span>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Not selected</p>
        </div>
      )
    }

    const species = speciesConfig[animal.species] || { icon: '🐾', color: 'text-primary' }
    const rarity = rarityConfig[animal.rarity] || { label: 'COMMON', color: 'text-primary' }

    return (
      <div className="bg-surface-container-low rounded-xl p-6 clay-card">
        <div className="flex items-center justify-center h-24 mb-4">
          <span className={cn('text-6xl', species.color)}>
            {species.icon}
          </span>
        </div>
        <div className="text-center space-y-2">
          <h4 className="font-pixel-style text-lg text-on-surface">
            {animal.species} #{animal.animal_id}
          </h4>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="clay" className={cn('text-xs', rarity.color)}>
              {rarity.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Gen {animal.generation}
            </span>
          </div>
          {animal.rarity_upgrade_count > 0 && (
            <Badge variant="clay" className="bg-warning/20 text-warning text-xs">
              +{animal.rarity_upgrade_count} ⭐
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Parent cards */}
      <div className="grid grid-cols-2 gap-4">
        {renderParentCard(parent1, 'Parent 1')}
        {renderParentCard(parent2, 'Parent 2')}
      </div>

      {/* Heart connector */}
      {parent1 && parent2 && (
        <div className="flex items-center justify-center -my-2">
          <div className="bg-secondary/20 rounded-full p-3">
            <span className="material-symbols-outlined text-3xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </div>
        </div>
      )}

      {/* Breeding info */}
      <div className="bg-surface-container rounded-xl p-4 clay-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Child Generation</span>
          <span className="font-bold text-on-surface">
            {childGeneration > 0 ? `Gen ${childGeneration}` : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Breeding Fee</span>
          <span className="font-bold text-on-surface flex items-center gap-1">
            {breedingFee} USDT
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Cooldown</span>
          <span className="font-bold text-on-surface">48 hours</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="clay-outline"
          size="clay-lg"
          className="flex-1"
          onClick={onBack}
          disabled={loading}
        >
          <span className="material-symbols-outlined mr-2">arrow_back</span>
          Back
        </Button>
        <Button
          variant="clay"
          size="clay-lg"
          className="flex-1"
          onClick={onConfirm}
          disabled={!canBreed}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin mr-2">sync</span>
              Breeding...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined mr-2">favorite</span>
              Breed Now
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default BreedingConfirmation
