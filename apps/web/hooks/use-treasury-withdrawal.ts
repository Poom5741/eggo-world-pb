'use client'

import { useState, useCallback, useRef } from 'react'
import { useMetaMask, BSC_CHAINS } from './use-metamask'
import { useContractOwnership } from './use-contract-ownership'
import { writeContract, simulateContract } from 'viem/actions'
import { createPublicClient, http } from 'viem'
import contracts from '@/lib/contracts.json'

export type WithdrawalStep =
  | 'idle'
  | 'validating'
  | 'estimating'
  | 'signing'
  | 'confirming'
  | 'done'
  | 'error'

interface GasEstimation {
  gasLimit: bigint
  gasPrice: bigint
  gasCostUSD: string
  gasCostNative: string
}

interface UseTreasuryWithdrawalReturn {
  withdrawalStep: WithdrawalStep
  gasEstimation: GasEstimation | null
  handleWithdraw: (amount: bigint) => Promise<void>
  error: string | null
  resetState: () => void
}

/**
 * Parse viem BaseError into user-friendly message per ERR-01
 */
function parseWithdrawalError(err: any): string {
  // BaseError from viem
  if (err?.name === 'ContractFunctionRevertedError') {
    const errorName = err.data?.errorName || err.data?.error

    // Map specific revert reasons to user-friendly messages
    switch (errorName) {
      case 'OwnableUnauthorizedAccount':
      case 'Ownable: caller is not the owner':
        return 'Only the contract owner can withdraw funds'
      case 'InsufficientBalance':
      case 'ERC20InsufficientBalance':
        return 'Treasury balance is insufficient for this withdrawal'
      case 'InvalidAmount':
      case 'AmountMustBeGreaterThanZero':
        return 'Withdrawal amount must be greater than 0'
      default:
        return `Contract error: ${errorName || 'Unknown transaction error'}`
    }
  }

  // TransactionNotFoundError per ERR-02
  if (err?.name === 'TransactionNotFoundError') {
    return 'RPC timeout: Transaction not found. Please check BscScan for details.'
  }

  // Network/RPC errors per ERR-02
  if (err?.name === 'NetworkError' || err?.name === 'RpcError') {
    return `RPC error: ${err.message || 'Network request failed'}`
  }

  // User rejection
  if (err?.name === 'UserRejectedRequestError') {
    return 'Transaction rejected by user'
  }

  // Generic fallback
  return err?.message || 'Transaction failed'
}

/**
 * useTreasuryWithdrawal - Custom React hook for treasury withdrawal transactions
 *
 * Implements D-20: Direct MetaMask flow (no intermediate confirmation)
 * Implements D-21: Gas estimation before withdrawal
 * Implements D-22: Progress indication (validating → signing → confirming → done)
 * Implements D-23: Success/failure handling
 * Implements ERR-01: Reverted transactions show human-readable error with reason
 * Implements ERR-02: RPC/network failures show retry option with context
 * Implements WDRW-04: Ownership check prevents withdrawal if not owner
 *
 * @example
 * ```tsx
 * const { withdrawalStep, gasEstimation, handleWithdraw, error } = useTreasuryWithdrawal()
 * ```
 */
