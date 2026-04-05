'use client'

import React from 'react'
import { EggData } from '@/hooks/use-egg-poll'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

/**
 * Props for FeaturedEggHero component
 * คุณสมบัติสำหรับ FeaturedEggHero
 */
export interface FeaturedEggHeroProps {
  egg: EggData
  onFeed?: (eggId: number) => void
  onPlay?: (eggId: number) => void
  onHatch?: (egg: EggData) => void
  polling?: boolean
}

/**
 * Featured egg hero section - highlights egg closest to hatching
 * ส่วนฮีโร่แสดงไข่ที่ใกล้จะฟักที่สุด
 * 
 * Large card with egg image, details, progress bar, and action buttons
 * การ์ดใหญ่แสดงรูปภาพไข่ รายละเอียด แถบความคืบหน้า และปุ่มดำเนินการ
 */
export function FeaturedEggHero({ egg, onFeed, onPlay, onHatch, polling }: FeaturedEggHeroProps) {
  // Calculate progress percentage
  const progressPercent = (egg.food_count / 10) * 100
  
  // Determine rarity display
  const isLegendary = (egg.rarity_seed ?? 0) >= 97
  
  return (
    <section className="mb-16">
      <div className="bg-surface-container-low rounded-xl p-8 clay-card relative overflow-hidden group">
        {/* Background glow effect - เอฟเฟกต์แสงพื้นหลัง */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/20 rounded-full blur-3xl group-hover:bg-primary-container/30 transition-colors" />
        
        {/* Grid layout - เลย์เอาต์แบบตาราง */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Column: Egg Image - ฝั่งซ้าย: รูปภาพไข่ */}
          <div className="relative flex justify-center">
            <div className="w-72 h-96 bg-white/40 backdrop-blur-sm rounded-[5rem] clay-card flex items-center justify-center p-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              {/* "Updating..." badge during polling - ป้าย "Updating..." ขณะกำลังโพล */}
              {polling && (
                <Badge variant="clay" className="absolute top-4 right-4 animate-pulse gap-1">
                  <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                  Updating...
                </Badge>
              )}
              <img
                alt="Featured Egg"
                className="w-full h-full object-contain drop-shadow-2xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK8Efx8th4pCVEPs45Ide0xBBOOo8MuO14861ITPWmsY42RxHovkpW1q8n3jkAFwF03y63yjbn9n-Yzai7AW9iwYZzXDKxHXY6rme6VbYv-4wwV3y9CJnufZEGlPcPq5_HwnI-qxIlcarNQ79Qh_I5ge2jy_cPEtsLlCOekPWnaFE4GE9Lm7nGNQdiptlxw3cdhPzYJCbUIF-WHwWSmKpbCr1ffw8zp-tQsCwDnDiiMsiTnRfh4xa4vm22K-qREWEKnJybsKaJgEpG"
              />
            </div>
            
            {/* Legendary badge - ตราสัญลักษณ์ Legendary */}
            {isLegendary && (
              <div className="absolute -top-4 -right-4 bg-tertiary-container text-on-tertiary-container px-6 py-2 rounded-full font-black shadow-lg transform rotate-12 flex items-center gap-2">
                <span className="material-symbols-outlined">auto_awesome</span>
                LEGENDARY
              </div>
            )}
          </div>
          
          {/* Right Column: Egg Details - ฝั่งขวา: รายละเอียดไข่ */}
          <div className="space-y-8">
            {/* Egg Name and Element - ชื่อไข่และธาตุ */}
            <div>
              <h2 className="text-4xl font-pixel-style text-secondary mb-2">
                Egg #{egg.egg_id}
              </h2>
              <div className="flex items-center gap-4">
                <Badge variant="clay" className="text-xs font-bold">
                  {egg.element_type || 'NORMAL'} ELEMENT
                </Badge>
                <span className="text-on-surface-variant text-sm font-medium">
                  Food collected: <span className="text-primary font-bold">{egg.food_count}/10</span>
                </span>
              </div>
            </div>
            
            {/* Progress Section - ส่วนแสดงความคืบหน้า */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-on-surface-variant">
                  GROWTH PROGRESS
                </label>
                <span className="text-lg font-black text-tertiary">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full h-6 bg-surface-container-high rounded-full inner-dip overflow-hidden p-1">
                <div
                  className="h-full bg-gradient-to-r from-tertiary to-tertiary-fixed rounded-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            
            {/* Action Buttons - ปุ่มดำเนินการ */}
            <div className="grid grid-cols-2 gap-4">
              {egg.food_count >= 10 && !egg.is_hatched ? (
                // แสดงปุ่ม HATCH เมื่อพร้อมฟัก
                <button
                  onClick={() => onHatch?.(egg)}
                  className="col-span-2 clay-button bg-primary text-on-primary py-5 rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:bg-primary-fixed-dim transition-colors shadow-lg"
                >
                  <span className="material-symbols-outlined">auto_fix_high</span>
                  HATCH NOW!
                </button>
              ) : (
                // แสดงปุ่ม FEED และ PLAY ปกติ
                <>
                  <button
                    onClick={() => onFeed?.(egg.egg_id)}
                    className="clay-button bg-primary-container text-on-primary-container py-5 rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:bg-primary-container/90 transition-colors"
                  >
                    <span className="material-symbols-outlined">restaurant</span>
                    FEED ME
                  </button>
                  <button
                    onClick={() => onPlay?.(egg.egg_id)}
                    className="clay-button bg-white text-primary py-5 rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:bg-white/90 transition-colors"
                  >
                    <span className="material-symbols-outlined">play_circle</span>
                    PLAY
                  </button>
                </>
              )}
            </div>
            
            {/* Eggo's Tip Box - กล่องคำแนะนำจาก Eggo */}
            <div className="bg-surface-container-highest/50 p-6 rounded-lg flex gap-4 items-start relative">
              <div className="w-12 h-12 bg-white rounded-full flex-shrink-0 clay-card flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">
                  emoji_emotions
                </span>
              </div>
              <div className="text-sm">
                <span className="font-bold text-primary block mb-1">
                  Eggo&apos;s Tip:
                </span>
                &quot;Keep feeding your egg to reach 10 food items. Once full, it will hatch into a magical creature!&quot;
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedEggHero
