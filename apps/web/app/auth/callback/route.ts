import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  // Handle errors from Supabase (e.g., expired links)
  if (error || errorCode) {
    const errorParams = new URLSearchParams()
    if (error) errorParams.set('error', error)
    if (errorCode) errorParams.set('error_code', errorCode)
    if (errorDescription) errorParams.set('error_description', errorDescription)
    
    return NextResponse.redirect(`${origin}/auth/error?${errorParams.toString()}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successfully confirmed - redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    // Exchange failed - redirect to error page
    return NextResponse.redirect(
      `${origin}/auth/error?error=exchange_failed&error_description=${encodeURIComponent('Failed to confirm email. Please try again.')}`
    )
  }

  // No code provided - redirect to error page
  return NextResponse.redirect(
    `${origin}/auth/error?error=missing_code&error_description=${encodeURIComponent('Invalid confirmation link.')}`
  )
}
