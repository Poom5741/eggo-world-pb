'use client'

import { useState, useEffect } from "react"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { getUser, createClient } from "@/lib/pocketbase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Download, RefreshCw, Copy } from "lucide-react"
import LayoutWithoutNav from "@/components/LayoutWithoutNav"
import { QRCodeSVG } from 'qrcode.react'

// Define interfaces for type safety
interface User {
  id: string
  wallet: string
}

interface Deposit {
  id: string
  user: string
  amount: number
  tx_hash: string
  from_address?: string
  status: 'pending' | 'confirmed' | 'failed'
  confirmed_at?: string
  block_number?: number
  confirmations?: number
  created: string
}

export default function DepositPage() {
  const isHydrated = useIsHydrated()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [balance, setBalance] = useState(0)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [pollingStatus, setPollingStatus] = useState("Waiting for deposit...")
  const [isPolling, setIsPolling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmedDeposits, setConfirmedDeposits] = useState<string[]>([])

  // Query deposits from collection
  const fetchDepositsFromCollection = async (userId: string) => {
    try {
      const pb = createClient()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/deposits/records?filter=(user="${userId}")&sort=-created&per-page=50`,
        {
          headers: {
            "Authorization": pb.authStore.token
          }
        }
      )

      if (!response.ok) {
        console.error('Fetch deposits failed:', response.status)
        return
      }

      const data = await response.json()
      if (data.items) {
        setDeposits(data.items)
      }
    } catch (err: any) {
      console.error("Fetch deposits error:", err)
    }
  }

  useEffect(() => {
    if (!isHydrated) return

    const userRecord = getUser()
    if (!userRecord) {
      window.location.href = "/auth/login"
      return
    }

    const typedUser: User = {
      id: userRecord.id,
      wallet: userRecord.wallet
    }
    setUser(typedUser)
    fetchInitialData(typedUser.wallet)
    fetchDepositsFromCollection(typedUser.id)
  }, [isHydrated])

  useEffect(() => {
    if (!isHydrated || !user) return
    
    // Check if user has wallet
    if (!user.wallet) {
      setError("Wallet not created. Please contact support.")
      return
    }
    
    const pollDeposits = async () => {
      setIsPolling(true)
      try {
        const pb = createClient()
        
        // Check if client and authStore exist
        if (!pb || !pb.authStore?.token) {
          setError("Not authenticated")
          window.location.href = "/auth/login"
          return
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/v2/deposit/poll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": pb.authStore.token
          },
          body: JSON.stringify({ user_address: user.wallet })
        })

        // Handle non-OK responses (including auth errors and endpoint not found)
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("Session expired. Please login again.")
            window.location.href = "/auth/login"
            return
          }
          if (response.status === 404) {
            console.warn("Deposit polling endpoint not available")
            setPollingStatus("Polling unavailable (endpoint not deployed)")
            return
          }
          console.error('Deposit poll failed:', response.status)
          return
        }

        const data = await response.json()
        if (data.success) {
          // Refresh deposits from collection to get latest state
          fetchDepositsFromCollection(user.id)
          setBalance(data.data.new_balance || 0)
          
          // Detect newly confirmed deposits for notification
          const prevPending = deposits.filter(d => d.status === 'pending')
          const newlyConfirmed = (data.data.deposits || []).filter(
            (d: Deposit) => d.status === 'confirmed' && !prevPending.some(p => p.tx_hash === d.tx_hash)
          )
          if (newlyConfirmed.length > 0) {
            setConfirmedDeposits(newlyConfirmed.map((d: Deposit) => d.tx_hash))
            setTimeout(() => setConfirmedDeposits([]), 5000)
          }
          
          setPollingStatus(data.data.deposits?.length > 0 ? "Deposit detected!" : "Waiting for deposit...")
        }
      } catch (err: any) {
        console.error("Poll error:", err)
      } finally {
        setIsPolling(false)
      }
    }
    
    pollDeposits()
    const interval = setInterval(pollDeposits, 30000)
    
    return () => clearInterval(interval)
  }, [isHydrated, user])

  async function fetchInitialData(walletAddress: string) {
    setIsPolling(true)
    try {
      const pb = createClient()
      const response = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/v2/deposit/poll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": pb.authStore.token
        },
        body: JSON.stringify({ user_address: walletAddress })
      })

      // Handle non-OK responses
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/auth/login"
          return
        }
        console.error('Initial deposit fetch failed:', response.status)
        return
      }

      const data = await response.json()
      if (data.success) {
        setBalance(data.data.new_balance || 0)
        setPollingStatus(data.data.deposits?.length > 0 ? "Deposit detected!" : "Checking for deposits...")
      }
    } catch (err: any) {
      console.error("Initial fetch error:", err)
      setError("Failed to load deposit data")
    } finally {
      setLoading(false)
      setIsPolling(false)
    }
  }

  const copyToClipboard = async () => {
    if (!user?.wallet) return
    try {
      await navigator.clipboard.writeText(user.wallet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (!isHydrated || loading) {
    return (
      <LayoutWithoutNav>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Loading...</p>
        </div>
      </LayoutWithoutNav>
    )
  }

  if (!user) {
    return null
  }

  return (
    <LayoutWithoutNav>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Wallet className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Deposit USDT</h1>
        </div>

        {confirmedDeposits.length > 0 && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">
              ✅ {confirmedDeposits.length} deposit(s) confirmed! Your balance has been updated.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Balance</CardTitle>
            <CardDescription>Current balance after deposits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {balance.toLocaleString()} USDT
            </div>
            <div className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              Status: {pollingStatus}
              {isPolling && (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Deposit Address</CardTitle>
            <CardDescription>Scan QR code or copy address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <QRCodeSVG 
                value={user.wallet} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-surface-container-lowest p-3 rounded border border-primary/20">
                <p className="flex-1 text-sm text-gray-600 font-mono break-all">
                  {user.wallet}
                </p>
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-primary/10 rounded transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4 text-primary" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 text-center font-medium">
                  Copied to clipboard!
                </p>
              )}
              <p className="text-xs text-gray-500 text-center">
                Send USDT to this address. The system will automatically detect your deposit.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Your deposit transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {deposits.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Download className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No deposits yet</p>
                <p className="text-sm">Waiting for your first deposit...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Tx Hash</th>
                      <th className="text-center py-2 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((deposit: Deposit, index: number) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3 text-sm text-gray-500">
                          {deposit.created ? new Date(deposit.created).toLocaleString() : '-'}
                        </td>
                        <td className="text-right py-3 text-sm font-medium text-green-600">
                          {deposit.amount?.toLocaleString()} USDT
                        </td>
                        <td className="py-3 text-sm font-mono text-gray-700">
                          <a 
                            href={`https://0xl3.testnet.eggoworld.io/tx/${deposit.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {deposit.tx_hash?.slice(0, 6)}...{deposit.tx_hash?.slice(-4)}
                          </a>
                        </td>
                        {deposit.status === 'pending' && (
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-500 transition-all" 
                                  style={{ width: `${Math.min((deposit.confirmations || 0) / 12 * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{deposit.confirmations || 0}/12</span>
                            </div>
                          </td>
                        )}
                        {deposit.status !== 'pending' && (
                          <td className="py-3 text-center">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              deposit.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`} title={deposit.status === 'failed' ? 'Deposit failed — chain reorg detected. Contact support if this persists.' : ''}>
                              {deposit.status === 'confirmed' ? (
                                <span>Confirmed</span>
                              ) : (
                                <span>Failed</span>
                              )}
                            </span>
                          </td>
                        )}
                        {deposit.status === 'pending' && (
                          <td className="py-3 text-center">
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              Pending ({deposit.confirmations || 0}/12)
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutWithoutNav>
  )
}
