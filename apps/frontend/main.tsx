import React from 'react'
import { createRoot } from 'react-dom/client'
import PocketBase from 'pocketbase'
import { AuthFlow } from './components/auth-flow'
import { PocketBaseProvider } from './lib/pocketbase-provider'
import './styles/auth-flow.module.css'

const POCKETBASE_URL = 'http://127.0.0.1:8090'
const pb = new PocketBase(POCKETBASE_URL)

function Frontend() {
  return (
    <PocketBaseProvider value={pb}>
      <AuthFlow />
    </PocketBaseProvider>
  )
}

if (typeof document !== 'undefined') {
  const root = createRoot(document.getElementById('root'))
  root.render(<Frontend />)
}

export default Frontend
