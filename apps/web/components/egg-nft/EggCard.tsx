"use client"

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Egg, Flame, Sparkles, Hash, Calendar } from 'lucide-react'
import { ReferralChainDisplay } from './ReferralChainDisplay'
import { cn } from '@/lib/utils'

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
    <Card variant="clay" className={cn(
      'relative overflow-hidden',
      'rounded-clay-lg shadow-clay-xl', // Clay container (32px radius, xl shadow)
      'bg-gradient-to-br from-card/80 to-card', // Subtle gradient for volume
      'border border-primary/10', // Subtle border for definition
      'transition-shadow duration-300 hover:shadow-clay-2xl', // Hover lift effect
      'hover:border-primary/20'
    )}>
      {/* Inner glow overlay for extra clay volume */}
      <div className="absolute inset-0 bg-gradient-clay-sheen pointer-events-none" />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Egg className={`w-6 h-6 ${egg.is_hatched ? 'text-accent' : 'text-primary'}`} />
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              #{egg.token_id}
            </span>
          </div>
          <Badge variant="clay" className={cn(
            rarity.color,
            'text-foreground font-[var(--font-pixel)] text-xs',
            'rounded-clay-full shadow-clay-sm'
          )}>
            {rarity.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Egg Visual - Pixel Art Sprite (preserved) */}
        <div className={cn(
          'aspect-square',
          'bg-secondary/30',
          'rounded-clay-md', // Soft clay frame (24px)
          'border-2 border-primary/30', // Thin border for pixel content frame
          'flex items-center justify-center',
          'relative overflow-hidden',
          'p-clay-lg' // Generous padding (24px) between sprite and clay frame
        )}>
          <Egg 
            className={cn(
              'w-24 h-24',
              'pixelated', // CRITICAL: preserves pixel art rendering
              'image-rendering-pixelated', // Fallback for Firefox
              egg.is_hatched ? 'text-accent animate-pulse' : 'text-primary'
            )} 
          />
          {egg.is_hatched && (
            <Flame className="absolute top-2 right-2 w-6 h-6 text-accent animate-bounce pixelated" />
          )}
        </div>

        {/* Stats - Clay container with pixel text */}
        <div className={cn(
          'space-y-2',
          'shadow-clay-sm rounded-clay-md p-clay', // Clay stats container
          'bg-secondary/20'
        )}>
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
              variant="clay"
              className={cn(
                egg.is_hatched ? 'bg-accent' : 'bg-secondary',
                'font-[var(--font-pixel)] text-xs',
                'rounded-clay-full shadow-clay-sm'
              )}
            >
              {egg.is_hatched ? 'HATCHED' : 'UNHATCHED'}
            </Badge>
          </div>
        </div>

        {/* Referral Chain Toggle - Clay button */}
        {egg.referral_chain && egg.referral_chain.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="clay-secondary"
              size="clay-sm"
              onClick={() => setShowReferralChain(!showReferralChain)}
              className="w-full font-[var(--font-pixel)] text-xs"
            >
              {showReferralChain ? 'HIDE' : 'VIEW'} REFERRAL CHAIN
            </Button>
            
            {showReferralChain && (
              <ReferralChainDisplay chain={egg.referral_chain} />
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-clay-md relative z-10">
        {!egg.is_hatched && (
          <>
            {showFeedButton && (
              <Button
                variant="clay-secondary"
                size="clay-md"
                onClick={() => window.location.href = `/dashboard/eggs/${egg.token_id}/feed`}
                className="flex-1 font-[var(--font-pixel)] text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2 pixelated" />
                FEED
              </Button>
            )}
            <Button
              variant="clay"
              size="clay-lg"
              onClick={onHatch}
              disabled={egg.food_count < 10}
              className={cn(
                'flex-1 font-[var(--font-pixel)] text-sm',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Flame className="w-4 h-4 mr-2 pixelated" />
              HATCH
            </Button>
          </>
        )}
        {egg.is_hatched && (
          <Button
            disabled
            variant="clay-secondary"
            size="clay-lg"
            className="w-full font-[var(--font-pixel)] text-sm"
          >
            ALREADY HATCHED
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
