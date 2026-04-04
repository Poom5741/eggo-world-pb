'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/pocketbase/client'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Suspense } from 'react'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function PageContent() {
  // isHydrated = true เมื่อ component mount แล้ว (client-side เท่านั้น)
  const isHydrated = useIsHydrated()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // ตรวจ error params จาก OAuth callback
    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    
    if (error || errorCode) {
      const params = new URLSearchParams()
      if (error) params.set('error', error)
      if (errorCode) params.set('error_code', errorCode)
      const errorDescription = searchParams.get('error_description')
      if (errorDescription) params.set('error_description', errorDescription)
      
      router.replace(`/auth/error?${params.toString()}`)
      return
    }

    // สร้าง PocketBase client และโหลด auth จาก localStorage
    const pb = createClient()

    // ตั้งค่า user จาก authStore หลัง hydration
    const user = pb.authStore.record

    if (user) {
      // ถ้า login อยู่แล้ว redirect ไป dashboard
      router.replace('/dashboard')
    } else {
      setCheckingAuth(false)
    }

    // ฟัง authStore onChange เพื่อ re-render เมื่อ auth state เปลี่ยน
    const unsubscribe = pb.authStore.onChange((token) => {
      if (token) {
        router.replace('/dashboard')
      } else {
        setCheckingAuth(false)
      }
    })

    return () => {
      // Cleanup listener เมื่อ component unmount
      unsubscribe()
    }
  }, [searchParams, router])

  // แสดง loading จนกว่าจะเช็ค auth เสร็จ
  if (!isHydrated || checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <section className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
          {/* Clay gradient orbs for depth */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary/5 rounded-clay-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-clay-full blur-3xl" />
          
          <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
            <div className="flex justify-center">
              <div className={cn(
                'relative mx-auto w-32 h-32 md:w-40 md:h-40',
                'rounded-clay-xl shadow-clay-2xl',
                'bg-gradient-to-br from-card to-card/50',
                'p-4'
              )}>
                <Image
                  src="/eggoworld-logo.svg"
                  alt="EggoWorld"
                  width={96}
                  height={96}
                  priority
                  loading="eager"
                  className="pixelated animate-float w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="font-[var(--font-pixel)] text-3xl md:text-4xl text-foreground">
                WELCOME TO EGGOWORLD
              </h1>
              <p className="font-[var(--font-pixel)] text-xs md:text-sm text-muted-foreground leading-relaxed">
                PREPARE YOUR WALLET AND SECURE YOUR UNIQUE EGG NFT
              </p>
            </div>

            {/* How it works - Clay container */}
            <Card variant="clay-lg" className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="font-[var(--font-pixel)] text-sm text-primary text-center">
                  HOW IT WORKS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-xs font-[var(--font-pixel)] text-foreground text-left">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">01</span>
                    <span>Create your account and receive a unique wallet address</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">02</span>
                    <span>Send 25 USDT to your wallet address on Binance Smart Chain</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">03</span>
                    <span>Submit your transaction hash and verify the transfer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">04</span>
                    <span>Receive your Egg NFT + Food NFT + 30-Day Membership</span>
                  </li>
                </ul>

                <div className="border-t border-primary/20 pt-6 space-y-3 text-center">
                  <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground">PRICE PER NFT</p>
                  <p className="font-[var(--font-pixel)] text-4xl text-primary">25 USDT</p>
                  <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground">on Binance Smart Chain (BEP20)</p>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons - Clay styling */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/auth/login"
                className={cn(
                  'inline-flex items-center justify-center',
                  'font-[var(--font-pixel)] text-xs px-8 py-4',
                  'rounded-clay-lg shadow-clay-xl',
                  'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
                  'transition-all duration-300 hover:shadow-clay-2xl'
                )}
              >
                LOGIN
              </a>
              <a
                href="/auth/sign-up"
                className={cn(
                  'inline-flex items-center justify-center',
                  'font-[var(--font-pixel)] text-xs px-8 py-4',
                  'rounded-clay-lg shadow-clay-xl',
                  'bg-primary hover:bg-primary/90 text-primary-foreground',
                  'transition-all duration-300 hover:shadow-clay-2xl'
                )}
              >
                CREATE ACCOUNT
              </a>
            </div>
          </div>
        </section>
      </main>
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
      <PageContent />
    </Suspense>
  )
}