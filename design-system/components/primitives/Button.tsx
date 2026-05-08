import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Button Component
 * 
 * Reusable button with claymorphism and standard variants.
 * Supports multiple sizes and variants for different use cases.
 * 
 * @default variant="default", size="default"
 * 
 * @example
 * // Clay button (primary)
 * <Button variant="clay">Click Me</Button>
 * 
 * @example
 * // Standard outlined
 * <Button variant="outline">Outlined</Button>
 * 
 * @example
 * // Large clay button
 * <Button variant="clay" size="clay-lg">Large Button</Button>
 * 
 * @example
 * // Icon button
 * <Button variant="ghost" size="icon">
 *   <Heart className="w-5 h-5" />
 * </Button>
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 aria-invalid:ring-error/20",
  {
    variants: {
      variant: {
        // Standard variants
        default: 'bg-primary text-on-primary hover:bg-primary/90',
        destructive:
          'bg-error text-on-error hover:bg-error/90 focus-visible:ring-error/20',
        outline:
          'border-2 border-outline bg-background hover:bg-surface-container-low hover:text-on-surface',
        secondary:
          'bg-secondary text-on-secondary hover:bg-secondary/90',
        ghost:
          'hover:bg-surface-container hover:text-on-surface',
        link: 'text-primary underline-offset-4 hover:underline',
        
        // Claymorphism variants (Jules Design)
        clay: 'bg-primary-container text-on-primary-container shadow-clay-md hover:shadow-clay-lg active:shadow-clay-sm rounded-clay transition-all',
        'clay-secondary': 'bg-secondary-container text-on-secondary-container shadow-clay-md hover:shadow-clay-lg rounded-clay transition-all',
        'clay-outline': 'bg-surface shadow-clay-md hover:shadow-clay-lg border-2 border-primary/20 rounded-clay transition-all',
        'clay-ghost': 'bg-surface-container shadow-clay-sm hover:shadow-clay-md rounded-clay transition-all',
      },
      size: {
        // Standard sizes
        default: 'h-10 rounded-clay-sm px-5 has-[>svg]:px-4',
        sm: 'h-9 rounded-clay-sm px-4 has-[>svg]:px-3 text-sm',
        lg: 'h-12 rounded-clay px-8 has-[>svg]:px-6 text-base',
        icon: 'size-10 rounded-clay-full',
        'icon-sm': 'size-9 rounded-clay-full',
        
        // Claymorphism sizes
        'clay-sm': 'h-9 rounded-clay-sm px-5 has-[>svg]:px-4 text-sm',
        'clay-md': 'h-11 rounded-clay px-6 has-[>svg]:px-5',
        'clay-lg': 'h-14 rounded-clay-md px-8 has-[>svg]:px-6 text-lg',
        'clay-xl': 'h-16 rounded-clay-lg px-10 has-[>svg]:px-8 text-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
