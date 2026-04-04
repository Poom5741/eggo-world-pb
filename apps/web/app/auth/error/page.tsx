'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
        {/* Error card - Clay variant with accent border */}
        <Card variant="clay" className={cn(
          'shadow-clay-lg text-center',
          'border-2 border-accent/50'
        )}>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className={cn(
                'w-16 h-16 rounded-clay-lg shadow-clay-md',
                'bg-accent/20',
                'flex items-center justify-center'
              )}>
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <CardTitle className="font-[var(--font-pixel)] text-xl text-accent">
                {getErrorTitle()}
              </CardTitle>
              <CardDescription className="font-[var(--font-pixel)] text-[10px] leading-relaxed">
                {getErrorMessage()}
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                variant="clay-secondary"
                size="clay-md"
                className="w-full"
                asChild
              >
                <Link href="/auth/login">
                  BACK TO LOGIN
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="clay-md"
                className="w-full"
                asChild
              >
                <Link href="/auth/sign-up">
                  CREATE NEW ACCOUNT
                </Link>
              </Button>
            </div>
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
      <ErrorContent />
    </Suspense>
  )
}