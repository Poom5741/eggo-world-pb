import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/react'
import SideNav from './SideNav'

describe('SideNav', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('hidden on mobile (has hidden class)', () => {
    render(<SideNav />)
    const nav = document.querySelector('aside')
    expect(nav).toBeInTheDocument()
    expect(nav?.className).toContain('hidden')
  })

  it('visible on desktop (has lg:flex class)', () => {
    render(<SideNav />)
    const nav = document.querySelector('aside')
    expect(nav).toBeInTheDocument()
    expect(nav?.className).toContain('lg:flex')
  })

  it('renders navigation items with Material Symbols icons', () => {
    render(<SideNav />)
    
    // Check for Material Symbols icon spans
    const icons = document.querySelectorAll('.material-symbols-outlined')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('includes: Dashboard, Eggs, Market, Wallet, Profile links', () => {
    render(<SideNav />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Eggs')).toBeInTheDocument()
    expect(screen.getByText('Market')).toBeInTheDocument()
    expect(screen.getByText('Wallet')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('fixed position on left side (ml-4, w-72)', () => {
    render(<SideNav />)
    const nav = document.querySelector('aside')
    expect(nav).toBeInTheDocument()
    expect(nav?.className).toContain('ml-4')
    expect(nav?.className).toContain('w-72')
  })
})
