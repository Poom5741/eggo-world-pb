'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BreedingAnimation } from './BreedingAnimation'
import { BreedingResult } from '@/hooks/use-breeding'
import { AnimalData } from '@/hooks/use-animal-poll'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

/**
 * Props for BreedingSuccessModal component
 * คุณสมบัติสำหรับคอมโพเนนต์ BreedingSuccessModal
 */
export interface BreedingSuccessModalProps {
  /** Whether modal is open */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Breeding result data */
  breedingResult: BreedingResult | null
  /** First parent animal */
  parent1: AnimalData | null
  /** Second parent animal */
  parent2: AnimalData | null
  /** Callback when user views egg or modal closes */
  onSuccess?: () => void
}

/**
 * Auto-redirect countdown duration in seconds
 */
const AUTO_REDIRECT_SECONDS = 5

/**
 * Breeding success modal with animation and egg reveal
 * โมดัลแสดงผลสำเร็จการผสมพันธุ์พร้อมแอนิเมชัน
 * 
 * Features:
 * - Shows BreedingAnimation during success (2-3 seconds)
 * - Displays new egg token ID, generation, parent info
 * - "View Egg" button routes to /eggs
 * - Auto-redirect countdown (5 seconds)
 * 
 * @param open - Modal open state
 * @param onOpenChange - Callback when modal open state changes
 * @param breedingResult - Breeding result with new egg data
 * @param parent1 - First parent animal
 * @param parent2 - Second parent animal
 * @param onSuccess - Callback when user continues
 */
export function BreedingSuccessModal({
  open,
  onOpenChange,
  breedingResult,
  parent1,
  parent2,
  onSuccess,
}: BreedingSuccessModalProps) {
  const router = useRouter()
  const [animating, setAnimating] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS)

  // Reset state when modal opens
  useEffect(() => {
    if (open && breedingResult) {
      setAnimating(true)
      setShowResult(false)
      setCountdown(AUTO_REDIRECT_SECONDS)
    } else if (!open) {
      setAnimating(false)
      setShowResult(false)
      setCountdown(AUTO_REDIRECT_SECONDS)
    }
  }, [open, breedingResult])

  // Handle animation complete
  const handleAnimationComplete = useCallback(() => {
    setAnimating(false)
    setShowResult(true)
  }, [])

  // Handle view egg button click
  const handleViewEgg = useCallback(() => {
    onOpenChange(false)
    onSuccess?.()
    router.push('/eggs')
  }, [onOpenChange, onSuccess, router])

  // Handle close without redirect
  const handleClose = useCallback(() => {
    onOpenChange(false)
    onSuccess?.()
  }, [onOpenChange, onSuccess])

  // Auto-redirect countdown
  useEffect(() => {
    if (!showResult || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Auto-redirect when countdown reaches 0
          clearInterval(timer)
          handleViewEgg()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showResult, countdown, handleViewEgg])

  // Get parent emoji based on species
  const getParentEmoji = (species: string) => {
    const emojiMap: Record<string, string> = {
      'Duck': 'duck',
      'Chicken': 'egg',
      'Rabbit': 'cruelty_free',
      'Pig': 'pets',
      'Cow': 'cow',
      'Sheep': 'sheep',
      'Cat': 'pets',
      'Dog': 'pets',
    }
    return emojiMap[species] || 'pets'
  }

  // Calculate child generation
  const childGeneration = parent1 && parent2 
    ? Math.max(parent1.generation, parent2.generation) + 1
    : breedingResult?.generation || 1

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay variant="clay" />
        
        {/* Show BreedingAnimation or Result */}
        {animating && !showResult ? (
          // Playing animation
          <BreedingAnimation
            parent1Species={parent1?.species || 'Parent 1'}
            parent2Species={parent2?.species || 'Parent 2'}
            onComplete={handleAnimationComplete}
          />
        ) : showResult && breedingResult ? (
          // Show breeding result
          <DialogContent className="sm:max-w-lg bg-surface-container-lowest border-4 border-primary-fixed-dim">
            <div className="flex flex-col items-center text-center py-8 px-6 space-y-6">
              {/* Success Header with Sparkles */}
              <div className="relative">
                <div className="absolute -top-4 -left-4 animate-ping">
                  <span className="material-symbols-outlined text-2xl text-yellow-400">sparkle</span>
                </div>
                <div className="absolute -top-2 -right-6 animate-ping" style={{ animationDelay: '0.2s' }}>
                  <span className="material-symbols-outlined text-xl text-pink-400">favorite</span>
                </div>
                <div className="absolute -bottom-2 -left-6 animate-ping" style={{ animationDelay: '0.4s' }}>
                  <span className="material-symbols-outlined text-xl text-purple-400">star</span>
                </div>
                
                <h2 className="text-3xl font-pixel-style text-primary">
                  Breeding Success!
                </h2>
              </div>

              {/* New Egg Display */}
              <div className={cn(
                "w-40 h-52 rounded-full flex items-center justify-center shadow-2xl",
                "bg-gradient-to-b from-amber-100 to-amber-300 border-4 border-amber-400"
              )}>
                <span className="material-symbols-outlined text-7xl text-amber-600">
                  egg
                </span>
              </div>

              {/* Egg Info */}
              <div className="space-y-4 w-full">
                <div>
                  <h3 className="text-2xl font-pixel-style text-primary">
                    Egg #{breedingResult.token_id}
                  </h3>
                  <p className="text-on-surface-variant text-sm mt-1">
                    A new life has been created through breeding!
                  </p>
                </div>

                {/* Generation Badge */}
                <div className="flex justify-center">
                  <Badge
                    className={cn(
                      "text-xl px-6 py-2 font-pixel-style",
                      "bg-purple-400 text-purple-900"
                    )}
                  >
                    <span className="material-symbols-outlined text-sm mr-1">spa</span>
                    Generation {childGeneration}
                  </Badge>
                </div>

                {/* Parents Info */}
                <div className="bg-surface-container-lowest p-4 rounded-lg clay-card">
                  <div className="text-sm font-bold text-on-surface-variant mb-3">
                    PARENTS
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    {/* Parent 1 */}
                    {parent1 && (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-blue-600">
                            {getParentEmoji(parent1.species)}
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant mt-1">
                          {parent1.species} #{parent1.animal_id}
                        </span>
                      </div>
                    )}
                    
                    {/* Heart */}
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-3xl text-pink-400 animate-pulse">
                        favorite
                      </span>
                    </div>
                    
                    {/* Parent 2 */}
                    {parent2 && (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-pink-100 border-2 border-pink-300 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-pink-600">
                            {getParentEmoji(parent2.species)}
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant mt-1">
                          {parent2.species} #{parent2.animal_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Success Message */}
                <div className="bg-primary-container/20 p-4 rounded-lg border-2 border-primary-container">
                  <p className="text-primary font-bold">
                    <Sparkles className="w-5 h-5 mr-2" /> Congratulations! Your new egg is ready to hatch!
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Feed it 10 times to see what creature emerges.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full pt-4">
                <Button
                  onClick={handleViewEgg}
                  className="w-full py-6 text-lg font-black bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors"
                >
                  <span className="material-symbols-outlined mr-2">egg</span>
                  View Egg
                </Button>
                
                {/* Countdown indicator */}
                <p className="text-sm text-muted-foreground text-center">
                  Auto-redirecting to eggs page in {countdown} seconds...
                </p>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </DialogPortal>
    </Dialog>
  )
}

export default BreedingSuccessModal
