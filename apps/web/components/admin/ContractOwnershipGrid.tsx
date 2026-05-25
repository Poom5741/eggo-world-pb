'use client'

import { ContractOwnershipCard } from './ContractOwnershipCard'
import contracts from '@/lib/contracts.json'
import { useMetaMask } from '@/hooks/use-metamask'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * ContractOwnershipGrid - Grid of all 6 contract ownership cards
 *
 * Renders all deployed contracts for the current chain in a responsive grid:
 * - Desktop: 2 columns
 * - Mobile: 1 column
 *
 * Filters out undeployed contracts (zero address) and shows error for unsupported networks.
 */
export function ContractOwnershipGrid() {
  const { chainId } = useMetaMask()

  // Determine current chain ID
  const currentChainId = chainId || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 7117 : 56)

  // Validate chain ID
  const supportedChains = [56, 97, 7117]
  if (!supportedChains.includes(currentChainId)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unsupported Network</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              The connected network (Chain ID: {currentChainId}) is not supported. Please switch to BSC Mainnet (56), BSC Testnet (97), or 0xl3 Testnet (7117).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Get all contracts with addresses for current chain
  const contractEntries = Object.entries(contracts).map(([name, config]) => {
    const address = config.addresses[currentChainId.toString() as keyof typeof config.addresses] as `0x${string}`
    return { name, address }
  })

  // Filter out undeployed contracts (zero address)
  const deployedContracts = contractEntries.filter(
    ({ address }) => address !== ZERO_ADDRESS
  )

  // Show message if no contracts deployed on this chain
  if (deployedContracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Contracts Deployed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No contracts are currently deployed on this network (Chain ID: {currentChainId}).
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {deployedContracts.map(({ name, address }) => (
        <ContractOwnershipCard
          key={name}
          contractName={name}
          contractAddress={address}
        />
      ))}
    </div>
  )
}
