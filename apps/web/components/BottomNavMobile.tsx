'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MOBILE_NAV_ITEMS } from './SideNav'

// BottomNavMobile - Mobile bottom navigation component
// Visible on mobile (<1024px), hidden on desktop
// Includes iOS safe area padding
export default function BottomNavMobile() {
  const pathname = usePathname()
  
  return (
    <nav 
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 h-24 bg-[var(--surface)] backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] border-t-4 border-[var(--primary-container)]/20 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-end px-4 pb-6 h-full">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={`${item.label}${isActive ? ' (current page)' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-2 transition-all focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 rounded-lg ${
                isActive
                  ? 'text-[var(--on-surface)] opacity-100 font-extrabold scale-110'
                  : 'text-[var(--on-surface)] opacity-70 hover:opacity-100'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
