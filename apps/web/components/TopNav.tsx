import React from 'react'

// Placeholder component - will be implemented in next plan
export default function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 h-20 bg-surface/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 h-full">
        <div className="text-2xl font-black italic text-yellow-800">EggoWorld</div>
        <button className="bg-primary px-6 py-2 rounded-full font-bold text-sm">
          Connect Wallet
        </button>
      </div>
    </nav>
  )
}
