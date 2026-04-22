"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface TierBadge {
    name: string
    tokenId: number
    threshold: number
    usdtReward: number
    claimed: boolean
    isNext: boolean
    canClaim: boolean
    progress: number
}

interface TierBadgeCardProps {
    badge: TierBadge
    className?: string
}

const tierIcons: Record<string, string> = {
    seedling: "sprout",
    grower: "potted_plant",
    farmer: "agriculture"
}

const tierColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    seedling: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        badge: "bg-emerald-100 text-emerald-800"
    },
    grower: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        badge: "bg-amber-100 text-amber-800"
    },
    farmer: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-700",
        badge: "bg-purple-100 text-purple-800"
    }
}

export function TierBadgeCard({ badge, className }: TierBadgeCardProps) {
    const iconName = tierIcons[badge.name] || "emoji_events"
    const colors = tierColors[badge.name] || tierColors.seedling
    
    return (
        <Card 
            className={cn(
                "relative overflow-hidden transition-all duration-300",
                badge.claimed && "shadow-clay-lg border-2",
                badge.claimed && colors.border,
                !badge.claimed && badge.isNext && "border-dashed border-2 border-muted-foreground/30",
                !badge.claimed && !badge.isNext && "opacity-60 grayscale",
                className
            )}
        >
            {/* Background decoration for claimed badges */}
            {badge.claimed && (
                <div className={cn(
                    "absolute inset-0 opacity-10",
                    colors.bg
                )} />
            )}
            
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span 
                            className={cn(
                                "material-symbols-outlined text-2xl",
                                badge.claimed ? colors.text : "text-muted-foreground"
                            )}
                        >
                            {iconName}
                        </span>
                        <CardTitle className={cn(
                            "text-lg font-[var(--font-pixel)] capitalize",
                            badge.claimed ? colors.text : "text-muted-foreground"
                        )}>
                            {badge.name}
                        </CardTitle>
                    </div>
                    
                    {badge.claimed && (
                        <Badge className={cn("font-[var(--font-pixel)] text-xs", colors.badge)}>
                            CLAIMED
                        </Badge>
                    )}
                    
                    {badge.isNext && !badge.claimed && badge.canClaim && (
                        <Badge variant="clay" className="font-[var(--font-pixel)] text-xs animate-pulse">
                            READY
                        </Badge>
                    )}
                    
                    {badge.isNext && !badge.claimed && !badge.canClaim && (
                        <Badge variant="secondary" className="font-[var(--font-pixel)] text-xs">
                            NEXT
                        </Badge>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
                {/* Reward amount */}
                <div className="flex items-baseline gap-1">
                    <span className={cn(
                        "text-2xl font-bold",
                        badge.claimed ? colors.text : "text-muted-foreground"
                    )}>
                        ${badge.usdtReward}
                    </span>
                    <span className="text-sm text-muted-foreground">USDT</span>
                </div>
                
                {/* Threshold info */}
                <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{badge.threshold.toLocaleString()}</span> food items required
                </div>
                
                {/* Progress bar for next tier */}
                {badge.isNext && !badge.claimed && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{badge.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                                className={cn(
                                    "h-full transition-all duration-500 rounded-full",
                                    badge.canClaim ? "bg-primary" : "bg-muted-foreground/50"
                                )}
                                style={{ width: `${badge.progress}%` }}
                            />
                        </div>
                    </div>
                )}
                
                {/* Soulbound indicator for claimed badges */}
                {badge.claimed && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-dashed">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        <span>Soulbound NFT</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

interface TierBadgeGridProps {
    badges: TierBadge[]
    className?: string
}

export function TierBadgeGrid({ badges, className }: TierBadgeGridProps) {
    // Sort badges: claimed first, then next available, then locked
    const sortedBadges = [...badges].sort((a, b) => {
        if (a.claimed && !b.claimed) return -1
        if (!a.claimed && b.claimed) return 1
        if (a.isNext && !b.isNext) return -1
        if (!a.isNext && b.isNext) return 1
        return a.tokenId - b.tokenId
    })
    
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
            {sortedBadges.map((badge) => (
                <TierBadgeCard key={badge.name} badge={badge} />
            ))}
        </div>
    )
}

export default TierBadgeCard
