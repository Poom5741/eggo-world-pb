import React, { useEffect, useState } from 'react'
import { usePocketBase } from '../lib/pocketbase-provider'

const POCKETBASE_URL = 'http://127.0.0.1:8090'
const REDIRECT_URL = 'http://localhost:3000/frontend/callback.html'

export function AuthFlow() {
  const pb = usePocketBase()
  const [providers, setProviders] = useState([])
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function loadProviders() {
      try {
        const authMethods = await pb.collection('users').listAuthMethods()
        const oauthProviders = authMethods.oauth2?.providers || []
        setProviders(oauthProviders)
      } catch (err) {
        setError(err.message)
      }
    }
    loadProviders()
  }, [])

  useEffect(() => {
    // Check if we returned from OAuth with a token
    const token = new URLSearchParams(window.location.search).get('token')
    if (token) {
      // PocketBase redirected back with token
      pb.authStore.save(token, null)
      // Reload to clear URL and get user data
      window.location.href = '/frontend/'
    }
  }, [])

  useEffect(() => {
    // Check if user is already logged in
    if (pb.authStore.isValid) {
      setUser(pb.authStore.record)
    }
    
    // Listen for auth changes
    pb.authStore.onChange((token, record) => {
      if (token && record) {
        setUser(record)
      } else {
        setUser(null)
      }
    })
  }, [])

  const handleLogin = (provider) => {
    // Parse the authURL from PocketBase
    const url = new URL(provider.authURL)
    const params = new URLSearchParams(url.search)
    
    // Extract state from the authURL and store it
    const state = params.get('state')
    if (state) {
      localStorage.setItem('oauth_state', state)
    }
    
    // Store OAuth data in localStorage for callback
    localStorage.setItem('oauth_provider', provider.name)
    localStorage.setItem('oauth_code_verifier', provider.codeVerifier)
    
    // Replace redirect_uri with our frontend callback
    // LINE Console must be configured with: http://localhost:3000/frontend/callback.html
    params.set('redirect_uri', 'http://localhost:3000/frontend/callback.html')
    
    // Rebuild the URL with new params
    url.search = params.toString()
    const authUrl = url.toString()
    
    console.log('Redirecting to LINE OAuth...')
    console.log('State stored:', state)
    console.log('Auth URL:', authUrl)
    window.location.href = authUrl
  }

  const handleLogout = () => {
    pb.authStore.clear()
    setUser(null)
    window.location.reload()
  }

  if (user) {
    return (
      <div className="auth-container">
        <button onClick={handleLogout} className="btn btn-logout">Logout</button>
        <div className="user-info">
          <h3>User Info:</h3>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="auth-container">
        <p className="error">{error}</p>
        <button onClick={() => window.location.reload()} className="btn">Retry</button>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <h1>PocketBase OIDC Test</h1>
      {providers.length === 0 ? (
        <p>No OIDC providers configured</p>
      ) : (
        <ul>
          {providers.map(provider => (
            <li key={provider.name}>
              <button onClick={() => handleLogin(provider)} className="btn btn-line">
                Login with {provider.displayName || provider.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
