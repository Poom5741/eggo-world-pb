'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { useAnimalPoll, AnimalData } from '@/hooks/use-animal-poll'
import { AnimalCard } from '@/components/animal-nft/AnimalCard'
import { CreateListingDialog } from '@/components/marketplace/CreateListingDialog'
import { BreedingDialog } from '@/components/breeding/BreedingDialog'
import { BreedingResult } from '@/hooks/use-breeding'
import { createClient, getUser, restoreAuth } from '@/lib/pocketbase/client'
import { toast } from 'sonner'

export default function Animals() {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const pb = createClient()

  // สถานะสำหรับเปิด/ปิด dialog และสัตว์ที่กำลังขาย
  // State for dialog open/close and animal being sold
  const [sellingAnimal, setSellingAnimal] = useState<AnimalData | null>(null)
  const [sellDialogOpen, setSellDialogOpen] = useState(false)
  const [_isCreatingListing, setIsCreatingListing] = useState(false)

  // State for breeding dialog
  const [breedingDialogOpen, setBreedingDialogOpen] = useState(false)
  const [breedingParent1, setBreedingParent1] = useState<AnimalData | null>(null)

  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (isHydrated) {
      restoreAuth(pb).then((restored) => {
        const u = getUser()
        setUser(u)
        setAuthReady(true)
        if (restored) console.log('[Animals] Auth restored:', u?.id)
      })
    }
  }, [isHydrated])

  // Use user ID for querying animal_nfts (owner field is a relation to users collection)
  const effectiveUserId = user?.id || ''
  const { animals, loading, refresh, polling } = useAnimalPoll(effectiveUserId, 30000)

  useEffect(() => {
    if (authReady && !user) {
      router.push('/auth/login')
    }
  }, [authReady, user, router])

  // Force refresh animals when auth becomes ready
  useEffect(() => {
    if (authReady && user?.id) {
      refresh()
    }
  }, [authReady, user?.id])

  // ฟังก์ชันจัดการเมื่อผู้ใช้กดปุ่มขาย
  // Handler when user clicks sell button
  const handleSell = (animal: AnimalData) => {
    setSellingAnimal(animal)
    setSellDialogOpen(true)
  }

  // Handler when user clicks breed button
  const handleBreed = (animal: AnimalData) => {
    setBreedingParent1(animal)
    setBreedingDialogOpen(true)
  }

  // Handler when breeding is successful
  const handleBreedingSuccess = (result: BreedingResult) => {
    toast.success(`Breeding successful! New egg #${result.token_id} created`)
    refresh()
  }

  // ฟังก์ชันจัดการเมื่อสร้างรายการสำเร็จ
  // Handler when listing is created successfully
  const handleListingSuccess = () => {
    toast.success('รายการขายถูกสร้างสำเร็จ!')
    setSellDialogOpen(false)
    setSellingAnimal(null)
    // รีเฟรชรายการสัตว์
    // Refresh animals list
    refresh()
    setIsCreatingListing(false)
  }

  if (!authReady || loading) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-4">
              <div className="h-16 w-80 bg-surface-container rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-surface-container rounded animate-pulse" />
            </div>
            <div className="h-20 w-48 bg-surface-container rounded-lg animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container-lowest p-6 rounded-xl clay-card">
                <div className="h-48 bg-surface-container rounded-lg mb-6 animate-pulse" />
                <div className="h-6 w-40 bg-surface-container rounded mb-4 animate-pulse" />
                <div className="h-4 w-32 bg-surface-container rounded mb-6 animate-pulse" />
                <div className="h-10 w-full bg-surface-container-high rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </LayoutWithoutNav>
    )
  }

  if (authReady && !user) {
    return null
  }
  
  // Empty state
  if (animals.length === 0) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-5xl font-pixel-style text-primary mb-2">My Animals</h1>
              <p className="text-on-surface-variant max-w-md">
                View and manage your Animal NFTs
              </p>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-xl p-12 clay-card text-center">
            <span className="material-symbols-outlined text-6xl text-primary mb-4">pets</span>
            <h2 className="text-2xl font-pixel-style text-primary mb-2">No Animals Yet</h2>
            <p className="text-on-surface-variant mb-6">
              You don&apos;t have any Animal NFTs yet. Hatch your eggs to get animals!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/eggs')}
                className="clay-button bg-primary text-on-primary py-4 px-8 rounded-xl font-black text-lg"
              >
                View My Eggs
              </button>
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

  return (
    <LayoutWithoutNav>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-pixel-style text-primary mb-2">My Animals</h1>
            <p className="text-on-surface-variant max-w-md">
              View and manage your Animal NFTs
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="clay-card bg-surface-container-lowest px-6 py-4 rounded-lg flex items-center gap-4">
              <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                pets
              </span>
              <div>
                <div className="text-xs font-bold text-on-surface-variant uppercase">Animals</div>
                <div className="text-xl font-black text-primary">{animals.length}</div>
              </div>
            </div>
            {animals.length >= 2 && (
              <button
                onClick={() => router.push('/animals/breed')}
                className="clay-button bg-primary text-on-primary py-4 px-6 rounded-xl font-black text-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  genetics
                </span>
                Breed
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {animals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onSell={handleSell}
              onBreed={handleBreed}
              showBreedButton={animals.length >= 2}
              polling={polling}
            />
          ))}
        </div>
      </div>

      {sellingAnimal && (
        <CreateListingDialog
          open={sellDialogOpen}
          onOpenChange={setSellDialogOpen}
          nftName={`${sellingAnimal.species} #${sellingAnimal.animal_id}`}
          nftType="Animal"
          tokenId={sellingAnimal.token_id.toString()}
          onSuccess={handleListingSuccess}
        />
      )}

      <BreedingDialog
        animals={animals}
        open={breedingDialogOpen}
        onOpenChange={setBreedingDialogOpen}
        onSuccess={handleBreedingSuccess}
        initialParent1={breedingParent1}
      />
    </LayoutWithoutNav>
  )
}