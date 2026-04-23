'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ข้อมูล commission แต่ละระดับ
 * 
 * @interface CommissionLevel
 * @property {number} level - ระดับ 1-4
 * @property {string} label - ชื่อระดับ (G1, G2, G3, G4)
 * @property {number} percentage - เปอร์เซ็นต์ comissão (20, 10, 10, 10)
 * @property {number} count - จำนวน referral ที่ระดับนี้
 * @property {number} earned - ยอดที่ earned จริง (USDT)
 * @property {number} expected - ยอดที่คาดหวัง (สำหรับคิด percentage fill)
 */
interface CommissionLevel {
  level: number
  label: string
  percentage: number
  count: number
  earned: number
  expected: number
}

interface CommissionBreakdownProps {
  userId: string
  className?: string
}

const LEVELS: Omit<CommissionLevel, 'count' | 'earned' | 'expected'>[] = [
  { level: 1, label: 'G1', percentage: 20 },
  { level: 2, label: 'G2', percentage: 10 },
  { level: 3, label: 'G3', percentage: 10 },
  { level: 4, label: 'G4', percentage: 10 },
]

const LEVEL_COLORS = {
  G1: 'bg-primary text-primary-foreground',
  G2: 'bg-accent text-accent-foreground',
  G3: 'bg-secondary text-secondary-foreground',
  G4: 'bg-muted text-muted-foreground',
}

/**
 * CommissionBreakdown Component
 * 
 * แสดง commission breakdown 4 ระดับในรูปแบบ Buddy Chain cards
 *Each card แสดง percentage fill, จำนวน buddies, และยอด earned
 *
 * @param {CommissionBreakdownProps} props - Component props
 * @param {string} props.userId - User ID สำหรับดึงข้อมูล
 * @param {string} [props.className] - Additional CSS className
 *
 * @example
 * ```tsx
 * <CommissionBreakdown userId="user123" className="mb-4" />
 * ```
 */
export function CommissionBreakdown({ userId, className }: CommissionBreakdownProps) {
  const [commissions, setCommissions] = useState<CommissionLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const pb = createClient()
        
        // ดึง commission records จากฐานข้อมูล
        const commissionRecords = await pb.collection('commission_records').getList(1, 500, {
          filter: `user = "${userId}"`,
          sort: '-created'
        })

        // คำนวณ commission แต่ละ level
        const calculatedLevels = LEVELS.map((level) => {
          const levelCommissions = commissionRecords.items.filter(
            (c: any) => c.level === level.level && !c.claimed
          )

          const earned = levelCommissions.reduce(
            (sum: number, c: any) => sum + parseFloat(c.amount || '0'),
            0
          )

          // คำนวณ expected earnings (ประมาณจากจำนวน referral)
          // Expected = จำนวน referral × average commission per referral
          const count = new Set(
            levelCommissions.map((c: any) => c.source_user).filter(Boolean)
          ).size

          const expected = count > 0 ? earned : 0

          return {
            ...level,
            count,
            earned,
            expected: expected || earned * 1.2, // Default to 120% of earned if no expected
          }
        })

        setCommissions(calculatedLevels)
      } catch (err: any) {
        console.error('Failed to fetch commissions:', err)
        setError(err.message || 'Failed to load commission data')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchCommissions()
    }
  }, [userId])

  // Empty state - ไม่มี referral
  const hasNoReferrals = !loading && commissions.every((c) => c.count === 0)

  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-2 border-primary/20 bg-card animate-pulse">
            <CardContent className="p-4 space-y-3">
              <div className="h-3 w-12 bg-surface-container-high rounded" />
              <div className="h-16 bg-surface-container-high rounded" />
              <div className="h-3 w-20 bg-surface-container-high rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={cn('border-2 border-destructive/30 bg-card', className)}>
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium">Failed to load commission data</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (hasNoReferrals) {
    return (
      <Card className={cn('border-2 border-primary/30 bg-card', className)}>
        <CardContent className="py-12 text-center space-y-4">
          <Users className="w-16 h-16 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="font-body text-lg text-foreground">
              NO REFERRALS YET
            </h3>
            <p className="font-body text-xs text-muted-foreground">
              Share your referral link to start earning
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {commissions.map((level) => {
        const percentage = level.expected > 0 
          ? Math.min(100, (level.earned / level.expected) * 100)
          : 0

        return (
          <Card
            key={level.label}
            className={cn(
              'relative overflow-hidden border-2 transition-all shadow-clay-sm',
              'hover:shadow-clay-md hover:-translate-y-0.5',
              level.percentage >= 20 ? 'border-primary/30' : 'border-surface-container-high',
              LEVEL_COLORS[level.label as keyof typeof LEVEL_COLORS]
            )}
          >
            {/* Percentage fill overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out opacity-10"
              style={{
                height: `${percentage}%`,
                background: 'currentColor',
              }}
            />

            <CardContent className="relative p-4 space-y-3">
              {/* Level badge */}
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={cn(
                    'font-body text-xs',
                    level.label === 'G1' && 'border-primary text-primary',
                    level.label === 'G2' && 'border-accent text-accent',
                    level.label === 'G3' && 'border-secondary text-secondary',
                    level.label === 'G4' && 'border-muted text-muted-foreground'
                  )}
                >
                  {level.label}
                </Badge>
                <span className="font-body text-xs text-muted-foreground">
                  {level.percentage}%
                </span>
              </div>

              {/* Percentage fill visualization */}
              <div className="relative h-16">
                <div className="absolute inset-0 flex items-center justify-center">
                  {percentage > 0 ? (
                    <TrendingUp
                      className={cn(
                        'w-8 h-8 transition-all',
                        percentage >= 80 && 'text-primary',
                        percentage >= 50 && percentage < 80 && 'text-accent',
                        percentage < 50 && 'text-muted-foreground'
                      )}
                    />
                  ) : (
                    <Users className="w-8 h-8 text-muted-foreground/50" />
                  )}
                </div>

                {/* Progress indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500 ease-out',
                      percentage >= 80 && 'bg-primary',
                      percentage >= 50 && percentage < 80 && 'bg-accent',
                      percentage < 50 && 'bg-muted-foreground/30'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span className="font-body text-xs">
                    {level.count} {level.count === 1 ? 'Buddy' : 'Buddies'}
                  </span>
                </div>
                <div className="font-body text-sm text-foreground">
                  {level.earned.toFixed(2)} USDT
                </div>
              </div>

              {/* Tooltip on hover */}
              <div className="group absolute inset-0 bg-background/95 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                <p className="font-body text-xs text-center text-foreground">
                  {level.label} earns {level.percentage}% of direct referrals
                  {level.level === 1 && ' (Direct referrals)'}
                  {level.level === 2 && ' (Level 2 network)'}
                  {level.level === 3 && ' (Level 3 network)'}
                  {level.level === 4 && ' (Level 4 network)'}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
