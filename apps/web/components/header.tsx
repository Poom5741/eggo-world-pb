'use client'

import Image from 'next/image'
import Link from 'next/link'
import AuthLink from '@/components/auth/AuthLink'
import { getUser, isAuthenticated, createClient } from '@/lib/pocketbase/client'
import LogoutButton from '@/components/logout-button'
import { useEffect, useState, useRef } from 'react'
import { Menu, X, User, Egg, ShoppingCart, Wallet, TrendingUp, LayoutDashboard } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/eggs', label: 'MY EGGS', icon: Egg },
  { href: '/marketplace/food', label: 'MARKETPLACE', icon: ShoppingCart },
  { href: '/dashboard/commissions', label: 'COMMISSIONS', icon: TrendingUp },
  { href: '/wallet', label: 'WALLET', icon: Wallet },
]

function truncateWallet(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Header() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateAuth = () => {
      const authed = isAuthenticated()
      setLoggedIn(authed)
      if (authed) {
        setUser(getUser())
      }
    }

    updateAuth()

    // Listen for auth changes (e.g., after OAuth callback)
    const pb = createClient()
    const unsubscribe = pb.authStore.onChange(() => {
      updateAuth()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userDropdownOpen])

  // Close mobile menu on route change (poll pathname)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if ((window as any).__lastPath !== currentPath) {
          setMobileMenuOpen(false)
          setUserDropdownOpen(false)
          ;(window as any).__lastPath = currentPath
        }
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const walletAddress = user?.wallet || user?.wallet_address || ''
  const userName = user?.name || 'User'
  const userPicture = user?.picture || user?.avatar || ''

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 border-b-4 border-primary/30">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={loggedIn ? '/dashboard' : '/'} className="flex items-center gap-3">
          <Image
            src="/eggoworld-logo.svg"
            alt="EggoWorld Logo"
            width={40}
            height={40}
            loading="eager"
            className="pixelated"
          />
          <span className="font-body text-primary text-xs md:text-sm tracking-wider">
            EGGOWORLD
          </span>
        </Link>

        {/* Desktop Navigation (logged in) */}
        {loggedIn && (
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <AuthLink
                  key={item.href}
                  href={item.href}
                  className="font-body text-[10px] text-foreground hover:text-primary px-3 py-2 border-2 border-transparent hover:border-primary/30 rounded transition-all flex items-center gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </AuthLink>
              )
            })}
          </nav>
        )}

        {/* Auth / User Section */}
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              {/* User Dropdown (Desktop) */}
              <div className="hidden lg:block relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-primary/30 hover:border-primary rounded transition-all"
                >
                  {userPicture ? (
                    <Image
                      src={userPicture}
                      alt={userName}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                  <div className="text-left">
                    <div className="font-body text-[10px] text-foreground truncate max-w-[100px]">
                      {userName}
                    </div>
                    {walletAddress && (
                      <div className="font-mono text-[9px] text-muted-foreground">
                        {truncateWallet(walletAddress)}
                      </div>
                    )}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border-2 border-primary/30 rounded shadow-sm z-50">
                    <div className="p-3 border-b-2 border-primary/10">
                      <p className="font-body text-[10px] text-foreground truncate">
                        {userName}
                      </p>
                      {walletAddress && (
                        <p className="font-mono text-[9px] text-muted-foreground mt-1 truncate">
                          {walletAddress}
                        </p>
                      )}
                    </div>
                    <div className="py-1">
                      {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <AuthLink
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 px-3 py-2 text-[10px] font-body text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {item.label}
                          </AuthLink>
                        )
                      })}
                      <div className="border-t-2 border-primary/10 mt-1 pt-1 px-3 pb-2">
                        <LogoutButton />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 border-2 border-primary/30 hover:border-primary rounded transition-all"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-primary" />
                ) : (
                  <Menu className="w-5 h-5 text-primary" />
                )}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex font-body text-xs text-foreground hover:text-primary px-3 py-2 border-2 border-primary/30 hover:border-primary transition-all cursor-pointer"
                scroll={true}
              >
                LOGIN
              </Link>
              <Link
                href="/auth/sign-up"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-body text-xs px-4 py-2 border-2 border-primary transition-all cursor-pointer"
                scroll={true}
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu (logged in) */}
      {loggedIn && mobileMenuOpen && (
        <div className="lg:hidden border-t-4 border-primary/30 bg-background">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {/* Mobile User Info */}
            <div className="flex items-center gap-3 px-3 py-3 border-b-2 border-primary/10 mb-3">
              {userPicture ? (
                <Image
                  src={userPicture}
                  alt={userName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
              <div>
                <p className="font-body text-xs text-foreground">{userName}</p>
                {walletAddress && (
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    {walletAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Nav Items */}
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <AuthLink
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-3 font-body text-xs text-foreground hover:text-primary hover:bg-primary/5 rounded transition-all border-2 border-transparent hover:border-primary/30"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </AuthLink>
              )
            })}

            {/* Logout */}
            <div className="pt-3 border-t-2 border-primary/10">
              <LogoutButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
