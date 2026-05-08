"use client"

import { Coins, TrendingUp, Users, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CommissionBreakdownProps {
  g1?: number
  g2?: number
  g3?: number
  g4?: number
  total?: number
  coinStor?: number
}

export function CommissionBreakdown({ 
  g1 = 0, 
  g2 = 0, 
  g3 = 0, 
  g4 = 0, 
  total = 0,
  coinStor = 0 
}: CommissionBreakdownProps) {
  const percentages = {
    g1: 25,
    g2: 15,
    g3: 10,
    g4: 5,
    coinStor: 4,
    treasury: 41
  }

  const tiers = [
    { label: 'G1 (Direct)', value: g1, percentage: percentages.g1, icon: Users },
    { label: 'G2', value: g2, percentage: percentages.g2, icon: TrendingUp },
    { label: 'G3', value: g3, percentage: percentages.g3, icon: TrendingUp },
    { label: 'G4', value: g4, percentage: percentages.g4, icon: TrendingUp },
  ]

  return (
    <div className={cn(
      'space-y-clay-md',
      'shadow-clay-lg rounded-clay-lg p-clay-lg', // Clay container
      'bg-gradient-to-br from-card/80 to-card'
    )}>
      <h3 className="font-body text-sm text-primary flex items-center gap-2">
        <Coins className="w-4 h-4 pixelated" />
        COMMISSION BREAKDOWN
      </h3>

      <div className="space-y-clay-md">
        {/* Commission Tiers - Clay rows with badges */}
        {tiers.map((tier, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center justify-between',
              'shadow-clay-sm rounded-clay-md p-clay', // Clay row container
              'bg-secondary/20',
              index === 0 && 'bg-primary/10 shadow-clay-md' // Highlight G1
            )}
          >
            <div className="flex items-center gap-clay-md">
              <tier.icon className="w-3 h-3 text-primary pixelated" />
              <span className="font-body text-xs text-foreground">
                {tier.label}
              </span>
            </div>
            <div className="flex items-center gap-clay-md">
              <Badge
                variant="clay"
                className={cn(
                  'rounded-clay-full shadow-clay-sm',
                  'font-body text-xs',
                  index === 0 ? 'bg-primary' : 'bg-secondary'
                )}
              >
                {tier.percentage}%
              </Badge>
              <span className="font-body text-xs text-primary">
                {tier.value.toFixed(2)} USDT
              </span>
            </div>
          </div>
        ))}

        {/* CoinStor Fee - Clay row */}
        <div className={cn(
          'flex items-center justify-between',
          'shadow-clay-sm rounded-clay-md p-clay',
          'bg-secondary/20',
          'border-t border-primary/30 pt-clay'
        )}>
          <div className="flex items-center gap-clay-md">
            <DollarSign className="w-3 h-3 text-primary pixelated" />
            <span className="font-body text-xs text-foreground">
              CoinStor Reserve
            </span>
          </div>
          <div className="flex items-center gap-clay-md">
            <Badge
              variant="clay"
              className={cn(
                'rounded-clay-full shadow-clay-sm',
                'bg-secondary',
                'font-body text-xs'
              )}
            >
              {percentages.coinStor}%
            </Badge>
            <span className="font-body text-xs text-primary">
              {coinStor.toFixed(2)} USDT
            </span>
          </div>
        </div>

        {/* Total - Clay emphasis */}
        <div className={cn(
          'flex items-center justify-between',
          'shadow-clay-md rounded-clay-md p-clay',
          'bg-primary/10',
          'border-t-2 border-primary pt-clay'
        )}>
          <span className="font-body text-sm text-foreground">
            TOTAL
          </span>
          <div className="flex items-center gap-clay-md">
            <Badge
              variant="clay"
              className={cn(
                'rounded-clay-full shadow-clay-sm',
                'bg-primary',
                'font-body text-xs'
              )}
            >
              100%
            </Badge>
            <span className="font-body text-sm text-primary">
              {total.toFixed(2)} USDT
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
