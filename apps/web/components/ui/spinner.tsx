import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SpinnerProps extends React.ComponentProps<'svg'> {
  variant?: 'default' | 'clay'
  size?: 'sm' | 'md' | 'lg'
}

function Spinner({ className, variant = 'default', size = 'md', ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
  }

  // Claymorphism container - เพิ่ม container แบบ claymorphism สำหรับ spinner
  if (variant === 'clay') {
    return (
      <div
        role="status"
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-clay-full shadow-clay-md bg-clay-volume-sm',
          'p-3',
          className,
        )}
      >
        <Loader2Icon
          aria-label="Loading"
          className={cn('animate-spin text-primary', sizeClasses[size])}
          {...props}
        />
      </div>
    )
  }

  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
