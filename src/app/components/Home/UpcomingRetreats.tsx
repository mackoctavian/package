'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, MapPin, Loader2, Lock } from 'lucide-react'

import { RetreatType } from '@/app/types/retreat'
import { retreatData } from '@/app/data/retreats'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'

const fallbackCategories = [
  { value: 'parish-retreat', label: 'Parish Retreats' },
  { value: 'residential-retreat', label: 'Residential Retreats' },
  { value: 'jesus-mission-retreat', label: 'Jesus Mission Retreats' },
  { value: 'special-retreat', label: 'Special Retreat' },
]

const formatDateRange = (value?: string | null) => value?.replaceAll('–', '–') ?? 'To be confirmed'

const YEAR_PATTERN = /\b(19|20)\d{2}\b/

const splitDateRangeTokens = (value?: string | null): [string, string] => {
  if (!value) return ['', '']
  const trimmed = value.trim()
  if (!trimmed) return ['', '']

  const separators = ['–', '—', ' to ', ' - ']
  for (const separator of separators) {
    if (trimmed.includes(separator)) {
      const [start, end] = trimmed.split(separator)
      return [start?.trim() ?? '', end?.trim() ?? '']
    }
  }

  return [trimmed, '']
}

const extractYear = (value?: string | null) => {
  if (!value) return null
  const match = value.match(YEAR_PATTERN)
  return match ? Number(match[0]) : null
}

const addYearIfMissing = (value: string, fallbackYear?: number | null) => {
  if (!value) return value
  if (YEAR_PATTERN.test(value)) return value
  return fallbackYear ? `${value.replace(/,\s*$/, '')}, ${fallbackYear}` : value
}

const getComparableTime = (retreat: EnhancedRetreat) =>
  retreat.parsedStart?.getTime() ?? retreat.parsedEnd?.getTime() ?? Number.POSITIVE_INFINITY

type EnhancedRetreat = RetreatType & {
  parsedStart: Date | null
  parsedEnd: Date | null
}

