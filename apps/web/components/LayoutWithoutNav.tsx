'use client'

import React, { useState, useRef, useEffect } from 'react'
import SideNav from './SideNav'
import BottomNavMobile from './BottomNavMobile'
import { AccountModal } from './account-modal'
import { getUser, isAuthenticated } from '@/lib/pocketbase/client'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import LogoutButton from './logout-button'
import Image from 'next/image'
import { User } from 'lucide-react'

function truncateWallet(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Layout wrapper without top navbar for pages that need full-screen experience
 * Used by: dashboard, eggs, animals, marketplace, etc.
 */
export default function LayoutWithoutNav({ children }: { children: React.ReactNode }) {
  const isHydrated = useIsHydrated()
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const loggedIn = isHydrated && isAuthenticated()
  const user = isHydrated ? getUser() : null
  
  const userName = user?.name || user?.username || 'User'
  const walletAddress = user?.wallet || ''
  const avatarPath = user?.avatar
  
  const userPicture = avatarPath 
    ? `https://pb.eggoworld.io/api/files/users/${user.id}/${avatarPath}`
    : null

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 pt-2">
        <SideNav />
        <main className="flex-1 lg:ml-4 p-4 lg:p-8 pb-32 lg:pb-8 max-w-full overflow-hidden">
          {children}
        </main>
      </div>
      
      {loggedIn && (
        <>
          <div className="fixed top-4 right-4 lg:top-6 lg:right-6 z-40">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 border-2 border-primary/30 hover:border-primary rounded transition-all bg-surface"
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
                <div className="text-left hidden sm:block">
                  <div className="font-[var(--font-pixel)] text-[10px] text-foreground truncate max-w-[100px]">
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
                    <p className="font-[var(--font-pixel)] text-[10px] text-foreground truncate">
                      {userName}
                    </p>
                    {walletAddress && (
                      <p className="font-mono text-[9px] text-muted-foreground mt-1 truncate">
                        {walletAddress}
                      </p>
                    )}
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setAccountModalOpen(true)
                        setUserDropdownOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-[10px] font-[var(--font-pixel)] text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
                    >
                      ACCOUNT
                    </button>
                    <div className="border-t-2 border-primary/10 mt-1 pt-1 px-3 pb-2">
                      <LogoutButton />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <AccountModal 
            isOpen={accountModalOpen} 
            onClose={() => setAccountModalOpen(false)} 
          />
        </>
      )}
      
      <BottomNavMobile />
    </div>
  )
}
