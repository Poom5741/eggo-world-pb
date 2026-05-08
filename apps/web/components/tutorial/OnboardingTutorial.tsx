'use client'

import React, { useState, useEffect } from 'react'

interface TutorialStep {
  title: string
  description: string
  target: string
}

interface OnboardingTutorialProps {
  onDismiss: () => void
}

/**
 * Onboarding Tutorial component - Overlay walkthrough for first-time users
 * 
 * Displays a 4-step walkthrough covering:
 * 1. Dashboard layout
 * 2. Wallet balance
 * 3. Referral section
 * 4. Quick navigation
 */
export default function OnboardingTutorial({ onDismiss }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  
  const steps: TutorialStep[] = [
    {
      title: "Welcome to Your Dashboard",
      description: "This is your command center. Track your balance, eggs, and referrals.",
      target: "dashboard-layout"
    },
    {
      title: "Your Wallet Balance",
      description: "See your USDT balance here. Top up to buy eggs and food.",
      target: "balance-section"
    },
    {
      title: "Your Referral Chain",
      description: "Invite friends and earn commissions. Share your referral link!",
      target: "referral-section"
    },
    {
      title: "Quick Actions",
      description: "Buy eggs, feed your animals, or visit the marketplace.",
      target: "quick-actions"
    }
  ]

  useEffect(() => {
    // Prevent scrolling when tutorial is open
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('tutorial_completed', 'true')
    onDismiss()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleComplete()
    }
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop highlighting the current target */}
      <div className="absolute inset-0 pointer-events-none">
        {/* We could add a highlighting animation here if needed */}
      </div>

      {/* Tutorial modal */}
      <div className="relative bg-surface-container-lowest rounded-xl clay-card p-6 max-w-md w-full mx-4 z-10">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-on-surface-variant mb-1">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-primary mb-2">{steps[currentStep].title}</h3>
          <p className="text-on-surface-variant">{steps[currentStep].description}</p>
        </div>

        {/* Navigation and controls */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-primary' : 'bg-surface-container'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-3">
            {/* Previous button */}
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`
                px-4 py-2 rounded-xl font-bold text-sm
                ${currentStep === 0 
                  ? 'text-on-surface-variant/50 cursor-not-allowed' 
                  : 'text-primary hover:bg-surface-container'}
              `}
            >
              Previous
            </button>

            {/* Next/Done button */}
            <button
              onClick={currentStep < steps.length - 1 ? handleNext : handleComplete}
              className="
                px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm 
                hover:scale-[1.02] active:scale-[0.98] transition-transform
              "
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
          aria-label="Dismiss tutorial"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  )
}