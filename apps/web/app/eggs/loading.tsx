import { Skeleton } from '@/components/ui/skeleton'
import LayoutWrapper from '@/components/LayoutWrapper'

/**
 * Loading skeleton for eggs page
 * โครงร่างแสดงขณะกำลังโหลดข้อมูลไข่
 * 
 * Displays animated placeholders matching the page layout:
 * - Page header skeleton
 * - Featured egg hero skeleton
 * - Egg grid with 6 card skeletons
 */
export default function Loading() {
  return (
    <LayoutWrapper>
      <div className="max-w-6xl mx-auto">
        {/* Page Header Skeleton - โครงร่างส่วนหัวของหน้า */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" /> {/* Title - หัวข้อ */}
            <Skeleton className="h-6 w-96" /> {/* Subtitle - คำบรรยาย */}
          </div>
          <div className="clay-card bg-surface-container-lowest px-6 py-4 rounded-lg flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-full" /> {/* Icon - ไอคอน */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" /> {/* Label - ป้ายกำกับ */}
              <Skeleton className="h-6 w-16" /> {/* Value - ค่า */}
            </div>
          </div>
        </div>

        {/* Featured Egg Hero Skeleton - โครงร่าง Featured Egg Hero */}
        <div className="mb-16">
          <div className="bg-surface-container-low rounded-xl p-8 h-64 clay-card animate-pulse">
            <div className="flex gap-8 h-full">
              {/* Left side: Egg image - ฝั่งซ้าย: รูปภาพไข่ */}
              <div className="flex-1">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>
              {/* Right side: Egg details - ฝั่งขวา: รายละเอียดไข่ */}
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" /> {/* Egg name - ชื่อไข่ */}
                <Skeleton className="h-4 w-32" /> {/* Rarity - ความหายาก */}
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-4 w-full" /> {/* Progress bar - แถบความคืบหน้า */}
                  <Skeleton className="h-3 w-24" /> {/* Progress text - ข้อความความคืบหน้า */}
                </div>
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-10 w-full" /> {/* Feed button - ปุ่มให้อาหาร */}
                  <Skeleton className="h-10 w-full" /> {/* Play button - ปุ่มเล่น */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Egg Grid Skeleton - โครงร่างตารางไข่ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-xl clay-card">
              {/* Egg image placeholder - รูปภาพไข่จำลอง */}
              <Skeleton className="w-full h-48 rounded-lg mb-6" />
              
              {/* Egg info - ข้อมูลไข่ */}
              <div className="space-y-3 mb-4">
                <Skeleton className="h-6 w-32" /> {/* Egg name - ชื่อไข่ */}
                <Skeleton className="h-4 w-24" /> {/* Rarity - ความหายาก */}
              </div>
              
              {/* Progress bar - แถบความคืบหน้า */}
              <div className="space-y-2 mb-4">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              
              {/* Manage button - ปุ่มจัดการ */}
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </LayoutWrapper>
  )
}
