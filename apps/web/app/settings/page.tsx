'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isAuthenticated } from '@/lib/pocketbase/client'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Wallet, Bell, Shield, Palette, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const pb = createClient()
  const user = isHydrated ? pb.authStore.record : null

  useEffect(() => {
    if (isHydrated && !isAuthenticated()) {
      router.push('/auth/login')
    }
  }, [isHydrated, router])

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-foreground">LOADING...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-heading text-heading-xl text-foreground">SETTINGS</h1>
              <p className="font-body text-xs text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>

            <Separator />

            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="font-body text-lg">Profile</CardTitle>
                    <CardDescription className="font-body text-xs">
                      Update your personal information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-body text-xs">Username</Label>
                  <Input value={user?.name || ''} readOnly className="font-body text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-xs">Email</Label>
                  <Input value={user?.email || ''} readOnly className="font-body text-xs" />
                </div>
              </CardContent>
            </Card>

            {/* Wallet Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="font-body text-lg">Wallet</CardTitle>
                    <CardDescription className="font-body text-xs">
                      Manage your connected wallet
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-body text-xs">Connected Wallet</Label>
                  <Input 
                    value={user?.wallet || user?.wallet_address || 'Not connected'} 
                    readOnly 
                    className="font-body text-xs font-mono" 
                  />
                </div>
                <Button variant="outline" className="font-body text-xs">
                  Change Wallet
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="font-body text-lg">Notifications</CardTitle>
                    <CardDescription className="font-body text-xs">
                      Manage your notification preferences
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-body text-xs">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Button variant="outline" size="sm" className="font-body text-xs">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="font-body text-lg">Appearance</CardTitle>
                    <CardDescription className="font-body text-xs">
                      Customize how EggoWorld looks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-body text-xs">Theme</Label>
                    <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <Button variant="outline" size="sm" className="font-body text-xs">
                    Customize
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="font-body text-lg">Security</CardTitle>
                    <CardDescription className="font-body text-xs">
                      Manage your account security
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="font-body text-xs w-full">
                  Change Password
                </Button>
                <Button variant="outline" className="font-body text-xs w-full">
                  Enable 2FA
                </Button>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  variant="destructive" 
                  className="font-body text-xs w-full"
                  onClick={() => {
                    pb.authStore.clear()
                    router.push('/')
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
