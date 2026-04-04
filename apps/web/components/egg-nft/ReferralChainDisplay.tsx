"use client"

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ReferralChainDisplayProps {
  chain: string[]
}

export function ReferralChainDisplay({ chain }: ReferralChainDisplayProps) {
  if (!chain || chain.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
          No referral chain
        </p>
      </div>
    )
  }

  const labels = ['G1 (25%)', 'G2 (15%)', 'G3 (10%)', 'G4 (5%)']

  // Shadow depth decreases with tier level (G1 deepest, G4 shallowest)
  const shadowClasses = [
    'shadow-clay-lg', // G1 - most depth (direct referrer)
    'shadow-clay-md', // G2
    'shadow-clay-sm', // G3
    'shadow-clay-sm', // G4 - least depth (furthest)
  ]

  return (
    <div className="space-y-clay-md">
      <p className="font-[var(--font-pixel)] text-xs text-primary mb-2">
        REFERRAL CHAIN:
      </p>
      <div className="grid grid-cols-2 gap-clay-md">
        {chain.map((referrer, index) => (
          <div
            key={index}
            className={cn(
              'relative rounded-clay-md p-clay',
              'bg-card transition-shadow duration-200 hover:shadow-clay-lg',
              // Depth hierarchy: G1 deepest → G4 shallowest
              shadowClasses[index] || 'shadow-clay-sm'
            )}
          >
            {/* Tier label with clay badge */}
            <Badge 
              variant="clay"
              className={cn(
                'absolute -top-2 left-clay-md',
                index === 0 ? 'bg-primary' : 'bg-secondary',
                'rounded-clay-full shadow-clay-sm',
                'font-[var(--font-pixel)] text-[10px]'
              )}
            >
              {labels[index]}
            </Badge>

            {/* Avatar/Address display */}
            <div className="flex items-center gap-clay-md mt-2">
              <div className={cn(
                'w-10 h-10 rounded-clay-full',
                'bg-secondary shadow-clay-sm',
                'flex items-center justify-center'
              )}>
                <span className="font-[var(--font-pixel)] text-[10px] text-foreground">
                  {referrer?.slice(2, 6)}
                </span>
              </div>
              <div className="flex-1">
                <span className="font-[var(--font-pixel)] text-xs text-foreground truncate block">
                  {referrer?.slice(0, 6)}...{referrer?.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
