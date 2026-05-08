import { useState, useEffect } from "react"
import { pb } from "@/lib/pocketbase/client"

interface MarketStats {
  floor_price: number
  volume_24h: number
  active_listings: number
  timestamp: string
}

export function useMarketStats(pollingInterval = 30000) {
  const [stats, setStats] = useState<MarketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await pb.send("/api/v2/market-stats", {})
      setStats(response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, pollingInterval)
    return () => clearInterval(interval)
  }, [pollingInterval])

  return { stats, loading, error, refetch: fetchStats }
}
