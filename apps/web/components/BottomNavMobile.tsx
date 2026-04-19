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
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-2 transition-colors ${
                isActive
                  ? 'text-[var(--primary)] opacity-100'
                  : 'text-[var(--on-surface)] opacity-40 hover:opacity-100 hover:text-[var(--primary)]'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
