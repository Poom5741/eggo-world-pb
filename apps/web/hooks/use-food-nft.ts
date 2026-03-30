'use client';

import { useState } from 'react';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { pb } from '@/lib/pocketbase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface MintResult {
  food_ids: number[];
  tx_hash: string;
  total_cost: string;
  food_type_distribution: {
    grain: number;
    fish: number;
    insects: number;
    herb: number;
  };
}

export function useFoodNft() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mintFood = async (quantity: number, referrerId?: string): Promise<MintResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await pb.send('/api/v2/mint-food', {
        method: 'POST',
        body: {
          quantity,
          referrer_id: referrerId,
        },
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to mint food');
      }

      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const feedEgg = async (egg_token_id: number, food_ids: number[]): Promise<any | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await pb.send('/api/v2/feed-egg', {
        method: 'POST',
        body: {
          egg_token_id,
          food_ids,
        },
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to feed egg');
      }

      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserFoodNfts = async (userId: string) => {
    try {
      const records = await pb.collection('food_nfts').getList(1, 100, {
        filter: `owner = "${userId}" && is_consumed = false`,
      });
      return records.items;
    } catch (err) {
      console.error('Error fetching food NFTs:', err);
      return [];
    }
  };

  const getTotalFoodConsumed = async (userId: string): Promise<number> => {
    try {
      const user = await pb.collection('users').getOne(userId);
      return user.total_food_consumed || 0;
    } catch (err) {
      console.error('Error fetching total food consumed:', err);
      return 0;
    }
  };

  return {
    loading,
    error,
    mintFood,
    feedEgg,
    getUserFoodNfts,
    getTotalFoodConsumed,
  };
}
