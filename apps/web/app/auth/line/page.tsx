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
    // รับ auth data จาก line-callback.html (ผ่าน URL params)
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email')
    const password = params.get('password')

    // ถ้าไม่มี email/password → redirect ไป login (ป้องกัน direct navigation)
    if (!email || !password) {
      router.replace('/auth/login')
      return
    }

    setStatus('loading')
    const pb = createClient()
    pb.collection('users').authWithPassword(email, password)
      .then((authData) => {
        // authStore.onChange จะ sync cookie pb_auth ให้อัตโนมัติ
        // ตั้งค่า cookie ซ้ำเพื่อให้แน่ใจ middleware อ่านได้ก่อน redirect
        document.cookie = `pb_auth=${authData.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`

        // อ่าน redirectTo จาก sessionStorage และลบออกหลังใช้งาน (per D-03)
        const redirectTo = sessionStorage.getItem('redirectTo') || '/'
        sessionStorage.removeItem('redirectTo')

        router.replace(redirectTo)
      })
      .catch((_err) => {
        setError('Authentication failed. Please try again.')
        setStatus('error')  // แสดง error state พร้อม retry link
      })
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
