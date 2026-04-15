'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * ข้อมูล NFT สำหรับ ListingCard
 * Marketplace NFT listing data
 */
export interface ListingCardProps {
  image: string
  name: string
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  price: number
  seller: string
  polling?: boolean
}

export interface ListingCardProps {
  image: string
  name: string
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  price: number
  seller: string
  polling?: boolean
}

function getRarityInfo(rarity: string): { color: string; variant: 'default' | 'secondary' | 'outline' } {
  switch (rarity) {
    case 'Common':
      return { color: 'text-gray-500', variant: 'default' }
    case 'Rare':
      return { color: 'text-blue-500', variant: 'secondary' }
    case 'Epic':
      return { color: 'text-purple-500', variant: 'secondary' }
    case 'Legendary':
      return { color: 'text-yellow-500', variant: 'outline' }
    default:
      return { color: 'text-gray-500', variant: 'default' }
  }
}

function formatPrice(price: number): string {
  return price.toFixed(2)
}

export function ListingCard({ image, name, rarity, price, seller, polling = false }: ListingCardProps) {
  const rarityInfo = getRarityInfo(rarity)

  return (
    <div className={cn(
      "bg-surface-container-low p-5 rounded-xl clay-card",
      "hover:-translate-y-2 transition-all duration-300",
      "group cursor-pointer"
    )}>
      <div className="relative rounded-lg overflow-hidden h-48 mb-4 clay-inset bg-white/50">
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge variant={rarityInfo.variant} className={cn(
            "backdrop-blur-md px-3 py-1 text-xs font-bold",
            rarityInfo.color
          )}>
            {rarity.toUpperCase()}
          </Badge>
          {polling && (
            <Badge variant="secondary" className="bg-primary-container/80 text-on-primary-container backdrop-blur-md px-2 py-1 text-xs">
              <span className="material-symbols-outlined text-xs animate-spin mr-1">sync</span>
              Updating
            </Badge>
          )}
        </div>
        
        <img
          alt={name}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
          src={image}
        />
      </div>

      <h3 className="font-headline font-bold text-xl mb-1 text-on-surface">
        {name}
      </h3>

      <p className="text-sm text-on-surface/60 mb-4 font-medium">
        Seller: {seller}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">
            Price
          </span>
          <span className="text-lg font-bold text-secondary">
            {formatPrice(price)} USDT
          </span>
        </div>

        <button
          className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center clay-button hover:scale-110 transition-transform"
          aria-label={`View details for ${name}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            visibility
          </span>
        </button>
      </div>
    </div>
  )
}

export default ListingCard
