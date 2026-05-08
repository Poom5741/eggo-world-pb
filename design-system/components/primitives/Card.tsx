import * as React from "react"
import { cn } from "@/lib/utils"
import { clsx, type ClassValue } from "clsx"

/**
 * Card Component
 * 
 * Reusable card with claymorphism shadows and Jules Design styling.
 * Supports multiple variants for different use cases.
 * 
 * @example
 * // Standard clay card
 * <Card>
 *   <CardHeader>Title</CardHeader>
 *   <CardContent>Content here</CardContent>
 *   <CardFooter>Actions</CardFooter>
 * </Card>
 * 
 * @example
 * // Compact variant
 * <Card variant="compact">
 *   <CardContent>Compact content</CardContent>
 * </Card>
 * 
 * @example
 * // Interactive card
 * <Card variant="interactive" onClick={handleClick} className="cursor-pointer">
 *   <CardContent>Clickable card</CardContent>
 * </Card>
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'compact' | 'interactive' | 'elevated'
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', shadow = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface rounded-clay',
      compact: 'bg-surface-container rounded-clay-sm',
      interactive: 'bg-surface rounded-clay-lg hover:shadow-clay-lg transition-shadow',
      elevated: 'bg-surface-container-highest rounded-clay-xl',
    }

    const shadows = {
      sm: 'shadow-clay-sm',
      md: 'shadow-clay-md',
      lg: 'shadow-clay-lg',
      xl: 'shadow-clay-xl',
      '2xl': 'shadow-clay-2xl',
    }

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          shadows[shadow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, inset, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-6",
          inset && "px-6 pt-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardHeader.displayName = "CardHeader"

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "font-headline font-black text-xl text-on-surface",
          className
        )}
        {...props}
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          "text-sm text-on-surface-variant mt-1",
          className
        )}
        {...props}
      />
    )
  }
)
CardDescription.displayName = "CardDescription"

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-6 pt-0",
          className
        )}
        {...props}
      />
    )
  }
)
CardContent.displayName = "CardContent"

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, inset, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-6 pt-0",
          inset && "px-6 pb-6",
          className
        )}
        {...props}
      />
    )
  }
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
