'use client'

import { PoolBalanceCard } from './PoolBalanceCard'
import { WithdrawalForm } from './WithdrawalForm'
import { useContractOwnership } from '@/hooks/use-contract-ownership'
import contracts from '@/lib/contracts.json'

/**
 * TreasuryWithdrawalSection - Container for Pool Balance & Treasury Withdrawal
 *
 * Implements D-27: Visual connection to Phase 66 — helpful guidance messaging links to ownership section
 * Composes PoolBalanceCard and WithdrawalForm in responsive layout
 * Applies claymorphism styling consistent with Phase 66 ownership cards
 *
 * @example
 * ```tsx
 * <TreasuryWithdrawalSection />
 * ```
 */
export function TreasuryWithdrawalSection() {
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

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-pixel-style text-primary mb-2">
          Pool Balances & Treasury Withdrawal
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitor USDT pool balances and withdraw treasury funds
        </p>
      </div>

      {/* Ownership guidance per D-27 */}
      {!isOwner && ownershipStatus !== 'unknown' && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Ownership Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  You must be the owner of the CommissionDistribution contract to withdraw treasury funds.
                </p>
                <a
                  href="#ownership-section"
                  className="mt-1 inline-block underline font-medium hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  Go to ownership section →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive layout: 2-column desktop, 1-column mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pool Balance Card */}
        <div className="md:col-span-1">
          <PoolBalanceCard />
        </div>

        {/* Withdrawal Form */}
        <div className="md:col-span-1">
          <WithdrawalForm />
        </div>
      </div>
    </div>
  )
}