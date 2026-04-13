'use client'

import { useState, useEffect } from "react"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { getUser, createClient } from "@/lib/pocketbase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Download } from "lucide-react"
import LayoutWithoutNav from "@/components/LayoutWithoutNav"
import { QRCodeSVG } from 'qrcode.react'

export default function DepositPage() {
  const isHydrated = useIsHydrated()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [balance, setBalance] = useState(0)
  const [deposits, setDeposits] = useState<any[]>([])
  const [pollingStatus, setPollingStatus] = useState("Waiting for deposit...")

  useEffect(() => {
    if (!isHydrated) return

    const userRecord = getUser()
    if (!userRecord) {
      window.location.href = "/auth/login"
      return
    }

    setUser(userRecord)
    fetchInitialData(userRecord.wallet)
  }, [isHydrated])

  useEffect(() => {
    if (!isHydrated || !user) return
    
    const pollDeposits = async () => {
      try {
        const pb = createClient()
        const response = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/v2/deposit/poll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": pb.authStore.token
          },
          body: JSON.stringify({ user_address: user.wallet })
        })

        const data = await response.json()
        if (data.success) {
          setDeposits(data.data.deposits || [])
          setBalance(data.data.new_balance || 0)
          setPollingStatus(data.data.deposits?.length > 0 ? "Deposit detected!" : "Waiting for deposit...")
        }
      } catch (err: any) {
        console.error("Poll error:", err)
        setError("Failed to check deposit status")
      }
    }
    
    pollDeposits()
    const interval = setInterval(pollDeposits, 30000)
    
    return () => clearInterval(interval)
  }, [isHydrated, user])

  async function fetchInitialData(walletAddress: string) {
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

      const data = await response.json()
      if (data.success) {
        setDeposits(data.data.deposits || [])
        setBalance(data.data.new_balance || 0)
      }
    } catch (err: any) {
      console.error("Initial fetch error:", err)
      setError("Failed to load deposit data")
    } finally {
      setLoading(false)
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Balance</CardTitle>
            <CardDescription>Current balance after deposits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {balance.toLocaleString()} USDT
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Status: {pollingStatus}
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
              <p className="text-sm text-gray-600 font-mono break-all text-center">
                {user.wallet}
              </p>
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
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Tx Hash</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((deposit: any, index: number) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3 text-sm font-mono text-gray-700">
                          <a 
                            href={`https://bscscan.com/tx/${deposit.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {deposit.tx_hash?.slice(0, 6)}...{deposit.tx_hash?.slice(-4)}
                          </a>
                        </td>
                        <td className="text-right py-3 text-sm font-medium text-green-600">
                          {deposit.amount?.toLocaleString()} USDT
                        </td>
                        <td className="text-right py-3 text-sm text-gray-500">
                          {deposit.timestamp 
                            ? new Date(deposit.timestamp).toLocaleString()
                            : 'Pending'}
                        </td>
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
