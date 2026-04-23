"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TierBadgeGrid } from "@/components/tier/TierBadgeCard"
import { TierProgressBar, TierProgressSummary } from "@/components/tier/TierProgressBar"
import { TierClaimButton, TierClaimNotification } from "@/components/tier/TierClaimButton"
import { useTierReward } from "@/hooks/use-tier-reward"
import { cn } from "@/lib/utils"
import { Award, ArrowRight, Sprout } from "lucide-react"
import Link from "next/link"

interface TierSectionProps {
    userId?: string
    className?: string
    compact?: boolean
}

export function TierSection({ userId, className, compact = false }: TierSectionProps) {
    const { status, isLoading, fetchStatus, claim } = useTierReward()
    
    useEffect(() => {
        fetchStatus()
    }, [fetchStatus, userId])
    
    // Get next claimable tier
    const nextClaimableTier = status?.tiers.find(t => t.is_next && t.can_claim)
    const hasClaimableTier = !!nextClaimableTier
    
    // Get current tier
    const currentTier = status?.current_tier
    
    if (compact) {
        // Compact view for dashboard card
        return (
            <Card className={cn(
                "bg-surface-container-lowest rounded-xl clay-card relative group overflow-hidden",
                hasClaimableTier && "border-2 border-primary animate-pulse",
                className
            )}>
                {/* Background decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-5xl text-primary">
                        {currentTier === 'farmer' ? 'agriculture' : 
                         currentTier === 'grower' ? 'potted_plant' : 
                         currentTier === 'seedling' ? 'sprout' : 'psychiatry'}
                    </span>
                </div>
                
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">
                                Tier Progress
                            </p>
                            <h3 className="pixel-font text-4xl text-primary capitalize">
                                {currentTier || "Getting Started"}
                            </h3>
                        </div>
                        
                        {hasClaimableTier && (
                            <Badge className="bg-primary text-primary-foreground font-[var(--font-pixel)] animate-bounce">
                                REWARD READY!
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                    {/* Progress to next tier */}
                    {status?.next_tier && status.tiers.find(t => t.is_next) && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Next: <span className="font-medium capitalize">{status.next_tier}</span>
                                </span>
                                <span className="font-[var(--font-pixel)] text-primary">
                                    {status.lifetime_food_items.toLocaleString()} / {status.tiers.find(t => t.is_next)?.threshold.toLocaleString()}
                                </span>
                            </div>
                            <TierProgressBar
                                currentItems={status.lifetime_food_items}
                                threshold={status.tiers.find(t => t.is_next)?.threshold || 10}
                                tierName={status.next_tier}
                                showLabel={false}
                            />
                        </div>
                    )}
                    
                    {/* All tiers complete */}
                    {!status?.next_tier && currentTier === 'farmer' && (
                        <div className="flex items-center gap-2 text-amber-600">
                            <Award className="w-5 h-5" />
                            <span className="font-medium">Master Farmer Achieved!</span>
                        </div>
                    )}
                    
                    {/* Claim action or view all */}
                    <div className="flex items-center justify-between pt-2">
                        {hasClaimableTier ? (
                            <TierClaimButton
                                tier={nextClaimableTier.name}
                                canClaim={true}
                                usdtReward={nextClaimableTier.usdt_reward}
                                onSuccess={fetchStatus}
                                variant="default"
                            />
                        ) : (
                            <Link href="/dashboard/tiers">
                                <Button variant="outline" size="sm" className="font-[var(--font-pixel)]">
                                    View All Tiers
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        )}
                        
                        <span className="text-xs text-muted-foreground">
                            {status?.lifetime_food_items.toLocaleString()} items total
                        </span>
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    // Full view for dedicated tier page
    return (
        <div className={cn("space-y-6", className)}>
            {/* Claim notification banner */}
            {hasClaimableTier && (
                <TierClaimNotification
                    availableTiers={[{
                        name: nextClaimableTier.name,
                        usdtReward: nextClaimableTier.usdt_reward
                    }]}
                    onClaimClick={(tier) => claim(tier)}
                />
            )}
            
            {/* Current status summary */}
            <Card className="border-2 border-primary/30">
                <CardHeader>
                    <CardTitle className="font-[var(--font-pixel)] flex items-center gap-2">
                        <Sprout className="w-5 h-5 text-primary" />
                        Your Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {status && (
                        <TierProgressSummary
                            lifetimeFoodItems={status.lifetime_food_items}
                            currentTier={status.current_tier}
                            nextTier={status.next_tier}
                        />
                    )}
                    
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                                refresh
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* All tier badges */}
            <div>
                <h3 className="font-[var(--font-pixel)] text-xl mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary" />
                    Tier Badges
                </h3>
                
                {status?.tiers && (
                    <TierBadgeGrid badges={status.tiers} />
                )}
            </div>
        </div>
    )
}

export default TierSection
