import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'

let pb: PocketBase | null = null

export function createClient(): PocketBase {
  if (!pb) {
    pb = new PocketBase(POCKETBASE_URL)

    // Load auth from localStorage if available (for OAuth redirects)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pocketbase_auth')
      if (stored) {
        try {
          const { token, model } = JSON.parse(stored)
          pb.authStore.save(token, model)
        } catch (e) {
          localStorage.removeItem('pocketbase_auth')
        }
      }

      // Subscribe to authStore changes to sync with localStorage
      pb.authStore.onChange((token, model) => {
        if (token && model) {
          localStorage.setItem('pocketbase_auth', JSON.stringify({ token, model }))
        } else {
          localStorage.removeItem('pocketbase_auth')
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
  return client.authStore.isValid
}

export function getUser() {
  const client = createClient()
  return client.authStore.record
}

export function logout() {
  const client = createClient()
  client.authStore.clear()
  
  // Clear localStorage auth data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pocketbase_auth')
  }
}