'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { useT } from '@/i18n/client'
import { useLocalizedRouter, usePathnameWithoutLocale } from '@/i18n/link'
import { inputClass } from '@/app/components/site/FormFields'
import type { Publication } from '@/lib/publications/format'
import { cn } from '@/lib/utils'
import PublicationCard from './PublicationCard'

const SORTS = ['featured', 'newest', 'price-low', 'price-high'] as const
type Sort = (typeof SORTS)[number]

export default function PublicationShop({ publications }: { publications: Publication[] }) {
  const t = useT()
  const router = useLocalizedRouter()
  const pathname = usePathnameWithoutLocale()
  const params = useSearchParams()
  const category = params.get('category')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('featured')

  const categories = useMemo(() => Array.from(new Set(publications.map((p) => p.category))), [publications])

  const setCategory = (value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set('category', value)
    else next.delete('category')
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false })
  }

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = publications.filter(
      (p) =>
        (!category || p.category === category) &&
        (!needle || [p.title, p.subtitle, p.author].some((value) => value?.toLowerCase().includes(needle))),
    )
    switch (sort) {
      case 'newest':
        return [...list].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn))
      case 'price-low':
        return [...list].sort((a, b) => a.price - b.price)
      case 'price-high':
        return [...list].sort((a, b) => b.price - a.price)
      default:
        return list
    }
  }, [publications, category, query, sort])

  return (
    <div>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-wrap gap-2' role='group' aria-label={t('publications.shop.categoryLabel')}>
          {[null, ...categories].map((value) => (
            <button
              key={value ?? 'all'}
              type='button'
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                category === value ? 'border-navy-900 bg-navy-900 text-white' : 'border-border bg-white text-navy-800 hover:border-navy-300',
              )}
            >
              {value ? t.dynamic(`publications.categories.${value}`, undefined, value) : t('publications.shop.everything')}
              <span className={cn('ml-1.5 text-xs', category === value ? 'text-navy-200' : 'text-muted-foreground')}>
                {value ? publications.filter((p) => p.category === value).length : publications.length}
              </span>
            </button>
          ))}
        </div>
        <div className='flex gap-3'>
          <div className='relative flex-1 lg:w-72'>
            <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <input aria-label={t('publications.shop.searchLabel')} placeholder={t('publications.shop.searchPlaceholder')} className={cn(inputClass, 'pl-11')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select aria-label={t('publications.shop.sortLabel')} value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={cn(inputClass, 'w-auto')}>
            {SORTS.map((value) => (
              <option key={value} value={value}>
                {t(`publications.shop.sort.${value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className='mt-6 text-sm text-muted-foreground' aria-live='polite'>
        {t('publications.shop.count', { count: results.length })}
      </p>

      {results.length ? (
        <div className='mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4'>
          {results.map((publication) => (
            <PublicationCard key={publication.id} publication={publication} />
          ))}
        </div>
      ) : (
        <p className='mt-6 rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground'>{t('publications.shop.empty')}</p>
      )}
    </div>
  )
}
