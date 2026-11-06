import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'left' | 'center'
  action?: React.ReactNode
  className?: string
}

export default function SectionHeading({ eyebrow, title, description, align = 'left', action, className }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className='eyebrow'>{eyebrow}</p>}
        <h2 className='mt-3 text-4xl leading-tight sm:text-5xl'>{title}</h2>
        {description && <p className='mt-4 text-lg leading-relaxed text-muted-foreground'>{description}</p>}
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </div>
  )
}