const parseDateToken = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const UpcomingRetreats = () => {
  const [retreats, setRetreats] = useState<RetreatType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('All')

  useEffect(() => {
    const fetchRetreats = async () => {
      try {
        const res = await fetch('/api/retreats', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load retreats')
        const json = await res.json()
        setRetreats(json.data ?? [])
      } catch (error) {
        console.warn('[upcoming-retreats] falling back to static data', error)
        setRetreats(retreatData)
      } finally {
        setLoading(false)
      }
    }
    fetchRetreats()
  }, [])

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const upcomingRetreats = useMemo<EnhancedRetreat[]>(() => {
    return retreats
      .map((retreat) => {
        const [startToken, endToken] = splitDateRangeTokens(retreat.dateRange)
        const fallbackYear = extractYear(endToken) ?? extractYear(retreat.dateRange)
        const normalizedStart = addYearIfMissing(startToken, fallbackYear)
        const normalizedEnd = addYearIfMissing(endToken || startToken, fallbackYear)
        const parsedStart = parseDateToken(normalizedStart)
        const parsedEnd = parseDateToken(normalizedEnd || normalizedStart)
        return { ...retreat, parsedStart, parsedEnd }
      })
      .filter((retreat) => {
        const comparisonDate = retreat.parsedStart ?? retreat.parsedEnd
        if (!comparisonDate) return true
        return comparisonDate >= today
      })
      .sort((a, b) => getComparableTime(a) - getComparableTime(b))
  }, [retreats, today])

  const bookableIds = useMemo(
    () =>
      [...upcomingRetreats]
        .sort((a, b) => getComparableTime(a) - getComparableTime(b))
        .slice(0, 3)
        .map((retreat) => retreat.id),
    [upcomingRetreats],
  )

  const categories = useMemo(() => {
    const dynamic = Array.from(new Set(upcomingRetreats.map((retreat) => retreat.category).filter(Boolean))).map((value) => ({
      value,
      label:
        fallbackCategories.find((cat) => cat.value === value)?.label ||
        value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    }))

    return [{ value: 'All', label: 'All Retreats' }, ...fallbackCategories, ...dynamic.filter((cat) => !fallbackCategories.some((f) => f.value === cat.value))].reduce<
      { value: string; label: string }[]
    >((acc, cat) => {
      if (!acc.some((existing) => existing.value === cat.value)) acc.push(cat)
      return acc
    }, [])
  }, [upcomingRetreats])

  const filteredRetreats = useMemo(() => {
    if (filter === 'All') return upcomingRetreats
    return upcomingRetreats.filter((retreat) => retreat.category === filter)
  }, [filter, upcomingRetreats])

  return (
    <section className='bg-slate-50 py-16'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-blue-600'>Upcoming</p>
            <h2 className='mt-2 text-3xl font-bold text-slate-900'>Retreat calendar</h2>
            <p className='mt-2 text-sm text-slate-600'>Explore active retreats and filter by category to plan your next encounter.</p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/retreats'>View all retreats</Link>
          </Button>
        </div>

        <div className='mt-6 flex flex-wrap gap-2'>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === cat.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>

        <div className='mt-8'>
          {loading ? (
            <div className='flex items-center justify-center py-16 text-slate-500'>
              <Loader2 className='mr-2 h-5 w-5 animate-spin' />
              Loading retreats…
            </div>
          ) : filteredRetreats.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500'>
              No retreats found in this category yet.
            </div>
          ) : (
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {filteredRetreats.map((retreat) => {
                const isBookable = bookableIds.includes(retreat.id)
                const bookHref = isBookable
                  ? retreat.ctaHref || retreat.detailHref || `/events/${retreat.slug}`
                  : undefined
                return (
                  <article
                    key={retreat.id}
                    className='flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1'
                  >
                    <div className='relative h-48 w-full'>
                      <Image
                        src={retreat.imageSrc || '/images/dmrc/gallery/IMG_0299.JPG'}
                        alt={retreat.title}
                        fill
                        className='object-cover'
                        sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                      />
                    </div>
                    <div className='flex flex-1 flex-col px-5 py-4'>
                      <div className='flex items-center justify-between'>
                        <Badge variant='outline' className='capitalize'>
                          {retreat.category?.replace(/-/g, ' ') || 'Retreat'}
                        </Badge>
                        <span className='text-xs text-slate-500'>{retreat.status}</span>
                      </div>
                      <h3 className='mt-2 text-lg font-semibold text-slate-900'>{retreat.title}</h3>
                      {retreat.subtitle ? <p className='text-sm text-slate-500'>{retreat.subtitle}</p> : null}
                      <div className='mt-4 space-y-2 text-sm text-slate-600'>
                        <p className='flex items-center gap-2 text-xs text-slate-500'>
                          <CalendarDays className='h-4 w-4 text-blue-600' />
                          {formatDateRange(retreat.dateRange)}
                        </p>
                        <p className='flex items-center gap-2 text-xs text-slate-500'>
                          <MapPin className='h-4 w-4 text-blue-600' />
                          {retreat.location || 'DMRC Campus'}
                        </p>
                      </div>
                      <div className='mt-4 flex items-end justify-between'>
                        <div>
                          <p className='text-xs text-slate-500'>Capacity</p>
                          <p className='text-sm font-semibold text-slate-900'>{retreat.availability.total ?? 0} seats</p>
                        </div>
                        <div className='flex flex-col items-end gap-1'>
                          {isBookable && bookHref ? (
                            <Button asChild size='sm'>
                              <Link href={bookHref}>Book</Link>
                            </Button>
                          ) : (
                            <div className='flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500'>
                              <Lock className='h-3 w-3' />
                              Booking opens once retreat reaches top 3
                            </div>
                          )}
                          {!isBookable && (
                            <p className='text-[11px] text-slate-400'>Only the earliest 3 retreats accept bookings.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default UpcomingRetreats


