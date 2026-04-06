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
      // Format 2: Production callback sends token + user (+ possibly email+password)
      if (token && userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam))
          console.log('Got token-based auth, user:', userData)

          // PRIORITY: If we also have email+password, use authWithPassword
          // to get a valid PocketBase JWT (works for both local and production)
            if (email && password) {
            console.log('Using authWithPassword with email+password')
            const pb = createClient()
            const authData = await pb.collection('users').authWithPassword(email, password)
            console.log('authWithPassword SUCCESS, user:', authData.record?.id)

            // Apply referral code after successful authentication
            const pendingReferralCode = sessionStorage.getItem('pending_referral_code')
            if (pendingReferralCode && authData.record) {
              try {
                const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
                const response = await fetch(`${pbUrl}/api/referrals/apply`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authData.token
                  },
                  body: JSON.stringify({
                    referral_code: pendingReferralCode,
                    user_id: authData.record.id
                  })
                })
                
                const result = await response.json()
                console.log('Referral result:', result)
                
                if (result.success) {
                  console.log('Referral applied successfully:', result.data?.referrer_name)
                } else {
                  console.log('Referral failed:', result.error?.message)
                }
              } catch (error) {
                console.error('Failed to apply referral:', error)
              } finally {
                sessionStorage.removeItem('pending_referral_code')
              }
            }

            const redirectTo = sessionStorage.getItem('redirectTo') || '/dashboard'
            console.log('Redirecting to:', redirectTo)
            sessionStorage.removeItem('redirectTo')

            window.location.href = redirectTo
            return
          }

          // Fallback: Production sends only token+user (no email+password)
          // The token is a simple base64 JSON (not a PocketBase JWT), so we need
          // to get a real JWT by calling authWithPassword.
          // We'll use the email from user data and reset the password via backend.
          console.log('No email+password, extracting from user data and getting real JWT')

          const userEmail = userData.email || (userData.sub ? `${userData.sub.slice(0, 8)}@line.eggo` : null)
          if (!userEmail) {
            throw new Error('Could not determine user email')
          }

          // Generate a random password and update it via backend
          const newPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

          // Call backend to update password using fetch() directly (avoid pb.send() with fake auth)
          const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
          const response = await fetch(`${pbUrl}/api/auth/line-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, password: newPassword })
          })

          if (!response.ok) {
            throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
          }

          const result = await response.json()
          if (!result.success) {
            throw new Error(result.error || 'Backend failed to update password')
          }

          console.log('Backend returned JWT token, saving auth...')

          // Save the real JWT token from the backend
          const realToken = result.token
          const backendUser = result.user
          
          console.log('Token received:', realToken)
          console.log('Token parts:', realToken.split('.').length)
          
          // Decode JWT payload to verify it's valid
          try {
            const payload = JSON.parse(atob(realToken.split('.')[1]))
            console.log('JWT payload:', payload)
            console.log('Token exp:', payload.exp, 'Current time:', Date.now()/1000)
            console.log('Token expired:', payload.exp && payload.exp < Date.now()/1000)
          } catch (e) {
            console.error('Failed to decode JWT:', e)
          }
          
          console.log('User data:', backendUser)
          
          // PocketBase authStore.save() expects a proper record object
          // We need to pass the user data in the format PocketBase expects
          const recordModel = {
            id: backendUser.id,
            email: backendUser.email,
            name: backendUser.name,
            wallet: backendUser.wallet,
            collectionId: '_pb_users_auth_',
            collectionName: 'users'
          }
          
          const pb = createClient()
          pb.authStore.save(realToken, recordModel)

          console.log('Real JWT saved, authStore.isValid:', pb.authStore.isValid)
          console.log('AuthStore record:', pb.authStore.record)
          console.log('AuthStore token:', pb.authStore.token)

          // ALSO save to localStorage directly (client.ts onChange handler will sync cookie)
          localStorage.setItem('pocketbase_auth', JSON.stringify({
            token: realToken,
            model: recordModel
          }))

          // EXPLICITLY set the cookie to ensure middleware can read it
          // (onChange handler might not fire before redirect)
          document.cookie = `pb_auth=${realToken}; path=/; max-age=${7 * 86400}; SameSite=Lax`
          console.log('Cookie set explicitly')
          
          // Verify cookie was set
          const cookieValue = document.cookie.split(';').find(c => c.trim().startsWith('pb_auth='))
          console.log('Cookie verification:', !!cookieValue)

          // Apply referral code after successful authentication
          const pendingReferralCode = sessionStorage.getItem('pending_referral_code')
          if (pendingReferralCode && backendUser?.id) {
            try {
              const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
              const response = await fetch(`${pbUrl}/api/referrals/apply`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': realToken
                },
                body: JSON.stringify({
                  referral_code: pendingReferralCode,
                  user_id: backendUser.id
                })
              })
              
              const result = await response.json()
              console.log('Referral result:', result)
              
              if (result.success) {
                console.log('Referral applied successfully:', result.data?.referrer_name)
              } else {
                console.log('Referral failed:', result.error?.message)
              }
            } catch (error) {
              console.error('Failed to apply referral:', error)
            } finally {
              sessionStorage.removeItem('pending_referral_code')
            }
          }

          const redirectTo = sessionStorage.getItem('redirectTo') || '/dashboard'
          console.log('Redirecting to:', redirectTo)
          sessionStorage.removeItem('redirectTo')

          window.location.href = redirectTo
          return
        } catch (err) {
          console.error('Failed to process token-based auth:', err)
          setError('Authentication failed. Please try again.')
          setStatus('error')
          return
        }
      }

      // Format 1: Local/dev callback sends email + password
      if (!email || !password) {
        console.log('No auth params found, redirecting to /auth/login')
        console.log('Full URL params:', window.location.search)
        router.replace('/auth/login')
        return
      }

      setStatus('loading')
      console.log('Calling authWithPassword...')
      const pb = createClient()
      try {
        const authData = await pb.collection('users').authWithPassword(email, password)
        console.log('authWithPassword SUCCESS, user:', authData.record?.id)
        document.cookie = `pb_auth=${authData.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
        
        // Wait for browser to commit cookie before navigation
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const redirectTo = sessionStorage.getItem('redirectTo') || '/dashboard'
        console.log('Redirecting to:', redirectTo)
        sessionStorage.removeItem('redirectTo')

        window.location.href = redirectTo
      } catch (err) {
        console.error('AuthWithPassword failed:', err)
        console.error('Error details:', err.message, err.status, err.response)
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
