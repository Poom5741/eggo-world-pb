'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  variant?: 'default' | 'clay'
}

function Switch({
  className,
  variant = 'default',
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'default' && 'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 shadow-xs',
        variant === 'clay' && 'pill-shaped shadow-clay-sm data-[state=checked]:bg-primary data-[state=unchecked]:bg-input/50 focus-visible:border-primary focus-visible:ring-primary/20 data-[state=checked]:shadow-clay-md',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full ring-0 transition-transform',
          variant === 'default' && 'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground size-4 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
          variant === 'clay' && 'bg-background shadow-clay-sm data-[state=checked]:bg-primary data-[state=unchecked]:bg-input size-4 data-[state=checked]:translate-x-[calc(100%-3px)] data-[state=unchecked]:translate-x-0.5',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
