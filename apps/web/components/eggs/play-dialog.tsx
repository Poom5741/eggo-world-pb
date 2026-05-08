'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PlayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eggId: number
}

/**
 * PlayDialog - Shows care tips for unhatched eggs
 * Dialog แสดงคำแนะนำการดูแลไข่สำหรับไข่ที่ยังไม่ฟัก
 */
export function PlayDialog({ open, onOpenChange, eggId }: PlayDialogProps) {
  const careTips = [
    {
      icon: 'restaurant',
      title: 'Feed Regularly',
      description: 'Feed your egg 10 times with Food NFTs to help it hatch',
    },
    {
      icon: 'visibility',
      title: 'Check Progress',
      description: 'Monitor feeding progress on your egg card',
    },
    {
      icon: 'emoji_events',
      title: 'Earn Streaks',
      description: 'Daily check-ins after hatching give you bonus rewards',
    },
    {
      icon: 'workspace_premium',
      title: 'Rarity Matters',
      description: 'Higher rarity eggs produce more valuable animals',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="clay" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">egg</span>
            Egg #{eggId} - Care Tips
          </DialogTitle>
          <DialogDescription>
            Your egg is still developing! Here&apos;s how to help it hatch faster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {careTips.map((tip, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-surface-container rounded-lg"
            >
              <span className="material-symbols-outlined text-primary flex-shrink-0">
                {tip.icon}
              </span>
              <div>
                <h4 className="font-bold text-on-surface text-sm">{tip.title}</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="clay"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PlayDialog
