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
        } catch {
          localStorage.removeItem('pocketbase_auth')
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
  const hasToken = client.authStore.token
  const hasModel = !!client.authStore.model?.id || !!client.authStore.record?.id
  return hasToken && hasModel
}

export function getUser() {
  const client = createClient()
  return client.authStore.record || client.authStore.model
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