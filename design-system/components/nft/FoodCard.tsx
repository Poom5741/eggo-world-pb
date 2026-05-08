import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Badge } from "../primitives/Badge"
import { Button } from "../primitives/Button"
import { Card, CardContent } from "../primitives/Card"

/**
 * Food NFT Card
 * 
 * Displays food NFT with image, effect, price, and buy action.
 * Compact design optimized for marketplace grid.
 * 
 * @example
 * <FoodCard 
 *   image="/food-berry.png"
 *   name="Berry Boost Pack"
 *   effect="+25 Energy"
 *   price={0.05}
 *   onBuy={handleBuy}
 * />
 */

export interface FoodCardProps {
  image: string
  name: string
  effect: string
  price: number
  quantity?: number
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  onBuy?: () => void
  className?: string
}

export function FoodCard({
  image,
  name,
  effect,
  price,
  quantity,
  rarity = 'common',
  onBuy,
  className,
}: FoodCardProps) {
  return (
    <div
      className={cn(
        "group bg-surface-container-high rounded-clay shadow-clay-md overflow-hidden cursor-pointer hover:shadow-clay-lg transition-all duration-200",
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onBuy?.()
        }
      }}
    >
      <div className="relative aspect-[4/3] bg-surface-container-highest overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain group-hover:scale-110 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {rarity && rarity !== 'common' && (
          <div className="absolute top-2 right-2">
            <Badge variant={rarity} size="sm" shape="pill">
              {rarity.toUpperCase()}
            </Badge>
          </div>
        )}

        {quantity !== undefined && quantity > 1 && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="ghost" size="sm" shape="pill">
              x{quantity}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">
            {name}
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            {effect}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-on-surface-variant font-bold">Price</div>
            <div className="font-black text-xl text-primary">
              {price.toFixed(3)} ETH
            </div>
          </div>
          <Button 
            variant="clay" 
            size="clay-sm"
            onClick={(e) => {
              e?.stopPropagation()
              onBuy?.()
            }}
          >
            Buy
          </Button>
        </div>
      </CardContent>
    </div>
  )
}
