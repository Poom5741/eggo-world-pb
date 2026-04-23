"use client"

import { useState } from 'react'
import { createClient } from '@/lib/pocketbase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface WithdrawFormProps {
  balance: string
}

/**
 * Withdraw form component
 * ฟอร์มสำหรับทำเรื่องถอนเงิน USDT
 */
export function WithdrawForm({ balance }: WithdrawFormProps) {
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate amount
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount. Please enter a valid number.')
      }
      if (amountNum > parseFloat(balance)) {
        throw new Error('Insufficient balance. You cannot withdraw more than your available balance.')
      }
      if (!address || address.trim().length === 0) {
        throw new Error('Withdrawal address is required.')
      }
      if (!address.startsWith('0x') || address.length !== 42) {
        throw new Error('Invalid address. Please enter a valid BSC address (0x...).')
      }

      // Get auth token
      const pb = createClient()
      const user = pb.authStore.record

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create withdrawal request in PocketBase
      await pb.collection('withdrawal_requests').create({
        user: user.id,
        amount: amountNum,
        address: address.trim(),
        status: 'pending'
      })

      setSuccess(true)
      setAmount('')
      setAddress('')
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-4 border-primary/50 bg-card">
      <CardHeader>
        <CardTitle className="font-body text-lg text-foreground">
          WITHDRAW USDT
        </CardTitle>
        <CardDescription className="font-body text-xs text-muted-foreground">
          Request withdrawal to your external wallet
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-body text-xs text-foreground">
              AMOUNT (USDT)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              max={balance}
              className="font-body text-xs border-2 border-primary/50 bg-background"
            />
            <p className="font-body text-xs text-muted-foreground">
              Available: {balance} USDT
            </p>
          </div>

          {/* Address Input */}
          <div className="space-y-2">
            <Label htmlFor="address" className="font-body text-xs text-foreground">
              WITHDRAWAL ADDRESS
            </Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="font-body text-xs border-2 border-primary/50 bg-background"
            />
            <p className="font-body text-xs text-muted-foreground">
              Enter your BSC wallet address (0x...)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-body text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="bg-primary/20 border-primary">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="font-body text-xs">
                Withdrawal request submitted! Processing time: 24-48 hours.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={loading || !amount || !address}
            className="w-full font-body text-sm h-12 border-4 border-primary/50 hover:border-primary transition-colors"
          >
            {loading ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                PROCESSING...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                WITHDRAW
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
