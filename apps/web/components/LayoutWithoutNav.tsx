import React from 'react'
import SideNav from './SideNav'
import BottomNavMobile from './BottomNavMobile'

/**
 * Layout wrapper without top navbar for pages that need full-screen experience
 * Used by: dashboard, eggs, animals, marketplace, etc.
 */
export default function LayoutWithoutNav({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 pt-2">
        <SideNav />
        <main className="flex-1 lg:ml-4 p-4 lg:p-8 pb-32 lg:pb-8 max-w-full overflow-hidden">
          {children}
        </main>
      </div>
      <BottomNavMobile />
    </div>
  )
}
