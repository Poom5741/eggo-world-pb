import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

/**
 * Avatar Component
 * 
 * User/profile avatar with fallback and status indicators.
 * Supports images, initials, and icons.
 * 
 * @example
 * // Image avatar
 * <Avatar src="/user.jpg" alt="John Doe" />
 * 
 * @example
 * // With fallback initials
 * <Avatar fallback="JD" />
 * 
 * @example
 * // With online status
 * <Avatar src="/user.jpg" status="online" />
 * 
 * @example
 * // Custom size
 * <Avatar size="lg" fallback="JD" />
 */

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden",
  {
    variants: {
      size: {
        sm: 'h-8 w-8 rounded-clay-sm',
        md: 'h-10 w-10 rounded-clay',
        lg: 'h-12 w-12 rounded-clay-md',
        xl: 'h-16 w-16 rounded-clay-lg',
        '2xl': 'h-24 w-24 rounded-clay-xl',
      },
      variant: {
        default: 'bg-surface-container',
        primary: 'bg-primary-container',
        secondary: 'bg-secondary-container',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
  status?: 'online' | 'offline' | 'away' | 'busy'
  statusPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, status, statusPosition = 'bottom-right', ...props }, ref) => {
    const [isLoading, setIsLoading] = React.useState(true)
    const [hasError, setHasError] = React.useState(false)

    const statusColors = {
      online: 'bg-tertiary',
      offline: 'bg-outline',
      away: 'bg-warning',
      busy: 'bg-error',
    }

    const statusPositions = {
      'top-right': 'top-1 right-1',
      'bottom-right': 'bottom-1 right-1',
      'top-left': 'top-1 left-1',
      'bottom-left': 'bottom-1 left-1',
    }

    return (
      <div
        ref={ref}
        className={cn(avatarVariants(props.size, props.variant), className)}
        {...props}
      >
        {src && !hasError ? (
          <>
            <img
              src={src}
              alt={alt}
              className={cn(
                "aspect-square h-full w-full object-cover",
                isLoading && "opacity-0"
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true)
                setIsLoading(false)
              }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-container animate-pulse">
                <span className="text-2xl font-bold text-on-surface-variant/50">
                  {fallback?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </>
        ) : fallback ? (
          <div className="flex h-full w-full items-center justify-center font-bold text-on-surface-variant">
            {fallback}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-1/2 w-1/2 text-on-surface-variant/50"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        )}

        {status && (
          <span
            className={cn(
              "absolute h-3 w-3 rounded-full border-2 border-surface",
              statusColors[status],
              statusPositions[statusPosition]
            )}
          />
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar, avatarVariants }
