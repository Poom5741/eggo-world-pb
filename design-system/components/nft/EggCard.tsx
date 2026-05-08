import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Badge } from "../primitives/Badge"
import { Button } from "../primitives/Button"
import { Card, CardContent } from "../primitives/Card"

/**
 * Egg NFT Card
 * 
 * Displays egg NFT with image, rarity, stats, and actions.
 * Supports hover effects and interactive states.
 * 
 * @example
 * <EggCard 
 *   image="/egg-1.png"
 *   name="Sun-Kissed Shell #042"
 *   rarity="legendary"
 *   price={1.24}
 *   foodCount={3}
 *   onClick={handleCardClick}
 * />
 */

export interface EggCardProps {
  image: string
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  price?: number
  foodCount?: number
  maxFoodCount?: number
  isReady?: boolean
  onClick?: () => void
  className?: string
}

export function EggCard({
  image,
  name,
  rarity,
  price,
  foodCount = 0,
  maxFoodCount = 10,
  isReady = false,
  onClick,
  className,
}: EggCardProps) {
  const progress = (foodCount / maxFoodCount) * 100

  return (
    <div
      className={cn(
        "group relative bg-surface rounded-clay-xl shadow-clay-md overflow-hidden cursor-pointer hover:shadow-clay-lg transition-all duration-300",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.()
        }
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-surface-container-high overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />

        {/* Rarity Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant={rarity} size="md" shape="pill">
            {rarity.toUpperCase()}
          </Badge>
        </div>

        {/* Ready Indicator */}
        {isReady && (
          <div className="absolute top-3 left-3">
            <div className="relative">
              <div className="w-3 h-3 bg-tertiary rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-tertiary rounded-full animate-ping" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface truncate">
            {name}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Food: {foodCount}/{maxFoodCount}
          </p>
        </div>

        {/* Food Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-on-surface-variant">Fed</span>
            <span className="text-primary">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-surface-container rounded-clay-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Price & Action */}
        {price !== undefined && (
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs text-on-surface-variant font-bold">Price</div>
              <div className="font-black text-2xl text-primary">
                {price.toFixed(2)} ETH
              </div>
            </div>
            <Button variant="clay" size="clay-sm">
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </div>
  )
}
