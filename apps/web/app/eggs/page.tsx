'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { useEggPoll, EggData } from '@/hooks/use-egg-poll'
import { FeaturedEggHero } from '@/components/eggs/featured-egg-hero'
import { EggCard } from '@/components/eggs/egg-card'
import { createClient, getUser, restoreAuth } from '@/lib/pocketbase/client'
import { Egg } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import heavy modal components to reduce initial bundle size
const HatchRevealModal = dynamic(
  () => import('@/components/eggs/hatch-reveal-modal').then((mod) => mod.HatchRevealModal),
  {
    loading: () => null,
  }
)

const FeedDialog = dynamic(
  () => import('@/components/eggs/feed-dialog').then((mod) => mod.FeedDialog),
  {
    loading: () => null,
  }
)

const MintEggModal = dynamic(
  () => import('@/components/mint/MintEggModal').then((mod) => mod.MintEggModal),
  {
    loading: () => null,
  }
)

const CreateListingDialog = dynamic(
  () => import('@/components/marketplace/CreateListingDialog').then((mod) => mod.CreateListingDialog),
  {
    loading: () => null,
  }
)

/**
 * My Eggs page - displays user's Egg NFT inventory
 * หน้าที่แสดง Egg NFT ที่ผู้ใช้เป็นเจ้าของ
 * 
 * Features:
 * - Featured egg hero (egg closest to hatching)
 * - Grid of all user's eggs with feeding progress
 * - Auto-polling every 30 seconds
 * - Auth guard (redirects to login if not authenticated)
 */
