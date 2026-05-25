'use client'

import { useEffect, useState } from 'react'
import { useMetaMask } from './use-metamask'
import { readContract } from 'viem/actions'
import type { Address } from 'viem'

interface UseContractOwnershipReturn {
  owner: Address | null
  pendingOwner: Address | null
  loading: boolean
  error: string | null
  ownershipStatus: 'owner' | 'pending' | 'not-owner' | 'unknown'
  refetch: () => Promise<void>
}

/**
 * useContractOwnership - Custom hook for per-contract ownership queries
 *
 * Queries on-chain ownership data using viem's readContract:
 * - owner() for all contracts
 * - pendingOwner() only for CommissionDistribution (Ownable2Step)
 *
 * @param contractName - Name of contract (must match contracts.json key)
 * @param contractAddress - Contract address to query
 * @returns Ownership data, loading state, error messages, and refetch function
 *
 * @example
 * ```tsx
 * const { owner, pendingOwner, loading, ownershipStatus, refetch } = useContractOwnership(
 *   'CommissionDistribution',
 *   '0x18b486086f4414500398276766697ad0fc1a43cf'
 * )
 * ```
 */
export function useContractOwnership(
  contractName: string,
  contractAddress: Address
): UseContractOwnershipReturn {
  const { address, isConnected, walletClient } = useMetaMask()

  const [owner, setOwner] = useState<Address | null>(null)
  const [pendingOwner, setPendingOwner] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOwnership = async () => {
    // Reset state
    setLoading(true)
    setError(null)

    // Validation checks
    if (!isConnected || !address) {
      setError('MetaMask not connected')
      setLoading(false)
      return
    }

    if (!walletClient) {
      setError('MetaMask not detected')
      setLoading(false)
      return
    }

    // Check for zero address (contract not deployed)
    if (contractAddress === '0x0000000000000000000000000000000000000000') {
      setError('Contract not deployed on this network')
      setLoading(false)
      return
    }

    try {
      // Query owner() - all contracts have this
      const ownerResult = await readContract(walletClient, {
        address: contractAddress,
        abi: [{
          name: 'owner',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'address' }]
        }],
        functionName: 'owner',
      }) as Address

      setOwner(ownerResult)

      // Only query pendingOwner() for CommissionDistribution (Ownable2Step)
      if (contractName === 'CommissionDistribution') {
        try {
          const pendingOwnerResult = await readContract(walletClient, {
            address: contractAddress,
            abi: [{
              name: 'pendingOwner',
              type: 'function',
              stateMutability: 'view',
              inputs: [],
              outputs: [{ name: '', type: 'address' }]
            }],
            functionName: 'pendingOwner',
          }) as Address

          setPendingOwner(pendingOwnerResult)
        } catch (pendingErr) {
          // pendingOwner() might not exist or call failed
          console.warn('Failed to fetch pendingOwner:', pendingErr)
          setPendingOwner(null)
        }
      } else {
        setPendingOwner(null)
      }

    } catch (err) {
      console.error('Failed to fetch ownership:', err)

      // Distinguish error types
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        setError('RPC unavailable - please check your connection')
      } else if (errorMessage.includes('chain')) {
        setError('Wrong network - please switch to the correct chain')
      } else {
        setError('Failed to fetch ownership data')
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch ownership on mount and when dependencies change
  useEffect(() => {
    fetchOwnership()
  }, [contractName, contractAddress, isConnected, address, walletClient])

  // Calculate ownership status
  const ownershipStatus: 'owner' | 'pending' | 'not-owner' | 'unknown' = (() => {
    if (!address || loading || error) return 'unknown'

    // Check if connected wallet is the owner
    if (owner && address.toLowerCase() === owner.toLowerCase()) {
      return 'owner'
    }

    // Check if connected wallet is pending owner (CommissionDistribution only)
    if (pendingOwner && pendingOwner !== '0x0000000000000000000000000000000000000000' &&
        address.toLowerCase() === pendingOwner.toLowerCase()) {
      return 'pending'
    }

    // Connected wallet is not the owner
    return 'not-owner'
  })()

  return {
    owner,
    pendingOwner,
    loading,
    error,
    ownershipStatus,
    refetch: fetchOwnership,
  }
}
