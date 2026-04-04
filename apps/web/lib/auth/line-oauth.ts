// lib/auth/line-oauth.ts
// Helper สำหรับเริ่มต้น LINE OAuth flow — แยกออกมาจาก /auth/line/page.tsx
// เพื่อให้ login และ sign-up page เรียกใช้ได้โดยตรง (ไม่ต้อง navigate ไป /auth/line ก่อน)

// URL ของ PocketBase production สำหรับ line-callback.html
const PRODUCTION_PB_URL = 'https://pb.eggoworld.io'
// LINE OAuth Client ID
const LINE_CLIENT_ID = '2009441873'

// สร้าง random string สำหรับ state parameter (ใช้ crypto.getRandomValues เพื่อความปลอดภัย)
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  
  // Try crypto.getRandomValues first (requires HTTPS or localhost)
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomValues = new Uint8Array(length)
      crypto.getRandomValues(randomValues)
      for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length]
      }
      console.log('Generated random string using crypto.getRandomValues')
      return result
    }
  } catch (err) {
    console.warn('crypto.getRandomValues failed, falling back to Math.random:', err)
  }
  
  // Fallback to Math.random for non-secure contexts
  console.log('Using Math.random fallback (not secure for production)')
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export interface LineLoginOptions {
  referrer?: string
  redirectTo?: string
}

export function initiateLineLogin(options: LineLoginOptions = {}): void {
  console.log('=== INITIATING LINE LOGIN ===')
  console.log('Options:', options)
  
  const { referrer, redirectTo } = options

  // returnUrl ต้องเป็น /auth/line เสมอ — line-callback.html อ่านค่านี้เพื่อ redirect กลับ
  // ห้ามเปลี่ยน! ดู apps/backend/pb_public/line-callback.html บรรทัด 65
  const returnUrl = `${window.location.origin}/auth/line`
  console.log('Return URL:', returnUrl)

  const stateData = {
    random: generateRandomString(16),
    returnUrl,                       // consumed by line-callback.html
    referrer: referrer ?? '',
    redirectTo: redirectTo ?? '',    // ค่านี้ line-callback.html ไม่ได้ใช้ เก็บไว้ใน state
  }
  const state = btoa(JSON.stringify(stateData))
  console.log('State data:', stateData)
  console.log('State (base64):', state)

  // บันทึกใน sessionStorage ก่อนออกจาก app (window.location.href จะ unload page)
  sessionStorage.setItem('oauth_state', state)
  if (redirectTo) sessionStorage.setItem('redirectTo', redirectTo)
  if (referrer) sessionStorage.setItem('referrer', referrer)
  console.log('SessionStorage set complete')

  // สร้าง LINE OAuth URL — redirect ไปที่ PocketBase line-callback.html
  const redirectUri = `${PRODUCTION_PB_URL}/line-callback.html`
  const authUrl =
    'https://access.line.me/oauth2/v2.1/authorize' +
    '?response_type=code' +
    `&client_id=${LINE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&scope=openid%20profile%20email' +
    `&state=${encodeURIComponent(state)}`

  console.log('Redirecting to LINE OAuth URL:')
  console.log(authUrl)
  console.log('=== REDIRECT NOW ===')

  window.location.href = authUrl
}
