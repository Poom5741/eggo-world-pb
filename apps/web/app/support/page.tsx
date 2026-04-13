'use client'

import {  useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isAuthenticated } from '@/lib/pocketbase/client'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LifeBuoy, MessageSquare, HelpCircle, Book, Mail, Phone } from 'lucide-react'

export default function SupportPage() {
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
        <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-[var(--font-pixel)] text-3xl text-foreground">SUPPORT</h1>
              <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                Get help with your EggoWorld experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FAQ */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="font-[var(--font-pixel)] text-lg">FAQ</CardTitle>
                      <CardDescription className="font-[var(--font-pixel)] text-xs">
                        Common questions answered
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="font-[var(--font-pixel)] text-xs w-full">
                    View FAQ
                  </Button>
                </CardContent>
              </Card>

              {/* Documentation */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Book className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="font-[var(--font-pixel)] text-lg">Guides</CardTitle>
                      <CardDescription className="font-[var(--font-pixel)] text-xs">
                        Step-by-step tutorials
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="font-[var(--font-pixel)] text-xs w-full">
                    Browse Guides
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Support */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="font-[var(--font-pixel)] text-lg">Contact Us</CardTitle>
                      <CardDescription className="font-[var(--font-pixel)] text-xs">
                        Submit a support ticket
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="font-[var(--font-pixel)] text-xs w-full">
                    Submit Ticket
                  </Button>
                </CardContent>
              </Card>

              {/* Discord Community */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <LifeBuoy className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="font-[var(--font-pixel)] text-lg">Community</CardTitle>
                      <CardDescription className="font-[var(--font-pixel)] text-xs">
                        Join our Discord server
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="font-[var(--font-pixel)] text-xs w-full">
                    Join Discord
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="font-[var(--font-pixel)] text-lg">Contact Information</CardTitle>
                    <CardDescription className="font-[var(--font-pixel)] text-xs">
                      Reach out to us directly
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-[var(--font-pixel)] text-xs">support@eggoworld.io</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-[var(--font-pixel)] text-xs">+1 (555) 123-4567</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
