'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Flame, Star, Trophy } from 'lucide-react'
import { useDailyCheckin } from '@/hooks/use-daily-checkin'

interface CheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  eggId: number
}

/**
 * CheckInDialog - Daily check-in modal with countdown and streak display
 * Modal check-in รายวันพร้อมนับถอยหลังและแสดง streak
 */
export function CheckInDialog({ open, onOpenChange, userId, eggId }: CheckInDialogProps) {
  const { checkInData, loading, error, claimCheckin, countdown } = useDailyCheckin(userId)

  const handleClaim = async () => {
    try {
      await claimCheckin()
      // Success - user can close dialog or continue
    } catch (err) {
      console.error('Claim failed:', err)
    }
  }

  // Calculate streak bonus with icon component instead of emoji
  const getStreakBonus = () => {
    if (!checkInData) return null
    
    const streak = checkInData.streak
    if (streak >= 30) return { days: 30, reward: 5, badgeComponent: Trophy, label: '30-Day Master' }
    if (streak >= 7) return { days: 7, reward: 2, badgeComponent: Star, label: '7-Day Warrior' }
    return { days: 1, reward: 1, badgeComponent: Flame, label: `${streak}d Streak` }
  }

  const streakBonus = getStreakBonus()

  // Calculate streak color intensity (increases with streak length)
  const getStreakColorIntensity = () => {
    if (!checkInData) return 'text-orange-500'
    
    const streak = checkInData.streak
    if (streak >= 30) return 'text-yellow-500'
    if (streak >= 14) return 'text-orange-600'
    if (streak >= 7) return 'text-orange-500'
    if (streak >= 3) return 'text-orange-400'
    return 'text-orange-300'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="clay" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">emoji_events</span>
            Daily Check-In - Egg #{eggId}
          </DialogTitle>
          <DialogDescription>
            Check in daily to earn Food NFT rewards and build your streak!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Streak Display - แสดง streak */}
          {checkInData && (
            <div className="text-center space-y-2">
              <div className={`flex items-center gap-2 text-6xl font-black ${getStreakColorIntensity()}`}>
                {checkInData.streak}d
                <Flame className="w-8 h-8" />
              </div>
              {streakBonus && streakBonus.days > 1 && (
                <Badge variant="clay" className="bg-warning/20 text-warning">
                  <streakBonus.badgeComponent className="w-4 h-4 mr-1" /> {streakBonus.label} - Next bonus: {streakBonus.reward} Food NFTs
                </Badge>
              )}
              <p className="text-xs text-on-surface-variant">
                Total check-ins: {checkInData.checkInCount}
              </p>
            </div>
          )}

          {/* Countdown Timer - นับถอยหลัง */}
          {checkInData && !checkInData.canClaim && (
            <div className="bg-surface-container rounded-lg p-4 text-center space-y-2">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                schedule
              </span>
              <p className="text-sm font-bold text-on-surface">Next check-in in:</p>
              <p className="text-3xl font-mono font-black text-primary">
                {countdown}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* Reward Info - ข้อมูลรางวัล */}
          <div className="space-y-2">
            <h4 className="font-bold text-on-surface text-sm">Daily Rewards:</h4>
            <div className="space-y-1 text-xs text-on-surface-variant">
              <p>• Daily check-in: 1 Food NFT</p>
              <p>• 7-day streak: 2 Food NFTs</p>
              <p>• 30-day streak: 5 Food NFTs + Special Badge</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="clay"
            onClick={handleClaim}
            disabled={!checkInData?.canClaim || loading}
            className="w-full min-h-[44px]"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Claiming...
              </>
            ) : checkInData?.canClaim ? (
              <>
                <span className="material-symbols-outlined">redeem</span>
                Claim Daily Reward
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">schedule</span>
                Come Back Later
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CheckInDialog
