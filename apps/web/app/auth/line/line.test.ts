import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('LINE Callback Handler - Pure Callback Only', () => {
  const filePath = join(process.cwd(), 'app/auth/line/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  const helperFilePath = join(process.cwd(), 'lib/auth/line-oauth.ts')
  const helperContent = readFileSync(helperFilePath, 'utf-8')

  it('does NOT contain LINE login button', () => {
    expect(content).not.toContain('LOGIN WITH LINE')
    expect(content).not.toContain('CONTINUE WITH LINE')
  })

  it('does NOT contain handleLineLogin function', () => {
    expect(content).not.toContain('handleLineLogin')
  })

  it('does NOT contain PRODUCTION_PB_URL (moved to line-oauth.ts)', () => {
    expect(content).not.toContain('PRODUCTION_PB_URL')
    // PRODUCTION_PB_URL ย้ายไป lib/auth/line-oauth.ts แล้ว
    expect(helperContent).toContain('PRODUCTION_PB_URL')
    expect(helperContent).toContain('https://pb.eggoworld.io')
  })

  it('shows PROCESSING loading state', () => {
    expect(content).toContain('PROCESSING')
    expect(content).toContain('animate-pulse')
  })

  it('reads sessionStorage redirectTo and removes it after use', () => {
    expect(content).toContain("sessionStorage.getItem('redirectTo')")
    expect(content).toContain("sessionStorage.removeItem('redirectTo')")
  })

  it('redirects to /auth/login when no email/password params', () => {
    expect(content).toContain("router.replace('/auth/login')")
  })

  it('calls authWithPassword with email and password params', () => {
    expect(content).toContain('authWithPassword(email, password)')
  })

  it('lib/auth/line-oauth.ts exports initiateLineLogin', () => {
    expect(helperContent).toContain('export function initiateLineLogin')
    expect(helperContent).toContain('export interface LineLoginOptions')
  })
})
