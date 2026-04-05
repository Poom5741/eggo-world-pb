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
import { cn } from '@/lib/utils'

/**
 * Props สำหรับ FeedDialog component
 */
interface FeedDialogProps {
  /** ข้อมูลไข่ที่ต้องการให้อาหาร */
  egg: EggData
  /** สถานะเปิด/ปิดของ dialog */
  open: boolean
  /** Callback เมื่อสถานะ open เปลี่ยนแปลง */
  onOpenChange: (open: boolean) => void
  /** Callback เมื่อให้อาหารสำเร็จ */
  onSuccess: () => void
}

/**
 * FeedDialog component - Dialog สำหรับให้อาหารไข่ NFT
 * 
 * Quick-fill auto-select: คลิก "FEED ME" → auto-select 10 food items → confirm → submit
 * ตาม D-07, D-08, D-09, D-10
 */
export function FeedDialog({ egg, open, onOpenChange, onSuccess }: FeedDialogProps) {
  const { feedEgg, loading } = useEggFeed()
  const [confirmed, setConfirmed] = useState(false)
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([])
  const [fetchingFood, setFetchingFood] = useState(false)

  /**
   * Quick-fill: Auto-select 10 food items จาก inventory ของผู้ใช้
   * ตาม D-08: ไม่แสดง manual selection UI, ระบบเลือกให้อัตโนมัติ
   */
  const handleQuickFill = async () => {
    setFetchingFood(true)
    try {
      const pb = createClient()
      const token = pb.authStore.token
      
      // ดึง food NFTs ของผู้ใช้จาก PocketBase
      const records = await pb.collection('food_nfts').getList(1, 10, {
        filter: `owner = "${pb.authStore.record?.id}"`,
        sort: '+created',
        headers: {
          'Authorization': token
        }
      })
      
      if (records.items.length < 10) {
        throw new Error(`ไม่พออาหาร: มี ${records.items.length}/10 ชิ้น`)
      }
      
      // เลือก 10 ชิ้นแรก (auto-select ตาม D-08)
      const foodIds = records.items.slice(0, 10).map((item: any) => item.id)
      setSelectedFoodIds(foodIds)
      setConfirmed(true) // แสดง confirmation dialog
    } catch (err: any) {
      console.error('Failed to fetch food items:', err)
      // ไม่ต้องแสดง error toast ที่นี่ ให้แสดงตอน submit แทน
    } finally {
      setFetchingFood(false)
    }
  }

  /**
   * Submit feed transaction
   * เรียก useEggFeed.feedEgg() และรอ confirmation
   */
  const handleSubmit = async () => {
    if (selectedFoodIds.length !== 10) {
      console.error('Invalid food count:', selectedFoodIds.length)
      return
    }
    
    const success = await feedEgg(egg.egg_id, selectedFoodIds)
    
    if (success) {
      // สำเร็จ: เรียก onSuccess และปิด dialog
      onSuccess()
      onOpenChange(false)
      setConfirmed(false)
      setSelectedFoodIds([])
    }
    // ถ้าล้มเหลว useEggFeed จะแสดง error toast แล้ว
  }

  /**
   * ยกเลิกการยืนยัน กลับไปสู่หน้าแรก
   */
  const handleCancel = () => {
    setConfirmed(false)
    setSelectedFoodIds([])
  }

  // Reset state เมื่อ dialog ปิด
  useEffect(() => {
    if (!open) {
      setConfirmed(false)
      setSelectedFoodIds([])
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

        {!confirmed ? (
          // ขั้นตอนที่ 1: Quick-fill selection
          <div className="py-6 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-foreground/80">
                จะให้อาหาร <strong className="text-primary">Egg #{egg.egg_id}</strong> ด้วยอาหาร 10 ชิ้นจาก inventory
              </p>
              <p className="text-sm text-muted-foreground">
                ระบบจะเลือกอาหาร 10 ชิ้นแรกอัตโนมัติ
              </p>
            </div>
            
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
          // ขั้นตอนที่ 2: Confirmation
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
          {/* Footer ว่างสำหรับ spacing */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FeedDialog
