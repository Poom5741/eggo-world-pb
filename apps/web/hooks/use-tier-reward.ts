"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/pocketbase/client"

export interface TierStatus {
    lifetime_food_items: number
    highest_tier_reached: string | null
    current_tier: string | null
    next_tier: string | null
    can_claim_next: boolean
    tiers: Array<{
        name: string
        threshold: number
        usdt_reward: number
        claimed: boolean
        is_next: boolean
        can_claim: boolean
        progress: number
    }>
}

export interface ClaimResult {
    success: boolean
    data?: {
        tier: string
        usdt_amount: number
        tx_hash: string
        token_id: number
        lifetime_food_items: number
    }
    error?: string
}

interface UseTierRewardReturn {
    status: TierStatus | null
    isLoading: boolean
    isClaiming: boolean
    error: string | null
    success: boolean
    fetchStatus: () => Promise<void>
    claim: (tier: string) => Promise<ClaimResult>
    clearError: () => void
}

export function useTierReward(): UseTierRewardReturn {
    const [status, setStatus] = useState<TierStatus | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isClaiming, setIsClaiming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    
    const pb = createClient()
    
    const fetchStatus = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        
        try {
            const token = pb.authStore.token
            
            if (!token) {
                throw new Error("Not authenticated")
            }
            
            const response = await fetch('/api/v2/check-tier-reward', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error?.message || 'Failed to fetch tier status')
            }
            
            setStatus(result.data)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch tier status')
            console.error('Tier status fetch error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [pb])
    
    const claim = useCallback(async (tier: string): Promise<ClaimResult> => {
        setIsClaiming(true)
        setError(null)
        setSuccess(false)
        
        try {
            const token = pb.authStore.token
            
            if (!token) {
                throw new Error("Not authenticated")
            }
            
            const response = await fetch('/api/v2/check-tier-reward', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ tier })
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error?.message || 'Tier claim failed')
            }
            
            setSuccess(true)
            
            // Refresh status after successful claim
            await fetchStatus()
            
            return {
                success: true,
                data: result.data
            }
            
        } catch (err: any) {
            const errorMessage = err.message || 'Tier claim failed'
            setError(errorMessage)
            console.error('Tier claim error:', err)
            
            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsClaiming(false)
        }
    }, [pb, fetchStatus])
    
    const clearError = useCallback(() => {
        setError(null)
    }, [])
    
    return {
        status,
        isLoading,
        isClaiming,
        error,
        success,
        fetchStatus,
        claim,
        clearError
    }
}

export default useTierReward
