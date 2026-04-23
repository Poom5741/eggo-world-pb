"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, isAuthenticated } from "@/lib/pocketbase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDescription } from "@/components/ui/alert"
import { TierBadgeGrid } from "@/components/tier/TierBadgeCard"
import { TierProgressSummary } from "@/components/tier/TierProgressBar"
import { TierClaimNotification } from "@/components/tier/TierClaimButton"
import { useTierReward } from "@/hooks/use-tier-reward"
import { Header } from "@/components/header"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function TiersPage() {
    const router = useRouter()
    const [isHydrated, setIsHydrated] = useState(false)
    const [user, setUser] = useState<any>(null)
    
    const { status, isLoading, error, fetchStatus, claim, clearError } = useTierReward()
    
    useEffect(() => {
        setIsHydrated(true)
        
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
    const claimableTiers = status?.tiers?.filter(t => t.can_claim && !t.claimed) || []
    const hasClaimableTiers = claimableTiers.length > 0
    
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="font-body text-foreground">LOADING...</p>
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
                        {/* Header with clay styling */}
                        <Card variant="clay-lg" className="border-t-8 border-primary-container">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Link href="/dashboard">
                                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-surface-container-high">
                                                <ArrowLeft className="w-5 h-5" />
                                            </Button>
                                        </Link>
                                        <div>
                                            <h1 className="font-heading text-heading-xl text-foreground flex items-center gap-3">
                                                <span className="material-symbols-outlined text-4xl text-primary">military_tech</span>
                                                TIER REWARDS
                                            </h1>
                                            <p className="font-body text-xs text-muted-foreground mt-1">
                                                EARN REWARDS BY FEEDING YOUR EGGS
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <Button
                                        onClick={fetchStatus}
                                        disabled={isLoading}
                                        variant="clay"
                                        size="sm"
                                        className="font-body text-xs rounded-full"
                                    >
                                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                        
                        {/* Error alert with clay styling */}
                        {error && (
                            <Card variant="clay" className="border-2 border-destructive bg-destructive/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <AlertDescription className="font-body text-xs text-destructive flex items-center gap-2">
                                            <span className="material-symbols-outlined">error</span>
                                            {error}
                                        </AlertDescription>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={clearError}
                                            className="rounded-full"
                                        >
                                            <span className="material-symbols-outlined">close</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
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
                        
                        {/* Progress summary with clay styling */}
                        <Card variant="clay-lg" className="border-t-8 border-secondary-container">
                            <CardHeader>
                                <CardTitle className="font-body flex items-center gap-2">
                                    <span className="material-symbols-outlined text-2xl text-secondary">psychiatry</span>
                                    Your Progress
                                </CardTitle>
                                <CardDescription className="font-body text-xs">
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
                                        <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                                            progress_activity
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        {/* Tier explanation with clay styling */}
                        <Card variant="clay" className="bg-tertiary-container/30">
                            <CardHeader>
                                <CardTitle className="font-body text-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-2xl text-tertiary">help</span>
                                    How Tier Rewards Work
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card variant="clay" className="bg-surface-container-lowest/50">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant="clay" className="font-body bg-primary text-primary-foreground">Step 1</Badge>
                                                <span className="">Feed Your Eggs</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Use food NFTs to feed your eggs. Each food item counts toward your lifetime total.
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card variant="clay" className="bg-surface-container-lowest/50">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant="clay" className="font-body bg-secondary text-secondary-foreground">Step 2</Badge>
                                                <span className="">Reach Milestones</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Hit 10, 100, or 1,000 lifetime food items to unlock tier rewards.
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card variant="clay" className="bg-surface-container-lowest/50">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant="clay" className="font-body bg-tertiary text-tertiary-foreground">Step 3</Badge>
                                                <span className="">Claim Rewards</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Receive USDT rewards and soulbound NFT badges that prove your achievement.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                <div className="pt-4 border-t border-outline/30">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">lock</span>
                                        <span>
                                            Tier badges are <strong>soulbound NFTs</strong> — they cannot be transferred and permanently mark your achievement.
                                        </span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* All tier badges with clay styling */}
                        <Card variant="clay-lg" className="border-t-8 border-tertiary-container">
                            <CardHeader>
                                <CardTitle className="font-heading text-heading-md flex items-center gap-2">
                                    <span className="material-symbols-outlined text-2xl text-tertiary">workspace_premium</span>
                                    Tier Badges
                                </CardTitle>
                                <CardDescription className="font-body text-xs">
                                    Collect all three soulbound badges
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {status?.tiers ? (
                                    <TierBadgeGrid badges={status.tiers} />
                                ) : (
                                    <div className="flex items-center justify-center py-12">
                                        <span className="material-symbols-outlined animate-spin text-3xl text-primary mr-2">
                                            progress_activity
                                        </span>
                                        <p className="font-body text-muted-foreground">
                                            Loading tier badges...
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        {/* Rewards summary with clay styling */}
                        {status && (
                            <Card variant="clay-xl" className="border-t-8 border-primary-container bg-gradient-to-br from-primary-container/20 to-secondary-container/20">
                                <CardHeader>
                                    <CardTitle className="font-body text-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined text-2xl text-primary">savings</span>
                                        Rewards Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card variant="clay" className="bg-emerald-100/50 border-emerald-200">
                                            <CardContent className="pt-6 text-center">
                                                <p className="text-3xl font-bold text-emerald-700 font-body">$5</p>
                                                <p className="text-sm text-emerald-600 font-medium">Seedling Reward</p>
                                                <p className="text-xs text-muted-foreground mt-1">10 items</p>
                                            </CardContent>
                                        </Card>
                                        <Card variant="clay" className="bg-amber-100/50 border-amber-200">
                                            <CardContent className="pt-6 text-center">
                                                <p className="text-3xl font-bold text-amber-700 font-body">$50</p>
                                                <p className="text-sm text-amber-600 font-medium">Grower Reward</p>
                                                <p className="text-xs text-muted-foreground mt-1">100 items</p>
                                            </CardContent>
                                        </Card>
                                        <Card variant="clay" className="bg-purple-100/50 border-purple-200">
                                            <CardContent className="pt-6 text-center">
                                                <p className="text-3xl font-bold text-purple-700 font-body">$500</p>
                                                <p className="text-sm text-purple-600 font-medium">Farmer Reward</p>
                                                <p className="text-xs text-muted-foreground mt-1">1,000 items</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-outline/30 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Total possible rewards: <span className="font-bold text-primary font-body">$555 USDT</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            You've earned: <span className="font-bold text-primary font-body">
                                                ${status.tiers
                                                    ?.filter(t => t.claimed)
                                                    ?.reduce((sum, t) => sum + (t.usdt_reward || 0), 0) || 0
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
