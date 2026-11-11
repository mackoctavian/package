import { cache } from 'react'

import prisma from '@/lib/prisma'
import { ministriesData } from '@/app/data/ministries'
import { imagery } from '@/app/data/site'
import type { MinistryFocusArea, MinistryGathering, MinistryType } from '@/app/types/ministry'
import { localizeRecords } from '@/lib/i18n/content'
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config'

/**
 * Public ministry queries. Ministries managed in the admin take priority; the
 * bundled list is used when the database is empty or unreachable. Bundled
 * activities and gatherings are kept for matching slugs, since the admin does
 * not edit those yet.
 */

const photoRotation = [
  imagery.prayerHands,
  imagery.community,
  imagery.churchInterior,
  imagery.bibleReading,
  imagery.candles,
  imagery.sunriseHills,
  imagery.cross,
  imagery.heroChapel,
]

const isPlaceholder = (src?: string | null) => !src || src.endsWith('.svg')

const withImage = (ministry: MinistryType, index: number): MinistryType => ({
  ...ministry,
  heroImage: isPlaceholder(ministry.heroImage) ? photoRotation[index % photoRotation.length] : ministry.heroImage,
})

const toFocusAreas = (value: unknown): MinistryFocusArea[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const areas = value
    .map((item) => {
      if (typeof item === 'string') return { title: item, description: '' }
      if (item && typeof item === 'object' && 'title' in item) {
        const record = item as { title?: unknown; description?: unknown }
        return { title: String(record.title ?? ''), description: String(record.description ?? '') }
      }
      return null
    })
    .filter((item): item is MinistryFocusArea => Boolean(item?.title))
  return areas.length ? areas : undefined
}

type MinistryRow = Awaited<ReturnType<typeof prisma.ministry.findMany>>[number]

const fromRow = (row: MinistryRow): MinistryType => {
  const fallback = ministriesData.find((item) => item.slug === row.slug)
  const contact = (row.contact ?? {}) as Record<string, string | null | undefined>
  const gatherings = Array.isArray(row.gatherings) ? (row.gatherings as MinistryGathering[]) : undefined
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.shortDescription || fallback?.shortDescription || '',
    overview: row.overview || fallback?.overview || '',
    heroImage: row.heroImage || fallback?.heroImage || '',
    highlightScripture: row.highlightScripture || fallback?.highlightScripture,
    focusAreas: toFocusAreas(row.focusAreas) ?? fallback?.focusAreas,
    gatherings: gatherings?.length ? gatherings : fallback?.gatherings,
    contact:
      contact.email || contact.coordinator
        ? { coordinator: contact.coordinator || 'Ministry coordinator', email: contact.email || '', phone: contact.phone || undefined }
        : fallback?.contact,
    activities: fallback?.activities,
    order: row.order,
    isActive: row.isActive,
  }
}

export const getMinistries = cache(async (locale: Locale = DEFAULT_LOCALE): Promise<MinistryType[]> => {
  try {
    const rows = await localizeRecords('ministry', await prisma.ministry.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }), locale)
    if (rows.length) return rows.map(fromRow).map(withImage)
  } catch (error) {
    console.error('[ministries] database unavailable, using static data', error instanceof Error ? error.message : error)
  }
  return ministriesData.filter((item) => item.isActive !== false).map(withImage)
})

export const getMinistryBySlug = cache(async (slug: string, locale: Locale = DEFAULT_LOCALE) => {
  const all = await getMinistries(locale)
  const index = all.findIndex((item) => item.slug === slug)
  return index === -1 ? undefined : { ministry: all[index], others: all.filter((_, i) => i !== index).slice(0, 3) }
})
