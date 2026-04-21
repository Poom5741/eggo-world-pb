'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { createClient, isAuthenticated, getUser } from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Egg, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

const MINT_PRICE = 25
const WALLET_API_URL = process.env.NEXT_PUBLIC_WALLET_API_URL || 'http://localhost:3001'
const BSCSCAN_BASE_URL = 'https://rpc.0xl3.com/tx'
const DEFAULT_EGG_NFT_ADDRESS = process.env.NEXT_PUBLIC_EGG_NFT_ADDRESS || ''

type ConfirmationProgress = 'idle' | 'preparing' | 'waiting' | 'confirmed' | 'error'

interface UserWallet {
  id: string
  user_id: string
  usdt_balance: number
  wallet_address: string
}

export default function MintPage() {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const pb = createClient()

  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [referrerId, setReferrerId] = useState('')
  const [confirmationProgress, setConfirmationProgress] = useState<ConfirmationProgress>('idle')
  const [tokenId, setTokenId] = useState<number | null>(null)

  // Get authenticated user (after hydration)
  const user = isHydrated ? getUser() : null

  // Auth check - redirect to login if not authenticated
  useEffect(() => {
    if (isHydrated && !isAuthenticated()) {
      router.push('/auth/login')
    }
  }, [isHydrated, router])

  // Fetch user's USDT balance
  useEffect(() => {
    if (!isHydrated || !user?.id) return

    const fetchBalance = async () => {
      try {
        const wallet = await pb.collection('user_wallets').getFirstListItem<UserWallet>(`user_id="${user.id}"`)
        setBalance(wallet.usdt_balance || 0)
      } catch (err) {
        console.error('[Mint] Failed to fetch balance:', err)
        // Balance defaults to 0, which will disable mint button
      }
    }

    fetchBalance()
  }, [isHydrated, user?.id, pb.collection])

  const handleMint = async () => {
    if (!user?.id || !user?.wallet) {
      setError('User wallet not found')
      return
    }

    setLoading(true)
    setError(null)
    setTxHash(null)
    setConfirmationProgress('preparing')

    try {
      // Validate referrer ID format if provided (PocketBase user ID pattern)
      if (referrerId && !referrerId.match(/^[a-z0-9]+$/)) {
        throw new Error('Invalid referrer ID format')
      }

      // Call wallet-api mint endpoint
      const response = await fetch(`${WALLET_API_URL}/mint-egg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          wallet: user.wallet,
          eggId: 1, // Default egg ID (configurable later)
          eggNftAddress: DEFAULT_EGG_NFT_ADDRESS,
          referrerAddress: referrerId || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || result.message || 'Mint transaction failed')
      }

      // Transaction submitted successfully
      const hash = result.data?.txHash || result.txHash
      setTxHash(hash)
      setConfirmationProgress('waiting')

      // Poll for confirmation status (12 blocks on BSC)
      const confirmed = await pollForConfirmation(hash)

      if (confirmed) {
        setConfirmationProgress('confirmed')
        // Extract tokenId if available
        if (result.data?.eggId) {
          setTokenId(result.data.eggId)
        }

        // Redirect to /eggs after 3 seconds
        setTimeout(() => {
          const highlightId = tokenId || result.data?.eggId || ''
          router.push(`/eggs?highlight=${highlightId}`)
        }, 3000)
      } else {
        throw new Error('Transaction confirmation timed out')
      }
    } catch (err: any) {
      console.error('[Mint] Error:', err)
      setError(err.message || 'Failed to mint egg')
      setConfirmationProgress('error')
    } finally {
      setLoading(false)
    }
  }

  // Poll wallet-api for transaction confirmation (12 blocks)
  const pollForConfirmation = async (hash: string): Promise<boolean> => {
    const maxAttempts = 24 // 24 * 5s = 2 minutes (12 blocks on BSC ≈ 36s, buffer for safety)
    let attempts = 0

    return new Promise((resolve) => {
      const poll = async () => {
        attempts++

        try {
          const response = await fetch(`${WALLET_API_URL}/tx-status/${hash}`)
          const result = await response.json()

          if (result.confirmed || result.status === 'confirmed') {
            resolve(true)
            return
          }

          if (attempts >= maxAttempts) {
            resolve(false)
            return
          }

          // Update progress with block confirmations if available
          const confirmations = result.confirmations || 0
          console.log(`[Mint] Confirmations: ${confirmations}/12`)
        } catch (err) {
          console.warn('[Mint] Poll error:', err)
        }

        setTimeout(poll, 5000)
      }

      poll()
    })
  }

  // Show loading state while checking hydration
  if (!isHydrated) {
    return (
      <LayoutWithoutNav>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      </LayoutWithoutNav>
    )
  }

  // Don't render if not authenticated (useEffect will redirect)
  if (!isAuthenticated()) {
    return null
  }

  const hasSufficientBalance = balance >= MINT_PRICE
  const bscScanUrl = txHash ? `${BSCSCAN_BASE_URL}/${txHash}` : null

  return (
    <LayoutWithoutNav>
      <div className="min-h-screen bg-[var(--surface)] px-4 py-8 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[var(--primary-container)] rounded-[2rem] shadow-clay-md mb-4">
              <Egg className="w-12 h-12 text-[var(--on-primary-container)]" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--on-surface)] font-headline">
              Mint Your Egg NFT
            </h1>
            <p className="text-[var(--on-surface-variant)] opacity-70">
              Start your collection with this exclusive NFT membership
            </p>
          </div>

          {/* Mint Price Card */}
          <div className="clay-card bg-[var(--surface-container)] rounded-[2rem] p-6 text-center shadow-clay-md">
            <p className="text-sm text-[var(--on-surface-variant)] mb-2">Mint Price</p>
            <p className="text-5xl font-bold text-[var(--primary)] font-headline">
              {MINT_PRICE} USDT
            </p>
          </div>

          {/* Balance Card */}
          <div className="clay-card bg-[var(--surface-container)] rounded-[2rem] p-6 shadow-clay-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--on-surface-variant)] mb-1">Your Balance</p>
                <p className={`text-2xl font-bold font-headline ${hasSufficientBalance ? 'text-[var(--tertiary)]' : 'text-[var(--error)]'}`}>
                  {balance.toFixed(2)} USDT
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl text-sm font-bold ${hasSufficientBalance ? 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]' : 'bg-[var(--error-container)] text-[var(--on-error-container)]'}`}>
                {hasSufficientBalance ? '✓ Sufficient' : '✗ Insufficient'}
              </div>
            </div>
          </div>

          {/* Referrer ID Input */}
          <div className="clay-card bg-[var(--surface-container)] rounded-[2rem] p-6 space-y-4 shadow-clay-md">
            <div className="space-y-2">
              <Label htmlFor="referrer" className="text-[var(--on-surface-variant)] font-bold">
                Referrer ID (Optional)
              </Label>
              <Input
                id="referrer"
                placeholder="Enter referrer user ID"
                value={referrerId}
                onChange={(e) => setReferrerId(e.target.value)}
                className="clay-input rounded-2xl border-[var(--outline-variant)] bg-[var(--surface-bright)] text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]/50"
                disabled={loading}
              />
              <p className="text-xs text-[var(--on-surface-variant)] opacity-70">
                Enter the ID of the user who referred you (optional)
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="rounded-2xl bg-[var(--error-container)] border-none shadow-clay-md">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-[var(--on-error-container)]">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Transaction Progress */}
          {confirmationProgress !== 'idle' && confirmationProgress !== 'error' && (
            <div className="clay-card bg-[var(--surface-container)] rounded-[2rem] p-6 space-y-4 shadow-clay-md">
              <div className="flex items-center gap-3">
                <Loader2 className={`w-6 h-6 animate-spin text-[var(--primary)] ${confirmationProgress === 'confirmed' ? 'hidden' : ''}`} />
                <CheckCircle2 className={`w-6 h-6 text-[var(--tertiary)] ${confirmationProgress === 'confirmed' ? '' : 'hidden'}`} />
                <div className="flex-1">
                  <p className="font-bold text-[var(--on-surface)]">
                    {confirmationProgress === 'preparing' && 'Preparing transaction...'}
                    {confirmationProgress === 'waiting' && 'Waiting for confirmation (0/12 blocks)...'}
                    {confirmationProgress === 'confirmed' && 'Confirmed!'}
                  </p>
                  {txHash && (
                    <p className="text-xs text-[var(--on-surface-variant)] opacity-70 mt-1 font-mono">
                      TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </p>
                  )}
                </div>
              </div>
              {confirmationProgress === 'confirmed' && bscScanUrl && (
                <a
                  href={bscScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                >
                  View on BSCScan <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* Mint Button */}
          <Button
            onClick={handleMint}
            disabled={loading || !hasSufficientBalance || confirmationProgress === 'waiting'}
            className="w-full py-6 rounded-2xl font-bold text-lg clay-button bg-[var(--primary-container)] text-[var(--on-primary-container)] hover:scale-[1.02] active:scale-95 transition-all shadow-clay-md disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {confirmationProgress === 'preparing' ? 'Preparing...' : 'Minting...'}
              </>
            ) : !hasSufficientBalance ? (
              'Insufficient Balance'
            ) : (
              <>
                <Egg className="w-5 h-5 mr-2" />
                Mint Egg for {MINT_PRICE} USDT
              </>
            )}
          </Button>

          {/* Info */}
          <div className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)] opacity-70 justify-center">
            <CheckCircle2 className="w-4 h-4 text-[var(--tertiary)]" />
            <span>Egg NFT will be minted to your wallet automatically</span>
          </div>
        </div>
      </div>
    </LayoutWithoutNav>
  )
}
