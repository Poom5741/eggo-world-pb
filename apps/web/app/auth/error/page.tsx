'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()

  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  const getErrorTitle = () => {
    if (errorCode === 'otp_expired') return 'LINK EXPIRED'
    if (error === 'access_denied' || errorCode === 'otp_invalid') return 'INVALID LINK'
    return 'SOMETHING WENT WRONG'
  }

  const getErrorMessage = () => {
    if (errorDescription) {
      return errorDescription.replace(/\+/g, ' ')
    }
    if (errorCode === 'otp_expired') return 'Your email confirmation link has expired. Please try again.'
    if (error === 'access_denied' || errorCode === 'otp_invalid') return 'The confirmation link is invalid. Please try again.'
    return 'An unexpected error occurred. Please try again.'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card border-4 border-accent/50 p-8 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto bg-accent/20 border-4 border-accent flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="font-[var(--font-pixel)] text-xl text-accent">
              {getErrorTitle()}
            </h1>
            <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground leading-relaxed">
              {getErrorMessage()}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Link 
              href="/auth/login"
              className="font-[var(--font-pixel)] text-xs text-foreground hover:text-primary transition-colors"
            >
              BACK TO LOGIN
            </Link>
            <Link 
              href="/auth/sign-up"
              className="font-[var(--font-pixel)] text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              CREATE NEW ACCOUNT
            </Link>
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
      <ErrorContent />
    </Suspense>
  )
}