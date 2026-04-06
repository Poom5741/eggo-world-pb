import Link from 'next/link'

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
  { icon: 'pets', label: 'Animals', href: '/animals' },
  { icon: 'storefront', label: 'Marketplace', href: '/marketplace' },
  { icon: 'group_add', label: 'Referrals', href: '/referrals' },
]

// SideNav - Desktop side navigation component
// Visible on desktop (≥1024px), hidden on mobile
export default function SideNav() {
  return (
    <aside className="hidden lg:flex flex-col w-72 p-6 space-y-8 bg-[var(--surface-container)] rounded-r-[3rem] h-[calc(100vh-6rem)] my-4 ml-4 shadow-[20px_0_40px_rgba(0,0,0,0.06)] sticky top-24">
      <div className="flex items-center space-x-4 px-2">
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
      
      <nav className="flex-grow space-y-2">
        {NAV_ITEMS.map((item) => (
          <Link 
            key={item.href}
            href={item.href}
            className="flex items-center space-x-4 px-4 py-3 text-[var(--on-surface-variant)] opacity-70 hover:bg-[var(--surface-container-high)] rounded-full transition-all duration-300 hover:translate-x-2 active-side-nav"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium font-headline">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="pt-4 border-t border-[var(--on-surface)]/5 space-y-2">
        <Link href="#" className="flex items-center space-x-4 px-4 py-2 text-[var(--on-surface-variant)] opacity-70 hover:bg-[var(--surface-container-high)] rounded-full transition-all duration-300">
          <span className="material-symbols-outlined text-sm">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <Link href="#" className="flex items-center space-x-4 px-4 py-2 text-[var(--on-surface-variant)] opacity-70 hover:bg-[var(--surface-container-high)] rounded-full transition-all duration-300">
          <span className="material-symbols-outlined text-sm">help_outline</span>
          <span className="text-sm font-medium">Support</span>
        </Link>
      </div>

      <button className="w-full py-4 bg-[var(--tertiary)] text-[var(--on-tertiary)] rounded-2xl font-bold clay-button hover:scale-[1.02] active:scale-95 transition-all font-headline">
        Feed Eggo
      </button>
    </aside>
  )
}
