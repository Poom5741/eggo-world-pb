"use client"

import { useMarketStats } from "@/lib/hooks/use-market-stats"
import { TrendingDown, TrendingUp, Package } from "lucide-react"

export function MarketStatsCard() {
  const { stats, loading, error } = useMarketStats()

  if (loading) return <div className="animate-pulse h-24 bg-muted rounded" />
  if (error) return <div className="text-destructive">Failed to load stats</div>
  if (!stats) return null

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 rounded-lg bg-card">
        <TrendingDown className="h-4 w-4 mb-2" />
        <p className="text-sm text-muted-foreground">Floor Price</p>
        <p className="text-2xl font-bold">{stats.floor_price} USDT</p>
      </div>
      <div className="p-4 rounded-lg bg-card">
        <TrendingUp className="h-4 w-4 mb-2" />
        <p className="text-sm text-muted-foreground">24h Volume</p>
        <p className="text-2xl font-bold">{stats.volume_24h} USDT</p>
      </div>
      <div className="p-4 rounded-lg bg-card">
        <Package className="h-4 w-4 mb-2" />
        <p className="text-sm text-muted-foreground">Active Listings</p>
        <p className="text-2xl font-bold">{stats.active_listings}</p>
      </div>
    </div>
  )
}
