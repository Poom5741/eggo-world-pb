'use client';

import { useState } from 'react';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { useFoodNft } from '@/hooks/use-food-nft';
import { pb } from '@/lib/pocketbase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const FOOD_PRICE = 0.50;
const MAX_QUANTITY = 100;

export default function FoodMarketplacePage() {
  const isHydrated = useIsHydrated();
  const searchParams = useSearchParams();
  const [quantity, setQuantity] = useState<number>(10);
  const [referrerId, setReferrerId] = useState<string>('');
  const { loading, error, mintFood } = useFoodNft();
  const [mintResult, setMintResult] = useState<any | null>(null);

  if (!isHydrated) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  const user = pb.authStore.record;
  
  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Alert>
          <AlertDescription>Please log in to mint Food NFTs</AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalCost = quantity * FOOD_PRICE;
  const userBalance = user.usdt_balance || 0;

  const handleMint = async () => {
    const result = await mintFood(quantity, referrerId || undefined);
    if (result) {
      setMintResult(result);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Food NFT Marketplace</h1>
          <p className="text-muted-foreground">Mint Food NFTs to feed your Egg NFTs</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mint Food NFTs</CardTitle>
            <CardDescription>Each Food NFT costs 0.50 USDT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Price per NFT</Label>
                <Badge variant="secondary">{FOOD_PRICE} USDT</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={MAX_QUANTITY}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum {MAX_QUANTITY} NFTs per transaction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrer">Referrer ID (optional)</Label>
              <Input
                id="referrer"
                value={referrerId}
                onChange={(e) => setReferrerId(e.target.value)}
                placeholder="Enter referrer user ID"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Total Cost</Label>
                <Badge variant="outline">{totalCost.toFixed(2)} USDT</Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Your Balance</Label>
                <Badge variant={userBalance >= totalCost ? 'default' : 'destructive'}>
                  {userBalance.toFixed(2)} USDT
                </Badge>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleMint}
              disabled={loading || userBalance < totalCost || quantity < 1}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Mint {quantity} Food NFT{quantity > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {mintResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✓ Minting Successful!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Food NFTs Minted</Label>
                  <p className="text-2xl font-bold">{mintResult.food_ids.length}</p>
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <p className="text-2xl font-bold">{mintResult.total_cost} USDT</p>
                </div>
              </div>

              <div>
                <Label>Food Type Distribution</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <Badge className="bg-yellow-500">🌾 {mintResult.food_type_distribution.grain} Grain</Badge>
                  <Badge className="bg-blue-500">🐟 {mintResult.food_type_distribution.fish} Fish</Badge>
                  <Badge className="bg-green-500">🦗 {mintResult.food_type_distribution.insects} Insects</Badge>
                  <Badge className="bg-purple-500">🌿 {mintResult.food_type_distribution.herb} Herb</Badge>
                </div>
              </div>

              <div>
                <Label>Transaction Hash</Label>
                <p className="text-xs font-mono break-all">{mintResult.tx_hash}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
