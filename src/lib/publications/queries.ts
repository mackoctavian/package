import { cache } from 'react'
import type { ContentItem } from '@prisma/client'

import prisma from '@/lib/prisma'
import { publicationsData } from '@/app/data/publications'
import { imagery } from '@/app/data/site'
import type { PublicationCategory, PublicationFormat } from '@/app/types/publication'
import { toSlug, type Publication } from './format'
import { localizeRecords } from '@/lib/i18n/content'
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config'

/** Publications shop catalogue: published admin items first, bundled catalogue as a fallback. */

const num = (value: unknown) => (value === null || value === undefined || value === '' ? undefined : Number(value))

const fromRecord = (item: ContentItem): Publication => {
  const meta = (item.metadata ?? {}) as Record<string, unknown>
  return {
    id: item.id,
    slug: item.slug || toSlug(item.title),
    title: item.title,
    subtitle: item.summary ?? undefined,
    description: item.body ?? '',
    author: typeof meta.author === 'string' && meta.author ? meta.author : 'DMRC Publications',
    category: (item.category || 'Books') as PublicationCategory,
    format: (typeof meta.format === 'string' ? meta.format : 'Paperback') as PublicationFormat,
    coverImage: item.mediaUrl || imagery.bibleReading,
    price: num(meta.price) ?? 0,
    originalPrice: num(meta.originalPrice),
    rating: 0,
    totalReviews: 0,
    publishedOn: (item.publishDate ?? item.createdAt).toISOString(),
    badge: typeof meta.badge === 'string' && meta.badge ? meta.badge : undefined,
    inStock: meta.inStock === undefined ? true : Boolean(meta.inStock),
  }
}

export const getPublications = cache(async (locale: Locale = DEFAULT_LOCALE): Promise<Publication[]> => {
  try {
    const records = await localizeRecords(
      'content',
      await prisma.contentItem.findMany({
        where: { type: 'publications', status: 'published' },
        orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
      }),
      locale,
    )
    if (records.length) return records.map(fromRecord)
  } catch (error) {
    console.error('[publications] database unavailable, using static data', error instanceof Error ? error.message : error)
  }
  return publicationsData.map((item) => ({ ...item, slug: toSlug(item.title) }))
})

export const getPublicationBySlug = cache(async (slug: string, locale: Locale = DEFAULT_LOCALE) => {
  const all = await getPublications(locale)
  const publication = all.find((item) => item.slug === slug)
  if (!publication) return undefined
  const related = all.filter((item) => item.id !== publication.id && item.category === publication.category).slice(0, 4)
  return { publication, related }
})
