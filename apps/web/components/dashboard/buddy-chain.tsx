'use client'

import { Card, CardContent } from '@/components/ui/card'

/**
 * Buddy Chain Referral Visualization Component
 * แสดงแผนผังการแนะนำแบบ 4 ระดับ
 * 
 * Matches Jules design: 4 cards with percentage fill visualization
 * Decision D-04 to D-07: Buddy Chain card visualization
 */

// Commission rates per level (20%, 10%, 10%, 10%)
const COMMISSION_RATES = [0.20, 0.10, 0.10, 0.10] as const

// Level colors per D-06: L1=primary, L2=secondary, L3=tertiary, L4=on-surface-variant
const LEVEL_COLORS = {
  1: {
    fill: 'bg-primary/20',
    text: 'text-primary',
  },
  2: {
    fill: 'bg-secondary/20',
    text: 'text-secondary',
  },
  3: {
    fill: 'bg-tertiary/20',
    text: 'text-tertiary',
  },
  4: {
    fill: 'bg-on-surface-variant/10',
    text: 'text-on-surface-variant',
  },
} as const

/**
 * Referral level data structure
 * โครงสร้างข้อมูลระดับการแนะนำ
 */
interface ReferralLevel {
  level: number // 1-4
  count: number // Number of buddies at this level
  percentage: number // Fill percentage (0-100)
  commissionRate: number // 0.20 for L1, 0.10 for L2-L4
}

/**
 * BuddyChain component props
 *Props ของคอมโพเนนต์ BuddyChain
 */
interface BuddyChainProps {
  levels: ReferralLevel[]
  loading?: boolean
  error?: string | null
}

/**
 * BuddyChain Component
 * แสดงแผนผัง Buddy Chain แบบ 4 ระดับ
 */
export function BuddyChain({ levels, loading = false, error = null }: BuddyChainProps) {
  // Loading state
  if (loading) {
    return (
      <Card variant="clay-lg" className="shadow-clay-xl">
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((level) => (
              <div key={level} className="flex flex-col items-center animate-pulse">
                <div className="w-full aspect-square bg-surface-container rounded-2xl" />
                <div className="h-4 w-12 mt-2 bg-surface-container rounded" />
                <div className="h-3 w-16 mt-1 bg-surface-container rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card variant="clay-lg" className="shadow-clay-xl">
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ensure we have exactly 4 levels
  const normalizedLevels = levels.length === 4
    ? levels
    : [1, 2, 3, 4].map((lvl) =>
        levels.find((l) => l.level === lvl) || {
          level: lvl,
          count: 0,
          percentage: 0,
          commissionRate: COMMISSION_RATES[lvl - 1],
        }
      )

  return (
    <Card variant="clay-lg" className="shadow-clay-xl">
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {normalizedLevels.map((levelData) => {
            const colors = LEVEL_COLORS[levelData.level as keyof typeof LEVEL_COLORS]
            
            return (
              <div key={levelData.level} className="flex flex-col items-center">
                {/* Square card with percentage fill */}
                <div className="w-full aspect-square bg-surface-container rounded-2xl clay-card-inset flex flex-col items-center justify-center relative mb-3 overflow-hidden">
                  {/* Percentage fill bar at bottom */}
                  <div
                    className={`absolute bottom-0 left-0 w-full ${colors.fill} transition-all duration-500`}
                    style={{ height: `${Math.min(levelData.percentage, 100)}%` }}
                  />
                  
                  {/* Percentage text overlay */}
                  <span className={`pixel-font text-2xl relative z-10 ${colors.text}`}>
                    {Math.round(levelData.percentage)}%
                  </span>
                </div>
                
                {/* Level label */}
                <p className="text-xs font-bold text-on-surface-variant/60 uppercase">
                  Lvl {levelData.level}
                </p>
                
                {/* Buddy count */}
                <p className="font-bold text-sm md:text-base">
                  {levelData.count} Buddies
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
