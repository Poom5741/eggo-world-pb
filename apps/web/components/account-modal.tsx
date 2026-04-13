'use client'

import { useEffect, useState } from 'react'
import { createClient, getUser } from '@/lib/pocketbase/client'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { useRouter } from 'next/navigation'
import { Copy, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

interface BalanceData {
  usdt_balance: number
  withdrawable: number
  total_withdrawn: number
}

function truncateWallet(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const [balance, setBalance] = useState<BalanceData | null>(null)

  const user = isHydrated ? getUser() : null
  const pb = isHydrated ? createClient() : null

  useEffect(() => {
    if (!isOpen || !user?.wallet || !pb?.authStore.token) return

    const fetchBalance = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pb.eggoworld.io'

      try {
        const response = await fetch(
          `${baseUrl}/api/v2/hot-wallet/balance`,
          {
            method: 'POST',
            headers: {
              Authorization: pb.authStore.token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_address: user.wallet }),
          }
        )
        const data = await response.json()
        if (data.success && data.data) {
          setBalance(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      }
    }

    fetchBalance()
  }, [isOpen, user?.wallet, pb])

  if (!isHydrated) return null
  if (!isOpen) return null

  const handleCopy = async () => {
    if (user?.wallet) {
      await navigator.clipboard.writeText(user.wallet)
    }
  }

  const handleDeposit = () => {
    router.push('/dashboard/deposit')
  }

  const handleWithdraw = () => {
    router.push('/dashboard/withdraw')
  }

  const formattedBalance = balance
    ? balance.usdt_balance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        variant="clay"
        className="w-full max-w-md font-[var(--font-pixel)]"
        data-testid="modal-content"
      >
        <div
          data-testid="modal-overlay"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
        <DialogHeader className="relative">
          <DialogTitle className="text-primary flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Account
          </DialogTitle>
          <DialogDescription className="sr-only">
            View your account balance and wallet information
          </DialogDescription>
        </DialogHeader>
        <div className="relative space-y-6">
          <div className="space-y-2">
            <div className="text-xs text-foreground/80">Wallet Address</div>
            <div className="flex items-center gap-2 p-3 bg-primary/5 border-2 border-primary/20 rounded">
              <code className="text-xs text-primary flex-1 truncate font-mono">
                {truncateWallet(user?.wallet || '')}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10"
                onClick={handleCopy}
                role="button"
                aria-label="copy"
              >
                <Copy className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-foreground/80">USDT Balance</div>
            <div className="p-4 bg-secondary/20 border-2 border-secondary/30 rounded text-center">
              <div className="text-3xl text-primary font-bold">
                {formattedBalance} <span className="text-lg">USDT</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="clay"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-[var(--font-pixel)] text-xs py-3"
              onClick={handleDeposit}
              role="button"
              aria-label="deposit"
            >
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Deposit
            </Button>
            <Button
              variant="clay-outline"
              className="flex-1 bg-background hover:bg-secondary/20 text-foreground font-[var(--font-pixel)] text-xs py-3 border-primary/30"
              onClick={handleWithdraw}
              role="button"
              aria-label="withdraw"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
