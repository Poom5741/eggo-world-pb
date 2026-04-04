import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('LINE Login Page - No Email Option', () => {
  const filePath = join(process.cwd(), 'app/auth/line/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('does NOT contain email login option text', () => {
    expect(content).not.toContain('OR USE EMAIL')
  })

  it('does NOT contain email login link', () => {
    expect(content).not.toContain('href="/auth/login"')
  })

  it('does NOT have divider section', () => {
    expect(content).not.toContain('className="divider"')
  })

  it('contains LOGIN title (not LINE LOGIN)', () => {
    // The main page state (idle) shows LOGIN title
    // The loading state shows PROCESSING... — both h1 elements exist in source
    expect(content).toContain('>LOGIN<')
    expect(content).not.toContain('>LINE LOGIN<')
  })

  it('contains CONTINUE WITH LINE subtitle', () => {
    expect(content).toContain('CONTINUE WITH LINE')
  })

  it('contains LINE login button', () => {
    expect(content).toContain('LOGIN WITH LINE')
  })

  it('uses production PocketBase URL', () => {
    expect(content).toContain('PRODUCTION_PB_URL')
    expect(content).toContain('https://pb.eggoworld.io')
  })
})
