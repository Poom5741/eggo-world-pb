import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Mint Page - Egg NFT Purchase', () => {
  const filePath = join(process.cwd(), 'app/mint/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('contains mint price display (25 USDT)', () => {
    expect(content).toContain('25 USDT')
    expect(content).toContain('MINT_PRICE')
  })

  it('contains bonus food display', () => {
    expect(content).toContain('BONUS FOOD NFTs')
    expect(content).toContain('INITIAL_FOOD_COUNT')
  })

  it('contains USDT balance check', () => {
    expect(content).toContain('usdt_balance')
    expect(content).toContain('canMint')
  })

  it('contains referrer input', () => {
    expect(content).toContain('referrer')
    expect(content).toContain('REFERRER ID')
  })

  it('handles mint loading state', () => {
    expect(content).toContain('loading')
    expect(content).toContain('MINTING...')
  })

  it('imports wallet and egg components', () => {
    expect(content).toContain('Wallet')
    expect(content).toContain('Egg')
  })
})
