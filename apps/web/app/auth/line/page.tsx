'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/pocketbase/client'

function LineLoginContent() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // Support TWO redirect formats from line-callback.html:
    // 1. email + password params (local/dev format - sends valid PocketBase credentials)
    // 2. token + user params (production format - may have fake token)
    const email = params.get('email')
    const password = params.get('password')
    const token = params.get('token')
    const userParam = params.get('user')

    console.log('=== /auth/line page loaded ===')
    console.log('URL:', window.location.href)
    console.log('Email param present:', !!email)
    console.log('Password param present:', !!password)
    console.log('Token param present:', !!token)
    console.log('User param present:', !!userParam)

    // Handle authentication
    const authenticate = async () => {
      // LINE callback sends email + password + user (from line-callback.html)
      // Uses /api/auth/line-auth endpoint since users collection is OAuth2-only
      if (!email || !password || !userParam) {
        console.log('Missing required auth params, redirecting to /auth/login')
        console.log('Full URL params:', window.location.search)
        router.replace('/auth/login')
        return
      }

      setStatus('loading')
      console.log('Processing LINE OAuth callback...')

      try {
        const userData = JSON.parse(decodeURIComponent(userParam))
        console.log('Got user data:', userData)

        const pb = createClient()
        const authData = await pb.collection('users').authWithPassword(email, password)
        
        console.log('PocketBase authWithPassword SUCCESS, user:', authData.record?.id)
        
        document.cookie = `pb_auth=${authData.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
        console.log('Cookie set explicitly')

        const backendUser = authData.record
        
        const pendingReferralCode = sessionStorage.getItem('pending_referral_code')
        if (pendingReferralCode && backendUser?.id) {
          const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
          const referralResponse = await fetch(`${pbUrl}/api/referrals/apply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authData.token
            },
            body: JSON.stringify({
              referral_code: pendingReferralCode,
              user_id: backendUser.id
            })
          })
          
          const referralResult = await referralResponse.json()
          console.log('Referral result:', referralResult)
          
          if (referralResult.success) {
            console.log('Referral applied successfully:', referralResult.data?.referrer_name)
          } else {
            console.log('Referral failed:', referralResult.error?.message)
          }
          sessionStorage.removeItem('pending_referral_code')
        }
        
        const redirectTo = sessionStorage.getItem('redirectTo') || '/dashboard'
        console.log('Redirecting to:', redirectTo)
        sessionStorage.removeItem('redirectTo')
        
        window.location.href = redirectTo
      } catch (err) {
        console.error('LINE OAuth authentication failed:', err)
        console.error('Error details:', err.message)
        setError(`Authentication failed: ${err.message || 'Unknown error'}. Please try again.`)
        setStatus('error')
      }
    }

    authenticate()
  }, [router])

  // แสดง loading state ขณะกำลัง authenticate
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/eggoworld-logo.svg"
                alt="EggoWorld"
                width={48}
                height={48}
                loading="eager"
                className="pixelated"
              />
            </div>
            <div className="animate-pulse">
              <h1 className="font-[var(--font-pixel)] text-sm text-primary">PROCESSING...</h1>
            </div>
            <p className="label mt-4">COMPLETING LOGIN</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/eggoworld-logo.svg"
              alt="EggoWorld"
              width={48}
              height={48}
              loading="eager"
              className="pixelated"
            />
          </div>
          <h1 className="font-[var(--font-pixel)] text-sm text-accent">ERROR</h1>
          <p className="label mt-4">{error}</p>
          <a href="/auth/login" className="btn-primary inline-block mt-6">
            TRY AGAIN
          </a>
        </div>
      </div>
    </div>
  )
}

export default function LineLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
      </div>
    }>
      <LineLoginContent />
    </Suspense>
  )
}
