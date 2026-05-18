'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEggFeed } from '@/hooks/use-egg-feed'
import { EggData } from '@/hooks/use-egg-poll'
import { createClient } from '@/lib/pocketbase/client'

interface FeedDialogProps {
  egg: EggData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function FeedDialog({ egg, open, onOpenChange, onSuccess }: FeedDialogProps) {
  const { feedEgg, loading } = useEggFeed(true)
  const [confirmed, setConfirmed] = useState(false)
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([])
  const [fetchingFood, setFetchingFood] = useState(false)
  const [noFoodAvailable, setNoFoodAvailable] = useState(false)
  const [availableFoodCount, setAvailableFoodCount] = useState(0)

  const handleQuickFill = async () => {
    setFetchingFood(true)
    setNoFoodAvailable(false)
    try {
      const pb = createClient()
      const token = pb.authStore.token

      const records = await pb.collection('food_nfts').getList(1, 10, {
        filter: `owner = "${pb.authStore.record?.id}" && is_consumed = false`,
        sort: '+created',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const count = records.items.length

      if (count < 10) {
        setAvailableFoodCount(count)
        setNoFoodAvailable(true)
        return
      }

      const foodIds = records.items.slice(0, 10).map((item: any) => item.id)
      setSelectedFoodIds(foodIds)
      setConfirmed(true)
    } catch (err: any) {
      console.error('Failed to fetch food items:', err)
    } finally {
      setFetchingFood(false)
    }
  }

  const handleSubmit = async () => {
    if (selectedFoodIds.length !== 10) {
      console.error('Invalid food count:', selectedFoodIds.length)
      return
    }

    const success = await feedEgg(egg.egg_id, selectedFoodIds)

    if (success) {
      onSuccess()
      onOpenChange(false)
      setConfirmed(false)
      setSelectedFoodIds([])
    }
  }

  const handleCancel = () => {
    setConfirmed(false)
    setSelectedFoodIds([])
    setNoFoodAvailable(false)
  }

  useEffect(() => {
    if (!open) {
      setConfirmed(false)
      setSelectedFoodIds([])
      setNoFoodAvailable(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="clay" className="max-w-md">
        <DialogHeader variant="clay">
          <DialogTitle variant="clay">
            Feed Egg #{egg.egg_id}
          </DialogTitle>
          <DialogDescription variant="clay">
            ให้อาหารไข่ของคุณด้วยอาหาร 10 ชิ้น
          </DialogDescription>
        </DialogHeader>

        {noFoodAvailable ? (
          <div className="py-6 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-bold text-destructive">Not Enough Food</p>
              <p className="text-foreground/80">
                You need at least 10 unconsumed food NFTs to feed{' '}
                <strong className="text-primary">Egg #{egg.egg_id}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                You currently have <strong className="text-secondary">{availableFoodCount}</strong>/10 food items available.
              </p>
            </div>
            <Button
              onClick={() => setNoFoodAvailable(false)}
              variant="clay-outline"
              className="w-full"
              size="clay-md"
            >
              Cancel
            </Button>
          </div>
        ) : !confirmed ? (
          <div className="py-6 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-foreground/80">
                จะให้อาหาร <strong className="text-primary">Egg #{egg.egg_id}</strong> ด้วยอาหาร 10 ชิ้นจาก inventory
              </p>
              <p className="text-sm text-muted-foreground">
                ระบบจะเลือกอาหาร 10 ชิ้นแรกอัตโนมัติ
              </p>
            </div>

            {fetchingFood && (
              <p className="text-sm text-center text-muted-foreground">
                Checking food inventory...
              </p>
            )}

            <Button
              onClick={handleQuickFill}
              disabled={fetchingFood || loading}
              className="w-full py-6 text-lg font-bold clay"
              size="clay-lg"
            >
              {fetchingFood ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Fetching food...
                </span>
              ) : (
                'FEED ME'
              )}
            </Button>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-bold text-primary">
                ยืนยันการให้อาหาร?
              </p>
              <p className="text-foreground/80">
                Feed <strong>Egg #{egg.egg_id}</strong> with{' '}
                <strong className="text-secondary">10 food items</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                ธุรกรรมจะถูกส่งไปยัง blockchain
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCancel}
                disabled={loading}
                variant="clay-outline"
                className="flex-1"
                size="clay-md"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                variant="clay"
                className="flex-1"
                size="clay-md"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Submitting...
                  </span>
                ) : (
                  'Confirm'
                )}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter variant="clay">
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FeedDialog
