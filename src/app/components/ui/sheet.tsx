"use client"

import * as SheetPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal
const SheetOverlay = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>) => (
  <SheetPrimitive.Overlay
    className={cn('fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm', className)}
    {...props}
  />
)
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const SheetContent = ({
  className,
  side = 'right',
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: 'left' | 'right' | 'top' | 'bottom' }) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      className={cn(
        'fixed z-50 flex flex-col bg-white shadow-2xl duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in',
        side === 'right' && 'inset-y-0 right-0 w-full max-w-lg border-l border-slate-200',
        side === 'left' && 'inset-y-0 left-0 w-full max-w-lg border-r border-slate-200',
        side === 'top' && 'inset-x-0 top-0 border-b border-slate-200',
        side === 'bottom' && 'inset-x-0 bottom-0 border-t border-slate-200',
        className,
      )}
      {...props}>
      <SheetPrimitive.Close className='absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'>
        <X className='h-4 w-4' />
        <span className='sr-only'>Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
)
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 border-b border-slate-200 px-6 py-5', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetTitle = SheetPrimitive.Title
const SheetDescription = SheetPrimitive.Description

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end', className)} {...props} />
)
SheetFooter.displayName = 'SheetFooter'

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

