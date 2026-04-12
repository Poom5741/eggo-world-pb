'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HatchAnimation } from '@/components/eggs/hatch-animation'
import { useEggHatch, AnimalData } from '@/hooks/use-egg-hatch'
import { EggData } from '@/hooks/use-egg-poll'
import { cn } from '@/lib/utils'

/**
 * Props for HatchRevealModal component
 * คุณสมบัติสำหรับคอมโพเนนต์ HatchRevealModal
 */
export interface HatchRevealModalProps {
  egg: EggData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

/**
 * Hatch reveal modal with animation and Animal NFT display
 * โมดัลแสดงแอนิเมชันฟักไข่และแสดง Animal NFT
 * 
 * Features:
 * - Opens when egg has food_count >= 10
 * - Shows HatchAnimation during hatch
 * - Displays Animal NFT with rarity badge after hatch
 * - Calls onSuccess to refresh egg list
 * 
 * @param egg - Egg data to hatch
 * @param open - Modal open state
 * @param onOpenChange - Callback when modal open state changes
 * @param onSuccess - Callback when hatch completes successfully
 */
export function HatchRevealModal({
  egg,
  open,
  onOpenChange,
  onSuccess,
}: HatchRevealModalProps) {
  const { hatchEggTransaction, loading } = useEggHatch()
  const [animating, setAnimating] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [animalData, setAnimalData] = useState<AnimalData | null>(null)

  // Handle hatch button click - จัดการการคลิกปุ่มฟักไข่
  const handleHatch = async () => {
    setAnimating(true)
    
    try {
      const result = await hatchEggTransaction(egg.egg_id)
      
      if (result) {
        setAnimalData(result)
        setShowResult(true)
      } else {
        // Hatch failed
        setAnimating(false)
        onOpenChange(false)
      }
    } catch {
      // Error handled by hook
      setAnimating(false)
      onOpenChange(false)
    }
  }

  // Handle animation complete - จัดการเมื่อแอนิเมชันเสร็จสิ้น
  const handleAnimationComplete = (animal: AnimalData) => {
    setAnimalData(animal)
    setShowResult(true)
  }

  // Handle continue button - จัดการการคลิกปุ่มดำเนินการต่อ
  const handleContinue = () => {
    onSuccess()
    onOpenChange(false)
    // Reset states
    setAnimating(false)
    setShowResult(false)
    setAnimalData(null)
  }

  // Get rarity badge color - รับสีของแบดจ์ความหายาก
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'bg-gray-400 text-gray-900'
      case 'Rare': return 'bg-blue-400 text-blue-900'
      case 'Epic': return 'bg-purple-400 text-purple-900'
      case 'Legendary': return 'bg-yellow-400 text-yellow-900'
      default: return 'bg-gray-400'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay variant="clay" />
        
        {/* แสดง HatchAnimation หรือ Animal Result */}
        {animating && !showResult ? (
          // กำลังเล่นแอนิเมชัน
          <HatchAnimation
            eggId={egg.egg_id}
            onComplete={handleAnimationComplete}
          />
        ) : showResult && animalData ? (
          // แสดงผลลัพธ์ Animal NFT
          <DialogContent className="sm:max-w-lg bg-surface-container-lowest border-4 border-primary-fixed-dim">
            <div className="flex flex-col items-center text-center py-8 px-6 space-y-6">
              {/* Animal Image - รูปภาพสัตว์ */}
              <div className={cn(
                "w-48 h-64 rounded-full flex items-center justify-center shadow-2xl",
                "bg-gradient-to-b from-blue-100 to-blue-300 border-4 border-blue-400"
              )}>
                <span className="material-symbols-outlined text-8xl text-blue-600">
                  {animalData.species.toLowerCase()}
                </span>
              </div>

              {/* Animal Info - ข้อมูลสัตว์ */}
              <div className="space-y-4 w-full">
                <div>
                  <h2 className="text-3xl font-pixel-style text-primary">
                    {animalData.species} #{animalData.token_id}
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-1">
                    Your new digital companion has hatched!
                  </p>
                </div>

                {/* Rarity Badge - แบดจ์ความหายาก */}
                <div className="flex justify-center">
                  <Badge
                    className={cn(
                      "text-2xl px-8 py-3 font-pixel-style",
                      getRarityColor(animalData.rarity)
                    )}
                  >
                    {animalData.rarity.toUpperCase()}
                  </Badge>
                </div>

                {/* Stats Grid - ตารางสถิติ */}
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-surface-container-lowest p-4 rounded-lg clay-card">
                    <div className="flex items-center justify-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-xl">water_drop</span>
                      <span className="text-sm font-bold">ELEMENT</span>
                    </div>
                    <div className="text-xl font-black text-primary mt-1">
                      {animalData.element}
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-4 rounded-lg clay-card">
                    <div className="flex items-center justify-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-xl">spa</span>
                      <span className="text-sm font-bold">GENERATION</span>
                    </div>
                    <div className="text-xl font-black text-primary mt-1">
                      Gen {animalData.generation}
                    </div>
                  </div>
                </div>

                {/* Success Message - ข้อความสำเร็จ */}
                <div className="bg-primary-container/20 p-4 rounded-lg border-2 border-primary-container">
                  <p className="text-primary font-bold">
                    🎉 Congratulations! Your {animalData.rarity} {animalData.species} is ready!
                  </p>
                </div>
              </div>

              {/* Action Buttons - ปุ่มดำเนินการ */}
              <div className="flex gap-4 w-full pt-4">
                <Button
                  onClick={handleContinue}
                  className="flex-1 py-6 text-lg font-black bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors"
                >
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : (
          // แสดงปุ่ม HATCH ก่อนเริ่ม
          <DialogContent className="sm:max-w-md bg-surface-container-lowest">
            <div className="flex flex-col items-center text-center py-8 px-6 space-y-6">
              {/* Egg Preview - ตัวอย่างไข่ */}
              <div className="w-32 h-40 bg-gradient-to-b from-amber-100 to-amber-300 rounded-full flex items-center justify-center shadow-xl border-4 border-amber-400">
                <span className="material-symbols-outlined text-6xl text-amber-600">
                  egg
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-pixel-style text-primary">
                  Ready to Hatch!
                </h2>
                <p className="text-on-surface-variant text-sm mt-2">
                  Egg #{egg.egg_id} has collected {egg.food_count}/10 food items.
                  <br />
                  Are you ready to discover your Animal NFT?
                </p>
              </div>

              {/* Warning - คำเตือน */}
              <div className="bg-warning-container/20 p-4 rounded-lg border-2 border-warning-container">
                <p className="text-warning font-bold text-sm">
                  ⚠️ Hatching is final! Once hatched, the egg cannot be used again.
                </p>
              </div>

              {/* Action Buttons - ปุ่มดำเนินการ */}
              <div className="flex gap-4 w-full pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 py-4"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleHatch}
                  disabled={loading || egg.food_count < 10}
                  className="flex-1 py-6 text-lg font-black bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
                >
                  {loading ? 'Hatching...' : 'HATCH!'}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </DialogPortal>
    </Dialog>
  )
}

export default HatchRevealModal
