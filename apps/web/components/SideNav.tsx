import { AuthLink } from '@/components/auth/AuthLink'

// Type definition for navigation items
export type NavItem = {
  icon: string
  label: string
  href: string
}

// Navigation items shared between SideNav and BottomNavMobile
export const NAV_ITEMS: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { icon: 'egg', label: 'Eggs', href: '/eggs' },
  { icon: 'storefront', label: 'Market', href: '/marketplace' },
  { icon: 'account_balance_wallet', label: 'Wallet', href: '/wallet' },
  { icon: 'person', label: 'Profile', href: '/settings' },
]

// SideNav - Desktop side navigation component
// Visible on desktop (≥1024px), hidden on mobile
export default function SideNav() {
  return (
    <aside className="hidden lg:flex flex-col w-72 bg-[var(--surface-container)] rounded-r-[3rem] h-[calc(100vh-2rem)] mt-4 ml-4 mr-2 shadow-[20px_0_40px_rgba(0,0,0,0.06)] sticky top-4 overflow-hidden">
      {/* Top Section: EggoBuddy Profile */}
      <div className="flex items-center space-x-4 px-6 py-6 shrink-0">
        <div className="w-12 h-12 bg-[var(--primary-container)] rounded-2xl flex items-center justify-center clay-card overflow-hidden">
          <img 
            alt="Eggo Mascot" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNRQcVq1g4tz-tcxCtmfRYhRwUpJ_UBpB-wtmAI2G_cJbzIlynXZYZJaSCZvuJTiH0dCtzQg18_rX6-lJ0oI2oIlXouUDy2v2r3Q1JvsxuqYvnLUez20peTTgddXpDkowvh6or7rQYnENYymPHDqloOmOeKA42jOTs3vR-Az3Vpdf8RJyXAXwQ024pmznuJUNVrd33xJLaZi6kKMYOsjyexEbbsudatolgiP1elIvPR3sWXpZuVRzNdeDfS-LQ_GtwKOUZJBrvl25P"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--on-surface)] font-headline">EggoBuddy</h2>
          <p className="text-xs text-[var(--on-surface-variant)] opacity-70 font-medium">Ready to hatch?</p>
        </div>
      </div>
      
      {/* Middle Section: Navigation Links (scrollable) */}
      <nav className="flex-grow overflow-y-auto px-6 space-y-2">
        {NAV_ITEMS.map((item) => (
          <AuthLink 
            key={item.href}
            href={item.href}
            className="flex items-center space-x-4 px-4 py-3 min-h-[44px] text-[var(--on-surface-variant)] opacity-70 hover:bg-[var(--surface-container-high)] rounded-full transition-all duration-300 hover:translate-x-2 active-side-nav"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium font-headline">{item.label}</span>
          </AuthLink>
        ))}
      </nav>

      {/* Bottom Section: Settings & Support (fixed) */}
      <div className="pt-4 border-t border-[var(--on-surface)]/5 px-6 space-y-2 shrink-0">
        <AuthLink href="/settings" className="flex items-center space-x-4 px-4 py-2 text-[var(--on-surface-variant)] opacity-70 hover:bg-[var(--surface-container-high)] rounded-full transition-all duration-300">
          <span className="material-symbols-outlined text-sm">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </AuthLink>
        <AuthLink href="/support" className="flex items-center space-x-4 px-4 py-2 text-[var(--on-surface-variant)] opacity-70 hover:bg-[var(--surface-container-high)] rounded-full transition-all duration-300">
          <span className="material-symbols-outlined text-sm">help_outline</span>
          <span className="text-sm font-medium">Support</span>
        </AuthLink>
      </div>

      {/* Bottom Section: Feed Eggo Button (fixed) */}
      <div className="px-6 pb-6 pt-2 shrink-0">
        <button className="w-full py-4 bg-[var(--tertiary)] text-[var(--on-tertiary)] rounded-2xl font-bold clay-button hover:scale-[1.02] active:scale-95 transition-all font-headline">
          Feed Eggo
        </button>
      </div>
    </aside>
  )
}
