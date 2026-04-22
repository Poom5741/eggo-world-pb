'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'

interface ErrorProps {
  error: Error
  reset: () => void
}

/**
 * Error boundary สำหรับ Breeding page
 * แสดงเมื่อเกิดข้อผิดพลาดในการโหลดข้อมูลการผสมพันธุ์สัตว์
 */
export default function BreedingError({ error, reset }: ErrorProps) {
  const router = useRouter()

  return (
    <LayoutWithoutNav>
      <div className="max-w-6xl mx-auto py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-pixel-style text-primary mb-2">Animal Breeding</h1>
            <p className="text-on-surface-variant max-w-md">
              Breed animals from your collection to unlock new species.
            </p>
          </div>
        </div>
        
        {/* Error Card */}
        <div className="bg-surface-container-low rounded-xl p-12 clay-card text-center">
          <span className="material-symbols-outlined text-6xl text-error mb-4">
            error
          </span>
          
          <h2 className="text-2xl font-pixel-style text-error mb-2">
            Failed to Load Animals
          </h2>
          
          <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Retry */}
            <button
              onClick={reset}
              className="clay-button bg-primary text-on-primary py-4 px-8 rounded-xl font-black text-lg flex items-center gap-2 justify-center"
            >
              <span className="material-symbols-outlined">refresh</span>
              Retry
            </button>
            
            {/* Back to Dashboard */}
            <button
              onClick={() => router.push('/dashboard')}
              className="clay-button bg-surface-container-high text-on-surface py-4 px-8 rounded-xl font-black text-lg flex items-center gap-2 justify-center"
            >
              <span className="material-symbols-outlined">home</span>
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    </LayoutWithoutNav>
  )
}