'use client'

import { isAuthenticated } from '@/lib/pocketbase/client'
import { initiateLineLogin } from '@/lib/auth/line-oauth'
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

  const handleSignUp = () => {
    console.log('=== SIGN UP BUTTON CLICKED ===')
    console.log('referrer:', referrer)
    console.log('redirectTo:', redirectTo)
    // ตั้งค่า default redirect ไป /dashboard สำหรับ sign-up flow
    if (!redirectTo) {
      sessionStorage.setItem('redirectTo', '/dashboard')
    }
    // เรียก LINE OAuth โดยตรง — ไม่ต้อง navigate ไป /auth/line ก่อน (per D-01)
    initiateLineLogin({ referrer: referrer || undefined, redirectTo: redirectTo || '/dashboard' })
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
            <CardTitle className="font-[var(--font-pixel)] text-xl text-primary">
              CREATE ACCOUNT
            </CardTitle>
            <CardDescription className="font-[var(--font-pixel)] text-xs">
              JOIN EGGOWORLD WITH LINE
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {referrer && (
              <div className={cn(
                'rounded-clay-sm bg-primary/10 p-3',
                'shadow-clay-sm'
              )}>
                <p className="font-[var(--font-pixel)] text-[10px] text-primary text-center">
                  REFERRER: {referrer.substring(0, 10)}...
                </p>
              </div>
            )}
            <Button
              onClick={handleSignUp}
              variant="line"
              size="clay-lg"
              className="w-full"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .349-.281.63-.63.63-.245 0-.436-.143-.54-.336l-1.086-1.92-1.086 1.92c-.104.193-.295.336-.54.336-.349 0-.63-.281-.63-.63 0-.12.035-.233.094-.329l1.44-2.535-1.44-2.535c-.059-.096-.094-.209-.094-.329 0-.349.281-.63.63-.63.245 0 .436.143.54.336l1.086 1.92 1.086-1.92c.104-.193.295-.336.54-.336.349 0 .63.281.63.63 0 .12-.035.233-.094.329l-1.44 2.535 1.44 2.535c.059.096.094.209.094.329zm-5.25-3.016c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H8.505v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H7.875c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H8.505v1.125h1.755zm-4.455 0c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H4.065v1.125h1.739c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H3.435c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.369c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H4.065v1.125h1.739z"/>
              </svg>
              SIGN UP WITH LINE
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
        <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}