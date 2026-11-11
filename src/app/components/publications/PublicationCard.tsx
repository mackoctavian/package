'use client'

import { useLocale, useT } from '@/i18n/client'
import { formatMoney } from '@/i18n/format'
import { Link } from '@/i18n/link'

import SmartImage from '@/app/components/site/SmartImage'
import { type Publication } from '@/lib/publications/format'
import { AddToCartButton } from './Bookshop'

export default function PublicationCard({ publication }: { publication: Publication }) {
  const t = useT()
  const locale = useLocale()
  const href = `/publications/${publication.slug}`
  return (
    <article className='group flex flex-col'>
      <Link href={href} className='relative block aspect-[3/4] overflow-hidden rounded-2xl bg-parchment shadow-soft' tabIndex={-1} aria-hidden>
        <SmartImage
          src={publication.coverImage}
          alt=''
          fill
          sizes='(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw'
          className='object-cover transition-transform duration-700 group-hover:scale-105'
        />
        {publication.badge && (
          <span className='absolute left-3 top-3 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-navy-950'>{publication.badge}</span>
        )}
        {publication.inStock === false && (
          <span className='absolute inset-x-3 bottom-3 rounded-full bg-white/95 py-1.5 text-center text-xs font-semibold text-navy-800'>{t('publications.cart.outOfStock')}</span>
        )}
      </Link>
      <div className='flex flex-1 flex-col pt-4'>
        <p className='text-xs font-medium uppercase tracking-widest text-gold-700'>
          {t.dynamic(`publications.categories.${publication.category}`, undefined, publication.category)} ·{' '}
          {t.dynamic(`publications.formats.${publication.format}`, undefined, publication.format)}
        </p>
        <h3 className='mt-1 font-display text-xl font-semibold leading-snug text-navy-900'>
          <Link href={href} className='hover:underline'>
            {publication.title}
          </Link>
        </h3>
        <p className='text-sm text-muted-foreground'>{publication.author}</p>
        <p className='mt-2 flex items-baseline gap-2'>
          <span className='font-semibold text-navy-900'>{formatMoney(publication.price, locale)}</span>
          {publication.originalPrice && publication.originalPrice > publication.price && (
            <span className='text-sm text-muted-foreground line-through'>{formatMoney(publication.originalPrice, locale)}</span>
          )}
        </p>
        <AddToCartButton publication={publication} className='mt-4 w-full' />
      </div>
    </article>
  )
}
