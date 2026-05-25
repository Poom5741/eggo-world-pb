'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import type {
  WalletClient,
  Chain,
  Address,
  Transport,
} from 'viem'
import { createWalletClient, custom } from 'viem'

/**
 * MetaMask window.ethereum interface with required methods
 */
interface EthereumProvider {
  isMetaMask?: boolean
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, handler: (...args: any[]) => void) => void
  removeListener: (event: string, handler: (...args: any[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

/**
 * BSC Chain configurations
 */
export const BSC_CHAINS: Record<number, Chain> = {
  56: {
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://bsc-dataseed.binance.org'] },
      public: { http: ['https://bsc-dataseed.binance.org'] },
    },
    blockExplorers: {
      default: { name: 'BscScan', url: 'https://bscscan.com' },
    },
  },
  97: {
    id: 97,
    name: 'BNB Smart Chain Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
      public: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
    },
    blockExplorers: {
      default: { name: 'BscScan Testnet', url: 'https://testnet.bscscan.com' },
    },
  },
  7117: {
    id: 7117,
    name: '0xl3 Testnet',
    nativeCurrency: { name: '0xl3', symbol: '0xl3', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc.0xl3.com'] },
      public: { http: ['https://rpc.0xl3.com'] },
    },
    blockExplorers: {
      default: { name: '0xl3 Explorer', url: 'https://explorer.0xl3.com' },
    },
  },
}

export interface UseMetaMaskReturn {
  address: Address | null
  isConnected: boolean
  chainId: number | null
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
  walletClient: WalletClient<Transport, Chain, number> | null
}

/**
 * Subscribe to MetaMask events
 */
function subscribeToMetaMaskEvents(
  ethereum: EthereumProvider,
  callback: () => void
) {
  const handleAccountsChanged = () => callback()
  const handleChainChanged = () => callback()
  const handleDisconnect = () => callback()

  ethereum.on('accountsChanged', handleAccountsChanged)
  ethereum.on('chainChanged', handleChainChanged)
  ethereum.on('disconnect', handleDisconnect)

  return () => {
    ethereum.removeListener('accountsChanged', handleAccountsChanged)
    ethereum.removeListener('chainChanged', handleChainChanged)
    ethereum.removeListener('disconnect', handleDisconnect)
  }
}

/**
 * Get current MetaMask snapshot synchronously
 */
function getMetaMaskSnapshot(): {
  address: Address | null
  chainId: number | null
  hasProvider: boolean
} {
  if (typeof window === 'undefined') {
    return { address: null, chainId: null, hasProvider: false }
  }

  const ethereum = window.ethereum
  if (!ethereum) {
    return { address: null, chainId: null, hasProvider: false }
  }

  return {
    address: null as Address | null,
    chainId: null as number | null,
    hasProvider: true,
  }
}

/**
 * useMetaMask - Custom React hook for MetaMask wallet connection using viem
 *
 * Provides:
 * - connect(): Prompt MetaMask connection
 * - disconnect(): Clear local wallet state
 * - address: Connected wallet address
 * - isConnected: Connection status
 * - chainId: Current chain ID
 * - switchChain(chainId): Switch to target chain
 * - error: Connection error messages
 *
 * @example
 * ```tsx
 * const { address, isConnected, connect, disconnect } = useMetaMask()
 * ```
 */
export function useMetaMask(): UseMetaMaskReturn {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  // Subscribe to MetaMask events using useSyncExternalStore
  const snapshot = useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined' || !window.ethereum) {
        return () => {}
      }
      return subscribeToMetaMaskEvents(window.ethereum, callback)
    },
    getMetaMaskSnapshot,
    getMetaMaskSnapshot
  )

  // Create wallet client
  const walletClient = useMemo(() => {
    if (!snapshot.hasProvider || typeof window === 'undefined') {
      return null
    }

    try {
      return createWalletClient({
        transport: custom(window.ethereum!),
        chain: BSC_CHAINS[56], // Default to BSC mainnet
      })
    } catch (err) {
      console.error('Failed to create wallet client:', err)
      return null
    }
  }, [snapshot.hasProvider])

  // Get current address and chain ID
  const [address, setAddress] = useState<Address | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  // Fetch current account and chain
  useEffect(() => {
    if (!snapshot.hasProvider || typeof window === 'undefined') {
      return
    }

    const fetchState = async () => {
      try {
        const ethereum = window.ethereum!

        // Get accounts
        const accounts = await ethereum.request({
          method: 'eth_accounts',
        })
        if (accounts?.[0] && mountedRef.current) {
          setAddress(accounts[0] as Address)
        }

        // Get chain ID
        const chainIdHex = await ethereum.request({
          method: 'eth_chainId',
        })
        if (chainIdHex && mountedRef.current) {
          setChainId(parseInt(chainIdHex as string, 16))
        }
      } catch (err) {
        console.error('Failed to fetch MetaMask state:', err)
      }
    }

    fetchState()
  }, [snapshot.hasProvider])

  const connect = useCallback(async () => {
    if (!snapshot.hasProvider) {
      setError('MetaMask not detected. Please install MetaMask to continue.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const ethereum = window.ethereum!

      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts?.[0]) {
        throw new Error('No accounts returned from MetaMask')
      }

      // Get chain ID
      const chainIdHex = await ethereum.request({
        method: 'eth_chainId',
      })

      if (mountedRef.current) {
        setAddress(accounts[0] as Address)
        setChainId(parseInt(chainIdHex as string, 16))
        setError(null)
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || 'Failed to connect MetaMask')
        console.error('MetaMask connection error:', err)
      }
    } finally {
      if (mountedRef.current) {
        setIsConnecting(false)
      }
    }
  }, [snapshot.hasProvider])

  const disconnect = useCallback(() => {
    setAddress(null)
    setChainId(null)
    setError(null)
    // Note: MetaMask doesn't have a true disconnect - we just forget the connection locally
  }, [])

  const switchChain = useCallback(
    async (targetChainId: number) => {
      if (!snapshot.hasProvider || !address) {
        setError('Please connect MetaMask first')
        return
      }

      const targetChain = BSC_CHAINS[targetChainId]
      if (!targetChain) {
        setError(`Unsupported chain ID: ${targetChainId}`)
        return
      }

      setError(null)

      try {
        const ethereum = window.ethereum!

        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        })

        if (mountedRef.current) {
          setChainId(targetChainId)
        }
      } catch (err: any) {
        // Chain doesn't exist in MetaMask, try to add it
        if (err?.code === 4902) {
          try {
            const ethereum = window.ethereum!
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: targetChain.name,
                  nativeCurrency: targetChain.nativeCurrency,
                  rpcUrls: Object.values(targetChain.rpcUrls).flat(),
                  blockExplorerUrls: Object.values(targetChain.blockExplorers).flatMap(
                    (explorer) => [explorer.url]
                  ),
                },
              ],
            })

            if (mountedRef.current) {
              setChainId(targetChainId)
            }
          } catch (addError) {
            if (mountedRef.current) {
              setError(
                `Failed to add ${targetChain.name}: ${addError}`
              )
            }
          }
        } else {
          if (mountedRef.current) {
            setError(err?.message || 'Failed to switch chain')
          }
        }
      }
    },
    [snapshot.hasProvider, address]
  )

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    address,
    isConnected: !!address,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    switchChain,
    walletClient,
  }
}