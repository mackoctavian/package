import Link from 'next/link'
import { ArrowRight, MapPin, Mic2, Users } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import type { RetreatType } from '@/app/types/retreat'
import { formatRetreatMonthDay } from '@/lib/retreats/dates'
import { categoryLabel } from '@/lib/retreats/categories'
import { cn } from '@/lib/utils'

type RetreatCardProps = {
  retreat: RetreatType & { startDate?: string | null; endDate?: string | null }
  className?: string
}

const formatPrice = (retreat: RetreatType) => {
  if (retreat.isPaid === false || !retreat.price) return 'Free-will offering'
  return `TZS ${retreat.price.toLocaleString('en-US')}`
}

const statusStyles: Record<string, string> = {
  'Registration Open': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Waitlist: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

export default function RetreatCard({ retreat, className }: RetreatCardProps) {
  const date = formatRetreatMonthDay(retreat.startDate ? new Date(retreat.startDate) : null)
  const seats = retreat.availability?.total ?? 0
  const ended = retreat.endDate ? new Date(retreat.endDate).getTime() < new Date().setHours(0, 0, 0, 0) : false
  const closed = retreat.status === 'Closed' || ended
  const href = retreat.detailHref || `/events/${retreat.slug}`

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
        className,
      )}
    >
      <Link href={href} className='relative block aspect-[16/10] overflow-hidden' tabIndex={-1} aria-hidden>
        <SmartImage
          src={retreat.imageSrc}
          alt=''
          fill
          sizes='(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
          className='object-cover transition-transform duration-700 group-hover:scale-105'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-navy-950/50 to-transparent' />
        {date && (
          <div className='absolute left-4 top-4 flex flex-col items-center rounded-2xl bg-white/95 px-3 py-2 text-center shadow-soft backdrop-blur'>
            <span className='text-[11px] font-semibold tracking-widest text-gold-700'>{date.month}</span>
            <span className='font-display text-2xl font-bold leading-none text-navy-900'>{date.day}</span>
          </div>
        )}
        <span
          className={cn(
            'absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
            ended ? statusStyles.Closed : statusStyles[retreat.status] ?? statusStyles['Registration Open'],
          )}
        >
          {ended ? 'Completed' : retreat.status}
        </span>
      </Link>

      <div className='flex flex-1 flex-col p-6'>
        <p className='flex items-center justify-between gap-3 text-sm font-medium text-gold-700'>
          <span>{retreat.dateRange}</span>
          {retreat.category && (
            <span className='rounded-full bg-parchment px-2.5 py-0.5 text-xs font-medium text-navy-700'>{categoryLabel(retreat.category)}</span>
          )}
        </p>
        <h3 className='mt-2 font-display text-2xl font-semibold leading-snug text-navy-900'>
          <Link href={href} className='focus-visible:outline-none'>
            <span className='bg-gradient-to-r from-gold-300 to-gold-300 bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-all duration-500 group-hover:bg-[length:100%_2px]'>
              {retreat.title}
            </span>
          </Link>
        </h3>
        <ul className='mb-6 mt-4 space-y-2 text-sm text-muted-foreground'>
          <li className='flex items-center gap-2'>
            <Mic2 className='h-4 w-4 text-navy-400' /> {retreat.speaker}
          </li>
          <li className='flex items-center gap-2'>
            <MapPin className='h-4 w-4 text-navy-400' /> {retreat.location}
          </li>
          {seats > 0 && (
            <li className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-navy-400' /> {seats} places available
            </li>
          )}
        </ul>
        <div className='mt-auto flex items-center justify-between gap-4 border-t border-border pt-5'>
          <div>
            <p className='text-xs uppercase tracking-wider text-muted-foreground'>Contribution</p>
            <p className='font-semibold text-navy-900'>{formatPrice(retreat)}</p>
          </div>
          {closed ? (
            <Link href={href} className='text-sm font-medium text-navy-700 hover:underline'>
              {ended ? 'View details' : 'Registration closed'}
            </Link>
          ) : (
            <Link
              href={retreat.ctaHref || `${href}#booking`}
              className='inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700'
            >
              Reserve <ArrowRight className='h-4 w-4' />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
