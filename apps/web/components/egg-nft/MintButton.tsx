"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Egg, Loader2, Wallet } from 'lucide-react'

interface MintButtonProps {
  onMint: () => Promise<void>
  disabled?: boolean
  balance?: number
  price?: number
}

export function MintButton({ onMint, disabled = false, balance = 0, price = 25 }: MintButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onMint()
    } finally {
      setLoading(false)
    }
  }

  const canAfford = balance >= price
  const buttonText = !canAfford 
    ? 'INSUFFICIENT BALANCE'
    : loading 
      ? 'MINTING...' 
      : `MINT EGG (${price} USDT)`

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading || !canAfford}
      className="w-full font-[var(--font-pixel)] text-sm h-12 border-4 border-primary/50 hover:border-primary transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          MINTING...
        </>
      ) : !canAfford ? (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          INSUFFICIENT BALANCE
        </>
      ) : (
        <>
          <Egg className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  )
}
