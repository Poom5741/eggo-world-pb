import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'

let pb: PocketBase | null = null

export function createClient(): PocketBase {
  if (!pb) {
    pb = new PocketBase(POCKETBASE_URL)

    // Add ngrok bypass header (required for free tier)
    if (POCKETBASE_URL.includes('ngrok')) {
      pb.beforeSend = function (url, options) {
        options.headers = options.headers || {}
        options.headers['ngrok-skip-browser-warning'] = 'true'
        return { url, options }
      }
    }

    // Load auth from localStorage if available (for OAuth redirects)
    if (typeof window !== 'undefined') {
      // Step 1: Try localStorage first
      const stored = localStorage.getItem('pocketbase_auth')
      if (stored) {
        try {
          const { token, record } = JSON.parse(stored)
          // PocketBase v0.25.2: use 'record' key (not 'model') for compat
          const model = record || JSON.parse(stored).model
          if (token && model?.id) {
            pb.authStore.save(token, model)
          }
        } catch {
          localStorage.removeItem('pocketbase_auth')
        }
      }

      // Step 2: Don't save token without model from cookie - it clears the model
      // Instead, rely on localStorage which is set by handleE2eLogin

      // Subscribe to authStore changes to sync with localStorage and cookie
      pb.authStore.onChange((token, model) => {
        if (token && model) {
          localStorage.setItem('pocketbase_auth', JSON.stringify({ token, record: model }))
          document.cookie = `pb_auth=${token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
        } else {
          localStorage.removeItem('pocketbase_auth')
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
  const record = client.authStore.record
  const model = client.authStore.model
  return record?.id ? record : model?.id ? model : null
}

// Restore user model from token or localStorage
export async function restoreAuth(client: PocketBase): Promise<boolean> {
  // First check localStorage for complete auth data
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('pocketbase_auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const record = parsed.record || parsed.model
        if (parsed.token && record?.id) {
          client.authStore.save(parsed.token, record)
          return true
        }
      } catch {}
    }
  }
  
  // Fallback: try to refresh auth with existing token
  if (client.authStore.token && !getUser()) {
    try {
      const refreshedRecord = await client.collection('users').authRefresh()
      const record = refreshedRecord?.record || refreshedRecord
      if (record?.id) {
        client.authStore.save(client.authStore.token, record)
        // console.error('[PocketBase] Auth restored via refresh:', record.id)
        return true
      }
    } catch (error) {
      console.warn('[PocketBase] Auth refresh failed:', error)
      client.authStore.clear()
      return false
    }
  }
  
  return !!getUser()
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