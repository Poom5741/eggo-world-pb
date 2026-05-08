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
      const email = searchParams.get('email')
      const password = searchParams.get('password')
      const userParam = searchParams.get('user')
      const token = searchParams.get('token')
      const stateParam = searchParams.get('state')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setStatus('error')
        setError(searchParams.get('error_description') || errorParam)
        return
      }

      // NEW FLOW: Accept token directly from line-callback.html (after auth)
      if (token && userParam) {
        console.log('Using new token-based auth flow')
        try {
          const pb = createClient()
          
          // Parse user data
          const userData = JSON.parse(decodeURIComponent(userParam))
          console.log('User data from redirect:', userData)
          
          // Construct proper PocketBase auth record with required fields
          const authRecord = {
            id: userData.id,
            collectionId: '_pb_users_auth_',
            collectionName: 'users',
            email: userData.email,
            name: userData.name,
            ...(userData.wallet && { wallet: userData.wallet }),
            // Include all fields from the user data
            ...userData
          }
          console.log('Auth record:', authRecord)
          
          // Save auth token directly (already authenticated by line-callback.html)
          pb.authStore.save(token, authRecord)
          
          // Force sync to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('pocketbase_auth', JSON.stringify({ 
              token, 
              model: authRecord 
            }))
            document.cookie = `pb_auth=${token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
          }
          
          // Handle state (referrer, redirectTo)
          if (stateParam) {
            try {
              const state = JSON.parse(atob(decodeURIComponent(stateParam)))
              if (state.redirectTo) {
                sessionStorage.setItem('redirectTo', state.redirectTo)
              }
              if (state.referrer) {
                sessionStorage.setItem('referrer', state.referrer)
              }
            } catch (e) {
              console.warn('Failed to parse state:', e)
            }
          }
          
          console.log('✓ Auth saved successfully, redirecting to dashboard')
          setStatus('success')
          
          // Wait briefly to ensure localStorage/cookie are written, then force reload
          setTimeout(() => {
            window.location.href = '/'
          }, 100)
          return
        } catch (error) {
          console.error('Token auth failed:', error)
          setStatus('error')
          setError('Authentication failed: ' + (error as Error).message)
          return
        }
      }

      // FALLBACK: Old email+password flow (legacy production)
      if (email && password) {
        console.log('Using legacy email+password auth flow')
        try {
          const pb = createClient()
          const authData = await pb.collection('users').authWithPassword(email, password)
          
          pb.authStore.save(authData.token, authData.record)
          document.cookie = `pb_auth=${authData.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
          
          if (userParam) {
            try {
              const userData = JSON.parse(decodeURIComponent(userParam))
              console.log('User data from redirect:', userData)
            } catch (e) {
              console.warn('Failed to parse user param:', e)
            }
          }
          
          setStatus('success')
          router.push('/')
          return
        } catch (error) {
          console.error('Legacy auth failed:', error)
          setStatus('error')
          setError('Authentication failed: ' + (error as Error).message)
          return
        }
      }

      // LAST RESORT: OAuth2 code flow (not used currently - PKCE not configured)
      if (code) {
        setStatus('error')
        setError('OAuth2 code flow not configured. Please use token-based auth.')
        return
      }

      if (!code && !token && !email) {
        setStatus('error')
        setError('No authorization credentials received')
        return
      }

      const redirectUrl = `${window.location.origin}/auth/callback`

      try {
        const pb = createClient()
        const response = await fetch(`${pb.baseUrl}/api/collections/users/auth-with-oauth2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'oidc',
            code: code,
            codeVerifier: '',
            redirectURL: redirectUrl,
            createData: {
              emailVisibility: false
              // externalId and username are set automatically by PocketBase
              // OAuth2 field mapping (id -> externalId) from the OIDC provider's sub claim
            }
          })
        })

        const authData = await response.json()
        console.warn('Auth response:', authData)

        if (!response.ok) {
          throw new Error(authData.message || 'Authentication failed')
        }

        // Save auth to PocketBase client
        // authStore.onChange จะ sync cookie pb_auth ให้อัตโนมัติ
        pb.authStore.save(authData.token, authData.record)

        // ตั้งค่า cookie ซ้ำเพื่อให้แน่ใจว่า middleware อ่านได้ก่อน redirect
        document.cookie = `pb_auth=${authData.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`

        // Check if this is a new user and we have a referrer
        const isFreshSignUp = authData.record?.created === authData.record?.updated
        const referrer = sessionStorage.getItem('referrer')
        
        if (isFreshSignUp && referrer) {
          console.warn('New user with referrer, registering...')
          
          // Call registration endpoint to set up referral chain
          const registrationResponse = await fetch(`${pb.baseUrl}/api/users/register`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            },
            body: JSON.stringify({
              user_address: authData.record.wallet_address,
              referrer_address: referrer,
              email: authData.record.email,
              name: authData.record.name
            })
          })
          
          const registrationResult = await registrationResponse.json()
          console.warn('Registration result:', registrationResult)
          
          if (!registrationResult.success) {
            console.warn('Registration failed:', registrationResult.error)
            // Continue anyway - referral chain might already exist
          }
        }

        // Clear referrer from sessionStorage
        sessionStorage.removeItem('referrer')

        setStatus('success')
        const redirectTo = sessionStorage.getItem('redirectTo') || '/dashboard'
        sessionStorage.removeItem('redirectTo')
        window.location.href = redirectTo
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Authentication failed')
        console.warn('Auth error:', err)
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