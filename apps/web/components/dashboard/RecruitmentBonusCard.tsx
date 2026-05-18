"use client"

import { useState, useEffect, useCallback } from "react"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { createClient } from "@/lib/pocketbase/client"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Users, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Recruitment tier definitions with colors and labels
 */
const TIER_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-[var(--color-tier-1)]", text: "text-[var(--color-tier-1)]", label: "Seedling" },
  2: { bg: "bg-[var(--color-tier-2)]", text: "text-[var(--color-tier-2)]", label: "Grower" },
  3: { bg: "bg-[var(--color-tier-3)]", text: "text-[var(--color-tier-3)]", label: "Farmer" },
  4: { bg: "bg-[var(--color-tier-4)]", text: "text-[var(--color-tier-4)]", label: "Master" },
}

/**
 * Data shape from GET /api/v2/recruitment-bonus-status
 */
interface RecruitmentStatus {
  direct_recruits: number
  current_tier: number
  claimed_tier: number
  can_claim: boolean
  next_tier: {
    tier: number
    min: number
    food: number
    usdt: number
  } | null
}

/**
 * Data shape from POST /api/v2/claim-recruitment-bonus
 */
interface ClaimResult {
  tier: number
  food_rewarded: number
  usdt_bonus: number
  direct_recruits: number
}

interface RecruitmentBonusCardProps {
  className?: string
}

/**
 * RecruitmentBonusCard - แสดงสถานะระดับการแนะนำและปุ่มรับโบนัส
 *
 * Fetches recruitment tier status on mount and provides a claim button
 * when the user is eligible for a tier bonus. Uses claymorphism styling
 * with hydration safety.
 */
export function RecruitmentBonusCard({ className }: RecruitmentBonusCardProps) {
  const isHydrated = useIsHydrated()
  const pb = createClient()

  const [status, setStatus] = useState<RecruitmentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setError(null)
      const token = pb.authStore.token
      if (!token) return

      const response = await fetch(`${pb.baseURL}/api/v2/recruitment-bonus-status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch status")
      }

      setStatus(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recruitment status")
    } finally {
      setIsLoading(false)
    }
  }, [pb])

  // Fetch on mount after hydration
  useEffect(() => {
    if (!isHydrated) return
    fetchStatus()
  }, [isHydrated, fetchStatus])

  const handleClaim = async () => {
    if (!status || isClaiming) return

    setIsClaiming(true)
    setError(null)

    try {
      const token = pb.authStore.token
      const response = await fetch(`${pb.baseURL}/api/v2/claim-recruitment-bonus`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error?.message || "Claim failed")
      }

      const result: ClaimResult = data.data
      toast({
        title: "Claimed!",
        description: `${result.food_rewarded} food + $${result.usdt_bonus} USDT`,
      })

      // Refresh status after claim
      await fetchStatus()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Claim failed"
      setError(message)
      toast({
        title: "Claim Failed",
        description: message,
        variant: "destructive",
      } as any)
    } finally {
      setIsClaiming(false)
    }
  }

  // Not hydrated - show skeleton
  if (!isHydrated) {
    return (
      <Card variant="clay" className={cn("w-full", className)} data-testid="recruitment-skeleton">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Card variant="clay" className={cn("w-full", className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </Card>
    )
  }

  // Error state
  if (error && !status) {
    return (
      <Card variant="clay" className={cn("w-full", className)}>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive mb-4">Error loading recruitment data</p>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="clay-outline" size="clay-md" onClick={fetchStatus}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // No data after fetch
  if (!status) {
    return null
  }

  const { direct_recruits, current_tier, claimed_tier, can_claim, next_tier } = status
  const tierInfo = current_tier > 0 ? TIER_COLORS[current_tier] : null
  const isMaxTier = current_tier === 4 && claimed_tier >= 4

  return (
    <Card
      variant="clay"
      className={cn(
        "w-full bg-surface-container-lowest relative overflow-hidden",
        can_claim && "border-2 border-primary animate-pulse",
        className
      )}
    >
      {/* Background decoration - trophy icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy className="h-24 w-24 text-primary" />
      </div>

      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-body uppercase tracking-widest text-muted-foreground">
            Recruitment
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Current tier display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Tier</p>
            {tierInfo ? (
              <span className={cn("text-3xl font-bold", tierInfo.text)}>Tier {current_tier}</span>
            ) : (
              <span className="text-xl font-medium text-muted-foreground">No tier yet</span>
            )}
            {tierInfo && (
              <span className={cn("ml-2 text-xs px-2 py-0.5 rounded-md font-medium", tierInfo.bg, "text-white")}>
                {tierInfo.label}
              </span>
            )}
          </div>

          {/* Direct recruits count */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{direct_recruits} direct recruits</span>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="space-y-1">
          {isMaxTier ? (
            <div className="flex items-center gap-2 text-amber-600">
              <Trophy className="h-5 w-5 fill-current" />
              <span className="font-medium text-lg">Max tier reached!</span>
            </div>
          ) : next_tier ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Next: <span className="font-medium">Tier {next_tier.tier}</span>
                </span>
                <span className="text-primary font-body">
                  {direct_recruits} / {next_tier.min} to next tier
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (direct_recruits / next_tier.min) * 100)}%`,
                  }}
                />
              </div>
              {/* Reward preview */}
              <p className="text-xs text-muted-foreground">
                Reward: {next_tier.food} food + ${next_tier.usdt} USDT
              </p>
            </div>
          ) : null}
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Claim button */}
        <div className="pt-2">
          {can_claim ? (
            <Button
              variant="clay"
              size="clay-md"
              className="w-full"
              onClick={handleClaim}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>Claim Tier {current_tier} Bonus</>
              )}
            </Button>
          ) : current_tier > 0 ? (
            <Button variant="clay-outline" size="clay-md" className="w-full" disabled>
              Claimed
            </Button>
          ) : next_tier ? (
            <Button variant="clay-outline" size="clay-md" className="w-full" disabled>
              Need {next_tier.min - direct_recruits} more recruits
            </Button>
          ) : (
            <Button variant="clay-outline" size="clay-md" className="w-full" disabled>
              Start recruiting
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default RecruitmentBonusCard