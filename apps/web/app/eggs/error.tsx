'use client'

import { Button } from '@/components/ui/button'
import LayoutWrapper from '@/components/LayoutWrapper'
import Link from 'next/link'

/**
 * Error props interface
 * อินเตอร์เฟซสำหรับ props ของ error boundary
 */
interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error boundary for eggs page
 * หน้าแสดงข้อผิดพลาดของ eggs page
 * 
 * Displays when egg data fails to load with:
 * - Error icon and message
 * - Retry button
 * - Link back to dashboard
 */
export default function Error({ error, reset }: ErrorProps) {
  return (
    <LayoutWrapper>
      <div className="max-w-6xl mx-auto">
        {/* Error Container - คอนเทนเนอร์แสดงข้อผิดพลาด */}
        <div className="clay-card bg-surface-container-low rounded-xl p-8 max-w-md mx-auto mt-20 text-center">
          {/* Error Icon - ไอคอนข้อผิดพลาด */}
          <div className="flex justify-center mb-6">
            <span className="material-symbols-outlined text-6xl text-destructive">
              error
            </span>
          </div>

          {/* Error Title - หัวข้อข้อผิดพลาด */}
          <h2 className="text-2xl font-pixel-style text-primary mb-4">
            Failed to Load Eggs
          </h2>

          {/* Error Message - ข้อความข้อผิดพลาด */}
          <div className="mb-6">
            <p className="text-sm text-on-surface-variant mb-2">
              {error.message.length > 100 
                ? `${error.message.substring(0, 100)}...` 
                : error.message}
            </p>
            <p className="text-xs text-on-surface-variant">
              Please check your connection and try again
            </p>
          </div>

          {/* Action Buttons - ปุ่มดำเนินการ */}
          <div className="space-y-3">
            {/* Retry Button - ปุ่มลองใหม่ */}
            <Button
              onClick={reset}
              variant="clay"
              size="clay-lg"
              className="w-full gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </Button>

            {/* Alternative: Go to Dashboard - ทางเลือก: กลับไป Dashboard */}
            <Button
              variant="ghost"
              size="clay-lg"
              className="w-full"
              asChild
            >
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}
