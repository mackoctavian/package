"use client"

import { cn } from '@/lib/utils'

type LoadingIndicatorProps = {
  label?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap: Record<Required<LoadingIndicatorProps>['size'], string> = {
  sm: 'h-6 w-6 border-[2.5px]',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-10 w-10 border-[3px]',
}

export function LoadingIndicator({ label = 'Loading data…', className, size = 'lg' }: LoadingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-sm font-medium text-muted-foreground',
        className,
      )}
      role='status'
      aria-live='polite'
    >
      <span
        className={cn(
          'inline-flex rounded-full border-muted-foreground/70 border-t-transparent',
          'animate-spin',
          sizeMap[size],
        )}
        aria-hidden='true'
      />
      {label ? <span>{label}</span> : null}
    </div>
  )
}


