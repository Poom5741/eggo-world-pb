'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export type FoodType = 'grain' | 'fish' | 'insects' | 'herb';

interface FoodCardProps {
  food: {
    food_id: number;
    token_id: number;
    food_type: FoodType;
    is_consumed: boolean;
    minted_at: string;
  };
  onSelect?: (id: number) => void;
  selected?: boolean;
  disableSelection?: boolean;
}

const foodTypeConfig: Record<FoodType, { label: string; color: string; icon: string }> = {
  grain: { label: 'Grain', color: 'bg-yellow-500', icon: '🌾' },
  fish: { label: 'Fish', color: 'bg-blue-500', icon: '🐟' },
  insects: { label: 'Insects', color: 'bg-green-500', icon: '🦗' },
  herb: { label: 'Herb', color: 'bg-purple-500', icon: '🌿' },
};

export function FoodCard({ food, onSelect, selected, disableSelection }: FoodCardProps) {
  const config = foodTypeConfig[food.food_type];

  return (
    <Card
      className={cn(
        'relative transition-all hover:shadow-lg',
        food.is_consumed && 'opacity-50 grayscale',
        selected && 'ring-2 ring-primary'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Food #{food.food_id}</CardTitle>
          <Badge className={config.color} variant="secondary">
            {config.icon} {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Minted: {new Date(food.minted_at).toLocaleDateString()}
          </div>
          
          {food.is_consumed && (
            <Badge variant="destructive" className="w-full justify-center">
              Consumed
            </Badge>
          )}
          
          {!disableSelection && !food.is_consumed && onSelect && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id={`food-${food.food_id}`}
                checked={selected}
                onCheckedChange={() => onSelect(food.food_id)}
              />
              <label
                htmlFor={`food-${food.food_id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select to feed
              </label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
