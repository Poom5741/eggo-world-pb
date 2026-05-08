'use client'

import React from 'react'
import { EggData } from '@/hooks/use-egg-poll'
import { cn } from '@/lib/utils'

/**
 * Props for BreedingEggTooltip component
 * คุณสมบัติสำหรับคอมโพเนนต์ BreedingEggTooltip
 */
export interface BreedingEggTooltipProps {
  /** Egg data containing breeding information */
  egg: EggData
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Breeding Egg Tooltip Component
 * คอมโพเนนต์แสดงข้อมูลไข่จากการผสมพันธุ์
 * 
 * Displays parent information and generation for breeding eggs.
 * Shows as a compact info panel that can be used as a tooltip or inline display.
 * 
 * @example
 * ```tsx
 * <BreedingEggTooltip egg={egg} size="sm" />
 * ```
 */
export function BreedingEggTooltip({
  egg,
  className,
  size = 'md',
}: BreedingEggTooltipProps) {
  // Only show for breeding eggs
  if (!egg.is_breeding_egg) {
    return null
  }

  const sizeClasses = {
    sm: {
      container: 'p-2 text-[10px]',
      icon: 'text-xs',
      title: 'text-[10px]',
      value: 'text-[10px]',
    },
    md: {
      container: 'p-3 text-xs',
      icon: 'text-sm',
      title: 'text-xs',
      value: 'text-xs',
    },
    lg: {
      container: 'p-4 text-sm',
      icon: 'text-base',
      title: 'text-sm',
      value: 'text-sm',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div
      className={cn(
        'bg-tertiary-container/50 rounded-lg space-y-2',
        classes.container,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 text-on-tertiary-container">
        <span className={cn('material-symbols-outlined', classes.icon)}>
          family_history
        </span>
        <span className={cn('font-bold', classes.title)}>Breeding Lineage</span>
      </div>

      {/* Generation info */}
      <div className="flex items-center justify-between">
        <span className="text-on-surface-variant">Generation:</span>
        <span className={cn('font-mono font-bold text-tertiary', classes.value)}>
          Gen {egg.generation ?? '?'}
        </span>
      </div>

      {/* Parent info */}
      {(egg.parent1_animal_id || egg.parent2_animal_id) && (
        <div className="space-y-1 pt-1 border-t border-outline-variant/30">
          <span className="text-on-surface-variant block">Parents:</span>
          <div className="flex items-center gap-2">
            {egg.parent1_animal_id && (
              <div className="flex items-center gap-1 bg-surface-container rounded px-2 py-0.5">
                <span className="material-symbols-outlined text-[10px] text-on-surface-variant">
                  pets
                </span>
                <span className={cn('font-mono text-on-surface', classes.value)}>
                  #{egg.parent1_animal_id}
                </span>
              </div>
            )}
            <span className="text-on-surface-variant">×</span>
            {egg.parent2_animal_id && (
              <div className="flex items-center gap-1 bg-surface-container rounded px-2 py-0.5">
                <span className="material-symbols-outlined text-[10px] text-on-surface-variant">
                  pets
                </span>
                <span className={cn('font-mono text-on-surface', classes.value)}>
                  #{egg.parent2_animal_id}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint text */}
      <p className={cn('text-on-surface-variant italic', classes.value)}>
        This egg was created through breeding
      </p>
    </div>
  )
}

/**
 * Compact Breeding Badge for inline display
 * ป้ายแสดงข้อมูลการผสมพันธุ์แบบกระชับ
 */
export function BreedingBadge({
  egg,
  className,
}: {
  egg: EggData
  className?: string
}) {
  if (!egg.is_breeding_egg) {
    return null
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
        'bg-tertiary-container text-on-tertiary-container text-xs',
        className
      )}
    >
      <span className="material-symbols-outlined text-[10px]">favorite</span>
      <span className="font-medium">Gen {egg.generation ?? '?'}</span>
      {(egg.parent1_animal_id || egg.parent2_animal_id) && (
        <span className="text-on-tertiary-container/70">
          (#{egg.parent1_animal_id ?? '?'}
          ×
          #{egg.parent2_animal_id ?? '?'})
        </span>
      )}
    </div>
  )
}

export default BreedingEggTooltip
