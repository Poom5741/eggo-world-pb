'use client'

import React from 'react'
import { AnimalData } from '@/hooks/use-animal-poll'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCooldownRemaining, calculateCooldownRemaining } from '@/hooks/use-breeding'

/**
 * Props for AnimalSelectionGrid component
 */
interface AnimalSelectionGridProps {
  /** List of user's animals */
  animals: AnimalData[]
  /** Currently selected animal IDs */
  selectedIds: number[]
  /** Callback when an animal is selected/deselected */
  onSelect: (animalId: number) => void
  /** Maximum number of animals that can be selected */
  maxSelection?: number
  /** Whether the grid is loading */
  loading?: boolean
  /** ID of animal to exclude from selection (e.g., already selected as parent1) */
  excludeAnimalId?: number | null
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

const rarityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  Common: { label: 'COMMON', color: 'text-primary', bgColor: 'bg-primary/10' },
  Rare: { label: 'RARE', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  Epic: { label: 'EPIC', color: 'text-tertiary', bgColor: 'bg-tertiary/10' },
  Legendary: { label: 'LEGENDARY', color: 'text-warning', bgColor: 'bg-warning/10' },
}

/**
 * AnimalSelectionGrid component - Grid for selecting animals for breeding
 * 
 * Displays user's animals in a grid with selection state and cooldown indicators
 */
export function AnimalSelectionGrid({
  animals,
  selectedIds,
  onSelect,
  maxSelection = 2,
  loading = false,
  excludeAnimalId = null,
}: AnimalSelectionGridProps) {
  const filteredAnimals = animals.filter(a => a.animal_id !== excludeAnimalId)

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-container-low rounded-xl p-4 clay-card animate-pulse"
          >
            <div className="h-24 bg-surface-container rounded-lg mb-3" />
            <div className="h-4 w-20 bg-surface-container rounded mb-2" />
            <div className="h-3 w-16 bg-surface-container rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (filteredAnimals.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">
          pets
        </span>
        <p className="text-sm text-muted-foreground">
          {excludeAnimalId 
            ? 'No other animals available for breeding'
            : 'No animals available'
          }
        </p>
      </div>
    )
  }

  return (
    <div 
      className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-2"
      role="list"
      aria-label="Available animals for breeding"
    >
      {filteredAnimals.map((animal) => {
        const species = speciesConfig[animal.species] || { icon: '🐾', color: 'text-primary' }
        const rarity = rarityConfig[animal.rarity] || { label: 'COMMON', color: 'text-primary', bgColor: 'bg-primary/10' }
        const isSelected = selectedIds.includes(animal.animal_id)
        const canSelect = isSelected || selectedIds.length < maxSelection
        
        // Check cooldown status
        const cooldownRemaining = calculateCooldownRemaining(animal.last_bred_at)
        const onCooldown = cooldownRemaining > 0
        const cooldownText = formatCooldownRemaining(cooldownRemaining)

        return (
          <div
            key={animal.id}
            role="listitem"
            className={cn(
              'relative rounded-xl p-4 cursor-pointer transition-all duration-200',
              'bg-surface-container-low clay-card',
              isSelected && 'ring-2 ring-primary bg-primary/5',
              !canSelect && !isSelected && 'opacity-50 cursor-not-allowed',
              onCooldown && 'opacity-70'
            )}
            onClick={() => {
              if (onCooldown) return
              if (isSelected || canSelect) {
                onSelect(animal.animal_id)
              }
            }}
            aria-pressed={isSelected}
            aria-disabled={onCooldown || (!canSelect && !isSelected)}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Badge variant="clay" className="bg-primary text-on-primary">
                  <span className="material-symbols-outlined text-xs">check</span>
                </Badge>
              </div>
            )}

            {/* Cooldown badge */}
            {onCooldown && (
              <div className="absolute top-2 right-2">
                <Badge variant="clay" className="bg-warning/20 text-warning text-xs">
                  <span className="material-symbols-outlined text-xs mr-1">timer</span>
                  {cooldownText}
                </Badge>
              </div>
            )}

            {/* Animal icon */}
            <div className="flex items-center justify-center h-20 mb-3">
              <span className={cn('text-5xl', species.color)}>
                {species.icon}
              </span>
            </div>

            {/* Animal info */}
            <div className="text-center space-y-1">
              <h4 className="font-pixel-style text-sm text-on-surface">
                {animal.species} #{animal.animal_id}
              </h4>
              <div className="flex items-center justify-center gap-2">
                <Badge 
                  variant="clay" 
                  className={cn('text-xs', rarity.bgColor, rarity.color)}
                >
                  {rarity.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Gen {animal.generation}
                </span>
              </div>
            </div>

            {/* Disabled overlay for cooldown */}
            {onCooldown && (
              <div className="absolute inset-0 bg-black/10 rounded-xl flex items-center justify-center">
                <div className="bg-surface-container-high rounded-lg px-3 py-2 shadow-clay-sm">
                  <span className="text-xs font-bold text-warning">
                    Cooldown: {cooldownText}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default AnimalSelectionGrid
