"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Gift, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTierReward } from "@/hooks/use-tier-reward"

interface TierClaimButtonProps {
    tier: string
    canClaim: boolean
    usdtReward: number
    onSuccess?: () => void
    className?: string
    variant?: "default" | "outline" | "ghost"
}

export function TierClaimButton({
    tier,
    canClaim,
    usdtReward,
    onSuccess,
    className,
    variant = "default"
}: TierClaimButtonProps) {
    const { claim, isClaiming, error, success } = useTierReward()
    const [showSuccess, setShowSuccess] = useState(false)
    
    const handleClaim = async () => {
        if (!canClaim || isClaiming) return
        
        const result = await claim(tier)
        
        if (result.success) {
            setShowSuccess(true)
            onSuccess?.()
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                setShowSuccess(false)
            }, 5000)
        }
    }
    
    // Show success state
    if (showSuccess || success) {
        return (
            <div className={cn("flex items-center gap-2 text-primary", className)}>
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-[var(--font-pixel)] text-sm">
                    ${usdtReward} USDT Claimed!
                </span>
            </div>
        )
    }
    
    return (
        <div className={cn("space-y-2", className)}>
            <Button
                onClick={handleClaim}
                disabled={!canClaim || isClaiming}
                variant={variant}
                className={cn(
                    "relative font-[var(--font-pixel)]",
                    canClaim && "animate-pulse hover:animate-none"
                )}
            >
                {isClaiming ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        CLAIMING...
                    </>
                ) : (
                    <>
                        <Gift className="w-4 h-4 mr-2" />
                        CLAIM ${usdtReward} USDT
                    </>
                )}
                
                {/* Notification badge when claimable */}
                {canClaim && !isClaiming && (
                    <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce"
                    >
                        1
                    </Badge>
                )}
            </Button>
            
            {/* Error message */}
            {error && (
                <p className="text-xs text-destructive">
                    {error}
                </p>
            )}
        </div>
    )
}

interface TierClaimNotificationProps {
    availableTiers: Array<{
        name: string
        usdtReward: number
    }>
    onClaimClick: (tier: string) => void
    className?: string
}

export function TierClaimNotification({
    availableTiers,
    onClaimClick,
    className
}: TierClaimNotificationProps) {
    const totalReward = availableTiers.reduce((sum, t) => sum + t.usdtReward, 0)
    
    if (availableTiers.length === 0) return null
    
    return (
        <div className={cn(
            "p-4 bg-primary/10 border border-primary/30 rounded-lg",
            className
        )}>
            <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl text-primary">
                    emoji_events
                </span>
                <div className="flex-1">
                    <h4 className="font-[var(--font-pixel)] text-foreground mb-1">
                        Tier Reward Available!
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                        You've reached {availableTiers.length > 1 ? 'new tiers' : 'a new tier'} and can claim{' '}
                        <span className="font-bold text-primary">${totalReward} USDT</span>
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                        {availableTiers.map((tier) => (
                            <Button
                                key={tier.name}
                                size="sm"
                                onClick={() => onClaimClick(tier.name)}
                                className="font-[var(--font-pixel)] text-xs"
                            >
                                <Gift className="w-3 h-3 mr-1" />
                                Claim {tier.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TierClaimButton
