"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { getUser, createClient, restoreAuth } from "@/lib/pocketbase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, ArrowRightFromLine } from "lucide-react"
import LayoutWithoutNav from "@/components/LayoutWithoutNav"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface WithdrawalRecord {
  id: string  
  amount: number
  fee: number
  external_wallet_address: string
  status: "pending" | "processing" | "completed" | "failed"
  tx_hash: string
  created: string
}

export default function WithdrawPage() {
  const isHydrated = useIsHydrated()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [balance, setBalance] = useState({
    withdrawable: 0,
    usdt_balance: 0,
    total_withdrawn: 0
  })
  
  const [formData, setFormData] = useState({
    amount: "",
    external_wallet_address: ""
  })
  
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  
  // Calculate fee and net amount for preview
  const withdrawalFeeRate = 0.05
  const amountValue = formData.amount ? parseFloat(formData.amount) : 0
  const feeAmount = amountValue * withdrawalFeeRate
  const netAmount = amountValue - feeAmount

  const router = useRouter()

  useEffect(() => {
    if (!isHydrated) return

    const pb = createClient()
    restoreAuth(pb).then((success) => {
      if (success) {
        const userRecord = getUser()
        if (userRecord) {
          setUser(userRecord)
          fetchBalance(userRecord.wallet)
          fetchWithdrawalHistory()
          return
        }
      }
      // Redirect with redirectTo preserving intent
      const redirectUrl = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
      router.push(redirectUrl)
    })
  }, [isHydrated])

  async function fetchBalance(walletAddress: string) {
    try {
      const pb = createClient()
      const response = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/v2/hot-wallet/balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": pb.authStore.token
        },
        body: JSON.stringify({ user_address: walletAddress })
      })

      if (!response.ok) {
        console.error('Balance fetch failed:', response.status)
        return
      }

      const data = await response.json()
      if (data.success) {
        setBalance({
          withdrawable: data.data.withdrawable,
          usdt_balance: data.data.usdt_balance,
          total_withdrawn: data.data.total_withdrawn
        })
      }
    } catch (err) {
      console.error("Balance fetch error:", err)
    } finally {
      setLoading(false)
    }
  }
  
  async function fetchWithdrawalHistory() {
    try {
      const pb = createClient();
      const response = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/collections/withdrawals/records?filter=user_id="${user?.id}"&sort=-created`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": pb.authStore.token
        },
      });
      
      const data = await response.json();
      if (data?.items) {
        setWithdrawalRecords(data.items.slice(0, 20));
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setWithdrawing(true)

    try {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount")
      }

      if (amount > balance.withdrawable) {
        throw new Error("Insufficient balance")
      }

      const pb = createClient()
      const response = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/v2/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": pb.authStore.token
        },
        body: JSON.stringify({
          user_address: user.wallet,
          amount: amount,
          external_wallet_address: formData.external_wallet_address
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        let errorMessage = "Withdrawal failed"
        if (data.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error
          } else if (typeof data.error === 'object' && data.error !== null) {
            if (typeof data.error.message === 'string') {
              errorMessage = data.error.message
            } else if (data.error.message && typeof data.error.message === 'object') {
              errorMessage = JSON.stringify(data.error.message)
            } else {
              errorMessage = JSON.stringify(data.error)
            }
          }
        }
        throw new Error(errorMessage)
      }

      setSuccess(`Withdrawal successful! ${amount} USDT sent to ${formData.external_wallet_address}`)
      setFormData({ amount: "", external_wallet_address: "" })
      fetchBalance(user.wallet);
      fetchWithdrawalHistory(); // Refresh history
    } catch (err: any) {
      setError(err.message || "Withdrawal failed")
    } finally {
      setWithdrawing(false)
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isHydrated || loading) {
    return (
      <LayoutWithoutNav>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">Loading...</p>
          </div>
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
          <h1 className="text-2xl font-bold">Withdraw USDT</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Balance</CardTitle>
            <CardDescription>Available for withdrawal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {balance.withdrawable.toLocaleString()} USDT
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Total withdrawn: {balance.total_withdrawn.toLocaleString()} USDT
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="withdraw" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="withdraw">Withdraw Funds</TabsTrigger>
            <TabsTrigger value="history">Withdrawal History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="withdraw">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
                <CardDescription>Send USDT to your external wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USDT)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={balance.withdrawable}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Available: {balance.withdrawable.toLocaleString()} USDT
                    </p>
                    
                    {/* Fee Preview */}
                    {!isNaN(netAmount) && netAmount >= 0 ? (
                      <div className="text-sm font-medium p-3 bg-blue-50 rounded-md mt-2">
                        <p className="flex justify-between">
                          <span>Amount:</span>
                          <span>{amountValue.toFixed(2)} USDT</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Fee ({(withdrawalFeeRate * 100).toFixed(0)}%):</span>
                          <span>-{feeAmount.toFixed(2)} USDT</span>
                        </p>
                        <p className="flex justify-between font-bold border-t border-gray-200 pt-2">
                          <span>Net transfer:</span>
                          <span>{netAmount.toFixed(2)} USDT</span>
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 p-2">
                        Enter an amount to see the fee breakdown
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="external_wallet_address">External Wallet Address</Label>
                    <Input
                      id="external_wallet_address"
                      type="text"
                      value={formData.external_wallet_address}
                      onChange={(e) => setFormData({ ...formData, external_wallet_address: e.target.value })}
                      placeholder="0x..."
                      pattern="^0x[a-fA-F0-9]{40}$"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Enter your EVM wallet address (0x...)
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={withdrawing || !formData.amount || !formData.external_wallet_address}
                  >
                    {withdrawing ? (
                      "Processing..."
                    ) : (
                      <>
                        Withdraw <ArrowRightFromLine className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
                <CardDescription>Your recent withdrawal records</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="py-4 text-center">
                    <p>Loading historical withdraw records...</p>
                  </div>
                ) : withdrawalRecords.length === 0 ? (
                  <div className="py-4 text-center">
                    <p>No withdrawal records found yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left py-2">Date</th>
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Fee</th>
                          <th className="text-left py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {withdrawalRecords.map((record) => (
                          <tr key={record.id}>
                            <td className="py-2">{formatDate(record.created)}</td>
                            <td className="py-2">{record.amount?.toLocaleString() ?? "0"} USDT</td>
                            <td className="py-2">{record.fee?.toLocaleString() ?? "0"} USDT</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                record.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : record.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : record.status === 'processing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWithoutNav>
  )
}
