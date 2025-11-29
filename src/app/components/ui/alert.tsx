import * as React from 'react'

import { cn } from '@/lib/utils'

const alertVariants = {
  default: 'bg-white text-slate-700',
  destructive: 'border-red-200 bg-red-50 text-red-700',
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof alertVariants
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role='alert'
      className={cn(
        'flex w-full flex-col gap-1 rounded-xl border border-slate-200 px-4 py-3 text-sm',
        alertVariants[variant],
        className,
      )}
      {...props}
    />
  ),
)
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('text-sm font-semibold leading-tight', className)} {...props} />
  ),
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm leading-relaxed text-slate-600', className)} {...props} />
  ),
)
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }

