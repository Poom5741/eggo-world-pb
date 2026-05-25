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
  const { address, isConnected, connect, disconnect, walletClient, chainId, switchChain } = useMetaMask()

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

  // Loading state (before hydration or during verification)
  if (!isHydrated || isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // MetaMask not detected
  if (typeof window !== 'undefined' && !window.ethereum) {
    return (
      fallback ?? (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>MetaMask Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  MetaMask not detected. Please install MetaMask browser extension to access this page.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://metamask.io/download/', '_blank')}
              >
                Install MetaMask
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // Not connected
  if (!isConnected) {
    return (
      fallback ?? (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Connect MetaMask</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your MetaMask wallet to access the Admin Treasury panel. You must be the contract owner to continue.
              </p>
              <Button
                className="w-full"
                onClick={connect}
              >
                Connect MetaMask
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // Wrong network
  if (chainId !== targetChainId) {
    return (
      fallback ?? (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Wrong Network</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  You are connected to the wrong network. Please switch to{' '}
                  {targetChainId === 56 ? 'BSC Mainnet' : '0xl3 Testnet'}.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => switchChain(targetChainId)}
                >
                  Switch Network
                </Button>
                <Button
                  variant="outline"
                  onClick={disconnect}
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // Not owner
  if (!isOwner && verificationError) {
    return (
      fallback ?? (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={disconnect}
              >
                Disconnect Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // Owner verified - render children
  return <>{children}</>
}