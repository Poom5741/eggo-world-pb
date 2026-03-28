'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient, isAuthenticated, getUser } from '@/lib/pocketbase/client'
import Image from 'next/image'
import Dashboard from '@/components/dashboard'
import { Header } from '@/components/header'
import { Suspense } from 'react'

function PageContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
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

    const pb = createClient()
    
    if (isAuthenticated()) {
      setUser(getUser())
      setLoading(false)
    } else {
      setLoading(false)
    }

    pb.authStore.onChange(() => {
      if (isAuthenticated()) {
        setUser(getUser())
      } else {
        setUser(null)
      }
    })
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-foreground">LOADING...</p>
      </div>
    )
  }

  if (user) {
    return <Dashboard />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <section className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <Image
                src="/eggoworld-logo.svg"
                alt="EggoWorld"
                width={96}
                height={96}
                priority
                loading="eager"
                className="pixelated animate-float"
              />
            </div>

            <div className="space-y-4">
              <h1 className="font-[var(--font-pixel)] text-3xl md:text-4xl text-foreground">
                WELCOME TO EGGOWORLD
              </h1>
              <p className="font-[var(--font-pixel)] text-xs md:text-sm text-muted-foreground leading-relaxed">
                PREPARE YOUR WALLET AND SECURE YOUR UNIQUE EGG NFT
              </p>
            </div>

            <div className="bg-secondary/30 border-4 border-primary/50 p-8 space-y-6 max-w-md mx-auto">
              <div className="space-y-4">
                <h2 className="font-[var(--font-pixel)] text-sm text-primary">HOW IT WORKS</h2>
                <ul className="space-y-3 text-xs font-[var(--font-pixel)] text-foreground text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">01</span>
                    <span>Create your account and receive a unique wallet address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">02</span>
                    <span>Send 25 USDT to your wallet address on Binance Smart Chain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">03</span>
                    <span>Submit your transaction hash and verify the transfer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">04</span>
                    <span>Receive your Egg NFT + Food NFT + 30-Day Membership</span>
                  </li>
                </ul>
              </div>

              <div className="border-t-2 border-primary/30 pt-6 space-y-3">
                <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground">PRICE PER NFT</p>
                <p className="font-[var(--font-pixel)] text-3xl text-primary">25 USDT</p>
                <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground">on Binance Smart Chain (BEP20)</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/auth/login"
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-[var(--font-pixel)] text-xs px-8 py-4 border-4 border-secondary transition-all"
              >
                LOGIN
              </a>
              <a
                href="/auth/sign-up"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-[var(--font-pixel)] text-xs px-8 py-4 border-4 border-primary transition-all"
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