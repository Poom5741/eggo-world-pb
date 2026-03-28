'use client'

import { createClient } from '@/lib/pocketbase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setStatus('error')
        setError(searchParams.get('error_description') || errorParam)
        return
      }

      if (!code) {
        setStatus('error')
        setError('No authorization code received')
        return
      }

      const redirectUrl = `${window.location.origin}/auth/callback`

      try {
        // Use direct API call (same as working HTML)
        const pb = createClient()
        const response = await fetch(`${pb.baseUrl}/api/collections/users/auth-with-oauth2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'oidc',
            code: code,
            codeVerifier: '',
            redirectURL: redirectUrl,
            createData: { emailVisibility: false }
          })
        })

        const authData = await response.json()
        console.log('Auth response:', authData)

        if (!response.ok) {
          throw new Error(authData.message || 'Authentication failed')
        }

        // Save auth to PocketBase client
        pb.authStore.save(authData.token, authData.record)

        setStatus('success')
        setTimeout(() => router.push('/'), 1500)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Authentication failed')
        console.error('Auth error:', err)
      }
    }

    handleCallback()
  }, [searchParams, router])

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

          {status === 'loading' && (
            <>
              <div className="animate-pulse">
                <h1 className="font-[var(--font-pixel)] text-sm text-primary">PROCESSING...</h1>
              </div>
              <p className="label mt-4">COMPLETING LOGIN</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="font-[var(--font-pixel)] text-sm text-primary">SUCCESS!</h1>
              <p className="label mt-4">REDIRECTING...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="font-[var(--font-pixel)] text-sm text-accent">ERROR</h1>
              <p className="label mt-4">{error}</p>
              <a href="/auth/login" className="btn-primary inline-block mt-6">
                TRY AGAIN
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}