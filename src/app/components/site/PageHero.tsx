import SmartImage from '@/app/components/site/SmartImage'
import { cn } from '@/lib/utils'

type PageHeroProps = {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  image: string
  /** Rendered beside the copy on large screens (buttons, stats, search). */
  aside?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/** Dark photographic page header shared by the public pages. */
export default function PageHero({ eyebrow, title, description, image, aside, children, className }: PageHeroProps) {
  return (
    <section className={cn('relative isolate overflow-hidden bg-navy-950 !py-0', className)}>
      <SmartImage src={image} alt='' fill priority sizes='100vw' className='-z-10 object-cover opacity-35' />
      <div className='absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/40' />
      <div className='container flex flex-col gap-8 py-20 sm:py-24 lg:flex-row lg:items-end lg:justify-between'>
        <div className='max-w-3xl'>
          <p className='eyebrow text-gold-300'>{eyebrow}</p>
          <h1 className='mt-4 text-5xl leading-[1.05] text-white sm:text-6xl'>{title}</h1>
          {description && <div className='mt-5 max-w-xl text-lg text-navy-100'>{description}</div>}
          {children}
        </div>
        {aside && <div className='shrink-0'>{aside}</div>}
      </div>
    </section>
  )
}
