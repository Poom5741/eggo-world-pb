'use client'

import { createClient } from '@/lib/pocketbase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const stateParam = searchParams.get('state')
      const errorParam = searchParams.get('error')
      const provider = searchParams.get('provider')

      // Handle OAuth error
      if (errorParam) {
        setStatus('error')
        setError(searchParams.get('error_description') || errorParam)
        return
      }

      // PocketBase OAuth2 callback - receives code and state
      if (code) {
        // console.error('=== PocketBase OAuth2 Callback ===')
        // console.error('Provider:', provider)
        // console.error('Code present:', !!code)
        
        try {
          const pb = createClient()
          const redirectUrl = `${window.location.origin}/auth/callback`

          // Call PocketBase's native OAuth2 authentication endpoint
          const authData = await pb.collection('users').authWithOAuth2({
            provider: provider || 'google',
            code: code,
            redirectURL: redirectUrl,
            createData: {
              emailVisibility: false
            }
          })

          // console.error('✓ OAuth2 authentication successful')
          // console.error('User ID:', authData.record?.id)
          // console.error('Is new user:', authData.meta?.isNewUser)

          // Parse state to get referral and redirect info
          if (stateParam) {
            try {
              const state = JSON.parse(atob(decodeURIComponent(stateParam)))
              
              // Handle referral for new users
              const isNewUser = authData.meta?.isNewUser
              const referrer = state.referrer || sessionStorage.getItem('referrer')
              
              if (isNewUser && referrer && authData.record?.id) {
                // console.error('New user with referrer, applying referral...')
                const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
                const referralResponse = await fetch(`${pbUrl}/api/referrals/apply`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authData.token}`
                  },
                  body: JSON.stringify({
                    referral_code: referrer,
                    user_id: authData.record.id
                  })
                })
                
                const referralResult = await referralResponse.json()
                if (referralResult.success) {
                  // console.error('✓ Referral applied:', referralResult.data?.referrer_name)
                } else {
                  console.warn('Referral application failed:', referralResult.error?.message)
                }
              }

              // Store redirect target
              if (state.redirectTo) {
                sessionStorage.setItem('redirectTo', state.redirectTo)
              }
            } catch (e) {
              console.warn('Failed to parse state:', e)
            }
          }

          // Clean up session storage
          sessionStorage.removeItem('referrer')
          sessionStorage.removeItem('oauth_state')

          setStatus('success')
          // console.error('✓ Auth complete, redirecting...')
          
          // Wait briefly then redirect
          setTimeout(() => {
            const redirectTo = sessionStorage.getItem('redirectTo') || '/dashboard'
            sessionStorage.removeItem('redirectTo')
            window.location.href = redirectTo
          }, 100)
          return
        } catch (err) {
          console.error('OAuth2 authentication failed:', err)
          setStatus('error')
          setError('Authentication failed: ' + (err as Error).message)
          return
        }
      }

      // No code or error received
      if (!code) {
        setStatus('error')
        setError('No authorization code received')
        return
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Feedback card - Clay variant */}
        <Card variant="clay" className="shadow-clay-lg text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className={cn(
                'rounded-clay-lg shadow-clay-md',
                'bg-card/50 p-3'
              )}>
                <Image
                  src="/eggoworld-logo.svg"
                  alt="EggoWorld"
                  width={48}
                  height={48}
                  loading="eager"
                  className="pixelated"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <>
                <div className="animate-pulse">
                  <CardTitle className="font-body text-lg text-primary">
                    PROCESSING...
                  </CardTitle>
                </div>
                <CardDescription className="font-body text-xs">
                  COMPLETING LOGIN
                </CardDescription>
              </>
            )}

            {status === 'success' && (
              <>
                <CardTitle className="font-body text-lg text-primary">
                  SUCCESS!
                </CardTitle>
                <CardDescription className="font-body text-xs">
                  REDIRECTING...
                </CardDescription>
              </>
            )}

            {status === 'error' && (
              <>
                <CardTitle className="font-body text-lg text-accent">
                  ERROR
                </CardTitle>
                <CardDescription className="font-body text-xs">
                  {error}
                </CardDescription>
                <a
                  href="/auth/login"
                  className={cn(
                    'inline-block mt-4',
                    'font-body text-xs',
                    'rounded-clay shadow-clay-md px-6 py-3',
                    'bg-primary hover:bg-primary/90 text-primary-foreground',
                    'transition-all'
                  )}
                >
                  TRY AGAIN
                </a>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-foreground">LOADING...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}