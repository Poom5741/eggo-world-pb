'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * ข้อมูล NFT สำหรับ ListingCard
 * Marketplace NFT listing data
 */
export interface ListingCardProps {
  /** รูปภาพ NFT */
  image: string
  /** ชื่อ NFT */
  name: string
  /** ความหายาก (Common, Rare, Epic, Legendary) */
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  /** ราคาใน USDT */
  price: number
  /** ผู้ขาย */
  seller: string
}

/**
 * แปลง rarity เป็นสีและ label สำหรับ Badge
 * Convert rarity to color and label for Badge component
 */
function getRarityInfo(rarity: string): { color: string; variant: 'default' | 'secondary' | 'outline' } {
  switch (rarity) {
    case 'Common':
      return { color: 'text-gray-500', variant: 'default' } // Gray for Common
    case 'Rare':
      return { color: 'text-blue-500', variant: 'secondary' } // Blue for Rare
    case 'Epic':
      return { color: 'text-purple-500', variant: 'secondary' } // Purple for Epic
    case 'Legendary':
      return { color: 'text-yellow-500', variant: 'outline' } // Gold for Legendary
    default:
      return { color: 'text-gray-500', variant: 'default' }
  }
}

/**
 * จัดรูปแบบราคาเป็น USDT
 * Format price as USDT currency
 */
function formatPrice(price: number): string {
  return price.toFixed(2)
}

/**
 * Marketplace listing card component with claymorphism styling
 * การ์ดแสดงรายการ NFT ใน Marketplace พร้อมสไตล์ claymorphism
 * 
 * แสดงรูปภาพ, ชื่อ, rarity badge, ราคาใน USDT, ผู้ขาย, และปุ่ม "View Details"
 */
export function ListingCard({ image, name, rarity, price, seller }: ListingCardProps) {
  const rarityInfo = getRarityInfo(rarity)

  return (
    <div className={cn(
      "bg-surface-container-low p-5 rounded-xl clay-card",
      "hover:-translate-y-2 transition-all duration-300",
      "group cursor-pointer"
    )}>
      {/* Image Section - ส่วนแสดงรูปภาพ */}
      <div className="relative rounded-lg overflow-hidden h-48 mb-4 clay-inset bg-white/50">
        {/* Rarity Badge - ป้ายแสดงระดับความหายาก */}
        <div className="absolute top-3 right-3">
          <Badge variant={rarityInfo.variant} className={cn(
            "backdrop-blur-md px-3 py-1 text-xs font-bold",
            rarityInfo.color
          )}>
            {rarity.toUpperCase()}
          </Badge>
        </div>
        
        {/* NFT Image - รูปภาพ NFT */}
        <img
          alt={name}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
          src={image}
        />
      </div>

      {/* Name Section - ส่วนชื่อ */}
      <h3 className="font-headline font-bold text-xl mb-1 text-on-surface">
        {name}
      </h3>

      {/* Seller Section - ส่วนข้อมูลผู้ขาย */}
      <p className="text-sm text-on-surface/60 mb-4 font-medium">
        Seller: {seller}
      </p>

      {/* Price and Action Section - ส่วนราคาและปุ่มกด */}
      <div className="flex items-center justify-between">
        {/* Price Display - แสดงราคา */}
        <div className="flex flex-col">
          <span className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">
            Price
          </span>
          <span className="text-lg font-bold text-secondary">
            {formatPrice(price)} USDT
          </span>
        </div>

        {/* View Details Button - ปุ่มดูรายละเอียด */}
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
