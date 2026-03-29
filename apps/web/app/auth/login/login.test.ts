import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Login Page - LINE OAuth Only', () => {
  const filePath = join(process.cwd(), 'app/auth/login/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('does NOT contain email state', () => {
    expect(content).not.toContain('useState(\'\')')
    expect(content).not.toContain('setEmail')
  })

  it('does NOT contain password state', () => {
    expect(content).not.toContain('setPassword')
  })

  it('does NOT contain Turnstile import', () => {
    expect(content).not.toContain('@marsidev/react-turnstile')
    expect(content).not.toContain('Turnstile')
  })

  it('does NOT contain handleLogin function', () => {
    expect(content).not.toContain('handleLogin')
    expect(content).not.toContain('authWithPassword')
  })

  it('does NOT contain email/password form inputs', () => {
    expect(content).not.toContain('type="email"')
    expect(content).not.toContain('type="password"')
    expect(content).not.toContain('placeholder="your@email.com"')
  })

  it('does NOT contain sign-up divider', () => {
    expect(content).not.toContain('DON\'T HAVE AN ACCOUNT')
    expect(content).not.toContain('SIGN UP')
  })

  it('contains LINE login button', () => {
    expect(content).toContain('LOGIN WITH LINE')
    expect(content).toContain('/auth/line')
  })

  it('has correct title', () => {
    expect(content).toContain('LOGIN')
    expect(content).toContain('LOGIN WITH LINE')
  })

  it('imports only isAuthenticated from pocketbase', () => {
    expect(content).toContain('isAuthenticated')
    expect(content).not.toContain('createClient')
  })
})
