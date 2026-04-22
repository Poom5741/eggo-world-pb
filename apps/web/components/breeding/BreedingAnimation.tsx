'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Props for BreedingAnimation component
 * คุณสมบัติสำหรับคอมโพเนนต์ BreedingAnimation
 */
export interface BreedingAnimationProps {
  /** Species name of parent 1 */
  parent1Species: string
  /** Species name of parent 2 */
  parent2Species: string
  /** Callback when animation completes */
  onComplete: () => void
}

/**
 * Animation duration in milliseconds (2-3 seconds)
 */
const ANIMATION_DURATION_MS = 2500

/**
 * Breeding animation with two animals and heart
 * แอนิเมชันผสมพันธุ์แสดงสัตว์สองตัวและหัวใจ
 * 
 * Features:
 * - Two animal emojis with heart between them
 * - Simple CSS animation using Tailwind
 * - Duration: 2-3 seconds
 * - Used inside BreedingSuccessModal
 * 
 * @param parent1Species - Species of first parent
 * @param parent2Species - Species of second parent
 * @param onComplete - Callback when animation completes
 */
export function BreedingAnimation({
  parent1Species,
  parent2Species,
  onComplete,
}: BreedingAnimationProps) {
  const [stage, setStage] = useState(0) // 0-3
  const [showParticles, setShowParticles] = useState(false)

  // Animation stage timing (total 2.5 seconds)
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    // Stage 0 (0-0.5s): Initial appearance
    timers.push(setTimeout(() => {
      setStage(1)
    }, 500))

    // Stage 1 (0.5-1s): Animals move closer
    timers.push(setTimeout(() => {
      setStage(2)
    }, 1000))

    // Stage 2 (1-1.5s): Heart pulse and particles
    timers.push(setTimeout(() => {
      setStage(3)
      setShowParticles(true)
    }, 1500))

    // Stage 3 (1.5-2.5s): Final glow and complete
    timers.push(setTimeout(() => {
      onComplete()
    }, ANIMATION_DURATION_MS))

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [onComplete])

  // Get emoji for species
  const getSpeciesEmoji = (species: string) => {
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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      {/* Particle effects (Stage 3) */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Hearts */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`heart-${i}`}
              className="absolute animate-float-up-fade"
              style={{
                left: `${20 + Math.random() * 60}%`,
                bottom: '20%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: '1.5s',
              }}
            >
              <span className="material-symbols-outlined text-pink-400 text-2xl">
                favorite
              </span>
            </div>
          ))}
          {/* Sparkles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: '0.8s',
              }}
            >
              <span className="material-symbols-outlined text-yellow-300 text-lg">
                sparkle
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main animation container */}
      <div className="relative flex items-center justify-center gap-4">
        {/* Parent 1 */}
        <div
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center shadow-2xl",
            "bg-gradient-to-b from-blue-100 to-blue-300 border-4 border-blue-400",
            "transition-all duration-500 ease-out",
            stage >= 1 && "scale-110",
            stage >= 2 && "translate-x-4"
          )}
        >
          <span className="material-symbols-outlined text-5xl text-blue-600">
            {getSpeciesEmoji(parent1Species)}
          </span>
        </div>

        {/* Heart (center) */}
        <div
          className={cn(
            "relative flex items-center justify-center",
            "transition-all duration-500 ease-out",
            stage >= 2 && "scale-125",
            stage >= 3 && "scale-150"
          )}
        >
          {/* Heart glow effect */}
          <div
            className={cn(
              "absolute inset-0 rounded-full bg-pink-400/30 blur-xl",
              "transition-opacity duration-300",
              stage >= 2 ? "opacity-100" : "opacity-0"
            )}
            style={{ width: '80px', height: '80px', margin: '-20px' }}
          />
          
          {/* Main heart */}
          <span
            className={cn(
              "material-symbols-outlined text-6xl text-pink-500 transition-all duration-300",
              stage >= 2 && "animate-pulse",
              stage >= 3 && "text-pink-400"
            )}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
        </div>

        {/* Parent 2 */}
        <div
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center shadow-2xl",
            "bg-gradient-to-b from-pink-100 to-pink-300 border-4 border-pink-400",
            "transition-all duration-500 ease-out",
            stage >= 1 && "scale-110",
            stage >= 2 && "-translate-x-4"
          )}
        >
          <span className="material-symbols-outlined text-5xl text-pink-600">
            {getSpeciesEmoji(parent2Species)}
          </span>
        </div>
      </div>

      {/* Loading text */}
      <div className="absolute bottom-1/3 text-center">
        <p className="text-white/80 text-lg font-pixel-style animate-pulse">
          Breeding in progress...
        </p>
      </div>

      {/* Custom keyframes */}
      <style jsx global>{`
        @keyframes float-up-fade {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0.5);
            opacity: 0;
          }
        }
        
        .animate-float-up-fade {
          animation: float-up-fade 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default BreedingAnimation
