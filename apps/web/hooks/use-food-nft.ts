'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/pocketbase/client';

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
      const pb = createClient();
      const response = await pb.send('/api/v2/mint-food', {
        method: 'POST',
        body: {
          quantity,
          referrer_id: referrerId,
        },
      });

      if (!response.success) {
        let errorMessage = 'Failed to mint food'
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error
          } else if (typeof response.error === 'object' && response.error !== null) {
            if (typeof response.error.message === 'string') {
              errorMessage = response.error.message
            } else if (response.error.message && typeof response.error.message === 'object') {
              errorMessage = JSON.stringify(response.error.message)
            } else {
              errorMessage = JSON.stringify(response.error)
            }
          }
        }
        throw new Error(errorMessage)
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
      const pb2 = createClient();
      const response = await pb2.send('/api/v2/feed-egg', {
        method: 'POST',
        body: {
          egg_token_id,
          food_ids,
        },
      });

      if (!response.success) {
        let errorMessage = 'Failed to feed egg'
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error
          } else if (typeof response.error === 'object' && response.error !== null) {
            if (typeof response.error.message === 'string') {
              errorMessage = response.error.message
            } else if (response.error.message && typeof response.error.message === 'object') {
              errorMessage = JSON.stringify(response.error.message)
            } else {
              errorMessage = JSON.stringify(response.error)
            }
          }
        }
        throw new Error(errorMessage)
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

  const getUserFoodNfts = useCallback(async (userId: string) => {
    try {
      const pb = createClient();
      // Use requestKey: null to disable auto-cancellation for this request
      const records = await pb.collection('food_nfts').getList(1, 100, {
        filter: `owner = "${userId}" && is_consumed = false`,
        requestKey: null,
      });
      return records.items;
    } catch (err) {
      // Don't log ClientResponseError for auto-cancellation (it's expected when dialog closes)
      if (err && typeof err === 'object' && 'isCanceled' in err && err.isCanceled) {
        return [];
      }
      console.error('Error fetching food NFTs:', err);
      return [];
    }
  }, []);

  const getTotalFoodConsumed = async (userId: string): Promise<number> => {
    try {
      const pb = createClient();
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
