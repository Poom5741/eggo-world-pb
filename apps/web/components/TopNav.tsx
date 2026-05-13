import Link from 'next/link'
import { AuthLink } from '@/components/auth/AuthLink'
import AdminNavLink from '@/components/auth/AdminNavLink'

// TopNav - Desktop top navigation bar component
// Displays EggoWorld logo, navigation links, and wallet connect button
export default function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-20 bg-[var(--surface)] backdrop-blur-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-2xl font-black italic text-[var(--on-surface)] font-headline tracking-tight">
          EggoWorld
        </Link>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center space-x-8 font-headline font-bold tracking-tight">
        <AuthLink href="/dashboard" className="text-[var(--on-surface-variant)] opacity-60 hover:scale-105 transition-transform active-nav-link">
          Dashboard
        </AuthLink>
        <AuthLink href="/marketplace" className="text-[var(--on-surface-variant)] opacity-60 hover:scale-105 transition-transform active-nav-link">
          Marketplace
        </AuthLink>
        <AdminNavLink />
      </div>

      <div className="flex items-center gap-3">
        <button 
          className="bg-[var(--primary-container)] text-[var(--on-primary-container)] px-6 py-2.5 md:py-2 rounded-full font-headline font-bold text-sm hover:scale-105 transition-transform shadow-lg clay-button"
          aria-label="Connect Wallet"
        >
          Connect Wallet
        </button>
        <div className="flex space-x-2">
          <button 
            className="material-symbols-outlined text-[var(--on-surface)] opacity-60 p-2 bg-[var(--surface-container)] rounded-full cursor-pointer hover:bg-[var(--surface-container-high)] hover:animate-pulse transition-colors"
            aria-label="Wallet"
          >
            account_balance_wallet
          </button>
          <button 
            className="material-symbols-outlined text-[var(--on-surface)] opacity-60 p-2 bg-[var(--surface-container)] rounded-full cursor-pointer hover:bg-[var(--surface-container-high)] hover:animate-pulse transition-colors"
            aria-label="Notifications"
          >
            notifications
          </button>
        </div>
      </div>
    </nav>
  )
}
