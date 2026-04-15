/**
 * Tests for CreateListingDialog component
 * 
 * @tests
 * - Dialog opens with NFT details pre-filled
 * - Price validation (min price by NFT type)
 * - Create Listing button calls createListing contract
 * - Success state after listing created
 * - Error state on rejection
 * - Loading state during transaction
 */

import { describe, it, expect, vi, beforeEach } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateListingDialog } from './CreateListingDialog'
import * as marketplace from '@/lib/contracts/marketplace'
import * as eggNft from '@/lib/contracts/eggNft'

// Mock contract functions
vi.mock('@/lib/contracts/marketplace', () => ({
  approveNFTForMarketplace: vi.fn(),
  createListing: vi.fn(),
}))

vi.mock('@/lib/contracts/eggNft', () => ({
  getSigner: vi.fn(),
}))

describe('CreateListingDialog', () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    nftName: 'Test Egg',
    nftType: 'Egg' as const,
    tokenId: '123',
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('เปิด对话框พร้อมข้อมูล NFT ที่กรอกไว้แล้ว (opens with NFT details pre-filled)', () => {
    render(<CreateListingDialog {...mockProps} />)
    
    // ตรวจสอบว่าแสดงชื่อ NFT
    expect(screen.getByText('Test Egg')).toBeInTheDocument()
    // ตรวจสอบว่าแสดงประเภท NFT
    expect(screen.getByText('EGG')).toBeInTheDocument()
    // ตรวจสอบว่าแสดง dialog title
    expect(screen.getByRole('heading', { name: /Create Listing/i })).toBeInTheDocument()
  })

  it('ตรวจสอบราคาขั้นต่ำตามประเภท NFT (validates minimum price by NFT type)', async () => {
    render(<CreateListingDialog {...mockProps} />)
    
    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    const createButton = screen.getByText('Create Listing')
    
    // พยามสร้าง listing ด้วยราคาที่ต่ำกว่า minimum
    fireEvent.change(priceInput, { target: { value: '0.5' } })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Minimum price is 1 USDT/i)).toBeInTheDocument()
    })
  })

  it('เรียก approveNFTForMarketplace ก่อนสร้าง listing (calls approveNFTForMarketplace before creating listing)', async () => {
    const mockSigner = { address: '0x123' }
    vi.mocked(eggNft.getSigner).mockResolvedValue(mockSigner as any)
    vi.mocked(marketplace.approveNFTForMarketplace).mockResolvedValue(true)
    vi.mocked(marketplace.createListing).mockResolvedValue(true)
    
    render(<CreateListingDialog {...mockProps} />)
    
    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    // หาปุ่ม Create Listing ในส่วน footer (ปุ่มเดียวที่เปิดใช้งานและไม่ disabled)
    const createButton = screen.getAllByRole('button', { name: /Create Listing/i })[0]
    
    // กรอก price ที่ถูกต้อง
    fireEvent.change(priceInput, { target: { value: '100' } })
    fireEvent.click(createButton)
    
    // รอให้ approve เสร็จ
    await waitFor(() => {
      expect(marketplace.approveNFTForMarketplace).toHaveBeenCalledWith(mockSigner)
    })
    
    // รอให้ createListing ถูกเรียก
    await waitFor(() => {
      expect(marketplace.createListing).toHaveBeenCalledWith(
        mockSigner,
        'Egg',
        '123',
        expect.any(BigInt)
      )
    })
  })

  it('แสดงสถานะสำเร็จหลังจากสร้าง listing สำเร็จ (shows success state after listing created)', async () => {
    const mockSigner = { address: '0x123' }
    vi.mocked(eggNft.getSigner).mockResolvedValue(mockSigner as any)
    vi.mocked(marketplace.approveNFTForMarketplace).mockResolvedValue(true)
    vi.mocked(marketplace.createListing).mockResolvedValue(true)
    
    render(<CreateListingDialog {...mockProps} />)
    
    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    const createButton = screen.getAllByRole('button', { name: /Create Listing/i })[0]
    
    fireEvent.change(priceInput, { target: { value: '100' } })
    fireEvent.click(createButton)
    
    // รอให้ transaction เสร็จ
    await waitFor(() => {
      expect(marketplace.createListing).toHaveBeenCalled()
    })
    
    // ตรวจสอบว่า onSuccess ถูกเรียก
    expect(mockProps.onSuccess).toHaveBeenCalled()
    // ตรวจสอบว่า dialog ปิด
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('แสดงสถานะ error เมื่อผู้ใช้ปฏิเสธ transaction (shows error state on rejection)', async () => {
    const mockSigner = { address: '0x123' }
    vi.mocked(eggNft.getSigner).mockResolvedValue(mockSigner as any)
    vi.mocked(marketplace.approveNFTForMarketplace).mockRejectedValue(
      new Error('User rejected the approval transaction')
    )
    
    render(<CreateListingDialog {...mockProps} />)
    
    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    const createButton = screen.getAllByRole('button', { name: /Create Listing/i })[0]
    
    fireEvent.change(priceInput, { target: { value: '100' } })
    fireEvent.click(createButton)
    
    // รอให้ error แสดง
    await waitFor(() => {
      expect(screen.getByText(/User rejected/i)).toBeInTheDocument()
    })
  })

  it('แสดง loading state ระหว่างทำรายการ (shows loading state during transaction)', async () => {
    const mockSigner = { address: '0x123' }
    vi.mocked(eggNft.getSigner).mockResolvedValue(mockSigner as any)
    vi.mocked(marketplace.approveNFTForMarketplace).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )
    vi.mocked(marketplace.createListing).mockResolvedValue(true)
    
    render(<CreateListingDialog {...mockProps} />)
    
    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    const createButton = screen.getAllByRole('button', { name: /Create Listing/i })[0]
    
    fireEvent.change(priceInput, { target: { value: '100' } })
    fireEvent.click(createButton)
    
    // ตรวจสอบ loading state
    expect(screen.getByText(/Approving.../i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText(/Creating.../i)).toBeInTheDocument()
    })
  })
})
