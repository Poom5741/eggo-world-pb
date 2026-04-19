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
import { FoodCard, FoodType } from '@/components/food-nft/FoodCard'
import { useFoodNft } from '@/hooks/use-food-nft'
import { createClient } from '@/lib/pocketbase/client'
import { EggData } from '@/hooks/use-egg-poll'

/**
 * Props สำหรับ FeedDialog component
 */
interface FeedDialogProps {
  /** ข้อมูลไข่ที่ต้องการให้อาหาร */
  egg: EggData
  /** สถานะเปิด/ปิดของ dialog */
  open: boolean
  /** Callback เมื่อสถานะ open เปลี่ยนแปลง */
  onOpenChange: (open: boolean) => void
  /** Callback เมื่อให้อาหารสำเร็จ */
  onSuccess: () => void
}

/**
 * FeedDialog component - Dialog สำหรับให้อาหารไข่ NFT
 * 
 * Manual food selection grid: แสดง food NFTs ใน grid 2 คอลัมน์
 * ผู้ใช้สามารถเลือก 1-10 รายการพร้อม counter แสดง "X/10 food selected"
 */
export function FeedDialog({ egg, open, onOpenChange, onSuccess }: FeedDialogProps) {
  const { feedEgg, loading, getUserFoodNfts } = useFoodNft()
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([])
  const [foodItems, setFoodItems] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)

  /**
   * Fetch available food เมื่อ dialog เปิด
   * getUserFoodNfts จะ filter is_consumed = false โดยอัตโนมัติ
   */
  useEffect(() => {
    if (!open) return
    const loadFood = async () => {
      setFetching(true)
      const pb = createClient()
      const user = pb.authStore.record
      if (user) {
        const foods = await getUserFoodNfts(user.id)
        setFoodItems(foods)
      }
      setFetching(false)
    }
    loadFood()
  }, [open, getUserFoodNfts])

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
   * Toggle food selection (สูงสุด 10 รายการ)
   */
  const handleSelectFood = (foodId: number) => {
    setSelectedFoodIds(
      (prev) =>
        prev.includes(foodId)
          ? prev.filter((id) => id !== foodId)
          : prev.length < 10
            ? [...prev, foodId]
            : prev // ป้องกันการเลือกเกิน 10 รายการ
    )
  }

  /**
   * Submit feed transaction ใช้ egg.token_id (blockchain token ID)
   */
  const handleFeed = async () => {
    if (selectedFoodIds.length === 0) return
    const result = await feedEgg(parseInt(egg.token_id, 10), selectedFoodIds)
    if (result) {
      onSuccess()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="clay" className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader variant="clay">
          <DialogTitle variant="clay">Feed Egg #{egg.egg_id}</DialogTitle>
          <DialogDescription variant="clay">
            Select 1-10 food items to feed your egg
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable grid area */}
        <div className="flex-1 overflow-y-auto">
          {fetching ? (
            <div className="py-8 text-center">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                sync
              </span>
              <p className="text-sm text-muted-foreground mt-2">Loading food inventory...</p>
            </div>
          ) : foodItems.length === 0 ? (
            <div className="py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground">
                restaurant
              </span>
              <p className="text-sm text-muted-foreground mt-2">No food available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-clay-lg max-h-[60vh] overflow-y-auto p-2">
              {foodItems.map((food) => (
                <FoodCard
                  key={food.food_id}
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
              ))}
            </div>
          )}
        </div>

        {/* Sticky footer with counter and button */}
        <DialogFooter variant="clay" className="flex-col gap-3">
          <p className="text-sm font-bold text-center">{selectedFoodIds.length}/10 food selected</p>
          <Button
            onClick={handleFeed}
            disabled={loading || selectedFoodIds.length === 0}
            variant="clay"
            size="clay-lg"
            className="w-full min-h-[44px]"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Feeding...
              </>
            ) : (
              `Feed ${selectedFoodIds.length} item${selectedFoodIds.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FeedDialog
