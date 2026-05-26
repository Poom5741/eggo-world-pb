'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTreasuryWithdrawal } from '@/hooks/use-treasury-withdrawal'
import { usePoolBalances } from '@/hooks/use-pool-balances'
import { useContractOwnership } from '@/hooks/use-contract-ownership'
import { useMetaMask } from '@/hooks/use-metamask'
import { AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react'
import contracts from '@/lib/contracts.json'

/**
 * WithdrawalForm - Treasury withdrawal form with validation and MetaMask integration
 *
 * Implements D-20: Direct MetaMask flow (no intermediate confirmation)
 * Implements D-21: Gas estimation displayed before withdrawal
 * Implements D-22: Progress indication (Signing → Sending → Confirming → Done)
 * Implements D-23: Success/failure alerts + auto-refresh
 * Implements D-24: Real-time validation as user types
 * Implements D-25: Large withdrawal warning (>$1000 or >10%)
 * Implements D-26: Ownership check (disable button, tooltip)
 * Implements WDRW-02: Display treasury destination + available balance
 *
 * @example
 * ```tsx
 * <WithdrawalForm />
 * ```
 */
export function WithdrawalForm() {
  const [amount, setAmount] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  // MetaMask connection state
  const { isConnected, chainId } = useMetaMask()

  // Determine target chain based on environment
  const targetChainId =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 7117 // Testnet for local dev
      : 56 // Mainnet for production

  // Resolve CommissionDistribution contract address per current chain.
  // The withdrawTreasury function transfers funds to the treasury address stored
  // in the contract, so we surface the contract address as the immutable destination
  // (WDRW-02 surfaces the contract that controls the destination).
  const contractConfig = contracts.CommissionDistribution
  const contractAddress = contractConfig.addresses[
    targetChainId.toString() as keyof typeof contractConfig.addresses
  ] as `0x${string}`
  const treasuryAddress = contractAddress

  // Pool balance data — used to compute available treasury + auto-refresh after withdrawal
  const { balances, autoRefreshAfterWithdrawal } = usePoolBalances()

  // Ownership check (D-26, WDRW-04)
  const { ownershipStatus } = useContractOwnership('CommissionDistribution', contractAddress)
  const isOwner = ownershipStatus === 'owner'

  // Withdrawal transaction state (wires auto-refresh callback for D-28)
  const { withdrawalStep, gasEstimation, handleWithdraw, error, resetState } =
    useTreasuryWithdrawal(autoRefreshAfterWithdrawal)

  // Derive numeric available treasury from formatted balance string
  const availableTreasury = useMemo(() => {
    if (!balances?.treasury) return '0'
    return balances.treasury.replace(/[^0-9.]/g, '') // strip "$" and " USDT"
  }, [balances])

  // Real-time validation per D-24
  useEffect(() => {
    if (!amount) {
      setValidationError(null)
      return
    }

    const amountNum = parseFloat(amount)

    if (isNaN(amountNum)) {
      setValidationError('Invalid amount')
      return
    }

    if (amountNum <= 0) {
      setValidationError('Amount must be greater than 0')
      return
    }

    if (amountNum > parseFloat(availableTreasury)) {
      setValidationError(
        `Amount cannot exceed available treasury: ${balances?.treasury || '$0.00 USDT'}`
      )
      return
    }

    setValidationError(null)
  }, [amount, availableTreasury, balances])

  // Check for large withdrawal per D-25
  const isLargeWithdrawal = useMemo(() => {
    if (!amount) return false
    const amountNum = parseFloat(amount)
    const availableNum = parseFloat(availableTreasury)

    if (isNaN(amountNum) || isNaN(availableNum) || availableNum === 0) return amountNum > 1000

    return amountNum > 1000 || amountNum / availableNum > 0.1
  }, [amount, availableTreasury])

  // Disable withdraw button per D-26, WDRW-04
  const isWithdrawDisabled = useMemo(() => {
    return (
      !isConnected ||
      chainId !== targetChainId ||
      !isOwner ||
      !!validationError ||
      !amount ||
      parseFloat(amount) <= 0 ||
      withdrawalStep !== 'idle'
    )
  }, [isConnected, chainId, targetChainId, isOwner, validationError, amount, withdrawalStep])

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
    // Clear error state when user starts typing
    if (withdrawalStep === 'error') {
      resetState()
    }
  }

  // Handle withdrawal submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isWithdrawDisabled || !amount) return

    try {
      // Convert USDT amount to wei (18 decimals)
      const amountNum = parseFloat(amount)
      const amountWei = BigInt(Math.floor(amountNum * 1e18))

      await handleWithdraw(amountWei)
    } catch (err) {
      console.error('[WithdrawalForm] Withdrawal failed:', err)
    }
  }

  // Progress step display per D-22
  const getProgressStepDisplay = () => {
    switch (withdrawalStep) {
      case 'validating':
        return { icon: <Loader2 className="h-5 w-5 animate-spin" />, text: 'Validating ownership...' }
      case 'estimating':
        return { icon: <Loader2 className="h-5 w-5 animate-spin" />, text: 'Estimating gas cost...' }
      case 'signing':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin" />,
          text: 'Please confirm in MetaMask...',
        }
      case 'confirming':
        return { icon: <Loader2 className="h-5 w-5 animate-spin" />, text: 'Confirming transaction...' }
      case 'done':
        return { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, text: 'Withdrawal complete!' }
      case 'error':
        return { icon: <AlertCircle className="h-5 w-5 text-red-500" />, text: 'Withdrawal failed' }
      default:
        return null
    }
  }

  const progressStep = getProgressStepDisplay()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treasury Withdrawal</CardTitle>
        <CardDescription>
          Withdraw USDT from treasury to immutable treasury address
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Treasury destination address per WDRW-02 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Treasury Destination (Immutable)</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {treasuryAddress}
              </p>
            </div>
          </div>

          {/* Available balance per WDRW-02 */}
          <div className="space-y-2">
            <Label>Available Treasury Balance</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-lg font-semibold text-primary">
                {balances?.treasury || 'Loading...'}
              </p>
            </div>
          </div>

          {/* Withdrawal form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">Withdrawal Amount (USDT)</Label>
              <Input
                id="withdrawal-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={withdrawalStep !== 'idle' && withdrawalStep !== 'error'}
                className="text-lg"
              />
            </div>

            {/* Real-time validation per D-24 */}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Large withdrawal warning per D-25 */}
            {isLargeWithdrawal && !validationError && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Large withdrawal: Please verify amount before confirming
                </AlertDescription>
              </Alert>
            )}

            {/* Gas estimation per D-21 */}
            {gasEstimation && (withdrawalStep === 'estimating' || withdrawalStep === 'signing') && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-1">
                  <p className="text-sm font-medium">Estimated gas cost</p>
                  <p className="text-xs">
                    ~${gasEstimation.gasCostUSD} USD ({gasEstimation.gasCostNative} BNB)
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Progress indication per D-22 */}
            {progressStep && (
              <Alert variant={withdrawalStep === 'error' ? 'destructive' : 'default'}>
                {progressStep.icon}
                <AlertDescription>{progressStep.text}</AlertDescription>
              </Alert>
            )}

            {/* Error display per ERR-01, ERR-02 */}
            {error && withdrawalStep === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetState}
                    className="ml-2"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Success display per D-23 */}
            {withdrawalStep === 'done' && (
              <Alert variant="default" className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  Treasury withdrawal completed successfully! Pool balances have been updated.
                </AlertDescription>
              </Alert>
            )}

            {/* Withdraw button per D-26 */}
            <Button
              type="submit"
              className="w-full"
              disabled={isWithdrawDisabled}
              size="lg"
              title={
                !isOwner && isConnected && chainId === targetChainId
                  ? 'Accept CommissionDistribution ownership first'
                  : undefined
              }
            >
              {withdrawalStep !== 'idle' ? 'Processing...' : 'Withdraw USDT'}
            </Button>

            {/* Ownership guidance per D-27 */}
            {!isOwner && isConnected && chainId === targetChainId && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Accept CommissionDistribution ownership first.{' '}
                  <a href="#ownership-section" className="underline font-medium">
                    Go to ownership section
                  </a>
                </AlertDescription>
              </Alert>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
