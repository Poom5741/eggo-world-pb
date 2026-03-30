"use client"

import { Badge } from '@/components/ui/badge'

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

  const labels = ['G1 (20%)', 'G2 (10%)', 'G3 (10%)', 'G4 (10%)']

  return (
    <div className="space-y-2 bg-secondary/20 p-3 border border-primary/30">
      <p className="font-[var(--font-pixel)] text-xs text-primary mb-2">
        REFERRAL CHAIN:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {chain.map((referrer, index) => (
          <div key={index} className="flex items-center gap-2">
            <Badge
              variant={index === 0 ? 'default' : 'secondary'}
              className="font-[var(--font-pixel)] text-xs min-w-[80px]"
            >
              {labels[index]}
            </Badge>
            <span className="font-[var(--font-pixel)] text-xs text-foreground truncate">
              {referrer?.slice(0, 6)}...{referrer?.slice(-4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