export default function Eggs() {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const pb = createClient()
  
  // State for hatching egg - สถานะสำหรับไข่ที่กำลังฟัก
  const [hatchingEgg, setHatchingEgg] = useState<EggData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  
  // State for feeding egg - สถานะสำหรับไข่ที่กำลังให้อาหาร
  const [feedingEgg, setFeedingEgg] = useState<EggData | null>(null)
  const [feedDialogOpen, setFeedDialogOpen] = useState(false)
  
  // State for selling egg - สถานะสำหรับขายไข่
  const [sellingEgg, setSellingEgg] = useState<EggData | null>(null)
  const [sellDialogOpen, setSellDialogOpen] = useState(false)
  
  // State for mint modal - สถานะสำหรับ mint modal
  const [isMintModalOpen, setIsMintModalOpen] = useState(false)
  
  // State for user feedback messages - ข้อความแจ้งเตือนชั่วคราว
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
  
  // Get authenticated user (after hydration) using getUser() for v0.25.2 compat
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)
  
  useEffect(() => {
    if (isHydrated) {
      // Try to restore auth from token if model is missing
      restoreAuth(pb).then((restored) => {
        const u = getUser()
        setUser(u)
        setAuthReady(true)
        if (restored) {
          console.log('[Eggs] Auth restored, user:', u?.id)
        }
      })
    }
  }, [isHydrated])
  
  // Fetch user profile to get wallet if not in auth record
  const [_userWallet, _setUserWallet] = useState<string | undefined>(undefined)
  
  useEffect(() => {
    if (authReady && user?.id) {
      pb.collection('users').getOne(user.id).then((userData: any) => {
        const wallet = userData.wallet
        if (wallet && typeof wallet === 'string' && wallet !== 'null') {
          _setUserWallet(wallet)
        } else {
          _setUserWallet('')
        }
      }).catch(console.error)
    }
  }, [authReady, user?.id])
  
  // Fetch eggs with auto-polling (uses user ID since owner is relation to users)
  const { eggs, loading, refresh, polling } = useEggPoll(user?.id, 30000)
  
  // Force refresh eggs when auth becomes ready
  useEffect(() => {
    if (authReady && user?.id) {
      refresh()
    }
  }, [authReady, user?.id])
  
  // Auth guard - redirect to login if not authenticated (wait for authReady)
  useEffect(() => {
    if (authReady && !user) {
      router.push('/auth/login')
    }
  }, [authReady, user, router])
  
  // Refresh eggs when page gains focus (e.g., after breeding success navigation)
  // รีเฟรชไข่เมื่อหน้ากลับมาโฟกัส (เช่น หลังจากนำทางจาก breeding success)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        refresh()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh, user?.id])
  
  // Handle manage egg action - เปิด FeedDialog เมื่อคลิก "Manage Egg"
  const handleManageEgg = (eggId: number) => {
    const egg = eggs.find(e => e.egg_id === eggId)
    if (egg) {
      setFeedingEgg(egg)
      setFeedDialogOpen(true)
    }
  }
  
  // Handle feed action
  const handleFeedEgg = (eggId: number) => {
    const egg = eggs.find(e => e.egg_id === eggId)
    if (egg) {
      setFeedingEgg(egg)
      setFeedDialogOpen(true)
    }
  }
  
  // Handle play action - interaction with the egg (cosmetic/animation only)
  // Note: Full play mechanic is P2 and awaiting game design spec
  const handlePlayEgg = (eggId: number) => {
    const egg = eggs.find(e => e.egg_id === eggId)
    if (egg) {
      setMessage({ type: 'info', text: `🎮 Egg #${egg.egg_id} is happy! Play feature coming soon — stay tuned!` })
      setTimeout(() => setMessage(null), 4000)
    }
  }
  
  // Handle hatch button click - จัดการการคลิกปุ่มฟักไข่
  const handleHatchEgg = (egg: EggData) => {
    setHatchingEgg(egg)
    setModalOpen(true)
  }
  
  // Handle sell button click - จัดการการคลิกปุ่มขายไข่
  const handleSellEgg = (egg: EggData) => {
    setSellingEgg(egg)
    setSellDialogOpen(true)
  }
  
  // Handle upgrade button click - จัดการการคลิกปุ่มอัปเกรดความหายาก
  const handleUpgradeEgg = (_egg: EggData) => {
    // Refresh egg list to show updated food_count after upgrade
    refresh()
  }
  
  // Handle hatch success - จัดการฟักไข่สำเร็จ
  const handleHatchSuccess = () => {
    // Refresh egg list to show updated status
    refresh()
  }
  
  // Loading state - แสดงสถานะกำลังโหลด (wait for authReady + egg poll)
  if (!authReady || loading) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton - โครงร่างส่วนหัว */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-4">
              <div className="h-16 w-80 bg-surface-container rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-surface-container rounded animate-pulse" />
            </div>
            <div className="h-20 w-48 bg-surface-container rounded-lg animate-pulse" />
          </div>
          
          {/* Featured Egg Hero Skeleton - โครงร่าง Featured Egg */}
          <div className="mb-16">
            <div className="bg-surface-container-low rounded-xl p-8 h-96 clay-card animate-pulse" />
          </div>
          
          {/* Egg Grid Skeleton - โครงร่างตารางไข่ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container-lowest p-6 rounded-xl clay-card">
                <div className="h-48 bg-surface-container rounded-lg mb-6 animate-pulse" />
                <div className="h-6 w-40 bg-surface-container rounded mb-4 animate-pulse" />
                <div className="h-4 w-32 bg-surface-container rounded mb-6 animate-pulse" />
                <div className="h-2 w-full bg-surface-container rounded mb-2 animate-pulse" />
                <div className="h-10 w-full bg-surface-container-high rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </LayoutWithoutNav>
    )
  }
  
  // Not authenticated - จะถูก redirect ไป login
  if (authReady && !user) {
    return null
  }
  
  // Empty state - กรณีไม่มีไข่
  if (eggs.length === 0) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-5xl font-pixel-style text-primary mb-2">My Egg Inventory</h1>
              <p className="text-on-surface-variant max-w-md">
                Manage your digital companions, keep them fed, and watch them hatch into legendary creatures.
              </p>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-xl p-12 clay-card text-center">
            <span className="material-symbols-outlined text-6xl text-primary mb-4">egg</span>
            <h2 className="text-2xl font-pixel-style text-primary mb-2">No Eggs Yet</h2>
            <p className="text-on-surface-variant mb-6">
              You don&apos;t have any Egg NFTs yet. Start your journey by purchasing your first egg!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/marketplace')}
                className="clay-button bg-primary text-on-primary py-4 px-8 rounded-xl font-black text-lg"
              >
                Get Your First Egg
              </button>
              {/* Manual retry button - ปุ่มลองใหม่ด้วยตนเอง */}
              <button
                onClick={refresh}
                className="clay-button bg-surface-container text-primary py-4 px-8 rounded-xl font-black text-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined">refresh</span>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </LayoutWithoutNav>
    )
  }
  
  // Main content - เนื้อหาหลัก
  return (
    <LayoutWithoutNav>
      <div className="max-w-6xl mx-auto">
        {/* Page Header - ส่วนหัวของหน้า */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-pixel-style text-primary mb-2">My Egg Inventory</h1>
            <p className="text-on-surface-variant max-w-md">
              Manage your digital companions, keep them fed, and watch them hatch into legendary creatures.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsMintModalOpen(true)}
              className="clay-button bg-[var(--primary-container)] text-[var(--on-primary-container)] py-4 px-6 rounded-2xl font-black text-base flex items-center gap-2 shadow-clay-md"
            >
              <Egg className="w-5 h-5" />
              Mint New Egg
            </button>
            <div className="clay-card bg-surface-container-lowest px-6 py-4 rounded-lg flex items-center gap-4">
              <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                token
              </span>
              <div>
                <div className="text-xs font-bold text-on-surface-variant uppercase">Egg Power</div>
                <div className="text-xl font-black text-primary">{eggs.length * 1000}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* User feedback message - ข้อความแจ้งเตือน */}
        {message && (
          <div className="mb-6 p-4 rounded-xl clay-card bg-primary-container text-on-primary-container flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
            <span className="material-symbols-outlined">{message.type === 'info' ? 'info' : 'warning'}</span>
            <span className="font-medium">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto material-symbols-outlined hover:opacity-70">close</button>
          </div>
        )}
        
        {/* Featured Egg Hero - ไข่ที่ใกล้จะฟักที่สุด */}
        {eggs.length > 0 && (
          <FeaturedEggHero
            egg={eggs[0]} // First egg has highest food_count (sorted by hook)
            onFeed={handleFeedEgg}
            onPlay={handlePlayEgg}
            onHatch={handleHatchEgg}
            onUpgrade={handleUpgradeEgg}
            polling={polling}
          />
        )}
        
        {/* Egg Grid - ตารางแสดงไข่ทั้งหมด */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eggs.slice(1).map((egg) => (
            <EggCard
              key={egg.id}
              egg={egg}
              onManage={handleManageEgg}
              onHatch={handleHatchEgg}
              onSell={handleSellEgg}
              onUpgrade={handleUpgradeEgg}
              polling={polling}
            />
          ))}
        </div>
      </div>
      
      {/* Hatch Reveal Modal - โมดัลฟักไข่ */}
      {hatchingEgg && (
        <HatchRevealModal
          egg={hatchingEgg}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={handleHatchSuccess}
        />
      )}
      
      {/* Feed Dialog - ไดอะล็อกให้อาหาร */}
      {feedingEgg && (
        <FeedDialog
          egg={feedingEgg}
          open={feedDialogOpen}
          onOpenChange={setFeedDialogOpen}
          onSuccess={handleHatchSuccess} // Refresh eggs after feeding
        />
      )}
      
      {/* Create Listing Dialog - ไดอะล็อกขายไข่ */}
      {sellingEgg && (
        <CreateListingDialog
          open={sellDialogOpen}
          onOpenChange={setSellDialogOpen}
          nftName={`Egg #${sellingEgg.egg_id}`}
          nftType="Egg"
          tokenId={sellingEgg.egg_id.toString()}
          onSuccess={handleHatchSuccess}
        />
      )}
      
      {/* Mint Egg Modal - โมดัล mint ไข่ */}
      <MintEggModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        onSuccess={() => {
          refresh()
          setIsMintModalOpen(false)
        }}
      />
    </LayoutWithoutNav>
  )
}
