'use client'

import React from 'react'
import { EggData } from '@/hooks/use-egg-poll'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Props for EggCard component
 * คุณสมบัติสำหรับคอมโพเนนต์ EggCard
 */
export interface EggCardProps {
  egg: EggData
  onManage: (eggId: number) => void
}

/**
 * Determine rarity from rarity_seed
 * ระบุความหายากจาก rarity_seed
 */
function getRarity(raritySeed?: number): { label: string; color: string } {
  if (raritySeed === undefined) {
    return { label: 'COMMON', color: 'text-primary' }
  }
  
  // Rarity distribution per PROJECT.md
  if (raritySeed < 60) {
    return { label: 'COMMON', color: 'text-primary' } // Gray/Common
  } else if (raritySeed < 85) {
    return { label: 'RARE', color: 'text-secondary' } // Blue/Rare
  } else if (raritySeed < 97) {
    return { label: 'EPIC', color: 'text-tertiary' } // Purple/Epic
  } else {
    return { label: 'LEGENDARY', color: 'text-warning' } // Gold/Legendary
  }
}

/**
 * Determine status based on food_count and is_hatched
 * ระบุสถานะตาม food_count และ is_hatched
 */
function getStatus(foodCount: number, isHatched: boolean): string {
  if (isHatched) {
    return 'Hatched'
  }
  if (foodCount >= 10) {
    return 'Ready' // Ready to hatch
  }
  if (foodCount > 0) {
    return 'Feeding'
  }
  return 'Ready' // Can start feeding
}

/**
 * Egg NFT card component with claymorphism styling
 * การ์ดแสดง Egg NFT พร้อมสไตล์ claymorphism
 * 
 * Displays egg image, name, rarity badge, element type,
 * feeding progress bar (X/10), and "Manage Egg" button
 */
export function EggCard({ egg, onManage }: EggCardProps) {
  // Calculate progress percentage
  const progressPercent = (egg.food_count / 10) * 100
  
  // Get rarity info
  const rarity = getRarity(egg.rarity_seed)
  
  // Get status
  const status = getStatus(egg.food_count, egg.is_hatched)
  
  return (
    <div className={cn(
      "bg-surface-container-lowest p-6 rounded-xl clay-card",
      "hover:-translate-y-2 transition-transform duration-300"
    )}>
      {/* Egg Image Section - ส่วนแสดงรูปภาพไข่ */}
      <div className="bg-surface-container h-48 rounded-lg mb-6 flex items-center justify-center inner-dip overflow-hidden">
        <img
          alt={`Egg ${egg.egg_id}`}
          className="h-32 object-contain"
          src={`https://lh3.googleusercontent.com/aida-public/AB6AXuArNLnmNvAkODM70eUgnmaz3HJr2TPaOkpkjtqQAFcQBaccoxS9iU2Eb-FEZRgc2KxcFUOwMJnB8nMapguLLgqOp3bmD4F-W-xEVSNest6m7ibKhI3Ior2k2f1SqwhE3o7UIV5ofXBLaAFcngLCne-N8QIZTXAYIHOHlkrTWRU87Yx102ki4Llf4f_IGojdN3NCOiCsF_K00KsluNl0SG2eL37Ia9TiMXNH9BWKiGN9yIIHM8D22Rak2gpO84fOlTLIVWzvfyi8-j6c`}
        />
      </div>
      
      {/* Egg Info Section - ส่วนข้อมูลไข่ */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-pixel-style text-xl text-on-surface">
            Egg #{egg.egg_id}
          </h3>
          <p className={cn("text-xs font-bold", rarity.color)}>
            {rarity.label} • {egg.element_type || 'NORMAL'}
          </p>
        </div>
        {/* Food count badge - แสดงจำนวนอาหาร */}
        <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-primary font-black">
          {egg.food_count}
        </div>
      </div>
      
      {/* Progress Section - ส่วนแสดงความคืบหน้า */}
      <div className="space-y-2 mb-6">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
          <span>FEEDING PROGRESS</span>
          <span>{egg.food_count}/10 food items</span>
        </div>
      </div>
      
      {/* Manage Button - ปุ่มจัดการ */}
      <button
        onClick={() => onManage(egg.egg_id)}
        className="w-full py-3 bg-surface-container-high rounded-full font-bold text-sm text-primary hover:bg-primary-container transition-colors"
      >
        Manage Egg
      </button>
    </div>
  )
}

export default EggCard
