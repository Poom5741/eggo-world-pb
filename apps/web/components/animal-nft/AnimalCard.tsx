'use client'

import React from 'react'
import { AnimalData } from '@/hooks/use-animal-poll'
import { Badge } from '@/components/ui/badge'
import { CooldownTimer } from '@/components/breeding/CooldownTimer'
import { cn } from '@/lib/utils'

/**
 * Props for AnimalCard component
 * คุณสมบัติสำหรับคอมโพเนนต์ AnimalCard
 */
export interface AnimalCardProps {
  animal: AnimalData
  onSell?: (animal: AnimalData) => void
  onBreed?: (animal: AnimalData) => void
  polling?: boolean
  showBreedButton?: boolean
  /** Show cooldown timer (for breeding context) */
  showCooldown?: boolean
  /** Cooldown duration in hours (default: 48) */
  cooldownHours?: number
  /** Show "Listed by [user]" badge for marketplace context */
  listedBy?: string
  /** Marketplace price display */
  listingPrice?: number
}

const speciesConfig: Record<string, { icon: string; color: string }> = {
  Chicken: { icon: '🐔', color: 'text-orange-500' },
  Duck: { icon: '🦆', color: 'text-blue-400' },
  Pig: { icon: '🐷', color: 'text-pink-400' },
  Cow: { icon: '🐄', color: 'text-brown-500' },
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
 * Check if an animal is currently on breeding cooldown
 * ตรวจสอบว่าสัตว์อยู่ในระยะ cooldown หรือไม่
 */
function isOnCooldown(lastBredAt: string, cooldownHours: number = 48): boolean {
  const lastBred = new Date(lastBredAt).getTime()
  const cooldownMs = cooldownHours * 60 * 60 * 1000
  const cooldownEnd = lastBred + cooldownMs
  return Date.now() < cooldownEnd
}

export function AnimalCard({ 
  animal, 
  onSell, 
  onBreed, 
  polling, 
  showBreedButton = false,
  showCooldown = false,
  cooldownHours = 48,
  listedBy,
  listingPrice,
}: AnimalCardProps) {
  const species = speciesConfig[animal.species] || { icon: '🐾', color: 'text-primary' }
  const rarity = rarityConfig[animal.rarity] || { label: 'COMMON', color: 'text-primary' }

  return (
    <div className={cn(
      "bg-surface-container-lowest p-6 rounded-xl clay-card",
      "hover:-translate-y-2 transition-transform duration-300"
    )}>
      {/* Animal Image Section - ส่วนแสดงรูปภาพสัตว์ */}
      <div className="bg-surface-container h-48 rounded-lg mb-6 flex items-center justify-center inner-dip overflow-hidden relative">
        {polling && (
          <Badge variant="clay" className="absolute top-2 right-2 animate-pulse gap-1">
            <span className="material-symbols-outlined text-xs animate-spin">sync</span>
            Updating...
          </Badge>
        )}
        <div className="text-7xl pixelated">
          {species.icon}
        </div>
      </div>

      {/* Animal Info Section - ส่วนข้อมูลสัตว์ */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-pixel-style text-xl text-on-surface">
            {animal.species} #{animal.animal_id}
          </h3>
          <p className={cn("text-xs font-bold", rarity.color)}>
            {rarity.label} • Gen {animal.generation}
          </p>
        </div>
        {animal.rarity_upgrade_count > 0 && (
          <Badge variant="clay" className="bg-warning/20 text-warning">
            +{animal.rarity_upgrade_count} 🌟
          </Badge>
        )}
        {/* Listed by badge (D-14) - for marketplace context */}
        {listedBy && (
          <Badge variant="outline" className="text-xs mt-2">
            Listed by {listedBy}
          </Badge>
        )}
        
        {/* Marketplace price display */}
        {listingPrice && (
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-2xl font-bold text-primary">
              ${listingPrice.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">USDT</span>
          </div>
        )}
      </div>

      {/* Minted Date - วันที่ mint */}
      <div className="text-xs text-on-surface-variant mb-2">
        Minted: {new Date(animal.minted_at).toLocaleDateString()}
      </div>

      {/* Cooldown Timer - แสดงเมื่ออยู่ในโหมด breeding */}
      {showCooldown && (
        <div className="mb-4">
          <CooldownTimer
            lastBredAt={animal.last_bred_at}
            cooldownHours={cooldownHours}
            size="md"
            showLabel
          />
        </div>
      )}

      {/* Action Buttons - ปุ่มกด */}
      <div className="space-y-3">
        {showBreedButton && onBreed && (
          <button
            onClick={() => onBreed(animal)}
            disabled={!!animal.last_bred_at && isOnCooldown(animal.last_bred_at, cooldownHours)}
            className={cn(
              "w-full py-3 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-colors",
              animal.last_bred_at && isOnCooldown(animal.last_bred_at, cooldownHours)
                ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                : "bg-primary text-on-primary hover:bg-primary/80"
            )}
          >
            <span className="material-symbols-outlined text-base">
              {animal.last_bred_at && isOnCooldown(animal.last_bred_at, cooldownHours) ? 'timer' : 'favorite'}
            </span>
            {animal.last_bred_at && isOnCooldown(animal.last_bred_at, cooldownHours) 
              ? 'On Cooldown' 
              : 'Breed'}
          </button>
        )}
        {onSell && (
          <button
            onClick={() => onSell(animal)}
            className="w-full py-3 bg-secondary text-on-secondary rounded-full font-black text-sm hover:bg-secondary/80 transition-colors"
          >
            Sell
          </button>
        )}
      </div>
    </div>
  )
}

export default AnimalCard