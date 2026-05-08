'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { createClient, getUser, restoreAuth } from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Egg, Loader2, CheckCircle2, AlertCircle, ExternalLink, X, Sparkles } from 'lucide-react'
import Link from 'next/link'

const MINT_PRICE = 25
const BSCSCAN_BASE_URL = 'https://rpc.0xl3.com/tx'

// MintedEggModal Component
function MintedEggModal({
  isOpen,
  eggId,
  tokenId,
  raritySeed,
  txHash,
  foodCount,
  hasReferral,
  onDismiss,
}: {
  isOpen: boolean
  eggId: string
  tokenId: number
  raritySeed: string
  txHash: string
  foodCount: number
  hasReferral: boolean
  onDismiss: () => void
}) {
  if (!isOpen) return null

  const truncatedTxHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`
  const bscScanUrl = `${BSCSCAN_BASE_URL}/${txHash}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />
      
      {/* Modal */}
      <div className="relative clay-card bg-[var(--surface-container-high)] rounded-[2rem] p-8 max-w-md w-full shadow-clay-lg animate-in fade-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--surface-container)] transition-colors"
        >
          <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--primary-container)] rounded-full mb-4 shadow-clay-md">
            <Sparkles className="w-10 h-10 text-[var(--on-primary-container)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--on-surface)] font-headline">
            Egg Minted Successfully!
          </h2>
          <p className="text-[var(--on-surface-variant)] mt-1">
            Your new egg NFT is on its way
          </p>
        </div>

        {/* Egg Details */}
        <div className="space-y-4 mb-6">
          <div className="clay-card-inner bg-[var(--surface-container-low)] rounded-2xl p-4 space-y-3">
            {/* Egg ID */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--on-surface-variant)]">Egg ID</span>
              <span className="font-mono text-[var(--on-surface)]">{eggId.slice(0, 8)}...</span>
            </div>
            
            {/* Token ID */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--on-surface-variant)]">Token ID</span>
              <span className="font-mono text-[var(--on-surface)]">#{tokenId}</span>
            </div>
            
            {/* Rarity */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--on-surface-variant)]">Rarity Seed</span>
              <span className="font-mono text-[var(--on-surface)]">{raritySeed.slice(0, 8)}...</span>
            </div>
            
            {/* Food NFT */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--on-surface-variant)]">Food NFTs</span>
              <span className="text-[var(--tertiary)] font-bold">+{foodCount}</span>
            </div>
            
            {/* Transaction */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--on-surface-variant)]">Transaction</span>
              <a
                href={bscScanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
                title={txHash}
              >
                {truncatedTxHash}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Referral badge */}
            {hasReferral && (
              <div className="mt-2 pt-2 border-t border-[var(--outline-variant)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--tertiary)]" />
                  <span className="text-sm text-[var(--tertiary)]">Referred mint - bonus earned!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={`/eggs?highlight=${eggId}`}
            className="block w-full py-4 rounded-2xl font-bold text-lg text-center clay-button bg-[var(--primary-container)] text-[var(--on-primary-container)] hover:scale-[1.02] active:scale-95 transition-all shadow-clay-md"
            onClick={onDismiss}
          >
            <Egg className="w-5 h-5 inline mr-2" />
            View My Eggs
          </Link>
          <a
            href={bscScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-[var(--primary)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container)] transition-colors"
          >
            View on BSCScan
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}

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
  const [_tokenId, setTokenId] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)

  // MintedEggModal state
  const [showMintedModal, setShowMintedModal] = useState(false)
  const [mintedEggData, setMintedEggData] = useState({
    eggId: '',
    tokenId: 0,
    raritySeed: '',
    txHash: '',
    hasReferral: false,
  })

  // Auth check - restore auth after hydration (matching eggs/animals pattern)
  useEffect(() => {
    if (!isHydrated) return
    restoreAuth(pb).then((success) => {
      if (success) setUser(getUser())
      setAuthReady(true)
      if (!success) router.push('/auth/login')
    })
  }, [isHydrated, router])

  // Fetch user's USDT balance
  useEffect(() => {
    if (!isHydrated || !authReady || !user?.id) return

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

      // Call PocketBase mint-egg hook (PB internally calls wallet-api)
      const pb = createClient()
      const response = await fetch(`${pb.baseURL}/api/v2/mint-egg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token,
        },
        body: JSON.stringify({
          referrer_id: referrerId || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Robust error message extraction
        let errorMessage = 'Mint transaction failed'
        
        if (result.error && typeof result.error === 'object') {
          // Backend returned { error: { message: "...", code: "..." } }
          const msg = result.error.message
          errorMessage = typeof msg === 'string' ? msg : JSON.stringify(result.error)
        } else if (typeof result.error === 'string') {
          // Backend returned { error: "..." }
          errorMessage = result.error
        } else if (result.message) {
          // Fallback to result.message
          errorMessage = typeof result.message === 'string' 
            ? result.message 
            : JSON.stringify(result.message)
        } else if (result.data?.error) {
          // Error might be in data.error
          errorMessage = typeof result.data.error === 'string'
            ? result.data.error
            : JSON.stringify(result.data.error)
        }
        
        // Ensure errorMessage is a string
        if (typeof errorMessage !== 'string') {
          errorMessage = String(errorMessage)
        }
        
        throw new Error(errorMessage)
      }

      // Transaction submitted successfully — PocketBase returns snake_case fields
      const hash = result.data?.tx_hash || result.data?.txHash
      setTxHash(hash)
      setConfirmationProgress('waiting')

      // Poll for confirmation status
      const confirmed = await pollForConfirmation(hash)

      if (confirmed) {
        setConfirmationProgress('confirmed')
        // Extract egg data from response
        const mintedEggId = result.data?.egg_id || result.data?.eggId || ''
        const mintedTokenId = result.data?.token_id || result.data?.tokenId || 0
        const mintedRaritySeed = result.data?.rarity_seed || result.data?.raritySeed || ''
        const mintedTxHash = hash || ''
        const mintedHasReferral = !!(result.data?.referral_applied || referrerId)

        if (mintedEggId) {
          setTokenId(mintedTokenId)
        }

        // Set modal data and show modal instead of auto-redirect
        setMintedEggData({
          eggId: mintedEggId,
          tokenId: mintedTokenId,
          raritySeed: mintedRaritySeed,
          txHash: mintedTxHash,
          hasReferral: mintedHasReferral,
        })
        setShowMintedModal(true)

        // Auto-dismiss modal and redirect after 3 seconds (only if not manually dismissed)
        setTimeout(() => {
          if (showMintedModal) {
            router.push(`/eggs?highlight=${mintedEggId}`)
          }
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

  // Poll PocketBase tx-status for confirmation
  const pollForConfirmation = async (hash: string): Promise<boolean> => {
    const maxAttempts = 24 // 24 * 5s = 2 minutes
    let attempts = 0
    const pb = createClient()

    return new Promise((resolve) => {
      const poll = async () => {
        attempts++

        try {
          const response = await fetch(`${pb.baseURL}/api/v2/tx-status/${hash}`, {
            headers: { 'Authorization': pb.authStore.token },
          })
          const result = await response.json()

          if (result.confirmed || result.status === 'confirmed') {
            resolve(true)
            return
          }

          if (attempts >= maxAttempts) {
            resolve(false)
            return
          }

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
  if (authReady && !user) {
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

      {/* Minted Egg Success Modal */}
      <MintedEggModal
        isOpen={showMintedModal}
        eggId={mintedEggData.eggId}
        tokenId={mintedEggData.tokenId}
        raritySeed={mintedEggData.raritySeed}
        txHash={mintedEggData.txHash}
        foodCount={2}
        hasReferral={mintedEggData.hasReferral}
        onDismiss={() => {
          setShowMintedModal(false)
          router.push(`/eggs?highlight=${mintedEggData.eggId}`)
        }}
      />
    </LayoutWithoutNav>
  )
}
