'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

interface DialogOverlayProps extends React.ComponentProps<typeof DialogPrimitive.Overlay> {
  variant?: 'default' | 'clay'
}

function DialogOverlay({
  className,
  variant = 'default',
  ...props
}: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 transition-all',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        variant === 'default' && 'bg-black/50',
        variant === 'clay' && 'bg-black/60 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean
  variant?: 'default' | 'clay'
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  variant = 'default',
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay variant={variant} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 transition-all duration-200 sm:max-w-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          variant === 'default' && 'bg-background rounded-lg shadow-lg',
          variant === 'clay' && 'bg-background rounded-clay-xl shadow-clay-xl border-primary/10 bg-clay-volume-lg',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              variant === 'default' && 'ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground focus:ring-2 focus:ring-offset-2',
              variant === 'clay' && 'focus:ring-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary focus:ring-2 focus:ring-offset-2 focus:ring-primary/20',
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

interface DialogHeaderProps extends React.ComponentProps<'div'> {
  variant?: 'default' | 'clay'
}

function DialogHeader({ className, variant = 'default', ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-2',
        variant === 'default' && 'text-center sm:text-left',
        variant === 'clay' && 'text-center sm:text-left pb-4 border-b border-primary/10',
        className,
      )}
      {...props}
    />
  )
}

interface DialogFooterProps extends React.ComponentProps<'div'> {
  variant?: 'default' | 'clay'
}

function DialogFooter({ className, variant = 'default', ...props }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        variant === 'clay' && 'pt-4 border-t border-primary/10',
        className,
      )}
      {...props}
    />
  )
}

interface DialogTitleProps extends React.ComponentProps<typeof DialogPrimitive.Title> {
  variant?: 'default' | 'clay'
}

function DialogTitle({
  className,
  variant = 'default',
  ...props
}: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'text-lg leading-none font-semibold',
        variant === 'clay' && 'text-xl font-bold text-primary',
        className,
      )}
      {...props}
    />
  )
}

interface DialogDescriptionProps extends React.ComponentProps<typeof DialogPrimitive.Description> {
  variant?: 'default' | 'clay'
}

function DialogDescription({
  className,
  variant = 'default',
  ...props
}: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-muted-foreground text-sm',
        variant === 'clay' && 'text-base text-foreground/80',
        className,
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
