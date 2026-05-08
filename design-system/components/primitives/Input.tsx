import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Input Component
 * 
 * Form input with claymorphism styling.
 * Supports various states: default, focus, error, disabled.
 * 
 * @example
 * // Default input
 * <Input placeholder="Enter text..." />
 * 
 * @example
 * // With error
 * <Input error="This field is required" />
 * 
 * @example
 * // With icon
 * <div className="relative">
 *   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
 *   <Input className="pl-10" placeholder="Search..." />
 * </div>
 * 
 * @example
 * // Clay variant
 * <Input variant="clay" placeholder="Clay styled input" />
 */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'clay' | 'filled'
  error?: string
  label?: string
  helpText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', error, label, helpText, ...props }, ref) => {
    const variants = {
      default: `
        bg-background 
        border-2 
        border-outline/30 
        focus:border-primary 
        focus:ring-2 
        focus:ring-primary/20
        text-on-surface
        placeholder:text-on-surface-variant/60
      `,
      clay: `
        bg-surface
        shadow-clay-inset
        border-2
        border-outline/20
        focus:border-primary
        focus:shadow-clay-md
        text-on-surface
        placeholder:text-on-surface-variant/60
      `,
      filled: `
        bg-surface-container
        border-0
        focus:ring-2
        focus:ring-primary/20
        text-on-surface
        placeholder:text-on-surface-variant/60
      `,
    }

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-bold text-on-surface">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-clay px-4 text-base transition-all disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]",
            variants[variant],
            error && "border-error focus:border-error focus:ring-error/20",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-error font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        
        {helpText && !error && (
          <p className="text-sm text-on-surface-variant">{helpText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
