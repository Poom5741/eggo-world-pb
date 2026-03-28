'use client'

import { useState } from 'react'
import { createClient, getUser } from '@/lib/pocketbase/client'

interface WalletModalProps {
  profile: any
  onClose: () => void
  onTransactionSubmitted?: () => void
}

const RECIPIENT_WALLET = '0xdEf0d71cD65aCFfD54fdf03B0128E14f8d97a60e'
const REQUIRED_AMOUNT = 25

export default function WalletModal({ profile, onClose, onTransactionSubmitted }: WalletModalProps) {
  const [txHash, setTxHash] = useState('')
  const [receiverWallet, setReceiverWallet] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(RECIPIENT_WALLET)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!txHash.trim()) {
      setError('PLEASE ENTER A TRANSACTION HASH OR BSCSCAN URL')
      return
    }

    if (!receiverWallet.trim()) {
      setError('PLEASE ENTER YOUR WALLET ADDRESS TO RECEIVE THE NFT')
      return
    }

    let rawHash = txHash.trim()
    
    const bscScanMatch = rawHash.match(/(?:bscscan\.com|testnet\.bscscan\.com)\/tx\/(0x[a-fA-F0-9]{64})/)
    if (bscScanMatch) {
      rawHash = bscScanMatch[1]
    } else if (rawHash.startsWith('0x')) {
      rawHash = rawHash.split(/[?#]/)[0]
    }

    if (!rawHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      setError('INVALID TRANSACTION HASH FORMAT — MUST BE 0x FOLLOWED BY 64 HEX CHARACTERS')
      return
    }

    if (!receiverWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('INVALID WALLET ADDRESS — MUST BE A VALID 0x ETHEREUM/BSC ADDRESS')
      return
    }

    setIsSubmitting(true)

    try {
      const pb = createClient()
      const user = getUser()

      if (!user) throw new Error('USER NOT FOUND')

      await pb.collection('transactions').create({
        user_id: user.id,
        tx_hash: rawHash,
        amount: REQUIRED_AMOUNT,
        status: 'pending',
        network: 'bsc',
      })

      await pb.collection('users').update(user.id, {
        wallet_address: receiverWallet,
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
        onTransactionSubmitted?.()
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'AN ERROR OCCURRED')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card border-4 border-primary overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-primary/40">
          <h2 className="font-[var(--font-pixel)] text-sm text-primary">PURCHASE EGG NFT</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground font-[var(--font-pixel)] text-xs px-2 py-1 border-2 border-primary/30 hover:border-primary transition-all"
          >
            X
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="step-indicator">1</span>
              <p className="font-[var(--font-pixel)] text-xs text-foreground">SEND USDT TO THIS WALLET</p>
            </div>

            <div className="bg-background border-2 border-primary/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="label">AMOUNT</span>
                <span className="font-[var(--font-pixel)] text-sm text-primary font-bold">{REQUIRED_AMOUNT} USDT</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="label">NETWORK</span>
                <span className="font-[var(--font-pixel)] text-xs text-foreground">BSC (BEP20)</span>
              </div>
              <div className="space-y-1">
                <span className="label">DESTINATION WALLET</span>
                <div className="flex items-stretch gap-2 mt-1">
                  <div className="flex-1 bg-secondary border-2 border-primary/30 p-2 overflow-x-auto">
                    <p className="font-mono text-[10px] text-foreground whitespace-nowrap">{RECIPIENT_WALLET}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-[var(--font-pixel)] text-[9px] px-3 border-2 border-primary transition-all flex-shrink-0"
                  >
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>
            </div>

            <div className="info-warning">
              <p className="font-[var(--font-pixel)] text-[9px] text-amber-400 leading-relaxed">
                ONLY SEND USDT ON BINANCE SMART CHAIN (BEP20). SENDING ON OTHER NETWORKS WILL RESULT IN LOSS OF FUNDS.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="step-indicator">2</span>
              <p className="font-[var(--font-pixel)] text-xs text-foreground">SUBMIT YOUR TRANSACTION</p>
            </div>

            <div className="space-y-2">
              <label className="label">
                TRANSACTION HASH OR BSCSCAN URL
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x... or https://bscscan.com/tx/0x..."
                disabled={isSubmitting || success}
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <label className="label">
                YOUR WALLET ADDRESS (TO RECEIVE NFT)
              </label>
              <input
                type="text"
                value={receiverWallet}
                onChange={(e) => setReceiverWallet(e.target.value)}
                placeholder="0x..."
                disabled={isSubmitting || success}
                className="input-field"
              />
              <p className="font-[var(--font-pixel)] text-[8px] text-muted-foreground">
                THE NFT WILL BE SENT TO THIS ADDRESS AFTER VERIFICATION
              </p>
            </div>

            {error && (
              <div className="info-error">
                <p className="font-[var(--font-pixel)] text-[9px] text-accent">{error}</p>
              </div>
            )}

            {success && (
              <div className="info-success">
                <p className="font-[var(--font-pixel)] text-[9px] text-green-400">
                  TRANSACTION SUBMITTED! OUR TEAM WILL VERIFY AND SEND YOUR NFT SHORTLY.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'SUBMITTING...' : success ? 'SUBMITTED!' : 'SUBMIT TRANSACTION'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}