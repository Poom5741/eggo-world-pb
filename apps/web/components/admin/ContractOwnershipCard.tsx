'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useContractOwnership } from '@/hooks/use-contract-ownership'
import { useMetaMask } from '@/hooks/use-metamask'
import { writeContract } from 'viem/actions'
import contracts from '@/lib/contracts.json'
import type { Address } from 'viem'

interface ContractOwnershipCardProps {
  contractName: string
  contractAddress: Address
}

const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'

/**
 * ContractOwnershipCard - Individual contract ownership card component
 *
 * Displays:
 * - Contract name (bold header)
 * - Current owner address (truncated with click-to-copy)
 * - Pending owner (CommissionDistribution only, if non-zero)
 * - Ownership status badge with color-coded border
 * - Accept Ownership button (CommissionDistribution + pending owner match)
 *
 * @param contractName - Name of contract (must match contracts.json key)
 * @param contractAddress - Contract address to query
 */
export function ContractOwnershipCard({ contractName, contractAddress }: ContractOwnershipCardProps) {
  const { address, walletClient } = useMetaMask()
  const { owner, pendingOwner, loading, error, ownershipStatus, refetch } = useContractOwnership(
    contractName,
    contractAddress
  )

  const [copied, setCopied] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'confirming' | 'pending' | 'success' | 'error'>('idle')
  const [txError, setTxError] = useState<string | null>(null)

  // Copy address to clipboard
  const handleCopyAddress = async (addressToCopy: string) => {
    try {
      await navigator.clipboard.writeText(addressToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  // Handle Accept Ownership click
  const handleAcceptOwnership = async () => {
    if (!walletClient || !address) {
      setTxError('MetaMask not connected')
      return
    }

    if (contractName !== 'CommissionDistribution') {
      setTxError('Only CommissionDistribution supports acceptOwnership')
      return
    }

    setTxStatus('confirming')
    setTxError(null)

    try {
      // Get CommissionDistribution ABI
      const contractConfig = contracts.CommissionDistribution

      // Call acceptOwnership()
      setTxStatus('pending')

      const hash = await writeContract(walletClient, {
        address: contractAddress,
        abi: [{
          name: 'acceptOwnership',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [],
          outputs: []
        }],
        functionName: 'acceptOwnership',
      })

      setTxStatus('success')

      // Refresh ownership data after transaction
      setTimeout(() => {
        refetch()
        setTxStatus('idle')
      }, 2000)

    } catch (err) {
      console.error('Failed to accept ownership:', err)
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      setTxError(errorMessage)
      setTxStatus('error')
    }
  }

  // Truncate address for display
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Determine border color based on ownership status
  const borderColor = ownershipStatus === 'owner' ? 'border-green-500' : 'border-border'

  // Loading skeleton
  if (loading) {
    return (
      <Card className={`border-2 ${borderColor}`}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-2 ${borderColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{contractName}</CardTitle>
          {ownershipStatus !== 'unknown' && (
            <Badge
              variant={ownershipStatus === 'owner' ? 'default' : ownershipStatus === 'pending' ? 'secondary' : 'outline'}
              className={ownershipStatus === 'owner' ? 'bg-green-500' : ''}
            >
              {ownershipStatus === 'owner' && '🟢 You are the owner'}
              {ownershipStatus === 'pending' && '🟡 Pending acceptance'}
              {ownershipStatus === 'not-owner' && '⚪ Not owner'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {error}
              <Button
                variant="link"
                className="h-auto p-0 ml-2 text-xs"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction error */}
        {txError && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              Transaction failed: {txError}
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction success */}
        {txStatus === 'success' && (
          <Alert variant="default">
            <AlertDescription className="text-sm">
              ✓ Ownership accepted successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Current Owner */}
        {owner && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Owner</p>
            <div
              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleCopyAddress(owner)}
            >
              <code className="text-sm font-mono">{truncateAddress(owner)}</code>
              {copied && <span className="text-xs text-green-500">Copied!</span>}
            </div>
          </div>
        )}

        {/* Pending Owner (CommissionDistribution only) */}
        {contractName === 'CommissionDistribution' && pendingOwner && pendingOwner !== ZERO_ADDRESS && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Pending Owner</p>
            <div
              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleCopyAddress(pendingOwner)}
            >
              <code className="text-sm font-mono">{truncateAddress(pendingOwner)}</code>
            </div>
          </div>
        )}

        {/* Accept Ownership Button */}
        {contractName === 'CommissionDistribution' &&
         pendingOwner &&
         pendingOwner !== ZERO_ADDRESS &&
         address &&
         address.toLowerCase() === pendingOwner.toLowerCase() && (
          <Button
            onClick={handleAcceptOwnership}
            disabled={txStatus === 'confirming' || txStatus === 'pending'}
            className="w-full"
          >
            {txStatus === 'confirming' && 'Confirming in MetaMask...'}
            {txStatus === 'pending' && 'Transaction pending...'}
            {txStatus === 'idle' && 'Accept Ownership'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
