'use client'

import { isAuthenticated } from '@/lib/pocketbase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/')
    }
  }, [router])

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

          <div className="pt-4 text-center">
            <a
              href="/auth/line"
              className="inline-flex items-center gap-2 bg-[#00C300] hover:bg-[#00a300] text-white font-[var(--font-pixel)] text-xs px-6 py-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .349-.281.63-.63.63-.245 0-.436-.143-.54-.336l-1.086-1.92-1.086 1.92c-.104.193-.295.336-.54.336-.349 0-.63-.281-.63-.63 0-.12.035-.233.094-.329l1.44-2.535-1.44-2.535c-.059-.096-.094-.209-.094-.329 0-.349.281-.63.63-.63.245 0 .436.143.54.336l1.086 1.92 1.086-1.92c.104-.193.295-.336.54-.336.349 0 .63.281.63.63 0 .12-.035.233-.094.329l-1.44 2.535 1.44 2.535c.059.096.094.209.094.329zm-5.25-3.016c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H8.505v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H7.875c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H8.505v1.125h1.755zm-4.455 0c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H4.065v1.125h1.739c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H3.435c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.369c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H4.065v1.125h1.739z"/>
              </svg>
              SIGN UP WITH LINE
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}