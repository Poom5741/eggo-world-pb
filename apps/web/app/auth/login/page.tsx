'use client'

import { isAuthenticated } from '@/lib/pocketbase/client'
import { initiateLineLogin } from '@/lib/auth/line-oauth'
import { isE2EEnvironment, getE2ETestUserFromParams, handleE2eLogin, E2E_TEST_USERS, E2ETestUser } from '@/lib/auth/e2e-auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsHydrated } from '@/hooks/use-is-hydrated'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  const [e2eLoading, setE2eLoading] = useState(false)
  const [e2eError, setE2eError] = useState<string | null>(null)
  const isHydrated = useIsHydrated()

  // Check E2E environment and test user (only after hydration)
  const showE2EButton = isHydrated && isE2EEnvironment()
  const testUserFromParams = isHydrated ? getE2ETestUserFromParams() : null

  useEffect(() => {
    if (isAuthenticated()) {
      router.push(redirectTo || '/dashboard')
    }
  }, [router, redirectTo])

  const handleLineLogin = async () => {
    // console.error('=== LOGIN BUTTON CLICKED ===')
    // console.error('redirectTo:', redirectTo)
    const targetPath = redirectTo || '/dashboard'
    
    try {
      await initiateLineLogin({ redirectTo: targetPath })
    } catch (error) {
      console.error('LINE login failed:', error)
      // Error is already logged in initiateLineLogin
      // Could show a toast notification here if needed
    }
  }

  const handleE2ELoginClick = async (testUser: E2ETestUser) => {
    setE2eLoading(true)
    setE2eError(null)

    try {
      await handleE2eLogin(testUser, redirectTo || undefined)
    } catch (error) {
      console.error('E2E login failed:', error)
      setE2eError(error instanceof Error ? error.message : 'E2E login failed')
      setE2eLoading(false)
    }
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
            <CardTitle className="font-body text-xl text-primary">
              LOGIN
            </CardTitle>
            <CardDescription className="font-body text-xs">
              LOGIN WITH LINE
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button
              onClick={handleLineLogin}
              variant="line"
              size="clay-lg"
              className="w-full"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .349-.281.63-.63.63-.245 0-.436-.143-.54-.336l-1.086-1.92-1.086 1.92c-.104.193-.295.336-.54.336-.349 0-.63-.281-.63-.63 0-.12.035-.233.094-.329l1.44-2.535-1.44-2.535c-.059-.096-.094-.209-.094-.329 0-.349.281-.63.63-.63.245 0 .436.143.54.336l1.086 1.92 1.086-1.92c.104-.193.295-.336.54-.336.349 0 .63.281.63.63 0 .12-.035.233-.094.329l1.44 2.535 1.44 2.535c.059.096.094.209.094.329zm-5.25-3.016c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H8.505v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H7.875c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H8.505v1.125h1.755zm-4.455 0c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H4.065v1.125h1.739c.349 0 .63.283.63.63 0 .344-.281.629-.63.629H3.435c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.369c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H4.065v1.125h1.739z"/>
              </svg>
              LOGIN WITH LINE
            </Button>

            {/* E2E Test Login Section */}
            {showE2EButton && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="text-center mb-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-600 text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.422-1.36 3.187 0l5.5 9.76c.75 1.325-.213 2.97-1.733 2.97H4.49c-1.523 0-2.483-1.645-1.733-2.97l5.5-9.76zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    TEST MODE
                  </span>
                </div>

                {testUserFromParams ? (
                  /* Single button for specified test user */
                  <Button
                    data-testid="e2e-login-button"
                    onClick={() => handleE2ELoginClick(testUserFromParams)}
                    disabled={e2eLoading}
                    variant="outline"
                    size="clay-lg"
                    className="w-full bg-yellow-500/5 hover:bg-yellow-500/10 border-yellow-500/20"
                  >
                    {e2eLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        AUTHENTICATING...
                      </span>
                    ) : (
                      <span>E2E LOGIN: {testUserFromParams.toUpperCase()}</span>
                    )}
                  </Button>
                ) : (
                  /* Buttons for all test users */
                  <div className="grid grid-cols-2 gap-2">
                    {E2E_TEST_USERS.map((user) => (
                      <Button
                        key={user}
                        data-testid={`e2e-login-button-${user}`}
                        onClick={() => handleE2ELoginClick(user)}
                        disabled={e2eLoading}
                        variant="outline"
                        size="sm"
                        className="bg-yellow-500/5 hover:bg-yellow-500/10 border-yellow-500/20 text-xs"
                      >
                        {user.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                )}

                {e2eError && (
                  <p className="mt-2 text-xs text-red-500 text-center">{e2eError}</p>
                )}
              </div>
            )}
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
        <p className="font-body text-foreground">LOADING...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}