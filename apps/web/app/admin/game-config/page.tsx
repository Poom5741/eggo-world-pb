'use client'

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { createClient } from '@/lib/pocketbase/client'
import LayoutWrapper from '@/components/LayoutWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'


interface GameConfig {
  platform_fee_percent: number
  breed_cooldown_seconds: number
  rarity_weights: { common: number; rare: number; epic: number; legendary: number }
  kyc_required: boolean
  species: { id: number; name: string; weight: number }[]
}

const DEFAULT_CONFIG: GameConfig = {
  platform_fee_percent: 0,
  breed_cooldown_seconds: 86400,
  rarity_weights: { common: 60, rare: 25, epic: 12, legendary: 3 },
  kyc_required: false,
  species: [],
}

export default function GameConfigPage() {
  return (
    <AuthGuard requireAdmin redirectTo="/auth/login">
      {() => <GameConfigContent />}
    </AuthGuard>
  )
}

function GameConfigContent() {
  const pb = createClient()

  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // New species form
  const [newSpeciesName, setNewSpeciesName] = useState('')
  const [newSpeciesWeight, setNewSpeciesWeight] = useState(0)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/v2/game-config`, {
        headers: { Authorization: pb.authStore.token },
      })
      const data = await res.json()
      if (data.success) {
        setConfig(data.data)
      } else {
        setError(data.error?.message || 'Failed to load config')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const callAdminEndpoint = async (endpoint: string, body: Record<string, unknown>) => {
    setSaving(endpoint)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setMessage(data.data?.message || 'Updated successfully')
        fetchConfig()
      } else {
        setError(data.error?.message || 'Update failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center text-on-surface-variant">Loading...</div>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-pixel-style text-primary mb-2">Game Configuration</h1>
        <p className="text-on-surface-variant mb-8">Manage game parameters and system settings</p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Platform Fee */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Fee</CardTitle>
              <CardDescription>Fee percentage charged on transactions (0-20%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="fee">Fee (basis points)</Label>
                <Input
                  id="fee"
                  type="number"
                  value={config.platform_fee_percent}
                  onChange={(e) => setConfig({ ...config, platform_fee_percent: Number(e.target.value) })}
                  min={0}
                  max={2000}
                  className="max-w-xs"
                />
                <Button
                  onClick={() => callAdminEndpoint('/api/v2/admin/set-platform-fee', { fee_percent: config.platform_fee_percent })}
                  disabled={saving !== null}
                >
                  {saving === '/api/v2/admin/set-platform-fee' ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Breed Cooldown */}
          <Card>
            <CardHeader>
              <CardTitle>Breeding Cooldown</CardTitle>
              <CardDescription>Cooldown period between breeding attempts (3600-604800 seconds)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="cooldown">Cooldown (seconds)</Label>
                <Input
                  id="cooldown"
                  type="number"
                  value={config.breed_cooldown_seconds}
                  onChange={(e) => setConfig({ ...config, breed_cooldown_seconds: Number(e.target.value) })}
                  min={3600}
                  max={604800}
                  className="max-w-xs"
                />
                <Button
                  onClick={() => callAdminEndpoint('/api/v2/admin/set-breed-cooldown', { cooldown_seconds: config.breed_cooldown_seconds })}
                  disabled={saving !== null}
                >
                  {saving === '/api/v2/admin/set-breed-cooldown' ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rarity Weights */}
          <Card>
            <CardHeader>
              <CardTitle>Rarity Weights</CardTitle>
              <CardDescription>Drop rates for each rarity tier (must sum to 100)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
                  <div key={rarity}>
                    <Label className="capitalize">{rarity}%</Label>
                    <Input
                      type="number"
                      value={config.rarity_weights[rarity]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          rarity_weights: { ...config.rarity_weights, [rarity]: Number(e.target.value) },
                        })
                      }
                      min={0}
                      max={100}
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={() =>
                  callAdminEndpoint('/api/v2/admin/update-rarity-weights', {
                    weights: config.rarity_weights,
                  })
                }
                disabled={saving !== null}
              >
                {saving === '/api/v2/admin/update-rarity-weights' ? 'Saving...' : 'Save Weights'}
              </Button>
            </CardContent>
          </Card>

          {/* KYC Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>KYC Requirement</CardTitle>
              <CardDescription>Require KYC verification for all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Switch
                  checked={config.kyc_required}
                  onCheckedChange={(checked) =>
                    callAdminEndpoint('/api/v2/admin/set-kyc-required', { required: checked })
                  }
                  disabled={saving !== null}
                />
                <span>{config.kyc_required ? 'Required' : 'Not Required'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Species Catalog */}
          <Card>
            <CardHeader>
              <CardTitle>Species Catalog</CardTitle>
              <CardDescription>Manage available animal species</CardDescription>
            </CardHeader>
            <CardContent>
              {config.species.length > 0 && (
                <div className="mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ID</th>
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.species.map((s) => (
                        <tr key={s.id} className="border-b">
                          <td className="py-2">{s.id}</td>
                          <td className="py-2">{s.name}</td>
                          <td className="py-2">{s.weight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex items-center gap-4">
                <Label htmlFor="species-name">Name</Label>
                <Input
                  id="species-name"
                  value={newSpeciesName}
                  onChange={(e) => setNewSpeciesName(e.target.value)}
                  placeholder="New species name"
                  className="max-w-xs"
                />
                <Label htmlFor="species-weight">Weight</Label>
                <Input
                  id="species-weight"
                  type="number"
                  value={newSpeciesWeight}
                  onChange={(e) => setNewSpeciesWeight(Number(e.target.value))}
                  min={1}
                  className="max-w-[100px]"
                />
                <Button
                  onClick={() => {
                    if (!newSpeciesName || newSpeciesWeight <= 0) return
                    callAdminEndpoint('/api/v2/admin/add-species', {
                      name: newSpeciesName,
                      weight: newSpeciesWeight,
                    })
                    setNewSpeciesName('')
                    setNewSpeciesWeight(0)
                  }}
                  disabled={saving !== null}
                >
                  {saving === '/api/v2/admin/add-species' ? 'Adding...' : 'Add Species'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  )
}
