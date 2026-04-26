'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FoodCard, FoodType } from '@/components/food-nft/FoodCard'
import { useFoodNft } from '@/hooks/use-food-nft'
import { createClient } from '@/lib/pocketbase/client'
import { EggData } from '@/hooks/use-egg-poll'

/**
 * Rarity tiers for guaranteed minimums
 */
const RARITY_TIERS = [
  { level: 'LEGENDARY', minItems: 500, color: 'bg-yellow-500' },
  { level: 'EPIC', minItems: 200, color: 'bg-purple-500' },
  { level: 'RARE', minItems: 50, color: 'bg-blue-500' },
] as const

/**
 * Calculate guaranteed tier based on food count (after upgrade)
 */
function getGuaranteedTier(foodCount: number): string | null {
  if (foodCount >= 10 + 500) return 'LEGENDARY' // 100% Legendary
  if (foodCount >= 10 + 200) return 'EPIC'      // Cannot roll below Epic
  if (foodCount >= 10 + 50) return 'RARE'       // Cannot roll below Rare
  return null // No guarantee at base level or low upgrade count
}

/**
 * Calculate probability bars based on food count
 */
function getProbabilityBars(foodCount: number): { common: number; rare: number; epic: number; legendary: number } {
  const extraFood = Math.max(0, foodCount - 10) // Food beyond base 10
  
  // Base probabilities (before upgrade bonus)
  let common = 60
  let rare = 25
  let epic = 12
  let legendary = 3
  
  // Apply +2% bonus per extra food item (capped at 100%)
  if (extraFood > 0) {
    const bonus = Math.min(extraFood * 2, 40) // Max 40% bonus to legendary
    
    // Redistribute: reduce common/rare, increase epic/legendary
    common = Math.max(0, common - bonus / 3)
    rare = Math.max(5, rare - bonus / 4)
    epic = Math.min(97, epic + bonus / 2)
    legendary = Math.min(100, legendary + bonus)
  }
  
  // Apply tier guarantees (clamp probabilities)
  if (extraFood >= 200) {
    common = 0 // Cannot roll Common at Epic+ tier
    rare = 0   // Cannot roll Rare at Epic+ tier
    epic = Math.min(97, epic + rare + common)
  } else if (extraFood >= 50) {
    common = 0 // Cannot roll Common at Rare+ tier
    rare = Math.min(85, rare + common)
  }
  
  return { common: Math.round(common), rare: Math.round(rare), epic: Math.round(epic), legendary: Math.round(legendary) }
}

/**
 * Props for RarityUpgradeDialog component
 */
interface RarityUpgradeDialogProps {
  /** ข้อมูลไข่ที่ต้องการอัปเกรดความหายาก */
  egg: EggData
  /** สถานะเปิด/ปิดของ dialog */
  open: boolean
  /** Callback เมื่อสถานะ open เปลี่ยนแปลง */
  onOpenChange: (open: boolean) => void
  /** Callback เมื่ออัปเกรดสำเร็จ */
  onSuccess: () => void
}

/**
 * RarityUpgradeDialog component - Dialog สำหรับอัปเกรดความหายากของไข่ NFT
 * 
 * Manual food selection grid: แสดง food NFTs ใน grid 2 คอลัมน์
 * ผู้ใช้สามารถเลือกสูงสุด 490 รายการ (รวมกับ 10 base = 500)
 * แสดง probability bars และ guaranteed tier แบบ real-time
 */
