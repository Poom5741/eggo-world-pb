'use client'

import { createClient, isAuthenticated, getUser } from '@/lib/pocketbase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import Image from 'next/image'

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<any>(null)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/')
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const verifyResponse = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      })

      const verifyData = await verifyResponse.json()
      if (!verifyData.success) {
        throw new Error('CAPTCHA verification failed. Please try again.')
      }

      const pb = createClient()
      await pb.collection('users').authWithPassword(email, password)

      router.push('/')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      if (turnstileRef.current) {
        turnstileRef.current.reset()
        setTurnstileToken(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card">
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

          <div className="space-y-2 text-center mb-6">
            <h1 className="font-[var(--font-pixel)] text-sm text-primary">LOGIN</h1>
            <p className="label">ENTER YOUR CREDENTIALS</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="label">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <label className="label">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <div className="flex justify-center py-2">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => {
                  setError('CAPTCHA failed. Please try again.')
                  setTurnstileToken(null)
                }}
                onExpire={() => {
                  setTurnstileToken(null)
                }}
              />
            </div>

            {error && (
              <div className="info-error">
                <p className="font-[var(--font-pixel)] text-[10px] text-accent">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>

          <div className="divider">
            <p className="label text-center">
              DON&apos;T HAVE AN ACCOUNT?{' '}
              <a href="/auth/sign-up" className="text-primary hover:underline">
                SIGN UP
              </a>
            </p>
          </div>

          <div className="pt-4 text-center">
            <p className="label text-center mb-2">OR LOGIN WITH</p>
            <a
              href="/auth/line"
              className="inline-flex items-center gap-2 bg-[#00C300] hover:bg-[#00a300] text-white font-[var(--font-pixel)] text-xs px-6 py-3"
            >
              LINE
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}