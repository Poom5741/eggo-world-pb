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

  it('has LINE login button (not text input)', () => {
    const { container } = render(<Join />)
    expect(container.textContent).toContain('Login with LINE')
  })

  it('shows Hatchery Pact link', () => {
    const { container } = render(<Join />)
    expect(container.textContent).toContain('Hatchery Pact')
  })

  it('shows feature badges', () => {
    const { container } = render(<Join />)
    expect(container.textContent).toContain('Bonus Egg')
    expect(container.textContent).toContain('Daily Rewards')
  })

  it('uses Material Symbols icons', () => {
    const { container } = render(<Join />)
    expect(container.innerHTML).toContain('material-symbols-outlined')
  })
})
