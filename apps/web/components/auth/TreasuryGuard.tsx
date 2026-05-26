'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { useMetaMask } from '@/hooks/use-metamask'
import { readContract } from 'viem/actions'
import contracts from '@/lib/contracts.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

interface TreasuryGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * TreasuryGuard - Wrapper component that gates content behind MetaMask + ownership check
 *
 * Gates content behind:
 * 1. MetaMask detection (window.ethereum exists)
 * 2. Wallet connection (user has connected MetaMask)
 * 3. Ownership verification (connected wallet == contract owner)
 *
 * @example
 * ```tsx
 * <TreasuryGuard>
 *   <TreasuryDashboard />
 * </TreasuryGuard>
 * ```
 */
export function TreasuryGuard({ children, fallback }: TreasuryGuardProps) {
  const isHydrated = useIsHydrated()
  const { address, isConnected, disconnect, walletClient, chainId } = useMetaMask()

  const [isVerifying, setIsVerifying] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  // Contract configuration
  const contractConfig = contracts.CommissionDistribution
  const targetChainId = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 7117 : 56
  const contractAddress = contractConfig.addresses[targetChainId.toString() as keyof typeof contractConfig.addresses] as `0x${string}`

  // Verify ownership when wallet connects
  useEffect(() => {
    if (!isHydrated || !isConnected || !address || !walletClient) {
      setIsOwner(false)
      return
    }

    const verifyOwnership = async () => {
      setIsVerifying(true)
      setVerificationError(null)

      try {
        // Check if connected wallet is the owner
        const owner = await readContract(walletClient, {
          address: contractAddress,
          abi: [contractConfig.abi.owner],
          functionName: 'owner',
        }) as `0x${string}`

        const isOwnerAddress = address.toLowerCase() === owner.toLowerCase()
        setIsOwner(isOwnerAddress)

        if (!isOwnerAddress) {
          setVerificationError(`Connected wallet is not the contract owner. Expected: ${owner}`)
        }
      } catch (err) {
        console.error('Ownership verification failed:', err)
        setVerificationError('Failed to verify ownership. Please check your connection.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyOwnership()
  }, [isHydrated, isConnected, address, walletClient, contractConfig, contractAddress])

  // Before hydration — render nothing to avoid layout flash
  if (!isHydrated) return null

  // MetaMask not detected — page-level connection card already handles this
  if (typeof window !== 'undefined' && !window.ethereum) {
    return fallback ?? null
  }

  // Not connected — page-level connection card already handles connect flow
  if (!isConnected) {
    return fallback ?? null
  }

  // Wrong network — page-level card already shows switch prompt
  if (chainId !== targetChainId) {
    return fallback ?? null
  }

  // Verifying ownership
  if (isVerifying) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-36" />
        </CardContent>
      </Card>
    )
  }

  // Not owner
  if (!isOwner && verificationError) {
    return (
      fallback ?? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{verificationError}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={disconnect}>
              Disconnect Wallet
            </Button>
          </CardContent>
        </Card>
      )
    )
  }

  // Owner verified - render children
  return <>{children}</>
}