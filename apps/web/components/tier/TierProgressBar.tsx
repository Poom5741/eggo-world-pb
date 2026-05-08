"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface TierProgressBarProps {
    currentItems: number
    threshold: number
    tierName: string
    className?: string
    showLabel?: boolean
}

export function TierProgressBar({ 
    currentItems, 
    threshold, 
    tierName,
    className,
    showLabel = true
}: TierProgressBarProps) {
    const progress = Math.min(100, Math.floor((currentItems / threshold) * 100))
    const remaining = Math.max(0, threshold - currentItems)
    const isComplete = currentItems >= threshold
    
    return (
        <div className={cn("space-y-2", className)}>
            {showLabel && (
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">
                        {isComplete ? (
                            <span className="text-primary flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Ready to claim {tierName}!
                            </span>
                        ) : (
                            <span className="text-muted-foreground">
                                <span className="font-bold text-foreground">{currentItems}</span>
                                {' '}of{' '}
                                <span className="font-bold text-foreground">{threshold.toLocaleString()}</span>
                                {' '}items to {tierName}
                            </span>
                        )}
                    </span>
                    <span className={cn(
                        "text-sm font-body",
                        isComplete ? "text-primary" : "text-muted-foreground"
                    )}>
                        {progress}%
                    </span>
                </div>
            )}
            
            <div className="relative">
                <Progress 
                    value={progress} 
                    className={cn(
                        "h-3",
                        isComplete && "bg-primary/20"
                    )}
                />
                
                {/* Milestone markers */}
                <div className="absolute inset-0 flex pointer-events-none">
                    {[25, 50, 75].map((marker) => (
                        <div 
                            key={marker}
                            className={cn(
                                "flex-1 border-l border-dashed",
                                progress >= marker 
                                    ? "border-primary/30" 
                                    : "border-muted-foreground/20"
                            )}
                            style={{ marginLeft: `${marker}%` }}
                        />
                    ))}
                </div>
            </div>
            
            {!isComplete && remaining > 0 && (
                <p className="text-xs text-muted-foreground">
                    {remaining.toLocaleString()} more food items needed
                </p>
            )}
        </div>
    )
}

interface TierProgressSummaryProps {
    lifetimeFoodItems: number
    currentTier: string | null
    nextTier: string | null
    className?: string
}

const tierThresholds: Record<string, number> = {
    seedling: 10,
    grower: 100,
    farmer: 1000
}

export function TierProgressSummary({
    lifetimeFoodItems,
    currentTier,
    nextTier,
    className
}: TierProgressSummaryProps) {
    const nextThreshold = nextTier ? tierThresholds[nextTier] : null
    
    return (
        <div className={cn("space-y-4", className)}>
            {/* Current status */}
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <span className="material-symbols-outlined text-2xl text-primary">
                    {currentTier ? 'verified' : 'psychiatry'}
                </span>
                <div>
                    <p className="font-medium text-foreground">
                        {currentTier ? (
                            <span className="capitalize">{currentTier}</span>
                        ) : (
                            "Getting Started"
                        )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {lifetimeFoodItems.toLocaleString()} lifetime food items
                    </p>
                </div>
            </div>
            
            {/* Next tier progress */}
            {nextTier && nextThreshold && (
                <TierProgressBar
                    currentItems={lifetimeFoodItems}
                    threshold={nextThreshold}
                    tierName={nextTier}
                />
            )}
            
            {/* All tiers complete */}
            {!nextTier && currentTier === 'farmer' && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="material-symbols-outlined text-amber-600">emoji_events</span>
                    <span className="text-amber-800 font-medium">
                        Maximum tier reached! You're a master farmer.
                    </span>
                </div>
            )}
        </div>
    )
}

export default TierProgressBar
