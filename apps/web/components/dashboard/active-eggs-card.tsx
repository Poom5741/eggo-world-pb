"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Egg data structure
 * โครงสร้างข้อมูลไข่
 */
interface Egg {
  id: string
  name: string
  image?: string
  status: 'incubating' | 'feeding' | 'ready' | 'hatched'
}

/**
 * ActiveEggsCard Component Props
 * Props สำหรับ component ActiveEggsCard
 */
interface ActiveEggsCardProps {
  /** Total count of active eggs */
  count: number
  /** Optional array of egg data for avatars */
  eggs?: Egg[]
}

/**
 * ActiveEggsCard Component
 * การ์ดแสดงจำนวนไข่ที่กำลังฟักตัวพร้อมตัวอย่าง avatar
 * 
 * Features per Jules design:
 * - Display total egg count
 * - Show 3 egg preview avatars + "+N" overflow indicator
 * - Overlapping avatars with -space-x-2
 * - Avatar size: w-8 h-8 rounded-full
 * - Border colors: primary-container, secondary-container, tertiary-container
 * - Claymorphism styling
 * 
 * @example
 * ```tsx
 * <ActiveEggsCard count={12} />
 * ```
 */
export function ActiveEggsCard({ count, eggs }: ActiveEggsCardProps) {
  // Determine how many eggs to show as avatars (max 3 per Jules design)
  // แสดง avatar ไข่สูงสุด 3 ใบตามการออกแบบของ Jules
  const maxAvatars = 3
  const displayCount = Math.min(count, maxAvatars)
  const overflowCount = count - maxAvatars
  
  // Generate placeholder avatars or use provided eggs
  const avatars = eggs 
    ? eggs.slice(0, maxAvatars)
    : Array.from({ length: displayCount }, (_, i) => ({
        id: `avatar-${i}`,
        name: `Egg ${i + 1}`,
        status: 'incubating' as const
      }))

  // Background color classes for avatars
  const bgColors = [
    'bg-primary-container',
    'bg-secondary-container',
    'bg-tertiary-container'
  ]

  return (
    <Card variant="clay" className="shadow-clay-lg border-t-8 border-primary-container">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground uppercase tracking-widest">
            Active Eggs
          </CardDescription>
          <CardTitle className="font-[var(--font-pixel)] text-4xl text-primary">
            {count}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Egg preview avatars with overlapping layout per Jules design */}
        <div className="flex -space-x-2 mt-2">
          {avatars.map((egg, index) => (
            <div
              key={egg.id}
              className={`
                w-8 h-8 rounded-full border-2 border-white
                ${bgColors[index % bgColors.length]}
                flex items-center justify-center
                clay-card
              `}
              title={egg.name}
            >
              <span className="material-symbols-outlined text-xs text-white">
                egg
              </span>
            </div>
          ))}
          
          {/* Overflow indicator */}
          {overflowCount > 0 && (
            <div
              className={`
                w-8 h-8 rounded-full border-2 border-white
                bg-surface-container
                flex items-center justify-center
                clay-card
              `}
            >
              <span className="text-[10px] font-bold text-foreground">
                +{overflowCount}
              </span>
            </div>
          )}
        </div>
        
        {/* Helper text */}
        <div className="flex items-center text-xs text-muted-foreground mt-3">
          <span className="material-symbols-outlined mr-1 text-sm">egg</span>
          Eggs currently incubating or feeding
        </div>
      </CardContent>
    </Card>
  )
}
