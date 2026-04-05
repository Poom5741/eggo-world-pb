'use client'

import React, { useState, useEffect } from 'react'
import { AnimalData } from '@/hooks/use-egg-hatch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Props for HatchAnimation component
 * คุณสมบัติสำหรับคอมโพเนนต์ HatchAnimation
 */
export interface HatchAnimationProps {
  eggId: number
  onComplete: (animalData: AnimalData) => void
}

/**
 * Hatch reveal animation with 6 stages
 * แอนิเมชันฟักไข่ 6 ขั้นตอน (10-15 วินาที)
 * 
 * Stages:
 * 0 (0-2s): Egg appears with subtle glow
 * 1 (2-4s): First crack appears
 * 2 (4-6s): Egg shakes vigorously
 * 3 (6-8s): Bright light bursts from cracks
 * 4 (8-10s): Egg bursts open, Animal emerges
 * 5 (10-12s): Rarity badge appears
 * 
 * @param eggId - The egg being hatched
 * @param onComplete - Callback when animation completes with Animal NFT data
 */
export function HatchAnimation({ eggId, onComplete }: HatchAnimationProps) {
  const [stage, setStage] = useState(0) // 0-5
  const [showParticles, setShowParticles] = useState(false)

  // Mock animal data for demo (ใน production จะได้จาก contract event)
  const mockAnimalData: AnimalData = {
    token_id: eggId,
    rarity: 'Rare',
    species: 'Duck',
    element: 'Water',
    generation: 0,
  }

  // Animation stage timing (รวม 10-15 วินาที)
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    // Stage 0 (0-2s): Egg glow
    timers.push(setTimeout(() => {
      setStage(1)
    }, 2000))

    // Stage 1 (2-4s): First crack
    timers.push(setTimeout(() => {
      setStage(2)
    }, 4000))

    // Stage 2 (4-6s): Shake vigorously
    timers.push(setTimeout(() => {
      setStage(3)
      setShowParticles(true)
    }, 6000))

    // Stage 3 (6-8s): Bright flash
    timers.push(setTimeout(() => {
      setStage(4)
    }, 8000))

    // Stage 4 (8-10s): Animal emerges
    timers.push(setTimeout(() => {
      setStage(5)
    }, 10000))

    // Stage 5 (10-12s): Complete and call onComplete
    timers.push(setTimeout(() => {
      onComplete(mockAnimalData)
    }, 12000))

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [onComplete, eggId])

  // Get rarity badge color
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      {/* Particle effects (Stage 3-4) - อนุภาคแสงวิ้งๆ */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      )}

      {/* Main animation container */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Stage 0-3: Egg with effects - ไข่พร้อมเอฟเฟกต์ */}
        {stage < 4 && (
          <div className="relative">
            {/* Egg image */}
            <div
              className={cn(
                "w-64 h-80 bg-gradient-to-b from-amber-100 to-amber-300 rounded-full",
                "flex items-center justify-center",
                "shadow-2xl border-4 border-amber-400",
                // Stage 0: Subtle glow
                stage === 0 && "animate-pulse",
                // Stage 2: Shake vigorously
                stage === 2 && "animate-shake",
              )}
              style={{
                animation: stage === 2 ? 'shake 0.5s ease-in-out infinite' : undefined,
              }}
            >
              {/* Egg icon */}
              <span className="material-symbols-outlined text-9xl text-amber-600">
                egg
              </span>
            </div>

            {/* Stage 1: Cracks appear - รอยแตก */}
            {stage >= 1 && (
              <svg
                className="absolute inset-0 w-full h-full opacity-0 animate-fade-in"
                viewBox="0 0 256 320"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  animation: 'fadeIn 0.5s ease-in forwards',
                }}
              >
                {/* Crack lines */}
                <path
                  d="M128 0 L128 80 M128 80 L100 100 M128 80 L156 100"
                  stroke="#78350f"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M128 160 L108 180 M128 160 L148 180"
                  stroke="#78350f"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M80 200 L100 220 M176 200 L156 220"
                  stroke="#78350f"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* Stage 3: Bright flash burst - แสงสว่างจ้า */}
            {stage === 3 && (
              <div
                className="absolute inset-0 bg-white/80 rounded-full"
                style={{
                  animation: 'flash 0.5s ease-in-out',
                }}
              />
            )}
          </div>
        )}

        {/* Stage 4-5: Animal reveal - สัตว์ปรากฏตัว */}
        {stage >= 4 && (
          <div
            className={cn(
              "flex flex-col items-center",
              stage === 4 && "animate-zoom-in"
            )}
            style={{
              animation: stage === 4 ? 'zoomIn 0.5s ease-out forwards' : undefined,
            }}
          >
            {/* Animal image */}
            <div className="w-64 h-80 bg-gradient-to-b from-blue-100 to-blue-300 rounded-full flex items-center justify-center shadow-2xl border-4 border-blue-400 mb-8">
              <span className="material-symbols-outlined text-9xl text-blue-600">
                {mockAnimalData.species.toLowerCase()}
              </span>
            </div>

            {/* Animal info */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-pixel-style text-white">
                {mockAnimalData.species} #{mockAnimalData.token_id}
              </h2>

              {/* Stage 5: Rarity badge appears - แบดจ์ความหายาก */}
              {stage === 5 && (
                <div
                  className="animate-bounce-in"
                  style={{
                    animation: 'bounceIn 0.5s ease-out forwards',
                  }}
                >
                  <Badge
                    className={cn(
                      "text-2xl px-8 py-4 font-pixel-style",
                      getRarityColor(mockAnimalData.rarity)
                    )}
                  >
                    {mockAnimalData.rarity.toUpperCase()}
                  </Badge>

                  <div className="mt-4 flex gap-4 justify-center">
                    <Badge variant="clay" className="text-lg px-4 py-2">
                      <span className="material-symbols-outlined text-sm">water_drop</span>
                      {mockAnimalData.element}
                    </Badge>
                    <Badge variant="clay" className="text-lg px-4 py-2">
                      <span className="material-symbols-outlined text-sm">spa</span>
                      Gen {mockAnimalData.generation}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom keyframes - คีย์เฟรมสำหรับแอนิเมชัน */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-10px) rotate(-5deg); }
          50% { transform: translateX(10px) rotate(5deg); }
          75% { transform: translateX(-10px) rotate(-5deg); }
        }
        
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        
        @keyframes zoomIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default HatchAnimation
