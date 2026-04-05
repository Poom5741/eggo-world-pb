"use client"

import { useRouter } from 'next/navigation'

/**
 * Quick Action item interface
 * อินเทอร์เฟซสำหรับรายการ Quick Action
 */
interface QuickAction {
  id: string
  title: string
  description: string
  icon: string // Material Symbols name
  href: string // Navigation path
  color: "primary" | "secondary" | "tertiary"
}

/**
 * QuickActions Component Props
 * Props สำหรับ component QuickActions
 */
interface QuickActionsProps {
  /** Optional override for actions (uses defaults if not provided) */
  actions?: QuickAction[]
}

/**
 * Default quick actions configuration per D-08 to D-11
 * ค่าเริ่มต้นสำหรับ Quick Actions ตามการตัดสินใจ D-08 ถึง D-11
 */
const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'feed-all',
    title: 'Feed All Eggs',
    description: 'Requires 12 units of food',
    icon: 'restaurant',
    href: '/mint',
    color: 'primary'
  },
  {
    id: 'hatch-ready',
    title: 'Hatch Ready Eggs',
    description: '3 eggs are ready to burst!',
    icon: 'auto_fix_high',
    href: '/dashboard/eggs',
    color: 'secondary'
  },
  {
    id: 'buy-food',
    title: 'Buy Food Bundle',
    description: 'Refill your supplies',
    icon: 'shopping_basket',
    href: '/mint/food',
    color: 'tertiary'
  }
]

/**
 * QuickActions Component
 * คอมโพเนนต์ Quick Actions สำหรับเข้าถึงฟีเจอร์หลักอย่างรวดเร็ว
 * 
 * Features per Jules design:
 * - 3 action cards with colored containers (primary, secondary, tertiary)
 * - Material Symbols icons in white/40 circles
 * - Title + description on left, chevron on right
 * - Hover: scale-[1.02], Active: scale-[0.98] per D-11
 * - Claymorphism styling with rounded-xl
 * - No Card wrapper - returns inline buttons
 * 
 * @example
 * ```tsx
 * <QuickActions />
 * ```
 */
export function QuickActions({ actions }: QuickActionsProps) {
  const router = useRouter()
  const quickActions = actions || DEFAULT_ACTIONS

  return (
    <div className="flex flex-col space-y-4">
      {quickActions.map((action) => {
        // Color mapping for container backgrounds per Jules design
        const colorStyles = {
          primary: 'bg-primary-container text-on-primary-container',
          secondary: 'bg-secondary-container text-on-secondary-container',
          tertiary: 'bg-tertiary-container text-on-tertiary-container'
        }

        return (
          <button
            key={action.id}
            onClick={() => router.push(action.href)}
            className={`
              w-full flex items-center justify-between p-6 rounded-xl clay-card
              ${colorStyles[action.color]}
              hover:scale-[1.02] active:scale-[0.98] transition-transform
            `}
          >
            {/* Left side: Icon + Text */}
            <div className="flex items-center space-x-4">
              {/* Icon circle with white/40 background */}
              <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined">{action.icon}</span>
              </div>
              
              {/* Title and description */}
              <div className="text-left">
                <p className="font-bold">{action.title}</p>
                <p className="text-xs opacity-70">{action.description}</p>
              </div>
            </div>
            
            {/* Right side: Chevron icon */}
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )
      })}
    </div>
  )
}
