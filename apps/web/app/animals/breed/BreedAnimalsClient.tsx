'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { useBreeding, BreedingResult } from '@/hooks/use-breeding'
import { createClient, getUser, restoreAuth } from '@/lib/pocketbase/client'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Loader2, Dna, AlertTriangle, CheckCircle, ArrowLeftRight } from 'lucide-react'

const BREEDING_FEE = 5

interface AnimalNft {
  id: string
  animal_id: number
  token_id: number
  species: string
  rarity: string
  generation: number
  owner: string
  breed_cooldown_until: string | null
  is_hatched: boolean
}

const RARITY_COLORS: Record<string, string> = {
  Common: 'bg-gray-200 text-gray-800',
  Uncommon: 'bg-green-200 text-green-800',
  Rare: 'bg-blue-200 text-blue-800',
  Epic: 'bg-purple-200 text-purple-800',
  Legendary: 'bg-amber-200 text-amber-800',
  Mythic: 'bg-red-200 text-red-800',
}

function getRarityBadgeClass(rarity: string): string {
  return RARITY_COLORS[rarity] || 'bg-gray-200 text-gray-800'
}

function isAnimalOnCooldown(animal: AnimalNft): boolean {
  if (!animal.breed_cooldown_until) return false
  const cooldownEnd = new Date(animal.breed_cooldown_until).getTime()
  return Date.now() < cooldownEnd
}

