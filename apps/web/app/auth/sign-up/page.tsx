'use client'

import { isAuthenticated } from '@/lib/pocketbase/client'
import { initiateGoogleLogin } from '@/lib/auth/google-oauth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [referrer, setReferrer] = useState('')
  const redirectTo = searchParams.get('redirectTo')  // อ่าน redirectTo จาก URL params

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/')
    }
    
    // Check for referrer in URL params
    const referrerParam = searchParams.get('referrer')
    if (referrerParam) {
      setReferrer(referrerParam)
      // Store in sessionStorage for OAuth flow
      sessionStorage.setItem('referrer', referrerParam)
    }
  }, [router, searchParams])

  const handleSignUp = async () => {
    // console.error('=== SIGN UP BUTTON CLICKED ===')
    // console.error('referrer:', referrer)
    // console.error('redirectTo:', redirectTo)
    
    try {
      // เรียก Google OAuth โดยตรง — ไม่ต้อง navigate ไป /auth/google ก่อน (per D-01)
      await initiateGoogleLogin({ referrer: referrer || undefined, redirectTo: redirectTo || '/dashboard' })
    } catch (error) {
      console.error('Google sign-up failed:', error)
      // Error is already logged in initiateGoogleLogin
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Auth form card - Clay LG variant */}
        <Card variant="clay-lg" className="shadow-clay-xl">
          <CardHeader className="text-center">
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
            <CardTitle className="font-body text-xl text-primary">
              CREATE ACCOUNT
            </CardTitle>
            <CardDescription className="font-body text-xs">
              JOIN EGGOWORLD WITH GOOGLE
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {referrer && (
              <div className={cn(
                'rounded-clay-sm bg-primary/10 p-3',
                'shadow-clay-sm'
              )}>
                <p className="font-body text-[10px] text-primary text-center">
                  REFERRER: {referrer.substring(0, 10)}...
                </p>
              </div>
            )}
            <Button
              onClick={handleSignUp}
              variant="google"
              size="clay-lg"
              className="w-full"
            >
              <svg viewBox="0 0 48 48" className="w-8 h-8">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              SIGN UP WITH GOOGLE
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-foreground">LOADING...</p>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}