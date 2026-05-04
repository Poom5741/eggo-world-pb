'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/pocketbase/client'
import LayoutWrapper from '@/components/LayoutWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Shield, Power, PowerOff, Loader2, TrendingUp, Link } from 'lucide-react'

export default function MarketplaceControlPage() {
  return (
    <AuthGuard requireAdmin redirectTo="/auth/login">
      {() => <MarketplaceControlContent />}
    </AuthGuard>
  )
}

function MarketplaceControlContent() {
  const router = useRouter()
  const pb = createClient()
  
  const [platformPaused, setPlatformPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revenue, setRevenue] = useState({ totalUsdt: 0, transactionCount: 0 })
  
  useEffect(() => {
    loadPlatformStatus()
    loadRevenueStats()
  }, [])

  async function loadRevenueStats() {
    try {
      const logs = await pb.collection('transaction_logs').getList(1, 1000, {
        filter: 'status = "success"',
        sort: '-created'
      })
      
      const totalUsdt = logs.items.reduce((sum: number, log: any) => {
        return sum + (log.amount || 0)
      }, 0)
      
      setRevenue({
        totalUsdt,
        transactionCount: logs.items.length
      })
    } catch (err) {
      console.error('Failed to load revenue stats:', err)
    }
  }

  async function loadPlatformStatus() {
    try {
      const token = pb.authStore.token
      const response = await fetch(`${pb.baseURL}/api/v2/platform/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to load status')
      
      const data = await response.json()
      setPlatformPaused(data.data?.paused || false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function togglePlatform(action: 'pause' | 'unpause') {
    setActionInProgress(action)
    setError(null)
    
    try {
      const token = pb.authStore.token
      const response = await fetch(`${pb.baseURL}/api/v2/platform/${action}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })
      
      if (!response.ok) throw new Error(`Failed to ${action} platform`)
      
      const _data = await response.json()
      
      setPlatformPaused(action === 'pause')
      
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionInProgress(null)
    }
  }

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Skeleton className="h-8 w-8 animate-spin" />
        </div>
      </LayoutWrapper>
    )
  }
  
  return (
    <LayoutWrapper>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Marketplace Controls
          </h1>
          <p className="text-muted-foreground mt-2">
            Emergency platform management controls
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Platform Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Marketplace State</span>
              <Badge variant={platformPaused ? "destructive" : "default"}>
                {platformPaused ? "PAUSED" : "ACTIVE"}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-1">
                <label className="text-sm font-medium">Pause Marketplace</label>
                <p className="text-xs text-muted-foreground">
                  Temporarily disable all marketplace operations
                </p>
              </div>
              
              {actionInProgress ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Switch
                  checked={platformPaused}
                  onCheckedChange={(checked) => togglePlatform(checked ? 'pause' : 'unpause')}
                  aria-label="Toggle marketplace pause state"
                />
              )}
            </div>

            {!actionInProgress && (
              <div className="flex gap-2 pt-4 border-t">
                {!platformPaused && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => togglePlatform('pause')}
                  >
                    <PowerOff className="w-4 h-4 mr-2" />
                    Pause Now
                  </Button>
                )}
                {platformPaused && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => togglePlatform('unpause')}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Unpause Now
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Alert className="mt-6">
          <AlertDescription className="text-sm">
            These controls affect all users. Use with caution and only during emergencies or maintenance windows.
          </AlertDescription>
        </Alert>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Stats
            </CardTitle>
            <CardDescription>Platform revenue from successful transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total USDT Volume</p>
                <p className="text-2xl font-bold text-green-600">{revenue.totalUsdt.toLocaleString()} USDT</p>
              </div>
              <div className="bg-surface-container rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{revenue.transactionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/monitoring')}>
            <Link className="w-4 h-4 mr-2" />
            Monitoring Dashboard
          </Button>
        </div>
      </div>
    </LayoutWrapper>
  )
}
