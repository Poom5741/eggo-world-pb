import React from 'react'
import TopNav from './TopNav'
import SideNav from './SideNav'
import BottomNavMobile from './BottomNavMobile'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <div className="flex flex-1 pt-20">
        <SideNav />
        <main className="flex-1 lg:ml-4 p-4 lg:p-8 pb-32 lg:pb-8 max-w-full overflow-hidden">
          {children}
        </main>
      </div>
      <BottomNavMobile />
    </div>
  )
}
