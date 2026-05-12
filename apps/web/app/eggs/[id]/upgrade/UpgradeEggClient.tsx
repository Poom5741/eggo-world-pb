"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { useFoodNft } from '@/hooks/use-food-nft';
import { createClient } from '@/lib/pocketbase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Egg, CheckCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { FoodCard, FoodType } from '@/components/food-nft/FoodCard';
import { cn } from '@/lib/utils';

const MAX_FOOD_COUNT = 20;
const MIN_FOOD_FOR_UPGRADE = 10;
const UPGRADE_FEE_PER_FOOD = 5;

interface UpgradeEggClientProps {
  params: { id: string };
}

export default function UpgradeEggClient({ params }: UpgradeEggClientProps) {
  const router = useRouter();
  const isHydrated = useIsHydrated();
  const [egg, setEgg] = useState<any | null>(null);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([]);
  const [upgradeResult, setUpgradeResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { getUserFoodNfts } = useFoodNft();

  useEffect(() => {
    if (!isHydrated) return;

    const loadData = async () => {
      const user = createClient().authStore.record;
      if (!user) {
        setDataLoading(false);
        return;
      }

      try {
        const eggs = await createClient().collection('egg_nfts').getList(1, 1, {
          filter: `token_id = ${params.id} && owner.id = "${user.id}"`,
        });
        if (eggs.items.length > 0) {
          setEgg(eggs.items[0]);
        }
      } catch (err) {
        console.error('Error loading egg:', err);
      }

      try {
        const foods = await getUserFoodNfts(user.id);
        setFoodItems(foods);
      } catch (err) {
        console.error('Error loading food:', err);
      }

      setDataLoading(false);
    };

    loadData();
  }, [isHydrated, params.id, getUserFoodNfts]);

  if (!isHydrated) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  const user = createClient().authStore.record;

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Alert>
          <AlertDescription>Please log in to upgrade your Egg NFT</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (dataLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  if (!egg) {
    return (
      <div className="container mx-auto py-10">
        <Alert>
          <AlertDescription>Egg not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const foodCount = egg.food_count || 0;
  const rarityUpgradeCount = egg.rarity_upgrade_count || 0;
  const progress = (foodCount / MAX_FOOD_COUNT) * 100;
  const canUpgrade = foodCount >= MIN_FOOD_FOR_UPGRADE && !egg.is_hatched;
  const maxSelectable = MAX_FOOD_COUNT - foodCount;
  const totalFee = selectedFoodIds.length * UPGRADE_FEE_PER_FOOD;

  const handleSelectFood = (foodId: number) => {
    setSelectedFoodIds(prev => {
      if (prev.includes(foodId)) {
        return prev.filter(id => id !== foodId);
      }
      if (prev.length >= maxSelectable) {
        return prev;
      }
      return [...prev, foodId];
    });
  };

  const handleUpgrade = async () => {
    if (selectedFoodIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const pb = createClient();
      const response = await pb.send('/api/v2/upgrade-egg-rarity', {
        method: 'POST',
        body: {
          egg_token_id: egg.token_id,
          food_ids: selectedFoodIds,
        },
      });

      if (!response.success) {
        let errorMessage = 'Failed to upgrade egg rarity';
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (typeof response.error === 'object' && response.error !== null) {
            if (typeof response.error.message === 'string') {
              errorMessage = response.error.message;
            } else {
              errorMessage = JSON.stringify(response.error);
            }
          }
        }
        throw new Error(errorMessage);
      }

      setUpgradeResult(response.data);

      const updatedEggs = await createClient().collection('egg_nfts').getList(1, 1, {
        filter: `token_id = ${egg.token_id} && owner.id = "${user.id}"`,
      });
      if (updatedEggs.items.length > 0) {
        setEgg(updatedEggs.items[0]);
      }

      const updatedFoods = await getUserFoodNfts(user.id);
      setFoodItems(updatedFoods);
      setSelectedFoodIds([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className={cn(
          'rounded-clay-lg p-clay-xl',
          'bg-card shadow-clay-lg'
        )}>
          <h1 className="text-3xl font-bold text-primary">Upgrade Egg Rarity</h1>
          <p className="text-muted-foreground">Burn Food NFTs to increase your egg&apos;s rarity bonus</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Egg className="h-6 w-6" />
                  Egg #{egg.token_id}
                </CardTitle>
                <CardDescription>Rarity upgrade progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Food Count</Label>
                    <Badge variant={foodCount >= MAX_FOOD_COUNT ? 'default' : 'secondary'}>
                      {foodCount} / {MAX_FOOD_COUNT}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Rarity Upgrades</Label>
                  <Badge variant="outline">{rarityUpgradeCount}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Rarity Bonus</Label>
                  <Badge variant="outline">{rarityUpgradeCount * 2}%</Badge>
                </div>

                {egg.is_hatched && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      This egg has already hatched and cannot be upgraded further.
                    </AlertDescription>
                  </Alert>
                )}

                {!canUpgrade && !egg.is_hatched && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Feed this egg at least {MIN_FOOD_FOR_UPGRADE} times before upgrading rarity.
                      Current: {foodCount} / {MIN_FOOD_FOR_UPGRADE}
                    </AlertDescription>
                  </Alert>
                )}

                {canUpgrade && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      This egg is eligible for rarity upgrades. Select food items below.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.push('/eggs')}>
                    Back to Eggs
                  </Button>
                  <Button variant="outline" onClick={() => router.push(`/eggs/${egg.token_id}/feed`)}>
                    Feed Egg
                  </Button>
                </div>
              </CardContent>
            </Card>

            {upgradeResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5" />
                    Upgrade Successful!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>New Food Count</Label>
                    <p className="text-2xl font-bold">{upgradeResult.new_food_count}</p>
                  </div>

                  <div>
                    <Label>Rarity Upgrade Count</Label>
                    <p className="text-2xl font-bold">{upgradeResult.rarity_upgrade_count}</p>
                  </div>

                  <div>
                    <Label>Rarity Bonus</Label>
                    <p className="text-2xl font-bold text-primary">{upgradeResult.rarity_bonus}%</p>
                  </div>

                  <div>
                    <Label>Fee Deducted</Label>
                    <p className="text-lg font-semibold">{upgradeResult.fee_deducted} USDT</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card variant="clay-lg" className="shadow-clay-xl">
              <CardHeader>
                <CardTitle className="font-body text-sm">Your Food NFTs</CardTitle>
                <CardDescription className="font-body text-xs">
                  Select food items to burn for upgrade ({selectedFoodIds.length} selected, max {maxSelectable})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="font-body text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {foodItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 font-body text-xs">
                    No Food NFTs available. Visit the{' '}
                    <a href="/marketplace/food" className="text-primary underline">
                      Food Marketplace
                    </a>{' '}
                    to mint some.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-clay-lg max-h-[600px] overflow-y-auto p-2">
                    {foodItems.map((food) => (
                      <FoodCard
                        key={food.food_id}
                        food={{
                          food_id: food.food_id,
                          token_id: food.token_id,
                          food_type: food.food_type as FoodType,
                          is_consumed: food.is_consumed,
                          minted_at: food.minted_at,
                        }}
                        selected={selectedFoodIds.includes(food.food_id)}
                        onSelect={canUpgrade ? handleSelectFood : undefined}
                        disableSelection={food.is_consumed || !canUpgrade}
                      />
                    ))}
                  </div>
                )}

                {foodItems.length > 0 && canUpgrade && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Upgrade Fee:</span>
                      <span className="font-semibold">{totalFee} USDT ({selectedFoodIds.length} x {UPGRADE_FEE_PER_FOOD} USDT)</span>
                    </div>

                    <Button
                      onClick={handleUpgrade}
                      disabled={loading || selectedFoodIds.length === 0}
                      variant="clay"
                      size="clay-lg"
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Upgrading...
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle className="mr-2 h-4 w-4" />
                          Upgrade Rarity ({selectedFoodIds.length} Food Item{selectedFoodIds.length !== 1 ? 's' : ''})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}