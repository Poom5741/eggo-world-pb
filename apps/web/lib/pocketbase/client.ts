import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'

let pb: PocketBase | null = null

export function createClient(): PocketBase {
  if (!pb) {
    pb = new PocketBase(POCKETBASE_URL)
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
}