import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'

let pb: PocketBase | null = null

export function createClient(): PocketBase {
  if (!pb) {
    pb = new PocketBase(POCKETBASE_URL)

    // Load auth from localStorage if available (for OAuth redirects)
    if (typeof window !== 'undefined') {
      // Step 1: Try localStorage first
      const stored = localStorage.getItem('pocketbase_auth')
      if (stored) {
        try {
          const { token, model } = JSON.parse(stored)
          pb.authStore.save(token, model)
        } catch {
          localStorage.removeItem('pocketbase_auth')
        }
      }

      // Step 2: Fallback to pb_auth cookie if localStorage is empty
      // This handles direct page access where cookie exists but localStorage might be out of sync
      if (!pb.authStore.token) {
        const cookieName = 'pb_auth='
        const cookies = document.cookie.split(';')
        const pbAuthCookie = cookies.find(cookie => {
          const trimmed = cookie.trim()
          return trimmed.startsWith(cookieName)
        })
        
        if (pbAuthCookie) {
          const token = pbAuthCookie.substring(cookieName.length).trim()
          if (token) {
            // Attempt to reload user data with the cookie token
            // This is a best-effort attempt; if it fails, auth will still work via onChange
            console.log('[PocketBase] Restored auth from cookie')
            // We don't save the model yet - it will be populated via onChange when user data is fetched
            pb.authStore.save(token, null)
          }
        }
      }

      // Subscribe to authStore changes to sync with localStorage and cookie
      pb.authStore.onChange((token, model) => {
        if (token && model) {
          // บันทึก auth ใน localStorage สำหรับ client-side
          localStorage.setItem('pocketbase_auth', JSON.stringify({ token, model }))
          // ตั้งค่า cookie pb_auth เพื่อให้ middleware อ่านได้
          document.cookie = `pb_auth=${token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
        } else {
          localStorage.removeItem('pocketbase_auth')
          // ลบ cookie เมื่อ logout
          document.cookie = 'pb_auth=; path=/; max-age=0'
        }
      })
    }
  }
  return pb
}

export function getAuthStore() {
  const client = createClient()
  return client.authStore
}

export function isAuthenticated(): boolean {
  const client = createClient()
  const hasToken = !!client.authStore.token
  const hasModel = !!client.authStore.model?.id || !!client.authStore.record?.id
  return hasToken && hasModel
}

export function getUser() {
  const client = createClient()
  return client.authStore.record || client.authStore.model
}

// NEW: Restore user model from token
export async function restoreAuth(client: PocketBase): Promise<boolean> {
  if (!client.authStore.token) {
    return false
  }
  
  if (client.authStore.record?.id) {
    return true // Already has user data
  }
  
  try {
    // Refresh auth to get user model from token
    const refreshedRecord = await client.collection('users').authRefresh()
    console.log('[PocketBase] Auth restored:', refreshedRecord.record?.id)
    return !!refreshedRecord.record?.id
  } catch (error) {
    console.warn('[PocketBase] Auth refresh failed:', error)
    // Token is invalid - clear auth
    client.authStore.clear()
    return false
  }
}

export function logout() {
  const client = createClient()
  client.authStore.clear()
  
  // ลบ auth data ออกจาก localStorage และ cookie
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pocketbase_auth')
    document.cookie = 'pb_auth=; path=/; max-age=0'
  }
}