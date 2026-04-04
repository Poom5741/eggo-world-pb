import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('BuyEggFlow Component', () => {
  const filePath = join(process.cwd(), 'components/buy-egg/BuyEggFlow.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('contains buy egg button with 25 USDT price', () => {
    expect(content).toContain('25 USDT')
    expect(content).toContain('BUY EGG')
  })

  it('contains USDT approval logic', () => {
    expect(content).toContain('approve')
    expect(content).toContain('USDT')
  })

  it('contains loading states', () => {
    expect(content).toContain('loading')
    expect(content).toContain('APPROVING')
    expect(content).toContain('PURCHASING')
  })

  it('contains error handling', () => {
    expect(content).toContain('error')
    expect(content).toContain('onError')
  })

  it('contains success callback', () => {
    expect(content).toContain('onSuccess')
    expect(content).toContain('eggId')
  })

  it('imports required components', () => {
    expect(content).toContain('@/components/ui/button')
    expect(content).toContain('@/components/ui/alert')
  })
})
