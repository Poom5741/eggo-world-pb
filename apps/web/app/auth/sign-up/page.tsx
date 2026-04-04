'use client'

import { isAuthenticated } from '@/lib/pocketbase/client'
import { initiateLineLogin } from '@/lib/auth/line-oauth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'

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
            <h1 className="font-[var(--font-pixel)] text-sm text-primary">CREATE ACCOUNT</h1>
            <p className="label">JOIN EGGOWORLD WITH LINE</p>
          </div>

          {referrer && (
            <div className="info-error mb-4">
              <p className="font-[var(--font-pixel)] text-[10px] text-primary">
                REFERRER: {referrer.substring(0, 10)}...
              </p>
            </div>
          )}

          <div className="pt-4 text-center">
            <button
              onClick={handleSignUp}
              className="inline-flex items-center gap-2 bg-[#00C300] hover:bg-[#00a300] text-white font-[var(--font-pixel)] text-xs px-6 py-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .349-.281.63-.63.63-.245 0-.436-.143-.54-.336l-1.086-1.92-1.086 1.92c-.104.193-.295.336-.54.336-.349 0-.63-.281-.63-.63 0-.12.035-.233.094-.329l1.44-2.535-1.44-2.535c-.059-.096-.094-.209-.094-.329 0-.349.281-.63.63-.63.245 0 .436.143.54.336l1.086 1.92 1.086-1.92c.104-.193.295-.336.54-.336.349 0 .63.281.63.63 0 .12-.035.233-.094.329l-1.44 2.535 1.44 2.535c.059.096.094.209.094.329zm-5.25-3.016c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H8.505v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H7.875c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H8.505v1.125h1.755zm-4.455 0c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H4.065v1.125h1.739c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H3.435c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.369c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H4.065v1.125h1.739z"/>
              </svg>
              SIGN UP WITH LINE
            </button>
          </div>
        </div>
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