export function RarityUpgradeDialog({ egg, open, onOpenChange, onSuccess }: RarityUpgradeDialogProps) {
  const { upgradeRarity, loading, getUserFoodNfts } = useFoodNft()
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([])
  const [foodItems, setFoodItems] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)

  /**
   * Fetch available food เมื่อ dialog เปิด
   */
  useEffect(() => {
    if (!open) return
    
    let cancelled = false
    const loadFood = async () => {
      setFetching(true)
      const pb = createClient()
      const user = pb.authStore.record
      if (user && !cancelled) {
        const foods = await getUserFoodNfts(user.id)
        // Filter: exclude food already used in this egg's feed history
        const availableFoods = (foods || []).filter((f: any) => f.token_id !== String(egg.token_id))
        if (!cancelled) {
          setFoodItems(availableFoods)
        }
      }
      if (!cancelled) {
        setFetching(false)
      }
    }
    loadFood()
    
    // Cleanup: prevent state updates if dialog closes during fetch
    return () => {
      cancelled = true
    }
  }, [open])

  /**
   * Reset state เมื่อ dialog ปิด
   */
  useEffect(() => {
    if (!open) {
      setSelectedFoodIds([])
      setFoodItems([])
    }
  }, [open])

  /**
   * Toggle food selection (สูงสุด 490 รายการสำหรับ upgrade)
   */
  const handleSelectFood = (foodId: number) => {
    setSelectedFoodIds(
      (prev) =>
        prev.includes(foodId)
          ? prev.filter((id) => id !== foodId)
          : prev.length < 490
            ? [...prev, foodId] // Add the actual foodId, not hardcoded 10
            : prev
    )
  }

  /**
   * Submit upgrade transaction ใช้ egg.token_id (blockchain token ID)
   */
  const handleUpgrade = async () => {
    if (selectedFoodIds.length === 0) return
    const result = await upgradeRarity(parseInt(egg.token_id, 10), selectedFoodIds)
    if (result) {
      onSuccess()
      onOpenChange(false)
    }
  }

  // Calculate display values
  const extraFood = selectedFoodIds.length
  const totalAfterUpgrade = egg.food_count + extraFood
  const guaranteedTier = getGuaranteedTier(totalAfterUpgrade)
  const probabilities = getProbabilityBars(totalAfterUpgrade)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="clay" className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader variant="clay">
          <DialogTitle variant="clay">Upgrade Rarity #{egg.egg_id}</DialogTitle>
          <DialogDescription variant="clay">
            Select food NFTs to upgrade hatch rarity probability
          </DialogDescription>
        </DialogHeader>

        {/* Probability Bars Section */}
        <div className="space-y-3 py-4 border-b border-border/50">
          <p className="text-sm font-bold text-center">Probability Distribution</p>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground">Common</span>
            <Progress value={probabilities.common} className="h-3 bg-gray-500/20" />
            <span className="w-10 text-right">{probabilities.common}%</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground">Rare</span>
            <Progress value={probabilities.rare} className="h-3 bg-blue-500/20" />
            <span className="w-10 text-right">{probabilities.rare}%</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground">Epic</span>
            <Progress value={probabilities.epic} className="h-3 bg-purple-500/20" />
            <span className="w-10 text-right">{probabilities.epic}%</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground">Legendary</span>
            <Progress value={probabilities.legendary} className="h-3 bg-yellow-500/20" />
            <span className="w-10 text-right">{probabilities.legendary}%</span>
          </div>

          {guaranteedTier && (
            <Badge variant="clay" className={`ml-auto ${RARITY_TIERS.find(t => t.level === guaranteedTier)?.color || 'bg-yellow-500'}`}>
              Guaranteed: {guaranteedTier}
            </Badge>
          )}
        </div>

        {/* Scrollable grid area */}
        <div className="flex-1 overflow-y-auto">
          {fetching ? (
            <div className="py-8 text-center" role="status" aria-live="polite">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                sync
              </span>
              <p className="text-sm text-muted-foreground mt-2">Loading food inventory...</p>
            </div>
          ) : foodItems.length === 0 ? (
            <div className="py-8 text-center" role="status">
              <span className="material-symbols-outlined text-4xl text-muted-foreground">
                restaurant
              </span>
              <p className="text-sm text-muted-foreground mt-2">No food available</p>
            </div>
          ) : (
            <div 
              className="grid grid-cols-2 gap-clay-lg max-h-[60vh] overflow-y-auto p-2"
              role="list"
              aria-label="Available food items for upgrade"
              aria-busy={fetching}
            >
              {foodItems.map((food) => (
                <div role="listitem" key={food.food_id}>
                  <FoodCard
                    food={{
                      food_id: food.food_id,
                      token_id: food.token_id,
                      food_type: food.food_type as FoodType,
                      is_consumed: food.is_consumed,
                      minted_at: food.minted_at,
                    }}
                    selected={selectedFoodIds.includes(food.food_id)}
                    onSelect={handleSelectFood}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky footer with counter and button */}
        <DialogFooter variant="clay" className="flex-col gap-3">
          <p 
            className="text-sm font-bold text-center" 
            role="status" 
            aria-live="polite"
            aria-atomic="true"
          >
            {extraFood}/490 food selected ({probabilities.legendary}% Legendary chance{guaranteedTier ? `, guaranteed: ${guaranteedTier}` : ''})
          </p>
          <Button
            onClick={handleUpgrade}
            disabled={loading || extraFood === 0}
            variant="clay"
            size="clay-lg"
            className="w-full min-h-[44px]"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin" aria-hidden="true">sync</span>
                <span aria-live="polite">Upgrading...</span>
              </>
            ) : (
              `Upgrade Rarity (${extraFood} items)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RarityUpgradeDialog
