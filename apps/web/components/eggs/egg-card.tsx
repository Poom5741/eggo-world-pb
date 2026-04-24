'use client'

import React, { useState } from 'react'
import { EggData } from '@/hooks/use-egg-poll'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BreedingBadge } from './BreedingEggTooltip'
import { RarityUpgradeDialog } from './rarity-upgrade-dialog'
import { cn } from '@/lib/utils'
import { Sparkles, Star } from 'lucide-react'

/**
 * Props for EggCard component
 * คุณสมบัติสำหรับคอมโพเนนต์ EggCard
 */
export interface EggCardProps {
  egg: EggData
  onManage: (eggId: number) => void
  onHatch?: (egg: EggData) => void
  onSell?: (egg: EggData) => void  // ฟังก์ชันขาย NFT
  onPlay?: (egg: EggData) => void  // ฟังก์ชัน Play button
  onUpgrade?: (egg: EggData) => void  // ฟังก์ชันอัปเกรดความหายาก
  polling?: boolean
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
 * Egg NFT card component with claymorphism styling
 * การ์ดแสดง Egg NFT พร้อมสไตล์ claymorphism
 * 
 * Displays egg image, name, rarity badge, element type,
 * feeding progress bar (X/10), and "Manage Egg" button
 */
export function EggCard({ egg, onManage, onHatch, onSell, onPlay, onUpgrade, polling }: EggCardProps) {
  // State for upgrade dialog
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  
  // Calculate progress percentage
  const progressPercent = (egg.food_count / 10) * 100
  
  // Get rarity info
  const rarity = getRarity(egg.rarity_seed)
  
  return (
    <div className={cn(
      "bg-surface-container-lowest p-6 rounded-xl clay-card",
      "hover:-translate-y-2 transition-transform duration-300",
      egg.food_count >= 10 && !egg.is_hatched && "animate-pulse-glow ring-2 ring-warning"
    )}>
      {/* Egg Image Section - ส่วนแสดงรูปภาพไข่ */}
      <div className="bg-surface-container h-48 rounded-lg mb-6 flex items-center justify-center inner-dip overflow-hidden relative">
        {/* "Updating..." badge during polling - ป้าย "Updating..." ขณะกำลังโพล */}
        {polling && (
          <Badge variant="clay" className="absolute top-2 right-2 animate-pulse gap-1">
            <span className="material-symbols-outlined text-xs animate-spin">sync</span>
            Updating...
          </Badge>
        )}
        {/* Breeding egg badge - ป้ายไข่จากการผสมพันธุ์ */}
        {egg.is_breeding_egg && (
          <Badge 
            variant="clay" 
            className="absolute top-2 left-2 bg-tertiary-container text-on-tertiary-container gap-1"
          >
            <span className="material-symbols-outlined text-xs">favorite</span>
            Breeding Egg
          </Badge>
        )}
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
            {egg.is_breeding_egg && egg.generation !== undefined && (
              <span className="ml-1 text-tertiary">• Gen {egg.generation}</span>
            )}
          </p>
          {/* Breeding badge for breeding eggs */}
          {egg.is_breeding_egg && (
            <BreedingBadge egg={egg} className="mt-1.5" />
          )}
        </div>
        {/* Food count badge - แสดงจำนวนอาหาร */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-primary font-black">
            {egg.food_count}
          </div>
          {egg.food_count >= 10 && !egg.is_hatched && (
            <span
              className="material-symbols-outlined text-warning text-xl animate-pulse-glow"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sparkle
            </span>
          )}
        </div>
      </div>
      
      {/* Progress Section - ส่วนแสดงความคืบหน้า */}
      <div className="space-y-2 mb-6">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
          <span>FEEDING PROGRESS</span>
          <span>
            {egg.food_count >= 10 && !egg.is_hatched
              ? "Ready to hatch!"
              : `${egg.food_count}/10 food — ${10 - egg.food_count} more to hatch`}
          </span>
        </div>
      </div>
      
      {/* Play Button - ปุ่มเล่น (shows for all eggs) */}
      {onPlay && (
        <button
          onClick={() => onPlay(egg)}
          className="w-full py-3 bg-tertiary text-on-tertiary rounded-full font-bold text-sm hover:bg-tertiary-container transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">sports_esports</span>
          {egg.is_hatched ? 'Daily Check-In' : 'Play'}
        </button>
      )}
      
      {/* Manage Button - ปุ่มจัดการ */}
      <div className="space-y-3">
        {onSell && (
          <button
            onClick={() => onSell(egg)}
            className="w-full py-3 bg-secondary text-on-secondary rounded-full font-black text-sm hover:bg-secondary/80 transition-colors"
          >
            Sell
          </button>
        )}
        
        <button
          onClick={() => onManage(egg.egg_id)}
          className="w-full py-3 bg-surface-container-high rounded-full font-bold text-sm text-primary hover:bg-primary-container transition-colors"
        >
          Manage Egg
        </button>
        
        {/* HATCH button - shows when egg has 10 food items and not hatched */}
        {egg.food_count >= 10 && !egg.is_hatched && onHatch && (
          <button
            onClick={() => onHatch && onHatch(egg)}
            className="w-full py-3 bg-primary text-on-primary rounded-full font-black text-lg hover:bg-primary-fixed-dim transition-colors shadow-lg"
          >
            <Sparkles className="inline w-5 h-5 mr-1" /> HATCH!
          </button>
        )}
        
        {/* UPGRADE button - shows when egg has 10 food items and not hatched */}
        {egg.food_count >= 10 && !egg.is_hatched && onUpgrade && (
          <button
            onClick={() => setShowUpgradeDialog(true)}
            className="w-full py-3 bg-tertiary-container text-on-tertiary-container rounded-full font-black text-sm hover:bg-tertiary transition-colors flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" /> UPGRADE
          </button>
        )}
      </div>
      
      {/* Rarity Upgrade Dialog */}
      {onUpgrade && egg.food_count >= 10 && !egg.is_hatched && (
        <RarityUpgradeDialog
          egg={egg}
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          onSuccess={() => {
            setShowUpgradeDialog(false)
            onUpgrade(egg)
          }}
        />
      )}
    </div>
  )
}

export default EggCard