function getCooldownText(animal: AnimalNft): string {
  if (!animal.breed_cooldown_until) return 'Ready'
  const cooldownEnd = new Date(animal.breed_cooldown_until).getTime()
  const remaining = Math.max(0, cooldownEnd - Date.now())
  if (remaining <= 0) return 'Ready'
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function getChildGeneration(gen1: number, gen2: number): number {
  return Math.max(gen1, gen2) + 1
}

export default function BreedAnimalsClient() {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const { breedAnimals, loading: breedingLoading, error: breedingError, clearError } = useBreeding()

  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)
  const [animals, setAnimals] = useState<AnimalNft[]>([])
  const [loadingAnimals, setLoadingAnimals] = useState(true)
  const [parent1Id, setParent1Id] = useState<string>('')
  const [parent2Id, setParent2Id] = useState<string>('')
  const [breedResult, setBreedResult] = useState<BreedingResult | null>(null)

  useEffect(() => {
    if (!isHydrated) return

    restoreAuth(createClient()).then(() => {
      const u = getUser()
      setUser(u)
      setAuthReady(true)
    })
  }, [isHydrated])

  useEffect(() => {
    if (!authReady || !user) return

    const fetchAnimals = async () => {
      setLoadingAnimals(true)
      try {
        const pb = createClient()
        const records = await pb.collection('animal_nfts').getList(1, 100, {
          filter: `owner = "${user.id}" && is_hatched = true`,
          sort: '-minted_at',
        })
        const mapped: AnimalNft[] = records.items.map((r: any) => ({
          id: r.id,
          animal_id: r.animal_id,
          token_id: r.token_id,
          species: r.species,
          rarity: r.rarity,
          generation: r.generation,
          owner: r.owner,
          breed_cooldown_until: r.breed_cooldown_until || null,
          is_hatched: r.is_hatched,
        }))
        setAnimals(mapped)
      } catch (err) {
        console.error('Error loading animals:', err)
      } finally {
        setLoadingAnimals(false)
      }
    }

    fetchAnimals()
  }, [authReady, user])

  useEffect(() => {
    if (authReady && !user) {
      router.push('/auth/login')
    }
  }, [authReady, user, router])

  if (!isHydrated || !authReady) {
    return (
      <LayoutWithoutNav>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      </LayoutWithoutNav>
    )
  }

  if (!user) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto py-10">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Please log in to breed animals / กรุณาเข้าสู่ระบบเพื่อผสมพันธุ์สัตว์</AlertDescription>
          </Alert>
        </div>
      </LayoutWithoutNav>
    )
  }

  if (loadingAnimals) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-4">
              <div className="h-16 w-80 bg-surface-container rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-surface-container rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        </div>
      </LayoutWithoutNav>
    )
  }

  if (animals.length < 2) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-5xl font-pixel-style text-primary mb-2">Breed Animals</h1>
              <p className="text-on-surface-variant max-w-md">
                ผสมพันธุ์สัตว์ / Breed your animals to create new eggs
              </p>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-12 clay-card text-center">
            <Dna className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-pixel-style text-primary mb-2">Not Enough Animals</h2>
            <p className="text-on-surface-variant mb-6">
              You need at least 2 animals to breed / คุณต้องมีสัตว์อย่างน้อย 2 ตัวจึงจะผสมพันธุ์ได้
            </p>
            <Button
              onClick={() => router.push('/animals')}
              className="clay-button bg-primary text-on-primary py-4 px-8 rounded-xl font-black text-lg"
            >
              View My Animals
            </Button>
          </div>
        </div>
      </LayoutWithoutNav>
    )
  }

  const eligibleAnimals = animals.filter(a => !isAnimalOnCooldown(a))
  const cooldownAnimals = animals.filter(a => isAnimalOnCooldown(a))

  const selectedParent1 = animals.find(a => a.id === parent1Id) || null
  const selectedParent2 = animals.find(a => a.id === parent2Id) || null

  const sameSelected = parent1Id && parent2Id && parent1Id === parent2Id
  const parent1OnCooldown = selectedParent1 ? isAnimalOnCooldown(selectedParent1) : false
  const parent2OnCooldown = selectedParent2 ? isAnimalOnCooldown(selectedParent2) : false
  const canBreed = !!parent1Id && !!parent2Id && !sameSelected && !parent1OnCooldown && !parent2OnCooldown && !breedingLoading

  const handleBreed = async () => {
    if (!selectedParent1 || !selectedParent2) return
    clearError()
    const result = await breedAnimals(selectedParent1.animal_id, selectedParent2.animal_id)
    if (result) {
      setBreedResult(result)
      setParent1Id('')
      setParent2Id('')
    }
  }

  const availableForParent2 = animals.filter(a => a.id !== parent1Id)

  return (
    <LayoutWithoutNav>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-pixel-style text-primary mb-2">Breed Animals</h1>
            <p className="text-on-surface-variant max-w-md">
              ผสมพันธุ์สัตว์ / Combine two animals to create a new egg
            </p>
          </div>
          <div className="flex gap-4">
            <div className="clay-card bg-surface-container-lowest px-6 py-4 rounded-lg flex items-center gap-4">
              <Dna className="h-6 w-6 text-primary-fixed-dim" />
              <div>
                <div className="text-xs font-bold text-on-surface-variant uppercase">Eligible / ที่ผสมได้</div>
                <div className="text-xl font-black text-primary">{eligibleAnimals.length}</div>
              </div>
            </div>
            {cooldownAnimals.length > 0 && (
              <div className="clay-card bg-surface-container-lowest px-6 py-4 rounded-lg flex items-center gap-4">
                <AlertTriangle className="h-6 w-6 text-secondary-fixed-dim" />
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase">On Cooldown / รอคูลดาวน์</div>
                  <div className="text-xl font-black text-secondary">{cooldownAnimals.length}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {breedResult && (
          <Card className="mb-8 border-tertiary bg-tertiary-container/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-tertiary">
                <CheckCircle className="h-6 w-6" />
                Breeding Successful! / ผสมพันธุ์สำเร็จ!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-on-surface-variant">Egg ID / ไอดีไข่</Label>
                  <p className="font-bold text-on-surface">{breedResult.breeding_egg_id}</p>
                </div>
                <div>
                  <Label className="text-on-surface-variant">Token ID</Label>
                  <p className="font-bold text-on-surface">#{breedResult.token_id}</p>
                </div>
                <div>
                  <Label className="text-on-surface-variant">Generation / รุ่น</Label>
                  <p className="font-bold text-on-surface">Gen {breedResult.generation}</p>
                </div>
                <div>
                  <Label className="text-on-surface-variant">Tx Hash</Label>
                  <p className="font-mono text-xs text-on-surface break-all">{breedResult.tx_hash}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setBreedResult(null)} variant="outline">
                  Breed Again / ผสมอีกครั้ง
                </Button>
                <Button onClick={() => router.push('/eggs')}>
                  View Eggs / ดูไข่
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dna className="h-5 w-5 text-primary" />
                Parent 1 / พ่อแม่ 1
              </CardTitle>
              <CardDescription>Select the first parent animal / เลือกสัตว์พ่อแม่ตัวแรก</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Animal / สัตว์</Label>
                <select
                  className="w-full rounded-lg border border-outline bg-surface-container-lowest px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  value={parent1Id}
                  onChange={(e) => { setParent1Id(e.target.value); if (e.target.value === parent2Id) setParent2Id('') }}
                >
                  <option value="">-- Select Parent 1 / เลือกพ่อแม่ 1 --</option>
                  {animals.map(a => (
                    <option key={a.id} value={a.id} disabled={isAnimalOnCooldown(a)}>
                      {a.species} #{a.animal_id} - {a.rarity} (Gen {a.generation}){isAnimalOnCooldown(a) ? ` [Cooldown: ${getCooldownText(a)}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedParent1 && (
                <div className="bg-surface-container-low rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface">{selectedParent1.species} #{selectedParent1.animal_id}</span>
                    <Badge className={getRarityBadgeClass(selectedParent1.rarity)}>{selectedParent1.rarity}</Badge>
                  </div>
                  <div className="text-sm text-on-surface-variant">Generation / รุ่น: {selectedParent1.generation}</div>
                  <div className="text-sm text-on-surface-variant">
                    Status / สถานะ: {isAnimalOnCooldown(selectedParent1) ? (
                      <span className="text-secondary font-bold">Cooldown ({getCooldownText(selectedParent1)})</span>
                    ) : (
                      <span className="text-tertiary font-bold">Ready / พร้อม</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dna className="h-5 w-5 text-secondary" />
                Parent 2 / พ่อแม่ 2
              </CardTitle>
              <CardDescription>Select the second parent animal / เลือกสัตว์พ่อแม่ตัวที่สอง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Animal / สัตว์</Label>
                <select
                  className="w-full rounded-lg border border-outline bg-surface-container-lowest px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  value={parent2Id}
                  onChange={(e) => setParent2Id(e.target.value)}
                >
                  <option value="">-- Select Parent 2 / เลือกพ่อแม่ 2 --</option>
                  {availableForParent2.map(a => (
                    <option key={a.id} value={a.id} disabled={isAnimalOnCooldown(a)}>
                      {a.species} #{a.animal_id} - {a.rarity} (Gen {a.generation}){isAnimalOnCooldown(a) ? ` [Cooldown: ${getCooldownText(a)}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedParent2 && (
                <div className="bg-surface-container-low rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface">{selectedParent2.species} #{selectedParent2.animal_id}</span>
                    <Badge className={getRarityBadgeClass(selectedParent2.rarity)}>{selectedParent2.rarity}</Badge>
                  </div>
                  <div className="text-sm text-on-surface-variant">Generation / รุ่น: {selectedParent2.generation}</div>
                  <div className="text-sm text-on-surface-variant">
                    Status / สถานะ: {isAnimalOnCooldown(selectedParent2) ? (
                      <span className="text-secondary font-bold">Cooldown ({getCooldownText(selectedParent2)})</span>
                    ) : (
                      <span className="text-tertiary font-bold">Ready / พร้อม</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {sameSelected && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Cannot select the same animal twice / ไม่สามารถเลือกสัตว์ตัวเดียวกันสองครั้งได้</AlertDescription>
          </Alert>
        )}

        {(parent1OnCooldown || parent2OnCooldown) && !sameSelected && (parent1Id || parent2Id) && (
          <Alert className="mb-6 border-secondary bg-secondary-container/10">
            <AlertTriangle className="h-4 w-4 text-secondary" />
            <AlertDescription className="text-secondary">
              Selected animal is on breeding cooldown / สัตว์ที่เลือกอยู่ในช่วงคูลดาวน์ผสมพันธุ์
            </AlertDescription>
          </Alert>
        )}

        {selectedParent1 && selectedParent2 && !sameSelected && !parent1OnCooldown && !parent2OnCooldown && (
          <Card className="clay-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                Breeding Info / ข้อมูลการผสมพันธุ์
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <Label className="text-on-surface-variant">Fee / ค่าธรรมเนียม</Label>
                  <p className="text-2xl font-black text-primary">{BREEDING_FEE} USDT</p>
                </div>
                <div>
                  <Label className="text-on-surface-variant">Cooldown / คูลดาวน์</Label>
                  <p className="text-2xl font-black text-on-surface">48h</p>
                </div>
                <div>
                  <Label className="text-on-surface-variant">Child Gen / รุ่นลูก</Label>
                  <p className="text-2xl font-black text-on-surface">
                    Gen {getChildGeneration(selectedParent1.generation, selectedParent2.generation)}
                  </p>
                </div>
                <div>
                  <Label className="text-on-surface-variant">Parents / พ่อแม่</Label>
                  <p className="text-sm font-bold text-on-surface">
                    {selectedParent1.species} #{selectedParent1.animal_id}
                    <ArrowLeftRight className="inline h-3 w-3 mx-1" />
                    {selectedParent2.species} #{selectedParent2.animal_id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {breedingError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{breedingError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleBreed}
            disabled={!canBreed}
            className="clay-button bg-primary text-on-primary py-4 px-12 rounded-xl font-black text-lg"
          >
            {breedingLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Breeding... / กำลังผสมพันธุ์...
              </>
            ) : (
              <>
                <Dna className="mr-2 h-5 w-5" />
                Breed Animals / ผสมพันธุ์สัตว์
              </>
            )}
          </Button>
        </div>
      </div>
    </LayoutWithoutNav>
  )
}
