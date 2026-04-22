"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient, getUser, isAuthenticated } from "@/lib/pocketbase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TierSection } from "@/components/dashboard/tier-section"
import { TierBadgeGrid } from "@/components/tier/TierBadgeCard"
import { TierProgressSummary } from "@/components/tier/TierProgressBar"
import { TierClaimNotification } from "@/components/tier/TierClaimButton"
import { useTierReward } from "@/hooks/use-tier-reward"
import { Header } from "@/components/header"
import { Award, Sprout, ArrowLeft, RefreshCw, Info } from "lucide-react"
import Link from "next/link"

export default function TiersPage() {
    const router = useRouter()
    const [isHydrated, setIsHydrated] = useState(false)
    const [user, setUser] = useState<any>(null)
    
    const { status, isLoading, error, fetchStatus, claim, clearError } = useTierReward()
    
    useEffect(() => {
        setIsHydrated(true)
        
        const pb = createClient()
        
        if (isAuthenticated()) {
            const currentUser = getUser()
            if (currentUser) {
                setUser(currentUser)
                fetchStatus()
            }
        } else {
            router.push('/auth/login')
        }
    }, [router, fetchStatus])
    
    const handleClaim = async (tier: string) => {
        const result = await claim(tier)
        if (result.success) {
            // Success is handled by the hook (refreshes status)
        }
    }
    
    // Get claimable tiers
    const claimableTiers = status?.tiers.filter(t => t.can_claim && !t.claimed) || []
    const hasClaimableTiers = claimableTiers.length > 0
    
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
            </div>
        )
    }
    
    if (!user) {
        return null
    }
    
    return (
        <div className="min-h-screen bg-background">
            <Header />
            
            <main className="pt-20 pb-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <Link href="/dashboard">
                                        <Button variant="ghost" size="icon">
                                            <ArrowLeft className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                    <h1 className="font-[var(--font-pixel)] text-2xl md:text-3xl text-foreground flex items-center gap-3">
                                        <Award className="w-8 h-8 text-primary" />
                                        TIER REWARDS
                                    </h1>
                                </div>
                                <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                                    EARN REWARDS BY FEEDING YOUR EGGS
                                </p>
                            </div>
                            
                            <Button
                                onClick={fetchStatus}
                                disabled={isLoading}
                                variant="outline"
                                size="sm"
                                className="font-[var(--font-pixel)] text-xs"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                        
                        {/* Error alert */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription className="font-[var(--font-pixel)] text-xs">
                                    {error}
                                    <Button 
                                        variant="link" 
                                        size="sm" 
                                        onClick={clearError}
                                        className="ml-2"
                                    >
                                        Dismiss
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        {/* Claim notification */}
                        {hasClaimableTiers && (
                            <TierClaimNotification
                                availableTiers={claimableTiers.map(t => ({
                                    name: t.name,
                                    usdtReward: t.usdt_reward
                                }))}
                                onClaimClick={handleClaim}
                            />
                        )}
                        
                        {/* Progress summary */}
                        <Card className="border-2 border-primary/30">
                            <CardHeader>
                                <CardTitle className="font-[var(--font-pixel)] flex items-center gap-2">
                                    <Sprout className="w-5 h-5 text-primary" />
                                    Your Progress
                                </CardTitle>
                                <CardDescription className="font-[var(--font-pixel)] text-xs">
                                    Track your journey from Seedling to Farmer
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {status ? (
                                    <TierProgressSummary
                                        lifetimeFoodItems={status.lifetime_food_items}
                                        currentTier={status.current_tier}
                                        nextTier={status.next_tier}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                                            refresh
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        {/* Tier explanation */}
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="font-[var(--font-pixel)] text-lg flex items-center gap-2">
                                    <Info className="w-5 h-5" />
                                    How Tier Rewards Work
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-[var(--font-pixel)]">Step 1</Badge>
                                            <span className="font-medium">Feed Your Eggs</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Use food NFTs to feed your eggs. Each food item counts toward your lifetime total.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-[var(--font-pixel)]">Step 2</Badge>
                                            <span className="font-medium">Reach Milestones</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Hit 10, 100, or 1,000 lifetime food items to unlock tier rewards.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-[var(--font-pixel)]">Step 3</Badge>
                                            <span className="font-medium">Claim Rewards</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Receive USDT rewards and soulbound NFT badges that prove your achievement.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">lock</span>
                                        <span>
                                            Tier badges are <strong>soulbound NFTs</strong> — they cannot be transferred and permanently mark your achievement.
                                        </span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* All tier badges */}
                        <div>
                            <h2 className="font-[var(--font-pixel)] text-xl mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-secondary" />
                                Tier Badges
                            </h2>
                            
                            {status?.tiers ? (
                                <TierBadgeGrid badges={status.tiers} />
                            ) : (
                                <div className="flex items-center justify-center py-12">
                                    <p className="font-[var(--font-pixel)] text-muted-foreground">
                                        Loading tier badges...
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Rewards summary */}
                        {status && (
                            <Card className="border-2 border-primary/30">
                                <CardHeader>
                                    <CardTitle className="font-[var(--font-pixel)] text-lg">
                                        Rewards Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center p-4 bg-emerald-50 rounded-lg">
                                            <p className="text-2xl font-bold text-emerald-700">$5</p>
                                            <p className="text-sm text-emerald-600">Seedling Reward</p>
                                            <p className="text-xs text-muted-foreground mt-1">10 items</p>
                                        </div>
                                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                                            <p className="text-2xl font-bold text-amber-700">$50</p>
                                            <p className="text-sm text-amber-600">Grower Reward</p>
                                            <p className="text-xs text-muted-foreground mt-1">100 items</p>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <p className="text-2xl font-bold text-purple-700">$500</p>
                                            <p className="text-sm text-purple-600">Farmer Reward</p>
                                            <p className="text-xs text-muted-foreground mt-1">1,000 items</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Total possible rewards: <span className="font-bold text-primary">$555 USDT</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            You've earned: <span className="font-bold">
                                                ${status.tiers
                                                    .filter(t => t.claimed)
                                                    .reduce((sum, t) => sum + t.usdt_reward, 0)
                                                } USDT
                                            </span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
