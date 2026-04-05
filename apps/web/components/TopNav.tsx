import Link from 'next/link'

// TopNav - Desktop top navigation bar component
// Displays EggoWorld logo, navigation links, and wallet connect button
export default function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-20 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-2xl font-black italic text-yellow-800 dark:text-yellow-300 font-headline tracking-tight">
          EggoWorld
        </Link>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center space-x-8 font-headline font-bold tracking-tight">
        <Link href="/dashboard" className="text-yellow-700/60 dark:text-yellow-400/60 hover:scale-105 transition-transform active-nav-link">
          Dashboard
        </Link>
        <Link href="/marketplace" className="text-yellow-700/60 dark:text-yellow-400/60 hover:scale-105 transition-transform active-nav-link">
          Marketplace
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button 
          className="bg-primary text-on-primary md:bg-primary-container md:text-on-primary-container px-6 py-2.5 md:py-2 rounded-full font-headline font-bold text-sm hover:scale-105 transition-transform shadow-lg md:shadow-none clay-button"
          aria-label="Connect Wallet"
        >
          Connect Wallet
        </button>
        <div className="flex space-x-2">
          <button 
            className="material-symbols-outlined text-yellow-700/60 md:text-yellow-700 p-2 md:bg-surface-container rounded-full cursor-pointer hover:bg-surface-container-high hover:animate-pulse transition-colors"
            aria-label="Wallet"
          >
            account_balance_wallet
          </button>
          <button 
            className="material-symbols-outlined text-yellow-700/60 md:text-yellow-700 p-2 md:bg-surface-container rounded-full cursor-pointer hover:bg-surface-container-high hover:animate-pulse transition-colors"
            aria-label="Notifications"
          >
            notifications
          </button>
        </div>
      </div>
    </nav>
  )
}
