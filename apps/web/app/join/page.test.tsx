import { describe, it, expect } from 'bun:test'
import { render } from '@testing-library/react'
import Join from './page'

describe('Join Page', () => {
  it('renders "Welcome Back!" headline', () => {
    const { container } = render(<Join />)
    expect(container.textContent).toContain('Welcome Back!')
  })

  it('displays LINE OAuth button with SVG icon', () => {
    const { container } = render(<Join />)
    expect(container.innerHTML).toContain('Login with LINE')
    expect(container.innerHTML).toContain('svg')
  })

  it('has username input field', () => {
    const { container } = render(<Join />)
    expect(container.innerHTML).toContain('type="text"')
    expect(container.textContent).toContain('Username')
  })

  it('has referral code input field (optional)', () => {
    const { container } = render(<Join />)
    expect(container.textContent).toContain('Referral Code')
  })

  it('includes "Start Hatching" CTA button', () => {
    const { container } = render(<Join />)
    expect(container.textContent).toContain('Start Hatching')
  })

  it('uses Material Symbols icons', () => {
    const { container } = render(<Join />)
    expect(container.innerHTML).toContain('material-symbols-outlined')
  })
})
