import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import PocketBase from 'pocketbase'
import './styles/auth-flow.module.css'

const POCKETBASE_URL = 'http://127.0.0.1:8090'

export default function Callback() {
  const [status, setStatus] = useState('Processing login...')
  const [error, setError] = useState(null)

  useEffect(() => {
    const pb = new PocketBase(POCKETBASE_URL)
    const params = new URLSearchParams(window.location.search)
    
    const code = params.get('code')
    const state = params.get('state')
    const errorParam = params.get('error')
    
    if (errorParam) {
      setStatus('Login Failed')
      setError(`Error: ${errorParam} - ${params.get('error_description') || ''}`)
      return
    }
    
    if (!code) {
      setStatus('No authorization code')
      setError('Authentication was cancelled or failed')
      return
    }
    
    // Get stored OAuth data
    const providerName = localStorage.getItem('oauth_provider') || 'line'
    const codeVerifier = localStorage.getItem('oauth_code_verifier')
    
    if (!codeVerifier) {
      setStatus('Missing code verifier')
      setError('Authentication state lost. Please try again.')
      return
    }
    
    console.log('Exchanging code for token...')
    console.log('Provider:', providerName)
    console.log('Code:', code.substring(0, 20) + '...')
    console.log('CodeVerifier:', codeVerifier.substring(0, 20) + '...')
    
    // Exchange code for token using authWithOAuth2Code
    // redirectUrl must match the redirect_uri used in the initial auth request
    pb.collection('users').authWithOAuth2Code(
      providerName,
      code,
      codeVerifier,
      'http://localhost:3000/frontend/callback.html',  // Must match LINE Console config
      { name: 'LINE User' }
    ).then((authData) => {
      console.log('Auth successful:', authData)
      setStatus('Success!')
      
      // Clear stored OAuth data
      localStorage.removeItem('oauth_provider')
      localStorage.removeItem('oauth_code_verifier')
      
      // Redirect back to main page
      setTimeout(() => {
        window.location.href = 'http://localhost:3000/frontend/'
      }, 1000)
    }).catch((err) => {
      console.error('Auth failed:', err)
      setStatus('Exchange Failed')
      setError(err.message || 'Authentication failed')
    })
    
  }, [])

  return (
    <div className="auth-container">
      <h1>{status}</h1>
      {error && <p className="error">{error}</p>}
      {!error && status === 'Success!' && <p className="success">Redirecting...</p>}
    </div>
  )
}

if (typeof document !== 'undefined') {
  const root = createRoot(document.getElementById('root'))
  root.render(<Callback />)
}
