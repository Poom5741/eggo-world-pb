import Link from 'next/link'
import { NAV_ITEMS } from './SideNav'

// BottomNavMobile - Mobile bottom navigation component
// Visible on mobile (<1024px), hidden on desktop
// Includes iOS safe area padding
export default function BottomNavMobile() {
  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 h-24 bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] border-t-4 border-yellow-100/20 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-end px-4 pb-6 h-full">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center text-yellow-900/40 dark:text-yellow-100/40 py-2 transition-colors hover:text-yellow-500"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
