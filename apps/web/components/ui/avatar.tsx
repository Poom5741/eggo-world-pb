'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  variant?: 'default' | 'clay'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

function Avatar({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex shrink-0 overflow-hidden',
        variant === 'default' && 'rounded-full',
        variant === 'clay' && 'rounded-clay-full shadow-clay-md border-2 border-primary/20',
        // Size variants
        size === 'sm' && 'size-6',
        size === 'md' && 'size-8',
        size === 'lg' && 'size-12',
        size === 'xl' && 'size-16',
        // Clay shadow sizes
        variant === 'clay' && size === 'sm' && 'shadow-clay-sm',
        variant === 'clay' && size === 'md' && 'shadow-clay-md',
        variant === 'clay' && size === 'lg' && 'shadow-clay-lg',
        variant === 'clay' && size === 'xl' && 'shadow-clay-xl',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
