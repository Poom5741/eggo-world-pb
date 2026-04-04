'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { useFoodNft } from '@/hooks/use-food-nft';
import { createClient } from '@/lib/pocketbase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Egg, CheckCircle } from 'lucide-react';
import { FoodCard, FoodType } from '@/components/food-nft/FoodCard';

const MAX_FOOD_COUNT = 10;

export default function FeedEggPage() {
  const params = useParams();
  const router = useRouter();
  const isHydrated = useIsHydrated();
  const [egg, setEgg] = useState<any | null>(null);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([]);
  const [feedResult, setFeedResult] = useState<any | null>(null);
  const { loading, error, feedEgg, getUserFoodNfts } = useFoodNft();

  useEffect(() => {
    if (!isHydrated) return;

    const loadData = async () => {
      const user = createClient().authStore.record;
      if (!user) return;

      // Load egg
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

      // Load food items
      try {
        const foods = await getUserFoodNfts(user.id);
        setFoodItems(foods);
      } catch (err) {
        console.error('Error loading food:', err);
      }
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
          <AlertDescription>Please log in to feed your Egg NFT</AlertDescription>
        </Alert>
      </div>
    );
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
  const progress = (foodCount / MAX_FOOD_COUNT) * 100;
  const readyToHatch = foodCount >= MAX_FOOD_COUNT;

  const handleSelectFood = (foodId: number) => {
    setSelectedFoodIds(prev =>
      prev.includes(foodId)
        ? prev.filter(id => id !== foodId)
        : [...prev, foodId]
    );
  };

  const handleFeed = async () => {
    const result = await feedEgg(egg.token_id, selectedFoodIds);
    if (result) {
      setFeedResult(result);
      // Reload egg data
      const updatedEggs = await createClient().collection('egg_nfts').getList(1, 1, {
        filter: `token_id = ${egg.token_id} && owner.id = "${user.id}"`,
      });
      if (updatedEggs.items.length > 0) {
        setEgg(updatedEggs.items[0]);
      }
      setSelectedFoodIds([]);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Feed Your Egg</h1>
          <p className="text-muted-foreground">Feed Food NFTs to progress toward hatching</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Egg className="h-6 w-6" />
                  Egg #{egg.token_id}
                </CardTitle>
                <CardDescription>Progress toward hatching</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Food Count</Label>
                    <Badge variant={readyToHatch ? 'default' : 'secondary'}>
                      {foodCount} / {MAX_FOOD_COUNT}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {readyToHatch && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Ready to hatch! Go to the eggs dashboard to hatch your egg.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.push('/dashboard/eggs')}>
                    Back to Eggs
                  </Button>
                  {readyToHatch && (
                    <Button onClick={() => router.push(`/dashboard/eggs/${egg.token_id}/hatch`)}>
                      Hatch Egg
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {feedResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">✓ Feeding Successful!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>New Food Count</Label>
                    <p className="text-2xl font-bold">{feedResult.new_food_count}</p>
                  </div>

                  <div>
                    <Label>Food Type Distribution</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      <Badge className="bg-yellow-500">🌾 {feedResult.food_type_distribution.grain}</Badge>
                      <Badge className="bg-blue-500">🐟 {feedResult.food_type_distribution.fish}</Badge>
                      <Badge className="bg-green-500">🦗 {feedResult.food_type_distribution.insects}</Badge>
                      <Badge className="bg-purple-500">🌿 {feedResult.food_type_distribution.herb}</Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Transaction Hash</Label>
                    <p className="text-xs font-mono break-all">{feedResult.tx_hash}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Food NFTs</CardTitle>
                <CardDescription>
                  Select food items to feed ({selectedFoodIds.length} selected)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {foodItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No Food NFTs available. Visit the{' '}
                    <a href="/marketplace/food" className="text-primary underline">
                      Food Marketplace
                    </a>{' '}
                    to mint some.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-2">
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
                        onSelect={handleSelectFood}
                        disableSelection={food.is_consumed}
                      />
                    ))}
                  </div>
                )}

                {foodItems.length > 0 && (
                  <Button
                    onClick={handleFeed}
                    disabled={loading || selectedFoodIds.length === 0}
                    className="w-full mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Feeding...
                      </>
                    ) : (
                      `Feed ${selectedFoodIds.length} Food Item${selectedFoodIds.length !== 1 ? 's' : ''}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
