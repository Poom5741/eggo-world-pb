import { describe, it, expect } from 'bun:test'
import { render } from '@testing-library/react'
import Home from './page'

describe('Landing Page', () => {
  it('renders hero section with headline "HATCH YOUR DESTINY"', () => {
    const { container } = render(<Home />)
    expect(container.textContent).toContain('HATCH YOUR DESTINY')
  })

  it('displays "Join EggoWorld" button linking to /join', () => {
    const { container } = render(<Home />)
    expect(container.textContent).toContain('Join the EggoWorld')
    expect(container.innerHTML).toContain('href="/join"')
  })

  it('renders NFT showcase bento grid', () => {
    const { container } = render(<Home />)
    expect(container.textContent).toContain('Genesis Collection')
    expect(container.textContent).toContain('Sun-Kissed Shell #042')
    expect(container.textContent).toContain('Berry Boost Pack')
    expect(container.textContent).toContain('Blue Honey Core')
  })

  it('includes "How To Eggo" section with 4 steps', () => {
    const { container } = render(<Home />)
    expect(container.textContent).toContain('How To Eggo')
    expect(container.textContent).toContain('Buy Egg')
    expect(container.textContent).toContain('Collect Food')
    expect(container.textContent).toContain('Feed')
    expect(container.textContent).toContain('Hatch')
  })

  it('uses Material Symbols icons throughout', () => {
    const { container } = render(<Home />)
    expect(container.innerHTML).toContain('material-symbols-outlined')
  })

  it('has claymorphism styling (clay-btn, clay-card classes)', () => {
    const { container } = render(<Home />)
    expect(container.innerHTML).toContain('clay-')
  })
})
