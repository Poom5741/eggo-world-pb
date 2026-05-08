import { describe, it, expect, vi } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PlayDialog } from './play-dialog'

describe('PlayDialog', () => {
  it('renders care tips when open', () => {
    render(
      <PlayDialog
        open={true}
        onOpenChange={vi.fn()}
        eggId={1}
      />
    )
    expect(screen.getByText('Egg #1 - Care Tips')).toBeTruthy()
    expect(screen.getByText('Feed Regularly')).toBeTruthy()
    expect(screen.getByText('Check Progress')).toBeTruthy()
    expect(screen.getByText('Earn Streaks')).toBeTruthy()
    expect(screen.getByText('Rarity Matters')).toBeTruthy()
  })

  it('shows correct egg ID in title', () => {
    render(
      <PlayDialog
        open={true}
        onOpenChange={vi.fn()}
        eggId={42}
      />
    )
    expect(screen.getByText('Egg #42 - Care Tips')).toBeTruthy()
  })

  it('shows care tip descriptions', () => {
    render(
      <PlayDialog
        open={true}
        onOpenChange={vi.fn()}
        eggId={1}
      />
    )
    expect(screen.getByText('Feed your egg 10 times with Food NFTs to help it hatch')).toBeTruthy()
    expect(screen.getByText('Monitor feeding progress on your egg card')).toBeTruthy()
    expect(screen.getByText('Daily check-ins after hatching give you bonus rewards')).toBeTruthy()
    expect(screen.getByText('Higher rarity eggs produce more valuable animals')).toBeTruthy()
  })

  it('closes when Got it! button clicked', () => {
    const onOpenChange = vi.fn()
    render(
      <PlayDialog
        open={true}
        onOpenChange={onOpenChange}
        eggId={1}
      />
    )
    fireEvent.click(screen.getByText('Got it!'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uses Material Symbols icons for tips', () => {
    render(
      <PlayDialog
        open={true}
        onOpenChange={vi.fn()}
        eggId={1}
      />
    )
    expect(screen.getByText('restaurant')).toBeTruthy()
    expect(screen.getByText('restaurant').className).toContain('material-symbols-outlined')
    
    expect(screen.getByText('visibility')).toBeTruthy()
    expect(screen.getByText('visibility').className).toContain('material-symbols-outlined')
    
    expect(screen.getByText('emoji_events')).toBeTruthy()
    expect(screen.getByText('emoji_events').className).toContain('material-symbols-outlined')
    
    expect(screen.getByText('workspace_premium')).toBeTruthy()
    expect(screen.getByText('workspace_premium').className).toContain('material-symbols-outlined')
  })

  it('does not render when open is false', () => {
    render(
      <PlayDialog
        open={false}
        onOpenChange={vi.fn()}
        eggId={1}
      />
    )
    expect(screen.queryByText('Egg #1 - Care Tips')).toBeNull()
  })

  it('shows egg icon in header', () => {
    render(
      <PlayDialog
        open={true}
        onOpenChange={vi.fn()}
        eggId={1}
      />
    )
    const eggIcon = screen.getByText('egg')
    expect(eggIcon).toBeTruthy()
    expect(eggIcon.className).toContain('material-symbols-outlined')
  })
})
