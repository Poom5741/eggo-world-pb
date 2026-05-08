'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import LayoutWithoutNav from '@/components/LayoutWithoutNav';
import { useFoodNft } from '@/hooks/use-food-nft';
import { FoodCard, FoodType } from '@/components/food-nft/FoodCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Tag } from 'lucide-react';
import { FoodIcon } from '@/components/icons/species-icons';
import { cn } from '@/lib/utils';
import { CreateListingDialog } from '@/components/marketplace/CreateListingDialog';

/**
 * My Food Inventory page - แสดง Food NFT ที่ผู้ใช้เป็นเจ้าของ
 * หน้าสำหรับดู Food NFT ในครอบครอง และขายบน Marketplace
 * 
 * Features:
 * - Grid of user's food NFTs with type and status
 * - Tag button with price input dialog
 * - Minimum price validation (0.50 USDT)
 * - Auth guard (redirects to login if not authenticated)
 */
export default function FoodInventoryPage() {
  return (
    <AuthGuard redirectTo="/auth/login">
      {(user) => <FoodInventoryContent user={user} />}
    </AuthGuard>
  );
}

function FoodInventoryContent({ user }: { user: any }) {
  const router = useRouter();
  const { getUserFoodNfts } = useFoodNft();
  
  // State สำหรับ Food NFT
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับ sell dialog
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  
  // Fetch food NFTs when user is available
  useEffect(() => {
    if (user?.id) {
      fetchFoods();
    }
  }, [user?.id]);
  
  const fetchFoods = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const foodList = await getUserFoodNfts(user.id);
      setFoods(foodList);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sell button click - เปิด dialog สำหรับขาย
  const handleSellClick = (food: any) => {
    setSelectedFood(food);
    setSellDialogOpen(true);
  };
  
  // Loading state - แสดงสถานะกำลังโหลด
  if (loading) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-4">
              <div className="h-16 w-80 bg-surface-container rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-surface-container rounded animate-pulse" />
            </div>
          </div>
          
          {/* Food Grid Skeleton - โครงร่างตารางอาหาร */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface-container-low p-6 rounded-xl clay-card">
                <div className="h-32 bg-surface-container rounded-lg mb-4 animate-pulse" />
                <div className="h-6 w-24 bg-surface-container rounded mb-2 animate-pulse" />
                <div className="h-4 w-20 bg-surface-container rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </LayoutWithoutNav>
    );
  }
  
  // Empty state - กรณีไม่มี Food NFT
  if (foods.length === 0) {
    return (
      <LayoutWithoutNav>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-5xl font-pixel-style text-primary mb-2">My Food Inventory</h1>
              <p className="text-on-surface-variant max-w-md">
                Your Food NFTs will appear here. Use them to feed your Egg NFTs!
              </p>
            </div>
          </div>
          
          <div className="bg-surface-container-low rounded-xl p-12 clay-card text-center">
            <span className="material-symbols-outlined text-6xl text-primary mb-4">inventory_2</span>
            <h2 className="text-2xl font-pixel-style text-primary mb-2">No Food NFTs Yet</h2>
            <p className="text-on-surface-variant mb-6">
              You don&apos;t have any Food NFTs yet. Purchase some to feed your eggs!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/eggs')}
                className="clay-button bg-primary text-on-primary py-4 px-8 rounded-xl font-black text-lg"
              >
                Buy Food NFTs
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="clay-button bg-surface-container text-primary py-4 px-8 rounded-xl font-black text-lg"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </LayoutWithoutNav>
    );
  }
  
  // Group foods by type for statistics
  const foodByType = foods.reduce((acc, food) => {
    const type = food.food_type || 'grain';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Main content - เนื้อหาหลัก
  return (
    <LayoutWithoutNav>
      <div className="max-w-6xl mx-auto">
        {/* Page Header - ส่วนหัวของหน้า */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-pixel-style text-primary mb-2">My Food Inventory</h1>
            <p className="text-on-surface-variant max-w-md">
              Manage your Food NFTs. Feed your eggs or sell on the marketplace!
            </p>
          </div>
          
          {/* Stats - สถิติ */}
          <div className="flex gap-4">
            <div className="clay-card bg-surface-container-lowest px-6 py-4 rounded-lg flex items-center gap-4">
              <Flame className="text-primary" style={{ fontVariationSettings: "'FILL' 1" }} />
              <div>
                <div className="text-xs font-bold text-on-surface-variant uppercase">Total</div>
                <div className="text-xl font-black text-primary">{foods.length}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Food Type Breakdown - แสดงประเภทอาหาร */}
        <div className="flex flex-wrap gap-2 mb-8">
            <Badge variant="clay" className="shadow-clay-sm font-body text-sm">
            <FoodIcon food="Wheat" className="w-4 h-4 inline mr-1" />Grain: {foodByType['grain'] || 0}
          </Badge>
          <Badge variant="clay" className="shadow-clay-sm font-body text-sm">
            <FoodIcon food="Fish" className="w-4 h-4 inline mr-1" />Fish: {foodByType['fish'] || 0}
          </Badge>
          <Badge variant="clay" className="shadow-clay-sm font-body text-sm">
            <FoodIcon food="Bug" className="w-4 h-4 inline mr-1" />Insects: {foodByType['insects'] || 0}
          </Badge>
          <Badge variant="clay" className="shadow-clay-sm font-body text-sm">
            <FoodIcon food="Leaf" className="w-4 h-4 inline mr-1" />Herbs: {foodByType['herb'] || 0}
          </Badge>
        </div>
        
        {/* Food Grid - ตารางแสดง Food NFT ทั้งหมด */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {foods.map((food) => (
            <div key={food.id} className="relative">
              <FoodCard
                food={{
                  food_id: food.food_id,
                  token_id: food.token_id,
                  food_type: food.food_type as FoodType,
                  is_consumed: food.is_consumed,
                  minted_at: food.minted_at,
                }}
              />
              
              {/* Tag Button - ปุ่มขาย (แสดงเฉพาะ Food ที่ยังไม่ถูกใช้) */}
              {!food.is_consumed && (
                <Button
                  variant="clay-secondary"
                  size="clay-md"
                  onClick={() => handleSellClick(food)}
                  className={cn(
                    'w-full mt-3 font-body text-sm',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  <Tag className="w-4 h-4" />
                  SELL
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* CreateListingDialog - ใช้ shared component สำหรับขาย NFT */}
      <CreateListingDialog
        open={sellDialogOpen}
        onOpenChange={setSellDialogOpen}
        nftName={`Food #${selectedFood?.food_id}`}
        nftType="Food"
        tokenId={selectedFood?.token_id}
        onSuccess={() => {
          fetchFoods();
        }}
      />
    </LayoutWithoutNav>
  );
}