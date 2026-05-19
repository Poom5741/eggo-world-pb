// lib/auth/google-oauth.ts
// Handles Google OAuth login using PocketBase SDK's authWithOAuth2 method
// This uses the SDK's popup-based flow which handles everything automatically

import { createClient } from '@/lib/pocketbase/client'

export interface GoogleLoginOptions {
  referrer?: string
  redirectTo?: string
}

// Prevent concurrent OAuth requests
let isAuthenticating = false

export async function initiateGoogleLogin(options: GoogleLoginOptions = {}): Promise<void> {
  // Prevent double-clicks
  if (isAuthenticating) {
    console.warn('Google OAuth already in progress, ignoring duplicate click')
    return
  }
  
  isAuthenticating = true
  
  try {
    const { referrer, redirectTo } = options

    const pb = createClient()
    
    // Clear any stale auth data to prevent conflicts
    pb.authStore.clear()
    
    // Store redirect target for after successful auth
    if (redirectTo) {
      sessionStorage.setItem('redirectTo', redirectTo)
    }
    if (referrer) {
      sessionStorage.setItem('referrer', referrer)
    }

    // PocketBase SDK handles the entire OAuth2 flow:
    // 1. Opens popup with Google auth page
    // 2. User authenticates with Google
    // 3. Google redirects to PocketBase's /api/oauth2-redirect
    // 4. PocketBase exchanges code for tokens
    // 5. PocketBase creates/updates user
    // 6. SDK receives auth data and closes popup
    // 7. Returns authData with token and user record
    const authData = await pb.collection('users').authWithOAuth2({
      provider: 'google',
    })

    // console.error('✓ Google OAuth successful!')
    // console.error('User ID:', authData.record?.id)
    // console.error('Is new user:', authData.meta?.isNewUser)
    // console.error('Username:', authData.meta?.username)

    // Handle referral for new users
    const isNewUser = authData.meta?.isNewUser
    const storedReferrer = referrer || sessionStorage.getItem('referrer')
    
    if (isNewUser && storedReferrer && authData.record?.id) {
      // console.error('New user with referrer, applying referral...')
      const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
      
      try {
        const referralResponse = await fetch(`${pbUrl}/api/referrals/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          },
          body: JSON.stringify({
            referral_code: storedReferrer,
            user_id: authData.record.id
          })
        })
        
        const referralResult = await referralResponse.json()
        if (referralResult.success) {
          // console.error('✓ Referral applied:', referralResult.data?.referrer_name)
        } else {
          console.warn('Referral application failed:', referralResult.error?.message)
        }
      } catch (referralErr) {
        console.warn('Referral application error:', referralErr)
      }
    }

    // Clean up session storage
    sessionStorage.removeItem('referrer')
    
    // Redirect to dashboard or specified path
    const targetPath = redirectTo || sessionStorage.getItem('redirectTo') || '/dashboard'
    sessionStorage.removeItem('redirectTo')
    
    // console.error('Redirecting to:', targetPath)
    window.location.href = targetPath
    
  } catch (error) {
    console.error('Google OAuth failed:', error)
    
    // Check if user closed the popup (not a real error)
    if (error instanceof Error && error.message.includes('popup')) {
      // console.error('User closed the popup window')
      return
    }
    
    // Show error to user
    throw error
  } finally {
    // Reset auth guard
    isAuthenticating = false
  }
}