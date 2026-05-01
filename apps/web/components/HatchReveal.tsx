"use client"

import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Egg, Sparkles, ArrowRight } from "lucide-react"
import { Rarity, Species, getRarityName, getSpeciesName } from "@/lib/contracts/eggNft"
import { SpeciesIcon } from "./icons/species-icons"

interface Animal {
  animalId: number
  rarity: Rarity
  species: Species
  generation: number
}

interface HatchRevealProps {
  animal: Animal
  onClaim: () => void
}

// Rarity colors mapping
const rarityColors: Record<Rarity, string> = {
  [Rarity.Common]: 'bg-gray-400 hover:bg-gray-500',
  [Rarity.Rare]: 'bg-blue-500 hover:bg-blue-600',
  [Rarity.Epic]: 'bg-purple-500 hover:bg-purple-600',
  [Rarity.Legendary]: 'bg-yellow-500 hover:bg-yellow-600',
}

// Rarity display names with styling
const rarityDisplay: Record<Rarity, { name: string; textColor: string }> = {
  [Rarity.Common]: { name: 'COMMON', textColor: 'text-gray-400' },
  [Rarity.Rare]: { name: 'RARE', textColor: 'text-blue-500' },
  [Rarity.Epic]: { name: 'EPIC', textColor: 'text-purple-500' },
  [Rarity.Legendary]: { name: 'LEGENDARY', textColor: 'text-yellow-500' },
}

// Map contract Species enum to our species-icons type names
const SPECIES_MAP: Record<Species, string> = {
  [Species.Chicken]: "Chicken",
  [Species.GoldenChicken]: "Chicken",
  [Species.Quail]: "Quail",
  [Species.Duck]: "Duck",
  [Species.SilverDuck]: "Duck",
  [Species.Peacock]: "Peacock",
  [Species.Swan]: "Swan",
  [Species.Turkey]: "Turkey",
  [Species.Phoenix]: "Phoenix",
  [Species.Dragon]: "Dragon",
  [Species.Unicorn]: "Unicorn",
  [Species.Gryphon]: "Gryphon",
}

// Animal icon component by species type (replaces emoji)
const getAnimalIcon = (species: Species): string => {
  return SPECIES_MAP[species] || "Chicken"
}

export function HatchReveal({ animal, onClaim }: HatchRevealProps) {
  const rarityInfo = rarityDisplay[animal.rarity]
  const speciesName = getAnimalIcon(animal.species)

  return (
    <Card className="border-4 border-primary/50 bg-card max-w-2xl mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <Sparkles className="w-16 h-16 text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <Badge className={`${rarityColors[animal.rarity]} text-white font-bold text-lg px-6 py-2`}>
            {rarityInfo.name}
          </Badge>
          <CardTitle className="font-body text-2xl text-foreground">
            CONGRATULATIONS!
          </CardTitle>
          <CardDescription className="font-body text-xs text-muted-foreground">
            Your egg has hatched into a magnificent creature
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Animal Display */}
        <div className="bg-secondary/30 border-2 border-primary/30 rounded-lg p-8 text-center space-y-4">
          {/* Animal Icon (replaces emoji) */}
          <div className="flex justify-center animate-bounce">
            <SpeciesIcon species={speciesName as any} size="lg" />
          </div>
          
          {/* Species Name */}
          <div className="space-y-2">
            <h2 className={`font-body text-3xl ${rarityInfo.textColor}`}>
              {getSpeciesName(animal.species)}
            </h2>
            <p className="font-body text-xs text-muted-foreground">
              Animal NFT #{animal.animalId}
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-primary/20">
            <div className="space-y-1">
              <p className="font-body text-xs text-muted-foreground">
                RARITY
              </p>
              <p className={`font-body text-sm ${rarityInfo.textColor}`}>
                {getRarityName(animal.rarity)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-body text-xs text-muted-foreground">
                GENERATION
              </p>
              <p className="font-body text-sm text-foreground">
                #{animal.generation}
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-secondary/20 border-2 border-primary/30 p-4 space-y-2">
          <h3 className="font-body text-xs text-primary">
            WHAT&apos;S NEXT?
          </h3>
          <ul className="space-y-1 font-body text-xs text-foreground">
            <li>• Your Animal NFT has been minted to your wallet</li>
            <li>• View it in your inventory</li>
            <li>• List it for sale on the marketplace</li>
            <li>• <Link href="/animals" className="underline hover:text-primary">Use it for breeding</Link></li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/eggs'}
          className="flex-1 font-body text-sm h-12 border-2 border-primary/50"
        >
          <Egg className="mr-2 h-4 w-4" />
          Back to Eggs
        </Button>
        <Button
          onClick={onClaim}
          className="flex-1 font-body text-sm h-12 border-4 border-primary/50 hover:border-primary transition-colors"
        >
          CLAIM TO INVENTORY
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
