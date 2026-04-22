'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Props for CooldownTimer component
 * คุณสมบัติสำหรับคอมโพเนนต์ CooldownTimer
 */
export interface CooldownTimerProps {
  /** Last bred timestamp (ISO string) */
  lastBredAt: string | null | undefined
  /** Cooldown duration in hours (default: 48) */
  cooldownHours?: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show label text */
  showLabel?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Calculate cooldown status
 * คำนวณสถานะ cooldown
 */
function _calculateCooldownStatus(
  lastBredAt: string | null | undefined,
  cooldownHours: number
): {
  isOnCooldown: boolean
  remainingSeconds: number
  totalSeconds: number
  progressPercent: number
} {
  if (!lastBredAt) {
    return {
      isOnCooldown: false,
      remainingSeconds: 0,
      totalSeconds: cooldownHours * 3600,
      progressPercent: 100,
    }
  }

  const lastBred = new Date(lastBredAt).getTime()
  const cooldownMs = cooldownHours * 60 * 60 * 1000
  const cooldownEnd = lastBred + cooldownMs
  const now = Date.now()

  const remainingMs = Math.max(0, cooldownEnd - now)
  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const totalSeconds = cooldownHours * 3600
  const elapsedSeconds = totalSeconds - remainingSeconds
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100))

  return {
    isOnCooldown: remainingMs > 0,
    remainingSeconds,
    totalSeconds,
    progressPercent,
  }
}

/**
 * Format remaining time as HH:MM:SS
 * จัดรูปแบบเวลาที่เหลือเป็น ชั่วโมง:นาที:วินาที
 */
function formatRemainingTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

/**
 * Cooldown Timer Component
 * คอมโพเนนต์แสดงเวลา cooldown
 * 
 * Displays a visual countdown timer for breeding cooldown.
 * Shows progress bar and remaining time until animal can breed again.
 * 
 * @example
 * ```tsx
 * <CooldownTimer lastBredAt={animal.last_bred_at} cooldownHours={48} />
 * ```
 */
export function CooldownTimer({
  lastBredAt,
  cooldownHours = 48,
  size = 'md',
  showLabel = true,
  className,
}: CooldownTimerProps) {
  const [status, setStatus] = useState(() =>
    _calculateCooldownStatus(lastBredAt, cooldownHours)
  )

  // Update timer every second
  useEffect(() => {
    if (!lastBredAt || !status.isOnCooldown) return

    const interval = setInterval(() => {
      const newStatus = _calculateCooldownStatus(lastBredAt, cooldownHours)
      setStatus(newStatus)

      if (!newStatus.isOnCooldown) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastBredAt, cooldownHours, status.isOnCooldown])

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'gap-1',
      icon: 'text-xs',
      text: 'text-[10px]',
      progress: 'h-1',
    },
    md: {
      container: 'gap-2',
      icon: 'text-sm',
      text: 'text-xs',
      progress: 'h-1.5',
    },
    lg: {
      container: 'gap-2',
      icon: 'text-base',
      text: 'text-sm',
      progress: 'h-2',
    },
  }

  const classes = sizeClasses[size]

  // Ready to breed state
  if (!status.isOnCooldown) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 text-success',
          classes.container,
          className
        )}
      >
        <span
          className={cn('material-symbols-outlined', classes.icon)}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
        {showLabel && (
          <span className={cn('font-medium', classes.text)}>Ready to Breed</span>
        )}
      </div>
    )
  }

  // On cooldown state
  return (
    <div className={cn('space-y-1', className)}>
      {/* Header with icon and time */}
      <div className={cn('flex items-center justify-between', classes.container)}>
        <div className="flex items-center gap-1.5 text-warning">
          <span
            className={cn('material-symbols-outlined animate-pulse', classes.icon)}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            timer
          </span>
          {showLabel && (
            <span className={cn('font-medium', classes.text)}>Cooldown</span>
          )}
        </div>
        <span className={cn('font-mono font-bold text-warning', classes.text)}>
          {formatRemainingTime(status.remainingSeconds)}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className={cn(
          'w-full bg-surface-container rounded-full overflow-hidden',
          classes.progress
        )}
      >
        <div
          className="h-full bg-warning transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${status.progressPercent}%` }}
        />
      </div>

      {/* Subtle hint text */}
      {size === 'lg' && (
        <p className="text-[10px] text-on-surface-variant">
          This animal can breed again in {formatRemainingTime(status.remainingSeconds)}
        </p>
      )}
    </div>
  )
}

export default CooldownTimer