export function useTreasuryWithdrawal(
  autoRefreshAfterWithdrawal?: () => Promise<void>
): UseTreasuryWithdrawalReturn {
  const { address, isConnected, walletClient, chainId } = useMetaMask()

  // Determine target chain based on environment
  const targetChainId = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 7117 // Testnet for local dev
    : 56    // Mainnet for production

  // Get contract address for useContractOwnership hook
  const contractConfig = contracts.CommissionDistribution
  const contractAddress = contractConfig.addresses[
    targetChainId.toString() as keyof typeof contractConfig.addresses
  ] as `0x${string}`

  const { ownershipStatus } = useContractOwnership('CommissionDistribution', contractAddress)

  // Check if connected wallet is the owner
  const isOwner = ownershipStatus === 'owner'
  const [withdrawalStep, setWithdrawalStep] = useState<WithdrawalStep>('idle')
  const [gasEstimation, setGasEstimation] = useState<GasEstimation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  /**
   * Reset state to idle
   */
  const resetState = useCallback(() => {
    setWithdrawalStep('idle')
    setGasEstimation(null)
    setError(null)
  }, [])

  /**
   * Handle treasury withdrawal transaction
   */
  const handleWithdraw = useCallback(
    async (amount: bigint) => {
      if (!isConnected || !address || !walletClient || chainId !== targetChainId) {
        setError('Please connect your wallet to the correct network')
        setWithdrawalStep('error')
        return
      }

      // Ownership check per WDRW-04
      if (!isOwner) {
        setError('Only the contract owner can withdraw funds')
        setWithdrawalStep('error')
        return
      }

      if (amount <= BigInt(0)) {
        setError('Withdrawal amount must be greater than 0')
        setWithdrawalStep('error')
        return
      }

      try {
        setError(null)

        // Step 1: Validating ownership per D-22
        setWithdrawalStep('validating')

        const contractConfig = contracts.CommissionDistribution
        const contractAddress = contractConfig.addresses[
          targetChainId.toString() as keyof typeof contractConfig.addresses
        ] as `0x${string}`

        // Create public client for the chain
        const chain = BSC_CHAINS[targetChainId]
        const publicRpcClient = createPublicClient({
          chain,
          transport: http(),
        })

        // Step 2: Estimating gas per D-21, D-22
        setWithdrawalStep('estimating')

        // Prepare withdrawTreasury function call
        const withdrawRequest = await simulateContract(publicRpcClient, {
          address: contractAddress,
          abi: [{
            name: 'withdrawTreasury',
            type: 'function',
            stateMutability: 'external',
            inputs: [{ name: 'amount', type: 'uint256' }],
            outputs: []
          }],
          functionName: 'withdrawTreasury',
          args: [amount],
          account: address,
        })

        // Calculate gas cost in USD (approximate).
        // viem's simulateContract may return `gas` as undefined when the node does
        // not run estimation as part of the simulation — fall back to an explicit
        // estimateContractGas call in that case so the user still sees a number.
        const gasPrice = await publicRpcClient.getGasPrice()
        const gasLimit: bigint =
          withdrawRequest.request.gas ??
          (await publicRpcClient.estimateContractGas({
            address: contractAddress,
            abi: [
              {
                name: 'withdrawTreasury',
                type: 'function',
                stateMutability: 'external',
                inputs: [{ name: 'amount', type: 'uint256' }],
                outputs: [],
              },
            ],
            functionName: 'withdrawTreasury',
            args: [amount],
            account: address,
          }))
        const gasCostWei = gasLimit * gasPrice
        const gasCostNative = Number(gasCostWei) / 1e18 // Convert to BNB
        const bnbPriceUSD = 300 // Approximate BNB price (could be fetched from API)
        const gasCostUSD = (gasCostNative * bnbPriceUSD).toFixed(2)

        setGasEstimation({
          gasLimit,
          gasPrice,
          gasCostUSD,
          gasCostNative: gasCostNative.toFixed(6),
        })

        // Step 3: Signing transaction per D-20, D-22
        setWithdrawalStep('signing')

        // Write contract via MetaMask
        const hash = await writeContract(walletClient, withdrawRequest.request)

        // Step 4: Confirming transaction per D-22
        setWithdrawalStep('confirming')

        // Wait for transaction receipt
        const receipt = await publicRpcClient.waitForTransactionReceipt({
          hash,
        })

        if (receipt.status === 'success') {
          // Step 5: Done per D-22, D-23
          setWithdrawalStep('done')
          setError(null)

          // Auto-refresh pool balances after successful withdrawal per D-28
          if (autoRefreshAfterWithdrawal) {
            await autoRefreshAfterWithdrawal()
          }

          // Reset state after delay
          setTimeout(() => {
            if (mountedRef.current) {
              resetState()
            }
          }, 3000)
        } else {
          throw new Error('Transaction failed')
        }
      } catch (err: any) {
        // Parse error into user-friendly message per ERR-01, ERR-02
        const errorMessage = parseWithdrawalError(err)
        console.error('[useTreasuryWithdrawal] Withdrawal failed:', errorMessage, err)

        if (mountedRef.current) {
          setError(errorMessage)
          setWithdrawalStep('error')
        }
      }
    },
    [
      isConnected,
      address,
      walletClient,
      chainId,
      targetChainId,
      isOwner,
      autoRefreshAfterWithdrawal,
      resetState,
    ]
  )

  return {
    withdrawalStep,
    gasEstimation,
    handleWithdraw,
    error,
    resetState,
  }
}