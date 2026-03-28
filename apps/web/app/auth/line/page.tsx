'use client'

import { createClient, isAuthenticated } from '@/lib/pocketbase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function LineLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/')
    }
  }, [router])

  const handleLineLogin = async () => {
    setError(null)
    try {
      const pb = createClient()
      const authMethods = await pb.collection('users').listAuthMethods()
      const providers = authMethods.oauth2?.providers || []
      
      const provider = providers.find(p => p.name === 'oidc' || p.name === 'line')
      
      if (!provider) {
        throw new Error('LINE OAuth provider not configured. Please contact support.')
      }

      const redirectUrl = `${window.location.origin}/auth/callback`
      const authUrl = provider.authURL + encodeURIComponent(redirectUrl)
      
      localStorage.setItem('oauth_provider', provider.name)
      localStorage.setItem('oauth_state', provider.state)
      localStorage.setItem('oauth_code_verifier', provider.codeVerifier)
      
      window.location.href = authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate LINE login')
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
            <h1 className="font-[var(--font-pixel)] text-sm text-primary">LINE LOGIN</h1>
            <p className="label">CONTINUE WITH LINE</p>
          </div>

          {error && (
            <div className="info-error mb-4">
              <p className="font-[var(--font-pixel)] text-[10px] text-accent">{error}</p>
            </div>
          )}

          <button
            onClick={handleLineLogin}
            className="w-full bg-[#00C300] hover:bg-[#00a300] text-white font-[var(--font-pixel)] text-xs px-8 py-4 flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .349-.281.63-.63.63-.245 0-.436-.143-.54-.336l-1.086-1.92-1.086 1.92c-.104.193-.295.336-.54.336-.349 0-.63-.281-.63-.63 0-.12.035-.233.094-.329l1.44-2.535-1.44-2.535c-.059-.096-.094-.209-.094-.329 0-.349.281-.63.63-.63.245 0 .436.143.54.336l1.086 1.92 1.086-1.92c.104-.193.295-.336.54-.336.349 0 .63.281.63.63 0 .12-.035.233-.094.329l-1.44 2.535 1.44 2.535c.059.096.094.209.094.329zm-5.25-3.016c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H8.505v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H7.875c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H8.505v1.125h1.755zm-4.455 0c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H4.065v1.125h1.739c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H3.435c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.369c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H4.065v1.125h1.739z"/>
            </svg>
            LOGIN WITH LINE
          </button>

          <div className="divider">
            <p className="label text-center">
              OR USE{' '}
              <a href="/auth/login" className="text-primary hover:underline">
                EMAIL
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}