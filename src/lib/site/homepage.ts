
import prisma from '@/lib/prisma'
import { retreatData } from '@/app/data/retreats'
import { mapPrismaRetreat } from '@/app/api/retreats/utils'
import { galleryHighlights } from '@/app/data/gallery'
import { imagery } from '@/app/data/site'
import type { RetreatType } from '@/app/types/retreat'
import { getUpcomingRetreats } from '@/lib/retreats/dates'
import { localizeRecords } from '@/lib/i18n/content'
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config'
import { DEFAULT_MESSAGES } from '@/i18n/messages'

/**
 * Server-side loaders for the homepage. Every loader falls back to bundled
 * content so the page still renders if the database is unreachable.
 */

const safely = async <T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await run()
  } catch (error) {
    console.error(`[homepage] ${label} failed, using fallback`, error instanceof Error ? error.message : error)
    return fallback
  }
}

export type HeroSlideView = {
  id: string
  imageUrl: string
  title?: string | null
  subtitle?: string | null
  linkUrl?: string | null
  linkText?: string | null
}

export const getHeroSlides = (locale: Locale = DEFAULT_LOCALE) =>
  safely<HeroSlideView[]>(
    'hero slides',
    async () =>
      localizeRecords(
        'hero_slide',
        await prisma.heroSlide.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: { id: true, imageUrl: true, title: true, subtitle: true, linkUrl: true, linkText: true },
        }),
        locale,
      ),
    [],
  ).then((slides) => (slides.length ? slides : [{ id: 'default', imageUrl: imagery.heroChapel }]))

export const getHomepageRetreats = async (locale: Locale = DEFAULT_LOCALE, limit = 3) => {
  const retreats = await safely<RetreatType[]>(
    'retreats',
    async () => (await localizeRecords('retreat', await prisma.retreat.findMany(), locale)).map(mapPrismaRetreat),
    retreatData,
  )
  return getUpcomingRetreats(retreats)
    .slice(0, limit)
    .map(({ retreat, dates }) => ({ ...retreat, startDate: dates.start?.toISOString() ?? null }))
}

export type HomepageRetreat = Awaited<ReturnType<typeof getHomepageRetreats>>[number]

export type PatronView = { id: string; name: string; title: string; role?: string | null; imageUrl: string }

export const getPatrons = (locale: Locale = DEFAULT_LOCALE) =>
  safely<PatronView[]>(
    'patrons',
    async () =>
      localizeRecords(
        'patron',
        await prisma.patron.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: { id: true, name: true, title: true, role: true, imageUrl: true },
        }),
        locale,
      ),
    [],
  )

export type TestimonialView = { id: string; name: string; role: string; imageUrl: string; quote: string }

/** Shown until real testimonies are added in the admin. Text comes from `messages/content.ts`. */
const fallbackTestimonials = (locale: Locale): TestimonialView[] => {
  const text = DEFAULT_MESSAGES[locale].content.testimonials
  return [
    {
      id: 't1',
      name: 'Maria Josephat',
      role: text.t1.role,
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      quote: text.t1.quote,
    },
    {
      id: 't2',
      name: 'Fr. Thomas Mwangi',
      role: text.t2.role,
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      quote: text.t2.quote,
    },
    {
      id: 't3',
      name: 'Sarah & John Kimani',
      role: text.t3.role,
      imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=80',
      quote: text.t3.quote,
    },
  ]
}

export const getTestimonials = (locale: Locale = DEFAULT_LOCALE) =>
  safely<TestimonialView[]>(
    'testimonials',
    async () =>
      localizeRecords(
        'testimonial',
        await prisma.testimonial.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: { id: true, name: true, role: true, imageUrl: true, quote: true },
        }),
        locale,
      ),
    [],
  ).then((items) => (items.length ? items : fallbackTestimonials(locale)))

export type GalleryPreviewItem = { id: string; src: string; title: string }

export const getGalleryPreview = async (locale: Locale = DEFAULT_LOCALE, limit = 5) => {
  const items = await safely<GalleryPreviewItem[]>(
    'gallery',
    async () => {
      const rows = await localizeRecords(
        'content',
        await prisma.contentItem.findMany({
          where: { type: 'gallery', status: 'published', mediaUrl: { not: null } },
          orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
          take: 30,
          select: { id: true, title: true, mediaUrl: true, metadata: true },
        }),
        locale,
      )
      return rows
        .filter((row) => {
          const type = (row.metadata as Record<string, unknown> | null)?.mediaType
          return !type || type === 'image'
        })
        .map((row) => ({ id: row.id, title: row.title, src: row.mediaUrl as string }))
    },
    [],
  )
  const fallback = galleryHighlights.map((item) => ({ id: item.id, src: item.src, title: item.title }))
  return (items.length ? items : fallback).slice(0, limit)
}
