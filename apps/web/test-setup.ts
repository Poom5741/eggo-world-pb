import { GlobalRegistrator } from '@happy-dom/global-registrator'
import '@testing-library/jest-dom'
import { beforeEach } from 'bun:test'

GlobalRegistrator.register()

beforeEach(() => {
  document.body.innerHTML = ''
})
