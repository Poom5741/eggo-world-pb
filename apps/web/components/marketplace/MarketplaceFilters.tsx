'use client'

import React, { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Types สำหรับ Marketplace Filters
 * Filter types for marketplace
 */
export type ItemType = 'Egg' | 'Food' | 'Animal'
export type RarityType = 'Common' | 'Rare' | 'Epic' | 'Legendary'
export type SortOption = 'newest' | 'price_asc' | 'price_desc'

/**
 * Interface สำหรับ filter state
 * Filter state interface
 */
export interface FilterState {
  types: ItemType[]
  rarities: RarityType[]
  sortBy: SortOption
}

/**
 * Interface สำหรับ component props
 * Component props interface
 */
interface MarketplaceFiltersProps {
  /** Callback เมื่อ filter เปลี่ยน */
  onChange?: (filters: FilterState) => void
  /** Initial filter state */
  initialFilters?: Partial<FilterState>
  /** Claymorphism variant */
  variant?: 'default' | 'clay'
}

/**
 * Marketplace Filters Component
 * Component สำหรับกรองและเรียงลำดับรายการใน Marketplace
 * 
 * Features:
 * - Filter by type: Egg, Food, Animal
 * - Filter by rarity: Common, Rare, Epic, Legendary
 * - Sort by: Newest, Price (low→high), Price (high→low)
 * - Clear all filters
 */
export function MarketplaceFilters({
  onChange,
  initialFilters,
  variant = 'clay',
}: MarketplaceFiltersProps) {
  // Initialize filter state
  const [filters, setFilters] = useState<FilterState>({
    types: initialFilters?.types || [],
    rarities: initialFilters?.rarities || [],
    sortBy: initialFilters?.sortBy || 'newest',
  })

  /**
   * Handle type toggle (checkbox)
   * จัดการการเลือก/ยกเลิกเลือก type
   */
  const handleTypeChange = (type: ItemType, checked: boolean) => {
    const newTypes = checked
      ? [...filters.types, type]
      : filters.types.filter((t) => t !== type)
    
    const newFilters = { ...filters, types: newTypes }
    setFilters(newFilters)
    onChange?.(newFilters)
  }

  /**
   * Handle rarity toggle (checkbox)
   * จัดการการเลือก/ยกเลิกเลือก rarity
   */
  const handleRarityChange = (rarity: RarityType, checked: boolean) => {
    const newRarities = checked
      ? [...filters.rarities, rarity]
      : filters.rarities.filter((r) => r !== rarity)
    
    const newFilters = { ...filters, rarities: newRarities }
    setFilters(newFilters)
    onChange?.(newFilters)
  }

  /**
   * Handle sort change (dropdown)
   * จัดการการเปลี่ยนการเรียงลำดับ
   */
  const handleSortChange = (sortBy: SortOption) => {
    const newFilters = { ...filters, sortBy }
    setFilters(newFilters)
    onChange?.(newFilters)
  }

  /**
   * Clear all filters
   * ล้าง filter ทั้งหมด
   */
  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      types: [],
      rarities: [],
      sortBy: 'newest',
    }
    setFilters(clearedFilters)
    onChange?.(clearedFilters)
  }

  /**
   * Check if any filters are active
   * ตรวจสอบว่ามี filter ใด ๆ ที่ถูกใช้งาน
   */
  const hasActiveFilters = filters.types.length > 0 || filters.rarities.length > 0 || filters.sortBy !== 'newest'

  return (
    <div className={cn(
      "flex flex-col gap-6 p-6",
      variant === 'clay' && "bg-surface-container-low rounded-clay-md shadow-clay-lg"
    )}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-on-surface">Filters</h2>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs text-on-surface/60 hover:text-on-surface"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-3">
          <Label variant={variant === 'clay' ? 'clay' : 'default'}>
            Sort by
          </Label>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger 
              variant={variant === 'clay' ? 'clay' : 'default'}
              size="default"
              className="w-full"
            >
              <SelectValue placeholder="Select sort option" />
            </SelectTrigger>
            <SelectContent variant={variant === 'clay' ? 'clay' : 'default'}>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <Label variant={variant === 'clay' ? 'clay' : 'default'}>
            Type
          </Label>
          <div className={cn(
            "flex flex-wrap gap-3 p-3 rounded-md",
            variant === 'clay' && "bg-surface-container-highest shadow-clay-sm"
          )}>
            {(['Egg', 'Food', 'Animal'] as ItemType[]).map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.types.includes(type)}
                  onCheckedChange={(checked) => handleTypeChange(type, checked as boolean)}
                  variant={variant === 'clay' ? 'clay' : 'default'}
                />
                <Label
                  htmlFor={`type-${type}`}
                  className="text-sm cursor-pointer"
                >
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label variant={variant === 'clay' ? 'clay' : 'default'}>
            Rarity
          </Label>
          <div className={cn(
            "flex flex-wrap gap-3 p-3 rounded-md",
            variant === 'clay' && "bg-surface-container-highest shadow-clay-sm"
          )}>
            {(['Common', 'Rare', 'Epic', 'Legendary'] as RarityType[]).map((rarity) => (
              <div key={rarity} className="flex items-center space-x-2">
                <Checkbox
                  id={`rarity-${rarity}`}
                  checked={filters.rarities.includes(rarity)}
                  onCheckedChange={(checked) => handleRarityChange(rarity, checked as boolean)}
                  variant={variant === 'clay' ? 'clay' : 'default'}
                />
                <Label
                  htmlFor={`rarity-${rarity}`}
                  className="text-sm cursor-pointer"
                >
                  {rarity}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketplaceFilters
