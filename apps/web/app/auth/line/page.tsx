'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/pocketbase/client'

// Production PocketBase URL
const PRODUCTION_PB_URL = 'https://pb.eggoworld.io'
const LINE_CLIENT_ID = '2009441873'

// สร้าง random string สำหรับ state parameter
function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  return result
}

function LineLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  useEffect(() => {
    // รับ auth data ที่ส่งกลับมาจาก line-callback.html (ผ่าน URL params)
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email')
    const password = params.get('password')
    const userData = params.get('user')

    if (email && password) {
      setStatus('loading')
      // ใช้ PocketBase authWithPassword เพื่อรับ real JWT token
      const pb = createClient()
      pb.collection('users').authWithPassword(email, password)
        .then((authData) => {
          // authStore.onChange จะ sync cookie pb_auth และ localStorage อัตโนมัติ
          // ตั้งค่า cookie ซ้ำเพื่อให้แน่ใจ middleware อ่านได้ก่อน redirect
          document.cookie = `pb_auth=${authData.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
          router.replace('/')
        })
        .catch((_err) => {
          console.error('LINE auth error:', _err)
          setError('Authentication failed. Please try again.')
          setStatus('idle')
        })
      return
    }

    // Fallback: รับ token โดยตรง (legacy path)
    const token = params.get('token')
    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData))
        const pb = createClient()
        pb.authStore.save(token, user)
        document.cookie = `pb_auth=${token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
        router.replace('/')
      } catch {
        setError('Failed to restore session')
      }
    }
  }, [router])

  const handleLineLogin = async () => {
    setError(null)
    try {
      // ดึง referrer จาก URL หรือ sessionStorage
      const referrer = searchParams.get('referrer') || sessionStorage.getItem('referrer')
      
      // ฝัง returnUrl (frontend origin) ใน state เพื่อให้ line-callback.html redirect กลับมา
      const returnUrl = `${window.location.origin}/auth/line`
      const stateData = {
        random: generateRandomString(16),
        returnUrl: returnUrl,
        referrer: referrer || ''
      }
      const state = btoa(JSON.stringify(stateData))
      
      sessionStorage.setItem('oauth_state', state)
      if (referrer) {
        sessionStorage.setItem('referrer', referrer)
      }

      // สร้าง LINE OAuth URL — redirect ไปที่ PocketBase line-callback.html
      const redirectUri = `${PRODUCTION_PB_URL}/line-callback.html`
      const authUrl = 'https://access.line.me/oauth2/v2.1/authorize' +
        '?response_type=code' +
        '&client_id=' + LINE_CLIENT_ID +
        '&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&scope=openid%20profile%20email' +
        '&state=' + encodeURIComponent(state)

      console.log('Redirecting to LINE OAuth:', authUrl)
      window.location.href = authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate LINE login')
      console.error('LINE login error:', err)
    }
  }

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
