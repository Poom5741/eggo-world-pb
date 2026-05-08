import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Badge Component
 * 
 * Status badges and tags with color variants.
 * Use for labels, status indicators, and tags.
 * 
 * @example
 * // Primary badge
 * <Badge variant="primary">New</Badge>
 * 
 * @example
 * // Success badge
 * <Badge variant="success">Active</Badge>
 * 
 * @example
 * // Outlined badge
 * <Badge variant="outline">Draft</Badge>
 * 
 * @example
 * // Custom size
 * <Badge size="lg">Large Badge</Badge>
 */

const badgeVariants = cva(
  "inline-flex items-center justify-center font-bold transition-colors select-none",
  {
    variants: {
      variant: {
        // Standard variants
        primary: 'bg-primary-container text-on-primary-container',
        secondary: 'bg-secondary-container text-on-secondary-container',
        tertiary: 'bg-tertiary-container text-on-tertiary-container',
        
        // Status variants
        success: 'bg-tertiary-container text-on-tertiary-container',
        warning: 'bg-orange-400 text-white',
        error: 'bg-error-container text-on-error-container',
        info: 'bg-blue-400 text-white',
        
        // Style variants
        outline: 'border-2 border-primary/30 text-on-surface-variant',
        ghost: 'bg-surface-container text-on-surface-variant',
        
        // Rarity variants (for NFTs)
        common: 'bg-slate-400 text-white',
        uncommon: 'bg-green-500 text-white',
        rare: 'bg-blue-500 text-white',
        epic: 'bg-purple-500 text-white',
        legendary: 'bg-amber-400 text-amber-950',
        mythic: 'bg-red-500 text-white',
      },
      size: {
        sm: 'h-6 px-2.5 text-xs rounded-clay-sm',
        md: 'h-7 px-3 text-sm rounded-clay',
        lg: 'h-8 px-4 text-base rounded-clay-md',
        xl: 'h-9 px-5 text-lg rounded-clay-lg',
      },
      shape: {
        default: '',
        pill: 'rounded-clay-full',
        square: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, shape, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size, shape }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
