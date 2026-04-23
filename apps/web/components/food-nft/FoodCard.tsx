'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FoodIcon } from '../icons/species-icons';

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

const foodTypeConfig: Record<FoodType, { label: string; color: string; foodIcon: string }> = {
  grain: { label: 'Grain', color: 'bg-yellow-500', foodIcon: 'Wheat' },
  fish: { label: 'Fish', color: 'bg-blue-500', foodIcon: 'Fish' },
  insects: { label: 'Insects', color: 'bg-green-500', foodIcon: 'Bug' },
  herb: { label: 'Herb', color: 'bg-purple-500', foodIcon: 'Leaf' },
};

export function FoodCard({ food, onSelect, selected, disableSelection }: FoodCardProps) {
  const config = foodTypeConfig[food.food_type];

  return (
    <Card
      variant="clay"
      className={cn(
        'relative overflow-hidden',
        'rounded-clay-md shadow-clay-md', // Clay container (24px radius)
        'transition-all duration-300 hover:shadow-clay-lg', // Hover lift
        'bg-gradient-to-br from-card/80 to-card',
        food.is_consumed && 'opacity-50 grayscale', // Consumed state
        selected && 'ring-2 ring-primary shadow-clay-lg', // Selected state
        onSelect && !food.is_consumed && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
      )}
      onClick={() => onSelect && !food.is_consumed && onSelect(food.food_id)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onSelect && !food.is_consumed) {
          e.preventDefault()
          onSelect(food.food_id)
        }
      }}
      tabIndex={onSelect && !food.is_consumed ? 0 : -1}
      role={onSelect && !food.is_consumed ? 'button' : undefined}
      aria-pressed={selected}
      aria-label={`Select ${config.label} food #${food.food_id}, ${selected ? 'selected' : 'not selected'}`}
    >
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium font-[var(--font-pixel)] text-xs text-foreground">
            Food #{food.food_id}
          </CardTitle>
          <Badge 
            variant="clay" 
            className={cn(
              config.color,
              'rounded-clay-full shadow-clay-sm',
              'font-[var(--font-pixel)] text-xs'
            )}
          >
            <FoodIcon food={config.foodIcon as any} /> {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-3">
          {/* Food Icon - Pixel Art (preserved) */}
          <div className={cn(
            'rounded-clay-md bg-secondary/20',
            'border-2 border-primary/30',
            'flex items-center justify-center',
            'p-clay-lg'
          )}>
            <div className={cn(
              'w-20 h-20',
              'flex items-center justify-center'
            )}>
              <FoodIcon food={config.foodIcon as any} />
            </div>
          </div>

          {/* Minted Date */}
          <div className="font-[var(--font-pixel)] text-xs text-muted-foreground">
            Minted: {new Date(food.minted_at).toLocaleDateString()}
          </div>
          
          {/* Consumed Badge - Clay styling */}
          {food.is_consumed && (
            <Badge 
              variant="clay" 
              className={cn(
                'w-full justify-center',
                'bg-accent/50',
                'rounded-clay-full shadow-clay-sm'
              )}
            >
              Consumed
            </Badge>
          )}
          
          {/* Selection Checkbox - Clay variant */}
          {!disableSelection && !food.is_consumed && onSelect && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id={`food-${food.food_id}`}
                checked={selected}
                onCheckedChange={() => onSelect(food.food_id)}
                variant="clay"
                aria-hidden="true"
                tabIndex={-1}
              />
              <label
                htmlFor={`food-${food.food_id}`}
                className="font-[var(--font-pixel)] text-xs peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                aria-hidden="true"
              >
                {config.label} #{food.food_id}
              </label>
            </div>
          )}

          {/* Use Button - Clay variant */}
          {!disableSelection && !food.is_consumed && (
            <Button
              variant="clay"
              size="clay-sm"
              className="w-full font-[var(--font-pixel)] text-xs rounded-clay-full"
              onClick={() => onSelect && onSelect(food.food_id)}
            >
              Use
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
