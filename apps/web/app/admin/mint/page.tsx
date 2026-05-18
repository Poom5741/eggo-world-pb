'use client'

import { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/pocketbase/client'
import LayoutWrapper from '@/components/LayoutWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AdminMintPage() {
  return (
    <AuthGuard requireAdmin redirectTo="/auth/login">
      {() => <AdminMintContent />}
    </AuthGuard>
  )
}

function AdminMintContent() {
  const pb = createClient()

  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    egg_id: string
    token_id: number
    tx_hash: string
  } | null>(null)

  const handleMint = async () => {
    if (!userId.trim()) {
      setError('Please enter a user ID')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    setResult(null)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/v2/admin/mint-egg`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${pb.authStore.token}`,
          },
          body: JSON.stringify({ user_id: userId.trim() }),
        }
      )
      const data = await res.json()

      if (data.success) {
        setMessage('Egg minted successfully!')
        setResult(data.data)
      } else {
        setError(data.error?.message || 'Mint failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-pixel-style text-primary mb-2">
          Admin Free Mint
        </h1>
        <p className="text-on-surface-variant mb-8">
          Mint an Egg NFT to any user without charging USDT
        </p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Mint Form */}
          <Card>
            <CardHeader>
              <CardTitle>Mint Egg NFT</CardTitle>
              <CardDescription>
                Enter the user ID to mint a free egg to their wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter PocketBase user ID..."
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleMint}
                  disabled={loading || !userId.trim()}
                >
                  {loading ? 'Minting...' : 'Mint Free Egg'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mint Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Mint Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Egg ID:</span>
                    <span className="font-mono">{result.egg_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Token ID:</span>
                    <span className="font-mono">{result.token_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">TX Hash:</span>
                    <span className="font-mono text-xs break-all max-w-[60%] text-right">
                      {result.tx_hash}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </LayoutWrapper>
  )
}
