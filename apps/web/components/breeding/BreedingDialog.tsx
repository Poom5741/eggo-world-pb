'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AnimalData } from '@/hooks/use-animal-poll'
import { useBreeding, BreedingResult } from '@/hooks/use-breeding'
import { AnimalSelectionGrid } from './AnimalSelectionGrid'
import { BreedingConfirmation } from './BreedingConfirmation'
import { BreedingSuccessModal } from './BreedingSuccessModal'

type BreedingStep = 'selection' | 'confirmation' | 'success'

/**
 * Props for BreedingDialog component
 */
interface BreedingDialogProps {
  /** List of user's animals */
  animals: AnimalData[]
  /** Whether dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when breeding is successful */
  onSuccess: (result: BreedingResult) => void
  /** Optional initial parent1 to pre-select (e.g., from AnimalCard action menu) */
  initialParent1?: AnimalData | null
}

/**
 * Breeding fee in USDT
 */
const BREEDING_FEE = 5

/**
 * BreedingDialog component - Dialog for breeding two animals
 * 
 * Two-step flow:
 * 1. Selection: Choose two parent animals from grid
 * 2. Confirmation: Review and confirm breeding
 * 
 * Uses FeedDialog pattern with claymorphism design
 */
export function BreedingDialog({
  animals,
  open,
  onOpenChange,
  onSuccess,
  initialParent1 = null,
}: BreedingDialogProps) {
  const { breedAnimals, loading } = useBreeding()
  const [step, setStep] = useState<BreedingStep>('selection')
  const [selectedParentIds, setSelectedParentIds] = useState<number[]>([])
  const [breedingResult, setBreedingResult] = useState<BreedingResult | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('selection')
      setBreedingResult(null)
      setShowSuccessModal(false)
      // If initialParent1 is provided, pre-select it
      if (initialParent1) {
        setSelectedParentIds([initialParent1.animal_id])
      } else {
        setSelectedParentIds([])
      }
    } else {
      setSelectedParentIds([])
      setStep('selection')
      setBreedingResult(null)
      setShowSuccessModal(false)
    }
  }, [open, initialParent1])

  // Get selected parent objects
  const parent1 = selectedParentIds[0] 
    ? animals.find(a => a.animal_id === selectedParentIds[0]) || null
    : null
  const parent2 = selectedParentIds[1] 
    ? animals.find(a => a.animal_id === selectedParentIds[1]) || null
    : null

  /**
   * Toggle animal selection
   */
  const handleSelectAnimal = useCallback((animalId: number) => {
    setSelectedParentIds(prev => {
      // If already selected, remove it
      if (prev.includes(animalId)) {
        return prev.filter(id => id !== animalId)
      }
      // If we have less than 2 selected, add it
      if (prev.length < 2) {
        return [...prev, animalId]
      }
      // Otherwise, replace the second selection
      return [prev[0], animalId]
    })
  }, [])

  /**
   * Proceed to confirmation step
   */
  const handleContinue = useCallback(() => {
    if (selectedParentIds.length === 2) {
      setStep('confirmation')
    }
  }, [selectedParentIds.length])

  /**
   * Go back to selection step
   */
  const handleBack = useCallback(() => {
    setStep('selection')
  }, [])

  /**
   * Execute breeding
   */
  const handleBreed = useCallback(async () => {
    if (!parent1 || !parent2) return

    const result = await breedAnimals(parent1.animal_id, parent2.animal_id)
    if (result) {
      setBreedingResult(result)
      setShowSuccessModal(true)
      onOpenChange(false)
    }
  }, [parent1, parent2, breedAnimals, onOpenChange])

  /**
   * Handle success modal close/redirect
   */
  const handleSuccessComplete = useCallback(() => {
    if (breedingResult) {
      onSuccess(breedingResult)
    }
    setShowSuccessModal(false)
    setBreedingResult(null)
  }, [breedingResult, onSuccess])

  /**
   * Get the ID to exclude from selection (parent1 when selecting parent2)
   */
  const excludeAnimalId = step === 'selection' && selectedParentIds.length === 1
    ? selectedParentIds[0]
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="clay" className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader variant="clay">
          <DialogTitle variant="clay">
            {step === 'selection' ? 'Select Parents' : 'Confirm Breeding'}
          </DialogTitle>
          <DialogDescription variant="clay">
            {step === 'selection' 
              ? 'Choose two animals to breed (48h cooldown applies)'
              : 'Review your selection and confirm breeding'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {step === 'selection' ? (
            <div className="space-y-4">
              {/* Selection progress */}
              <div className="flex items-center justify-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${selectedParentIds.length >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container text-muted-foreground'}
                `}>
                  1
                </div>
                <div className="w-8 h-0.5 bg-surface-container-high" />
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${selectedParentIds.length >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container text-muted-foreground'}
                `}>
                  2
                </div>
              </div>

              {/* Selection labels */}
              <div className="flex justify-between text-sm px-4">
                <span className={selectedParentIds.length >= 1 ? 'text-primary font-bold' : 'text-muted-foreground'}>
                  {parent1 ? `${parent1.species} #${parent1.animal_id}` : 'Parent 1'}
                </span>
                <span className={selectedParentIds.length >= 2 ? 'text-primary font-bold' : 'text-muted-foreground'}>
                  {parent2 ? `${parent2.species} #${parent2.animal_id}` : 'Parent 2'}
                </span>
              </div>

              {/* Animal grid */}
              <AnimalSelectionGrid
                animals={animals}
                selectedIds={selectedParentIds}
                onSelect={handleSelectAnimal}
                maxSelection={2}
                excludeAnimalId={excludeAnimalId}
              />
            </div>
          ) : (
            <BreedingConfirmation
              parent1={parent1}
              parent2={parent2}
              loading={loading}
              breedingFee={BREEDING_FEE}
              onConfirm={handleBreed}
              onBack={handleBack}
            />
          )}
        </div>

        {/* Footer */}
        {step === 'selection' && (
          <DialogFooter variant="clay" className="flex-col gap-3">
            <p 
              className="text-sm font-bold text-center" 
              role="status" 
              aria-live="polite"
              aria-atomic="true"
            >
              {selectedParentIds.length}/2 parents selected
            </p>
            <Button
              onClick={handleContinue}
              disabled={selectedParentIds.length < 2}
              variant="clay"
              size="clay-lg"
              className="w-full min-h-[44px]"
            >
              <span className="material-symbols-outlined mr-2">arrow_forward</span>
              Continue
            </Button>
          </DialogFooter>
        )}
      </DialogContent>

      {/* Breeding Success Modal */}
      <BreedingSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        breedingResult={breedingResult}
        parent1={parent1}
        parent2={parent2}
        onSuccess={handleSuccessComplete}
      />
    </Dialog>
  )
}

export default BreedingDialog
