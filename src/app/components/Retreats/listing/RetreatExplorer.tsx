'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarSearch, Search, X } from 'lucide-react'

import RetreatCard from '@/app/components/site/RetreatCard'
import { normalizeCategory, retreatCategories, translatedCategoryLabel } from '@/lib/retreats/categories'
import { useT } from '@/i18n/client'
import { useLocalizedRouter, usePathnameWithoutLocale } from '@/i18n/link'
import type { RetreatListItem } from '@/lib/retreats/queries'
import { cn } from '@/lib/utils'

type Props = { retreats: RetreatListItem[] }

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export default function RetreatExplorer({ retreats }: Props) {
  const t = useT()
  const router = useLocalizedRouter()
  const pathname = usePathnameWithoutLocale()
  const params = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const category = normalizeCategory(params.get('category'))
  const showPast = params.get('past') === '1'

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}${next.toString() ? `?${next}` : ''}`, { scroll: false })
  }

  const categories = useMemo(() => {
    const present = new Set(retreats.map((r) => normalizeCategory(r.category)).filter(Boolean))
    const known = retreatCategories.map((c) => c.value as string)
    return [...known, ...[...present].filter((c) => !known.includes(c))].map((value) => ({ value, label: translatedCategoryLabel(t, value) }))
  }, [retreats, t])

  const filtered = useMemo(() => {
    const today = startOfToday()
    const term = query.trim().toLowerCase()
    return retreats
      .filter((r) => {
        const end = r.endDate ? new Date(r.endDate).getTime() : null
        const isPast = end !== null && end < today
        return showPast ? isPast : !isPast
      })
      .filter((r) => !category || normalizeCategory(r.category) === category)
      .filter(
        (r) =>
          !term ||
          [r.title, r.subtitle, r.speaker, r.conductor, r.location, r.description].some((v) => v?.toLowerCase().includes(term)),
      )
      .sort((a, b) => {
        const ta = a.startDate ? new Date(a.startDate).getTime() : Number.POSITIVE_INFINITY
        const tb = b.startDate ? new Date(b.startDate).getTime() : Number.POSITIVE_INFINITY
        return showPast ? tb - ta : ta - tb
      })
  }, [retreats, query, category, showPast])

  const chip = (active: boolean) =>
    cn(
      'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition',
      active ? 'border-navy-900 bg-navy-900 text-white' : 'border-border bg-white text-navy-700 hover:border-navy-300',
    )

  return (
    <div>
      <div className='sticky top-[72px] z-20 -mx-4 border-b border-border bg-ivory/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5'>
        <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
          <div className='scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1'>
            <button type='button' className={chip(!category)} onClick={() => setParam('category', null)}>
              {t('retreats.explorer.all')}
            </button>
            {categories.map((c) => (
              <button key={c.value} type='button' className={chip(category === c.value)} onClick={() => setParam('category', c.value)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className='flex items-center gap-3'>
            <label className='relative flex-1 xl:w-72'>
              <span className='sr-only'>{t('retreats.explorer.searchLabel')}</span>
              <Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400' />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => setParam('q', query.trim() || null)}
                placeholder={t('retreats.explorer.searchPlaceholder')}
                className='w-full rounded-full border border-border bg-white py-2.5 pl-10 pr-9 text-sm text-navy-900 placeholder:text-navy-300 focus:border-gold-400 focus:outline-none focus:ring-4 focus:ring-gold-200/50'
              />
              {query && (
                <button
                  type='button'
                  aria-label={t('retreats.explorer.clearSearch')}
                  onClick={() => {
                    setQuery('')
                    setParam('q', null)
                  }}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-800'
                >
                  <X className='h-4 w-4' />
                </button>
              )}
            </label>
            <button type='button' className={chip(showPast)} onClick={() => setParam('past', showPast ? null : '1')}>
              {t('retreats.explorer.past')}
            </button>
          </div>
        </div>
      </div>

      <p className='mt-8 text-sm text-muted-foreground' aria-live='polite'>
        {t(showPast ? 'retreats.explorer.countPast' : 'retreats.explorer.countUpcoming', { count: filtered.length })}
        {category && t('retreats.explorer.inCategory', { category: translatedCategoryLabel(t, category) })}
      </p>

      {filtered.length ? (
        <div className='mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {filtered.map((retreat) => (
            <RetreatCard key={retreat.id} retreat={retreat} />
          ))}
        </div>
      ) : (
        <div className='mt-6 rounded-[2rem] border border-dashed border-gold-300 bg-white/60 px-6 py-16 text-center'>
          <CalendarSearch className='mx-auto h-10 w-10 text-gold-500' />
          <h3 className='mt-4 font-display text-3xl text-navy-900'>{t('retreats.explorer.emptyTitle')}</h3>
          <p className='mx-auto mt-2 max-w-md text-muted-foreground'>{t('retreats.explorer.emptyText')}</p>
          <button
            type='button'
            onClick={() => {
              setQuery('')
              router.replace(pathname, { scroll: false })
            }}
            className='mt-6 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-700'
          >
            {t('retreats.explorer.reset')}
          </button>
        </div>
      )}
    </div>
  )
}
