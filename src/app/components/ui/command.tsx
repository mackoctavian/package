"use client"

import { type ComponentPropsWithoutRef } from 'react'
import * as CommandPrimitive from 'cmdk'
import { Dialog, DialogContent } from '@/app/components/ui/dialog'

import { cn } from '@/lib/utils'

const Command = ({ className, ...props }: ComponentPropsWithoutRef<typeof CommandPrimitive.Command>) => (
  <CommandPrimitive.Command
    className={cn(
      'flex h-full w-full flex-col rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm',
      className,
    )}
    {...props}
  />
)
Command.displayName = CommandPrimitive.Command.displayName

const CommandInput = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.CommandInput>) => (
  <div className='flex items-center border-b border-slate-200 px-3'>
    <CommandPrimitive.CommandInput
      className={cn(
        'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  </div>
)
CommandInput.displayName = CommandPrimitive.CommandInput.displayName

const CommandList = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.CommandList>) => (
  <CommandPrimitive.CommandList
    className={cn('max-h-80 overflow-y-auto p-2 text-sm', className)}
    {...props}
  />
)
CommandList.displayName = CommandPrimitive.CommandList.displayName

const CommandEmpty = CommandPrimitive.CommandEmpty

const CommandGroup = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.CommandGroup>) => (
  <CommandPrimitive.CommandGroup
    className={cn('overflow-hidden p-2 text-xss font-semibold uppercase tracking-[0.3em] text-slate-500', className)}
    {...props}
  />
)
CommandGroup.displayName = CommandPrimitive.CommandGroup.displayName

const CommandSeparator = ({ className, ...props }: ComponentPropsWithoutRef<typeof CommandPrimitive.CommandSeparator>) => (
  <CommandPrimitive.CommandSeparator
    className={cn('my-2 h-px bg-slate-100', className)}
    {...props}
  />
)
CommandSeparator.displayName = CommandPrimitive.CommandSeparator.displayName

const CommandItem = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.CommandItem>) => (
  <CommandPrimitive.CommandItem
    className={cn(
      'flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 aria-selected:bg-slate-100 aria-selected:text-slate-900',
      className,
    )}
    {...props}
  />
)
CommandItem.displayName = CommandPrimitive.CommandItem.displayName

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('ml-auto text-xs tracking-widest text-slate-400', className)} {...props} />
)
CommandShortcut.displayName = 'CommandShortcut'

const CommandDialog = ({ children, ...props }: ComponentPropsWithoutRef<typeof Dialog>) => {
  return (
    <Dialog {...props}>
      <DialogContent className='overflow-hidden p-0'>
        <Command className='[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5'>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}

