'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

function ErrorContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  const isExpiredLink = errorCode === 'otp_expired'
  const isInvalidLink = error === 'access_denied' || errorCode === 'otp_invalid'

  const getErrorTitle = () => {
    if (isExpiredLink) return 'LINK EXPIRED'
    if (isInvalidLink) return 'INVALID LINK'
    return 'SOMETHING WENT WRONG'
  }

  const getErrorMessage = () => {
    if (errorDescription) {
      return errorDescription.replace(/\+/g, ' ')
    }
    if (isExpiredLink) return 'Your email confirmation link has expired. Please request a new one.'
    if (isInvalidLink) return 'The confirmation link is invalid. Please request a new one.'
    return 'An unexpected error occurred. Please try again.'
  }

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      setResendSuccess(true)
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Failed to resend email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card border-4 border-accent/50 p-8 space-y-6 text-center">
          {/* Error Icon */}
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

          {/* Title */}
          <div className="space-y-2">
            <h1 className="font-[var(--font-pixel)] text-xl text-accent">
              {getErrorTitle()}
            </h1>
            <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground leading-relaxed">
              {getErrorMessage()}
            </p>
          </div>

          {/* Resend Form (for expired/invalid links) */}
          {(isExpiredLink || isInvalidLink) && !resendSuccess && (
            <form onSubmit={handleResendEmail} className="space-y-4">
              <div className="bg-secondary/30 border-2 border-primary/30 p-4 space-y-3">
                <p className="font-[var(--font-pixel)] text-[10px] text-foreground">
                  ENTER YOUR EMAIL TO RESEND CONFIRMATION
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-background border-2 border-primary/30 px-3 py-2 font-[var(--font-pixel)] text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                {resendError && (
                  <p className="font-[var(--font-pixel)] text-[10px] text-accent">
                    {resendError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isResending}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-[var(--font-pixel)] text-xs px-6 py-3 border-2 border-primary transition-all"
              >
                {isResending ? 'SENDING...' : 'RESEND CONFIRMATION EMAIL'}
              </button>
            </form>
          )}

          {/* Success Message */}
          {resendSuccess && (
            <div className="bg-green-500/20 border-2 border-green-500 p-4">
              <p className="font-[var(--font-pixel)] text-[10px] text-green-400">
                CONFIRMATION EMAIL SENT! CHECK YOUR INBOX.
              </p>
            </div>
          )}

          {/* Navigation Links */}
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
