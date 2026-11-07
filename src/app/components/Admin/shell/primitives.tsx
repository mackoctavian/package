import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** The title row at the top of every admin page. */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string
  description?: React.ReactNode
  eyebrow?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className='min-w-0'>
        {eyebrow && <p className='text-xs font-semibold uppercase tracking-[0.18em] text-gold-700'>{eyebrow}</p>}
        <h1 className='mt-1 text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl'>{title}</h1>
        {description && <p className='mt-1.5 max-w-2xl text-sm text-muted-foreground'>{description}</p>}
      </div>
      {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
    </div>
  )
}

/** Standard padding and width for admin page content. */
export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1400px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8', className)}>{children}</div>
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'navy',
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  tone?: 'navy' | 'gold' | 'green' | 'rose'
}) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700',
    gold: 'bg-gold-100 text-gold-700',
    green: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return (
    <div className='rounded-xl border border-border bg-white p-5 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <p className='text-sm font-medium text-muted-foreground'>{label}</p>
        {Icon && (
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tones[tone])}>
            <Icon className='h-4 w-4' />
          </span>
        )}
      </div>
      <p className='mt-2 text-3xl font-semibold tracking-tight text-navy-950 tabular-nums'>{value}</p>
      {hint && <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>}
    </div>
  )
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-white shadow-sm', className)}>
      {(title || actions) && (
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4'>
          <div>
            {title && <h2 className='text-base font-semibold text-navy-950'>{title}</h2>}
            {description && <p className='text-sm text-muted-foreground'>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className='flex flex-col items-center justify-center px-6 py-12 text-center'>
      {Icon && (
        <span className='flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
          <Icon className='h-5 w-5' />
        </span>
      )}
      <p className='mt-4 font-medium text-navy-950'>{title}</p>
      {description && <p className='mt-1 max-w-sm text-sm text-muted-foreground'>{description}</p>}
      {action && <div className='mt-5'>{action}</div>}
    </div>
  )
}

export { ExportButton } from './ExportButton'
