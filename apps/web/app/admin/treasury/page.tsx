'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LayoutWrapper from '@/components/LayoutWrapper'
import { useMetaMask } from '@/hooks/use-metamask'
import { BSC_CHAINS } from '@/hooks/use-metamask'
import { TreasuryGuard } from '@/components/auth/TreasuryGuard'
import { ContractOwnershipGrid } from '@/components/admin/ContractOwnershipGrid'
import { TreasuryWithdrawalSection } from '@/components/admin/treasury/TreasuryWithdrawalSection'

export default function AdminTreasuryPage() {
  const {
    address,
    isConnected,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    switchChain,
  } = useMetaMask()

  const targetChainId = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 7117 : 56

  return (
    <LayoutWrapper>
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-pixel-style text-primary mb-2">
            Admin Treasury
          </h1>
          <p className="text-on-surface-variant">
            Manage contract ownership, monitor pool balances, and withdraw treasury funds
          </p>
        </div>

        {/* MetaMask Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>MetaMask Connection</CardTitle>
                <CardDescription>
                  Connect your wallet to manage treasury
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <>
                    {chainId === targetChainId ? (
                      <Badge variant="default" className="bg-green-500">
                        {BSC_CHAINS[chainId]?.name || 'Unknown Network'}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Wrong Network
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your MetaMask wallet to access the admin treasury. You must be the contract owner to perform administrative actions.
                </p>
                <Button onClick={connect} disabled={isConnecting}>
                  {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Connected Wallet</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {chainId !== targetChainId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => switchChain(targetChainId)}
                      >
                        Switch Network
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={disconnect}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Ownership Section (Phase 66) */}
        <TreasuryGuard>
          <Card id="ownership-section">
            <CardHeader>
              <CardTitle>Contract Ownership</CardTitle>
              <CardDescription>
                View contract ownership and accept pending transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractOwnershipGrid />
            </CardContent>
          </Card>
        </TreasuryGuard>

        {/* Pool Balances & Withdraw Section (Phase 67) */}
        <TreasuryGuard>
          <TreasuryWithdrawalSection />
        </TreasuryGuard>
      </div>
    </LayoutWrapper>
  )
}
