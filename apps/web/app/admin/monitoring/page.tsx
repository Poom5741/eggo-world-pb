'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { createClient } from '@/lib/pocketbase/client'
import LayoutWrapper from '@/components/LayoutWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface TransactionLog {
  id: string
  user: string
  tx_hash: string
  tx_type: string
  status: string
  error_message?: string
  gas_used: number | null
  created: string
}

export default function MonitoringPage() {
  const [logs, setLogs] = useState<TransactionLog[]>([])
  const [metrics, setMetrics] = useState<{
    mintRate: number
    feedRate: number
    breedRate: number
    totalCount: number
    successCount: number
    failCount: number
  }>({
    mintRate: 0,
    feedRate: 0,
    breedRate: 0,
    totalCount: 0,
    successCount: 0,
    failCount: 0
  })
  const [recentFailures, setRecentFailures] = useState<TransactionLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const pb = createClient()
  const isAuthorized = isHydrated && pb.authStore.isValid

  useEffect(() => {
    if (!isHydrated) return

    const fetchData = async () => {
      if (!isHydrated || !pb?.authStore?.isValid) {
        router.push('/auth/login')
        return
      }

      try {
        setIsLoading(true)
        
        // Fetch transaction logs
        const list = await pb.collection('transaction_logs').getList(1, 1000, {
          sort: '-created',
        })

        const allLogs: TransactionLog[] = list.items as unknown as TransactionLog[]
        setLogs(allLogs)

        // Calculate metrics
        const totalCount = allLogs.length
        const successCount = allLogs.filter(log => log.status === 'success').length
        const failCount = totalCount - successCount
        const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0

        // Calculate type-specific success rates
        const mintLogs = allLogs.filter(log => log.tx_type === 'mint')
        const feedLogs = allLogs.filter(log => log.tx_type === 'feed')
        const breedLogs = allLogs.filter(log => log.tx_type === 'breed')

        const getRate = (type: string) => {
          const typeLogs = allLogs.filter(log => log.tx_type === type)
          const typeSuccess = typeLogs.filter(log => log.status === 'success').length
          return typeLogs.length > 0 ? Math.round(((typeSuccess) / typeLogs.length) * 100) : 0
        }

        // Calculate success rates for each type
        const mintRate = getRate('mint')
        const feedRate = getRate('feed')
        const breedRate = getRate('breed')

        setMetrics({
          mintRate,
          feedRate,
          breedRate,
          totalCount,
          successCount,
          failCount
        })

        // Get recent failures
        const recentFailures = allLogs
          .filter(log => log.status === 'failed')
          .slice(0, 10) // Show only top 10 recent failures

        setRecentFailures(recentFailures)
      } catch (error) {
        console.error('Error fetching monitoring data:', error)
        // Show error message to user
        alert('Failed to load monitoring data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isHydrated, router])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsLoading(true)
      const list = await pb.collection('transaction_logs').getList(1, 1000, {
        sort: '-created',
      })

      const allLogs: TransactionLog[] = list.items as TransactionLog[]
      setLogs(allLogs)

      // Re-calculate metrics...
      const totalCount = allLogs.length
      const successCount = allLogs.filter(log => log.status === 'success').length
      const failCount = totalCount - successCount

      const getRate = (type: string) => {
        const typeLogs = allLogs.filter(log => log.tx_type === type)
        const typeSuccess = typeLogs.filter(log => log.status === 'success').length
        return typeLogs.length > 0 ? Math.round(((typeSuccess) / typeLogs.length) * 100) : 0
      }

      const mintRate = getRate('mint')
      const feedRate = getRate('feed')
      const breedRate = getRate('breed')

      setMetrics({
        mintRate,
        feedRate,
        breedRate,
        totalCount,
        successCount,
        failCount
      })

      const recentFailures = allLogs
        .filter(log => log.status === 'failed')
        .slice(0, 10)

      setRecentFailures(recentFailures)
    } catch (error) {
      console.error('Error refreshing data:', error)
      alert('Failed to refresh monitoring data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isHydrated) {
    return (
      <LayoutWrapper>
        <div className="max-w-6xl mx-auto py-12">
          <div className="bg-surface-container-low rounded-xl p-12 clay-card">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Skeleton className="h-24 w-24 rounded-full" />
              </div>
              <Skeleton className="h-6 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto mb-6" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-surface-container rounded-xl p-6 clay-card text-center">
                    <Skeleton className="h-8 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  if (!isAuthorized) {
    return (
      <LayoutWrapper>
        <div className="max-w-6xl mx-auto py-12">
          <div className="bg-surface-container-low rounded-xl p-12 clay-card text-center">
            <h2 className="text-2xl font-pixel-style mb-4">Access Denied</h2>
            <p className="mb-6">Please log in to access the monitoring dashboard.</p>
            <Button onClick={() => router.push('/auth/login')}>Go to Login</Button>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-pixel-style text-primary mb-2">Admin Monitoring Dashboard</h1>
            <p className="text-on-surface-variant">
              View transaction success rates and monitor system health
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRefresh} disabled={isLoading}>
              <span className="material-symbols-outlined mr-2">refresh</span>
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Mint Success Rate" 
            value={`${metrics.mintRate}%`} 
            description={`${metrics.totalCount > 0 ? Math.round((metrics.mintRate / 100) * (logs.filter(l => l.tx_type === 'mint').length)) : 0}/${logs.filter(l => l.tx_type === 'mint').length} successful`}
          />
          <StatCard 
            title="Feed Success Rate" 
            value={`${metrics.feedRate}%`} 
            description={`${metrics.totalCount > 0 ? Math.round((metrics.feedRate / 100) * (logs.filter(l => l.tx_type === 'feed').length)) : 0}/${logs.filter(l => l.tx_type === 'feed').length} successful`}
          />
          <StatCard 
            title="Breed Success Rate" 
            value={`${metrics.breedRate}%`} 
            description={`${metrics.totalCount > 0 ? Math.round((metrics.breedRate / 100) * (logs.filter(l => l.tx_type === 'breed').length)) : 0}/${logs.filter(l => l.tx_type === 'breed').length} successful`}
          />
          <StatCard 
            title="Total Transactions" 
            value={String(metrics.totalCount)} 
            description={`${metrics.successCount} success, ${metrics.failCount} failed`}
          />
        </div>

        {/* Recent Failures */}
        <div className="bg-surface-container-low rounded-xl p-6 clay-card mb-8">
          <h2 className="text-2xl font-pixel-style mb-4">Recent Failures</h2>
          
          {recentFailures.length === 0 ? (
            isLoading ? (
              <div className="py-8 text-center">
                <div className="flex justify-center mb-4">
                  <Skeleton className="h-8 w-8" />
                </div>
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            ) : (
              <div className="py-8 text-center text-on-surface-variant">
                No recent failures detected
              </div>
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFailures.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.created)}</TableCell>
                    <TableCell>{log.tx_type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.status === 'success' 
                          ? 'bg-success-container text-on-success-container' 
                          : 'bg-error-container text-on-error-container'
                      }`}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell>{log.error_message || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* All Transactions */}
        <div className="bg-surface-container-low rounded-xl p-6 clay-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-pixel-style">All Transactions</h2>
            <p className="text-sm text-on-surface-variant">{logs.length} records</p>
          </div>
          
          {logs.length === 0 ? (
            isLoading ? (
              <div className="py-8 text-center">
                <div className="flex justify-center mb-4">
                  <Skeleton className="h-8 w-8" />
                </div>
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            ) : (
              <div className="py-8 text-center text-on-surface-variant">
                No transaction logs found
              </div>
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>Gas Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 20).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.created)}</TableCell>
                    <TableCell>{log.tx_type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.status === 'success' 
                          ? 'bg-success-container text-on-success-container' 
                          : 'bg-error-container text-on-error-container'
                      }`}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell>{log.tx_hash?.substring(0, 10)}...</TableCell>
                    <TableCell>{log.gas_used ? `${log.gas_used} Gwei` : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </LayoutWrapper>
  )
}

interface StatCardProps {
  title: string
  value: string
  description?: string
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card className="clay-card bg-surface-container bg-opacity-50 hover:bg-opacity-100 transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-normal text-on-surface-variant">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && <div className="text-sm text-on-surface-variant">{description}</div>}
      </CardContent>
    </Card>
  )
}