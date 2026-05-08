import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Badge } from "../primitives/Badge"
import { Button } from "../primitives/Button"
import { Card, CardContent } from "../primitives/Card"
import { Heart } from "lucide-react"

/**
 * Marketplace Listing Card
 * 
 * Displays NFT listing with image, price, seller info, and actions.
 * Used in marketplace grid and collection pages.
 * 
 * @example
 * <ListingCard 
 *   image="/nft-1.png"
 *   name="Genesis Egg #123"
 *   collection="Genesis Collection"
 *   price={2.5}
 *   seller={{ name: "JohnDoe", avatar: "/avatar.jpg" }}
 *   rarity="legendary"
 *   onBuy={handleBuy}
 *   onFavorite={handleFavorite}
 * />
 */

export interface ListingCardProps {
  image: string
  name: string
  collection: string
  price: number
  seller?: {
    name: string
    avatar?: string
  }
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  endTime?: Date
  isFavorite?: boolean
  onBuy?: () => void
  onFavorite?: () => void
  onClick?: () => void
  className?: string
}

export function ListingCard({
  image,
  name,
  collection,
  price,
  seller,
  rarity = 'common',
  endTime,
  isFavorite = false,
  onBuy,
  onFavorite,
  onClick,
  className,
}: ListingCardProps) {
  const [favorite, setFavorite] = React.useState(isFavorite)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorite(!favorite)
    onFavorite?.()
  }

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onBuy?.()
  }

  return (
    <div
      className={cn(
        "group bg-surface rounded-clay-xl shadow-clay-md overflow-hidden cursor-pointer hover:shadow-clay-lg transition-all duration-300",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onClick?.()
        }
      }}
    >
      {/* Image Section */}
      <div className="relative aspect-square bg-surface-container-high overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            className={cn(
              "w-9 h-9 rounded-clay-full bg-surface/80 backdrop-blur-sm flex items-center justify-center transition-colors",
              favorite
                ? "text-error hover:bg-error/10"
                : "text-on-surface hover:bg-primary hover:text-white"
            )}
            onClick={handleFavoriteClick}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
          </button>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {rarity && rarity !== 'common' && (
            <Badge variant={rarity} size="sm" shape="pill">
              {rarity.toUpperCase()}
            </Badge>
          )}
          {endTime && (
            <Badge variant="ghost" size="sm" shape="pill">
              Ends in {formatTimeLeft(endTime)}
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-5 space-y-4">
        {/* Title & Collection */}
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface truncate">
            {name}
          </h3>
          <p className="text-sm text-on-surface-variant truncate">{collection}</p>
        </div>

        {/* Seller Info */}
        {seller && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-clay-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary">
              {seller.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-on-surface-variant">
              {seller.name}
            </span>
          </div>
        )}

        {/* Attributes Preview */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-container-high rounded-clay-sm px-3 py-2 text-center">
            <div className="text-xs text-on-surface-variant">Rarity</div>
            <div className="text-sm font-bold capitalize text-on-surface">
              {rarity}
            </div>
          </div>
          <div className="bg-surface-container-high rounded-clay-sm px-3 py-2 text-center">
            <div className="text-xs text-on-surface-variant">Tier</div>
            <div className="text-sm font-bold text-on-surface">Genesis</div>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-outline/20">
          <div>
            <div className="text-xs text-on-surface-variant font-bold">Price</div>
            <div className="font-black text-2xl text-primary">
              {price.toFixed(3)} ETH
            </div>
          </div>
          <Button 
            variant="clay" 
            size="clay-sm"
            onClick={handleBuyClick}
          >
            Buy Now
          </Button>
        </div>
      </CardContent>
    </div>
  )
}

function formatTimeLeft(endDate: Date): string {
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  
  if (diff <= 0) return 'Ended'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d`
  }
  
  return `${hours}h ${minutes}m`
}
