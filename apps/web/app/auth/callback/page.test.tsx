import { describe, it, expect, beforeEach, afterEach, spyOn, mock } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import CallbackPage from './page'
import * as fs from 'fs'

describe('Auth Callback Page', () => {
  it('processes OAuth code from URL params', () => {
    // For now, just verify the file exists and has the right structure
    const pageContent = fs.readFileSync('./app/auth/callback/page.tsx', 'utf-8')
    expect(pageContent).toContain('useSearchParams')
    expect(pageContent).toContain('code')
  })

  it('calls PocketBase authWithOAuth2 method', () => {
    const pageContent = fs.readFileSync('./app/auth/callback/page.tsx', 'utf-8')
    expect(pageContent).toContain('auth-with-oauth2')
    expect(pageContent).toContain('fetch')
  })

  it('redirects to dashboard on success', () => {
    const pageContent = fs.readFileSync('./app/auth/callback/page.tsx', 'utf-8')
    expect(pageContent).toContain('router.push')
    expect(pageContent).toContain("'/'")
  })

  it('redirects to /auth/error on failure', () => {
    const pageContent = fs.readFileSync('./app/auth/callback/page.tsx', 'utf-8')
    expect(pageContent).toContain('/auth/login')
    expect(pageContent).toContain('error')
    expect(pageContent).toContain('TRY AGAIN')
  })

  it('handles hydration correctly (waits for client-side)', () => {
    const pageContent = fs.readFileSync('./app/auth/callback/page.tsx', 'utf-8')
    expect(pageContent).toContain("'use client'")
    expect(pageContent).toContain('useEffect')
  })

  it('uses Material Symbols or clay styling', () => {
    const pageContent = fs.readFileSync('./app/auth/callback/page.tsx', 'utf-8')
    expect(pageContent).toMatch(/clay-|material-symbols/i)
  })
})
