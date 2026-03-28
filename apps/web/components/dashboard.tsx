'use client'

import { useEffect, useState } from 'react'
import { createClient, getUser, isAuthenticated } from '@/lib/pocketbase/client'
import WalletModal from './wallet-modal'
import LogoutButton from './logout-button'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWalletModal, setShowWalletModal] = useState(false)

  useEffect(() => {
    const pb = createClient()

    const fetchUserData = async () => {
      if (isAuthenticated()) {
        const currentUser = getUser()
        setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id)
        }
      }
      setLoading(false)
    }

    fetchUserData()

    pb.authStore.onChange(() => {
      if (isAuthenticated()) {
        const currentUser = getUser()
        setUser(currentUser)
        if (currentUser) {
          fetchProfile(currentUser.id)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
    })
  }, [])

  const fetchProfile = async (userId: string) => {
    const pb = createClient()
    try {
      const data = await pb.collection('users').getOne(userId)
      if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12 border-b-4 border-primary/30 pb-4">
          <h1 className="font-[var(--font-pixel)] text-2xl text-foreground">EGGOWORLD</h1>
          <LogoutButton />
        </div>

        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="w-full max-w-md bg-secondary/30 border-4 border-primary/50 p-8 space-y-6">
            <div className="inline-flex items-center gap-2 bg-secondary/50 border-2 border-primary/50 px-4 py-2">
              <span className="w-2 h-2 bg-green-400 animate-pulse" />
              <span className="font-[var(--font-pixel)] text-xs text-foreground">
                WALLET CONNECTED
              </span>
            </div>

            <div className="py-8 space-y-4">
              <h2 className="font-[var(--font-pixel)] text-xl md:text-2xl text-foreground">
                SALE COMING SOON
              </h2>
              <p className="font-[var(--font-pixel)] text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                GET READY TO MINT YOUR UNIQUE EGGOWORLD NFT. STAY TUNED FOR THE OFFICIAL LAUNCH DATE.
              </p>
            </div>

            <div className="bg-secondary/30 border-2 border-primary/50 p-6 space-y-4">
              <div className="text-center">
                <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground mb-2">PRICE PER NFT</p>
                <p className="font-[var(--font-pixel)] text-3xl text-primary">25 USDT</p>
              </div>

              <div className="border-t border-primary/30 pt-4 space-y-2">
                <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground">YOU RECEIVE</p>
                <ul className="space-y-1 text-center">
                  <li className="font-[var(--font-pixel)] text-xs text-foreground">• 1 Egg NFT</li>
                  <li className="font-[var(--font-pixel)] text-xs text-foreground">• 1 Food NFT</li>
                  <li className="font-[var(--font-pixel)] text-xs text-foreground">• 30-Day Membership</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground text-center">REFERRAL COMMISSIONS</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="border-2 border-primary/30 bg-secondary/20 p-3 text-center">
                  <p className="font-[var(--font-pixel)] text-[10px] text-primary font-bold">GEN1</p>
                  <p className="font-[var(--font-pixel)] text-sm text-foreground">20%</p>
                </div>
                <div className="border-2 border-primary/30 bg-secondary/20 p-3 text-center">
                  <p className="font-[var(--font-pixel)] text-[10px] text-primary font-bold">GEN2</p>
                  <p className="font-[var(--font-pixel)] text-sm text-foreground">10%</p>
                </div>
                <div className="border-2 border-primary/30 bg-secondary/20 p-3 text-center">
                  <p className="font-[var(--font-pixel)] text-[10px] text-primary font-bold">GEN3</p>
                  <p className="font-[var(--font-pixel)] text-sm text-foreground">10%</p>
                </div>
                <div className="border-2 border-primary/30 bg-secondary/20 p-3 text-center">
                  <p className="font-[var(--font-pixel)] text-[10px] text-primary font-bold">GEN4</p>
                  <p className="font-[var(--font-pixel)] text-sm text-foreground">10%</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowWalletModal(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-[var(--font-pixel)] text-xs py-4 border-4 border-primary transition-colors"
            >
              SUBMIT USDT TRANSFER
            </button>
          </div>
        </div>
      </div>

      {showWalletModal && profile && (
        <WalletModal
          profile={profile}
          onClose={() => setShowWalletModal(false)}
          onTransactionSubmitted={() => {
            setShowWalletModal(false)
            if (user) fetchProfile(user.id)
          }}
        />
      )}
    </div>
  )
}