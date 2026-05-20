'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { createClient, getUser, restoreAuth } from '@/lib/pocketbase/client'
import { isNotFound } from '@/lib/pocketbase/error-handling'
import { Button } from '@/components/ui/button'
// Input and Label available for future form expansion
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Egg, Loader2, CheckCircle2, AlertCircle, ExternalLink, X, Sparkles } from 'lucide-react'
import Link from 'next/link'

const MINT_PRICE = 25
const BSCSCAN_BASE_URL = 'https://bscscan.com/tx'

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

  const safeTxHash = String(txHash || '')
  const safeEggId = String(eggId || '')
  const safeRaritySeed = String(raritySeed || '')
  const truncatedTxHash = `${safeTxHash.slice(0, 10)}...${safeTxHash.slice(-8)}`
  const bscScanUrl = `${BSCSCAN_BASE_URL}/${safeTxHash}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />

      <div className="relative clay-card bg-[var(--surface-container-high)] rounded-[2rem] p-8 max-w-md w-full shadow-clay-lg animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--surface-container)] transition-colors"
        >
          <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--primary-container)] rounded-full mb-4 shadow-clay-md">
            <Sparkles className="w-10 h-10 text-[var(--on-primary-container)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--on-surface)] font-headline">
            Egg Minted Successfully!
          </h2>
          <p className="text-[var(--on-surface-variant)] mt-1">
            Your egg is ready to hatch!
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--on-surface-variant)]">Egg ID</span>
            <span className="font-mono text-sm">{safeEggId.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--on-surface-variant)]">Token ID</span>
            <span className="font-bold text-[var(--primary)]">#{tokenId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--on-surface-variant)]">Rarity</span>
            <span className="text-sm font-medium text-[var(--tertiary)] capitalize">
              {safeRaritySeed || 'common'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--on-surface-variant)]">Food NFTs</span>
            <span className="text-[var(--tertiary)] font-bold">+{foodCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--on-surface-variant)]">Transaction</span>
            <a
              href={bscScanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
              title={safeTxHash}
            >
              {truncatedTxHash}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {hasReferral && (
            <div className="mt-2 pt-2 border-t border-[var(--outline-variant)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--tertiary)]" />
                <span className="text-sm text-[var(--tertiary)]">Referred mint - bonus earned!</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href={`/eggs?highlight=${safeEggId}`}
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

function ReferralBanner({ referrerName }: { referrerName: string }) {
  return (
    <div className="clay-card bg-green-50 border border-green-200 rounded-[1.5rem] p-4 flex items-center gap-3 shadow-clay-md">
      <span className="text-2xl">🎁</span>
      <p className="text-green-800 font-medium">
        Minting with referral from <strong>{referrerName}</strong>
      </p>
    </div>
  )
}

function MintPageContent() {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const pb = createClient()
  const searchParams = useSearchParams()

  const refCode = searchParams.get('ref')

  const isValidRefFormat = useMemo(() => {
    if (!refCode) return false
    return /^[A-Z2-9]{6,8}$/i.test(refCode)
  }, [refCode])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [referrerId, setReferrerId] = useState('')
  const [confirmationProgress, setConfirmationProgress] = useState<ConfirmationProgress>('idle')
  const [_tokenId, _setTokenId] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)
  const [referrerName, setReferrerName] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidRefFormat || !pb?.authStore?.token) return

    pb.collection('users')
      .getFirstListItem(`referral_code="${refCode?.toUpperCase()}"`)
      .then((referrer: any) => {
        setReferrerId(referrer.id)
        setReferrerName(referrer.name || referrer.email?.split('@')[0] || 'a friend')
      })
      .catch((err) => {
        console.warn('[Mint] Referrer lookup failed:', err)
      })
  }, [isValidRefFormat, refCode, pb?.authStore?.token])

  const [showMintedModal, setShowMintedModal] = useState(false)
  const [mintedEggData, setMintedEggData] = useState({
    eggId: '',
    tokenId: 0,
    raritySeed: '',
    txHash: '',
    foodCount: 3,
    hasReferral: false,
  })

  useEffect(() => {
    if (!isHydrated) return
    restoreAuth(pb).then((success) => {
      if (success) setUser(getUser())
      setAuthReady(true)
      if (!success) router.push('/auth/login')
    })
  }, [isHydrated, router])

  useEffect(() => {
    if (!isHydrated || !authReady || !user?.id) return

    const fetchBalance = async () => {
      try {
        const wallet = await pb.collection('user_wallets').getFirstListItem<UserWallet>(`user_id="${user.id}"`)
        setBalance(wallet.usdt_balance || 0)
      } catch (err) {
        if (isNotFound(err)) {
          console.warn('[Mint] No wallet record found for user, balance defaults to 0')
        } else {
          console.error('[Mint] Failed to fetch balance:', err)
        }
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
      if (referrerId && !referrerId.match(/^.{1,50}$/)) {
        throw new Error('Referrer name is too long (max 50 characters)')
      }

      const pb = createClient()
      const response = await fetch(`${pb.baseURL}/api/v2/mint-egg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({
          referrer_id: referrerId || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        let errorMessage = 'Mint transaction failed'

        if (result.error && typeof result.error === 'object') {
          const msg = result.error.message
          errorMessage = typeof msg === 'string' ? msg : JSON.stringify(result.error)
        } else if (typeof result.error === 'string') {
          errorMessage = result.error
        } else if (result.message) {
          errorMessage = typeof result.message === 'string'
            ? result.message
            : JSON.stringify(result.message)
        } else if (result.data?.error) {
          errorMessage = typeof result.data.error === 'string'
            ? result.data.error
            : JSON.stringify(result.data.error)
        }

        if (typeof errorMessage !== 'string') {
          errorMessage = String(errorMessage)
        }

        throw new Error(errorMessage)
      }

      const hash = result.data?.tx_hash || result.data?.txHash
      setTxHash(hash)
      setConfirmationProgress('waiting')

      const confirmed = await pollForConfirmation(hash)

      if (confirmed) {
        setConfirmationProgress('confirmed')
        const mintedEggId = String(result.data?.egg_id || result.data?.eggId || '')
        const mintedTokenId = result.data?.token_id || result.data?.tokenId || 0
        const mintedRaritySeed = String(result.data?.rarity_seed || result.data?.raritySeed || '')
        const mintedFoodCount = result.data?.food_count || result.data?.foodCount || 3

        setMintedEggData({
          eggId: mintedEggId,
          tokenId: mintedTokenId,
          raritySeed: mintedRaritySeed,
          txHash: hash,
          foodCount: mintedFoodCount,
          hasReferral: !!referrerId,
        })

        setShowMintedModal(true)

        setBalance((prev) => prev - MINT_PRICE)
      } else {
        setConfirmationProgress('error')
        setError('Transaction was not confirmed on-chain. Please check BSCScan for status.')
      }
    } catch (err: any) {
      setConfirmationProgress('error')
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const pollForConfirmation = (txHash: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0
      const maxAttempts = 24

      const poll = async () => {
        attempts++

        try {
          const pb = createClient()
          const result = await fetch(`${pb.baseURL}/api/v2/mint-status?tx_hash=${txHash}`).then(r => r.json())

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

  if (!isHydrated) {
    return (
      <LayoutWithoutNav>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      </LayoutWithoutNav>
    )
  }

  if (authReady && !user) {
    return null
  }

  const hasSufficientBalance = balance >= MINT_PRICE
  const bscScanUrl = txHash ? `${BSCSCAN_BASE_URL}/${txHash}` : null

  return (
    <LayoutWithoutNav>
      <div className="min-h-screen bg-[var(--surface)] px-4 py-8 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
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

          <div className="clay-card bg-[var(--surface-container)] rounded-[2rem] p-6 text-center shadow-clay-md">
            <p className="text-sm text-[var(--on-surface-variant)] mb-2">Mint Price</p>
            <p className="text-5xl font-bold text-[var(--primary)] font-headline">
              {MINT_PRICE} USDT
            </p>
          </div>

          {/* Referral Code Detection Display */}
          {refCode && (
            <div className="clay-card bg-[var(--surface-container)] rounded-[2rem] p-6 shadow-clay-md">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--tertiary-container)]">
                  <Sparkles className="w-5 h-5 text-[var(--on-tertiary-container)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--on-surface-variant)]">Referral Code</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-[var(--primary)] tracking-wider">{refCode.toUpperCase()}</span>
                    {referrerName ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--tertiary)] bg-[var(--tertiary-container)] px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : isValidRefFormat ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--on-surface-variant)] opacity-60">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--error)] bg-[var(--error-container)] px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Invalid
                      </span>
                    )}
                  </div>
                  {referrerName && (
                    <p className="text-xs text-[var(--on-surface-variant)] opacity-70 mt-1">
                      Referred by <span className="font-semibold">{referrerName}</span> — commission will be applied
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {referrerName && !loading && (
            <ReferralBanner referrerName={referrerName} />
          )}

          <div className="clay-card bg-[var(--surface-container)] rounded-[2rem] p-6 shadow-clay-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--on-surface-variant)] mb-1">Your Balance</p>
                <p className="text-2xl font-bold text-[var(--on-surface)] font-headline">
                  {balance.toFixed(2)} USDT
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/deposit')}
                className="px-4 py-2 bg-[var(--primary-container)] text-[var(--on-primary-container)] rounded-full text-sm font-bold hover:scale-105 transition-transform"
              >
                + Deposit
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-2xl bg-[var(--error-container)] border-none shadow-clay-md">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-[var(--on-error-container)]">
                {error}
              </AlertDescription>
            </Alert>
          )}

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
                      TX: {String(txHash).slice(0, 10)}...{String(txHash).slice(-8)}
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

          <Button
            onClick={handleMint}
            disabled={loading || !hasSufficientBalance || confirmationProgress === 'waiting'}
            className="w-full py-6 rounded-2xl font-bold text-lg clay-button bg-[var(--primary-container)] text-[var(--on-primary-container)] hover:scale-[1.02] active:scale-95 transition-all shadow-clay-md disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                {confirmationProgress === 'preparing' && 'Preparing...'}
                {confirmationProgress === 'waiting' && 'Waiting for confirmation...'}
                {confirmationProgress === 'idle' && 'Minting...'}
              </>
            ) : !hasSufficientBalance ? (
              'Insufficient Balance'
            ) : (
              <>
                <Egg className="w-6 h-6 mr-2" />
                Mint Egg NFT
              </>
            )}
          </Button>

          <p className="text-center text-sm text-[var(--on-surface-variant)] opacity-50">
            Powered by BNB Chain • Secure smart contract
          </p>
        </div>
      </div>

      <MintedEggModal
        isOpen={showMintedModal}
        eggId={mintedEggData.eggId}
        tokenId={mintedEggData.tokenId}
        raritySeed={mintedEggData.raritySeed}
        txHash={mintedEggData.txHash}
        foodCount={mintedEggData.foodCount}
        hasReferral={mintedEggData.hasReferral}
        onDismiss={() => setShowMintedModal(false)}
      />
    </LayoutWithoutNav>
  )
}

export default function MintPage() {
  return (
    <Suspense fallback={
      <LayoutWithoutNav>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      </LayoutWithoutNav>
    }>
      <MintPageContent />
    </Suspense>
  )
}