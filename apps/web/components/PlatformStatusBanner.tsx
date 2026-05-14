'use client'

import React, { useState, useEffect } from 'react'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { createClient } from '@/lib/pocketbase/client'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PlatformStatusBanner() {
  const isHydrated = useIsHydrated()
  const [isPaused, setIsPaused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!isHydrated) return
    
    const checkStatus = async () => {
      try {
        const pb = createClient()
        const token = pb.authStore.token
        if (!token) {
          setLoading(false)
          return
        }
        // Remove trailing slash from baseURL if present
        const baseUrl = pb.baseURL.endsWith('/') ? pb.baseURL.slice(0, -1) : pb.baseURL
        const response = await fetch(`${baseUrl}/api/v2/platform/status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setIsPaused(data.data?.paused || false)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    
    checkStatus()
    
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [isHydrated])
  
  if (!isHydrated || loading || !isPaused || dismissed) {
    return null
  }
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-red-600 text-white">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">
            Marketplace Paused — Trading Temporarily Disabled
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:text-white hover:bg-red-700 h-6 px-2"
          onClick={() => setDismissed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}