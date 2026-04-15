'use client'

import React from 'react'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'

/**
 * Loading skeleton สำหรับ Marketplace page
 * แสดงระหว่างรอข้อมูล listings จาก PocketBase
 */
export default function MarketplaceLoading() {
  return (
    <LayoutWithoutNav>
      <div className="max-w-6xl mx-auto py-12">
        {/* Page Header - โครงร่างส่วนหัว */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-4 flex-1">
            <div className="h-16 w-80 bg-surface-container rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-surface-container rounded animate-pulse" />
            <div className="h-3 w-32 bg-surface-container rounded animate-pulse mt-2" />
          </div>
          
          <div className="w-full md:w-auto">
            <div className="clay-card bg-surface-container-lowest px-6 py-4 rounded-lg flex items-center gap-4 h-20 min-w-[200px]">
              <div className="h-10 w-10 bg-surface-container rounded-full animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 bg-surface-container rounded animate-pulse" />
                <div className="h-6 w-12 bg-surface-container rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters - โครงร่างส่วน filter */}
        <div className="mb-8">
          <div className="clay-card bg-surface-container-lowest p-6 rounded-xl h-32">
            <div className="flex flex-wrap gap-4">
              <div className="h-10 w-32 bg-surface-container rounded-lg animate-pulse" />
              <div className="h-10 w-32 bg-surface-container rounded-lg animate-pulse" />
              <div className="h-10 w-40 bg-surface-container rounded-lg animate-pulse" />
              <div className="h-10 w-10 bg-surface-container rounded-full animate-pulse ml-auto" />
            </div>
          </div>
        </div>
        
        {/* Listings Grid - โครงร่างตารางสินค้า 6 รายการ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-container-low p-5 rounded-xl clay-card">
              <div className="relative rounded-lg overflow-hidden h-48 mb-4 clay-inset bg-surface-container animate-pulse">
                <div className="absolute top-3 right-3 h-6 w-16 bg-surface-container-high rounded animate-pulse" />
              </div>
              
              <div className="h-6 w-40 bg-surface-container rounded mb-2 animate-pulse" />
              <div className="h-4 w-32 bg-surface-container rounded mb-4 animate-pulse" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-surface-container rounded animate-pulse" />
                  <div className="h-6 w-24 bg-surface-container rounded animate-pulse" />
                </div>
                
                <div className="h-10 w-10 bg-surface-container rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutWithoutNav>
  )
}
