'use client'

import React, { useState } from 'react'

interface ApprovalDialogProps {
  /** เปิด/ปิด dialog */
  isOpen: boolean
  /** จำนวน USDT ที่จะอนุมัติ (ในหน่วยปกติ เช่น 100 USDT) */
  amount: number
  /** ชื่อหรือ address ของ marketplace contract */
  spenderName: string
  /** กำลังดำเนินการ approve อยู่หรือไม่ */
  isApproving: boolean
  /** แสดง approval สำเร็จแล้วหรือไม่ (เพื่อไปขั้นตอนถัดไป) */
  approvalComplete: boolean
  /** ปิด dialog */
  onClose: () => void
  /** เริ่มต้นการ approve */
  onApprove: () => Promise<void>
  /** ไปยังขั้นตอนถัดไป (ซื้อ NFT) */
  onNext: () => void
}

/**
 * Dialog สำหรับอนุมัติ USDT (Two-step approval flow)
 * 
 * แสดง progress indicator:
 * - Step 1: Approving USDT...
 * - Step 2: Completing Purchase... (handled by parent)
 * 
 * รองรับ:
 * - MetaMask rejection
 * - Loading states
 * - Success state
 */
export function ApprovalDialog({
  isOpen,
  amount,
  spenderName,
  isApproving,
  approvalComplete,
  onClose,
  onApprove,
  onNext,
}: ApprovalDialogProps) {
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  /**
   * Handle approve click
   * เริ่มการ approve USDT
   */
  const handleApprove = async () => {
    try {
      setError(null)
      await onApprove()
    } catch (err: any) {
      console.error('Approval error:', err)
      setError(err.message || 'Failed to approve USDT')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - พื้นหลังโปร่งใส */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog Container - กล่อง dialog */}
      <div className="relative bg-surface-container-low rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl clay-card">
        {/* Header - ส่วนหัว */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">
              approval
            </span>
          </div>
          <h2 className="text-2xl font-pixel-style text-on-surface mb-2">
            Approve USDT
          </h2>
          <p className="text-on-surface-variant text-sm">
            อนุญาตให้ marketplace ใช้ USDT ของคุณ
          </p>
        </div>

        {/* Approval Details - รายละเอียดการอนุมัติ */}
        {isApproving ? (
          /* Step 1: Approving - กำลังอนุมัติ */
          <div className="text-center py-6">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-on-surface font-bold text-lg mb-2">
              Step 1/2: Approving USDT...
            </p>
            <p className="text-on-surface-variant text-sm">
              กรุณายืนยันธุรกรรมใน MetaMask
            </p>
          </div>
        ) : approvalComplete ? (
          /* Step 2: Approved - อนุมัติสำเร็จแล้ว */
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
              <span className="material-symbols-outlined text-3xl text-success">
                check_circle
              </span>
            </div>
            <p className="text-on-surface font-bold text-lg mb-2">
              Approval Successful!
            </p>
            <p className="text-on-surface-variant text-sm mb-6">
              USDT ถูกอนุมัติเรียบร้อยแล้ว
            </p>
            <button
              onClick={onNext}
              className="w-full clay-button bg-primary text-on-primary py-4 px-6 rounded-xl font-black text-lg flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              Continue to Purchase
            </button>
          </div>
        ) : (
          /* Initial State - ยังไม่ได้อนุมัติ */
          <div className="space-y-4">
            {/* Amount Display - แสดงจำนวนเงิน */}
            <div className="bg-surface-container p-4 rounded-xl">
              <div className="text-sm text-on-surface-variant mb-1">Amount</div>
              <div className="text-2xl font-black text-primary">
                {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </div>
            </div>

            {/* Spender Info - ข้อมูลผู้ใช้จ่าย */}
            <div className="bg-surface-container p-4 rounded-xl">
              <div className="text-sm text-on-surface-variant mb-1">Spender</div>
              <div className="text-on-surface font-mono text-sm truncate">
                {spenderName}
              </div>
            </div>

            {/* Info Box - กล่องข้อมูล */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-base mt-0.5">
                  info
                </span>
                <div className="text-xs text-on-surface-variant">
                  <p className="font-bold mb-1">
                    การอนุมัติในครั้งเดียว (One-time Approval)
                  </p>
                  <p>
                    คุณกำลังอนุมัติจำนวน {amount.toLocaleString()} USDT เท่านั้น 
                    ไม่ใช่การอนุมัติแบบไม่จำกัด (infinite approval)
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message - แสดง error */}
            {error && (
              <div className="bg-error-container p-4 rounded-xl border border-error">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-error text-base mt-0.5">
                    error
                  </span>
                  <div className="text-sm text-error">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - ปุ่มดำเนินการ */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 clay-button bg-surface-container-high text-on-surface py-4 px-6 rounded-xl font-black text-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 clay-button bg-primary text-on-primary py-4 px-6 rounded-xl font-black text-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">thumb_up</span>
                Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
