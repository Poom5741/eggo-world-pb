"use client"

import { Coins, TrendingUp, Users, DollarSign } from 'lucide-react'

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
    g1: 20,
    g2: 10,
    g3: 10,
    g4: 10,
    coinStor: 4,
    treasury: 46
  }

  return (
    <div className="space-y-3 bg-secondary/20 p-4 border border-primary/30">
      <h3 className="font-[var(--font-pixel)] text-sm text-primary flex items-center gap-2">
        <Coins className="w-4 h-4" />
        COMMISSION BREAKDOWN
      </h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-primary" />
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              G1 (Direct)
            </span>
          </div>
          <div className="text-right">
            <span className="font-[var(--font-pixel)] text-xs text-primary">
              {g1.toFixed(2)} USDT
            </span>
            <span className="font-[var(--font-pixel)] text-xs text-muted-foreground ml-2">
              ({percentages.g1}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-secondary-foreground" />
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              G2
            </span>
          </div>
          <div className="text-right">
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              {g2.toFixed(2)} USDT
            </span>
            <span className="font-[var(--font-pixel)] text-xs text-muted-foreground ml-2">
              ({percentages.g2}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-secondary-foreground" />
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              G3
            </span>
          </div>
          <div className="text-right">
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              {g3.toFixed(2)} USDT
            </span>
            <span className="font-[var(--font-pixel)] text-xs text-muted-foreground ml-2">
              ({percentages.g3}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-secondary-foreground" />
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              G4
            </span>
          </div>
          <div className="text-right">
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              {g4.toFixed(2)} USDT
            </span>
            <span className="font-[var(--font-pixel)] text-xs text-muted-foreground ml-2">
              ({percentages.g4}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-primary/30">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-primary" />
            <span className="font-[var(--font-pixel)] text-xs text-foreground">
              CoinStor (4%)
            </span>
          </div>
          <div className="text-right">
            <span className="font-[var(--font-pixel)] text-xs text-primary">
              {coinStor.toFixed(2)} USDT
            </span>
            <span className="font-[var(--font-pixel)] text-xs text-muted-foreground ml-2">
              ({percentages.coinStor}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t-2 border-primary">
          <span className="font-[var(--font-pixel)] text-sm text-foreground">
            TOTAL (25 USDT)
          </span>
          <span className="font-[var(--font-pixel)] text-sm text-primary">
            {total.toFixed(2)} USDT
          </span>
        </div>
      </div>
    </div>
  )
}
