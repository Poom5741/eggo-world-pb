import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Sign-up Page - LINE OAuth Only', () => {
  const filePath = join(process.cwd(), 'app/auth/sign-up/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('does NOT contain email state', () => {
    expect(content).not.toContain('setEmail')
    expect(content).not.toContain('[email, setEmail]')
  })

  it('does NOT contain password state', () => {
    expect(content).not.toContain('setPassword')
    expect(content).not.toContain('setRepeatPassword')
  })

  it('does NOT contain Turnstile import', () => {
    expect(content).not.toContain('@marsidev/react-turnstile')
    expect(content).not.toContain('Turnstile')
  })

  it('does NOT contain direct PocketBase user creation', () => {
    expect(content).not.toContain('pb.collection(\'users\').create')
    expect(content).not.toContain('pb.collection("users").create')
  })

  it('does NOT contain email/password form inputs', () => {
    expect(content).not.toContain('type="email"')
    expect(content).not.toContain('type="password"')
    expect(content).not.toContain('CONFIRM PASSWORD')
  })

  it('does NOT contain login divider', () => {
    expect(content).not.toContain('ALREADY HAVE AN ACCOUNT')
  })

  it('does NOT redirect to sign-up-success', () => {
    expect(content).not.toContain('/auth/sign-up-success')
  })

  it('contains LINE sign-up button that calls initiateLineLogin', () => {
    expect(content).toContain('SIGN UP WITH LINE')
    expect(content).toContain('initiateLineLogin')
    expect(content).not.toContain("router.push('/auth/line')")
  })

  it('has correct title', () => {
    expect(content).toContain('CREATE ACCOUNT')
    expect(content).toContain('JOIN EGGOWORLD WITH LINE')
  })

  it('imports only isAuthenticated from pocketbase', () => {
    expect(content).toContain('isAuthenticated')
    expect(content).not.toContain('createClient')
  })
})
