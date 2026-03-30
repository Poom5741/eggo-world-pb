"use client"

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Egg, Flame, Sparkles, Hash, Calendar } from 'lucide-react'
import { ReferralChainDisplay } from './ReferralChainDisplay'

interface EggCardProps {
  egg: {
    token_id: number
    egg_id: number
    food_count: number
    is_hatched: boolean
    rarity_seed: number
    referral_chain?: any[]
    minted_at: string
  }
  onHatch?: () => void
  showFeedButton?: boolean
}

export function EggCard({ egg, onHatch, showFeedButton }: EggCardProps) {
  const [showReferralChain, setShowReferralChain] = useState(false)

  const getRarityLabel = (seed: number) => {
    if (seed < 100) return { label: 'LEGENDARY', color: 'bg-yellow-500' }
    if (seed < 300) return { label: 'EPIC', color: 'bg-purple-500' }
    if (seed < 600) return { label: 'RARE', color: 'bg-blue-500' }
    if (seed < 800) return { label: 'UNCOMMON', color: 'bg-green-500' }
    return { label: 'COMMON', color: 'bg-gray-500' }
  }

  const rarity = getRarityLabel(egg.rarity_seed || 0)

  return (
    <Card className="border-4 border-primary/30 bg-card hover:border-primary transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Egg className={`w-6 h-6 ${egg.is_hatched ? 'text-accent' : 'text-primary'}`} />
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              #{egg.token_id}
            </span>
          </div>
          <Badge className={rarity.color + ' text-foreground font-[var(--font-pixel)] text-xs'}>
            {rarity.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Egg Visual */}
        <div className="aspect-square bg-secondary/30 border-2 border-primary/30 rounded-none flex items-center justify-center relative overflow-hidden">
          <Egg 
            className={`w-24 h-24 ${egg.is_hatched ? 'text-accent animate-pulse' : 'text-primary'}`} 
          />
          {egg.is_hatched && (
            <Flame className="absolute top-2 right-2 w-6 h-6 text-accent animate-bounce" />
          )}
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-[var(--font-pixel)] text-xs text-muted-foreground flex items-center gap-1">
              <Hash className="w-3 h-3" />
              EGG ID:
            </span>
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              {egg.egg_id}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-[var(--font-pixel)] text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              FOOD NFTs:
            </span>
            <span className="font-[var(--font-pixel)] text-xs text-primary">
              {egg.food_count} / 10
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-[var(--font-pixel)] text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              MINTED:
            </span>
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              {new Date(egg.minted_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-[var(--font-pixel)] text-xs text-muted-foreground">
              STATUS:
            </span>
            <Badge
              variant={egg.is_hatched ? 'default' : 'secondary'}
              className="font-[var(--font-pixel)] text-xs"
            >
              {egg.is_hatched ? 'HATCHED' : 'UNHATCHED'}
            </Badge>
          </div>
        </div>

        {/* Referral Chain Toggle */}
        {egg.referral_chain && egg.referral_chain.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReferralChain(!showReferralChain)}
              className="w-full font-[var(--font-pixel)] text-xs border-primary/50 hover:border-primary"
            >
              {showReferralChain ? 'HIDE' : 'VIEW'} REFERRAL CHAIN
            </Button>
            
            {showReferralChain && (
              <ReferralChainDisplay chain={egg.referral_chain} />
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!egg.is_hatched && (
          <>
            {showFeedButton && (
              <Button
                variant="outline"
                onClick={() => window.location.href = `/dashboard/eggs/${egg.token_id}/feed`}
                className="flex-1 font-[var(--font-pixel)] text-sm border-primary/50 hover:border-primary"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                FEED
              </Button>
            )}
            <Button
              onClick={onHatch}
              disabled={egg.food_count < 10}
              className="flex-1 font-[var(--font-pixel)] text-sm border-4 border-accent/50 hover:border-accent transition-colors disabled:opacity-50"
            >
              <Flame className="w-4 h-4 mr-2" />
              HATCH
            </Button>
          </>
        )}
        {egg.is_hatched && (
          <Button
            disabled
            variant="secondary"
            className="w-full font-[var(--font-pixel)] text-sm"
          >
            ALREADY HATCHED
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
