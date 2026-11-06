
import prisma from '@/lib/prisma'
import { retreatData } from '@/app/data/retreats'
import { mapPrismaRetreat } from '@/app/api/retreats/utils'
import { galleryHighlights } from '@/app/data/gallery'
import { imagery } from '@/app/data/site'
import type { RetreatType } from '@/app/types/retreat'
import { getUpcomingRetreats } from '@/lib/retreats/dates'

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

export const getHeroSlides = () =>
  safely<HeroSlideView[]>(
    'hero slides',
    () =>
      prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, imageUrl: true, title: true, subtitle: true, linkUrl: true, linkText: true },
      }),
    [],
  ).then((slides) => (slides.length ? slides : [{ id: 'default', imageUrl: imagery.heroChapel }]))

export const getHomepageRetreats = async (limit = 3) => {
  const retreats = await safely<RetreatType[]>(
    'retreats',
    async () => (await prisma.retreat.findMany()).map(mapPrismaRetreat),
    retreatData,
  )
  return getUpcomingRetreats(retreats)
    .slice(0, limit)
    .map(({ retreat, dates }) => ({ ...retreat, startDate: dates.start?.toISOString() ?? null }))
}

export type HomepageRetreat = Awaited<ReturnType<typeof getHomepageRetreats>>[number]

export type PatronView = { id: string; name: string; title: string; role?: string | null; imageUrl: string }

export const getPatrons = () =>
  safely<PatronView[]>(
    'patrons',
    () =>
      prisma.patron.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, title: true, role: true, imageUrl: true },
      }),
    [],
  )

export type TestimonialView = { id: string; name: string; role: string; imageUrl: string; quote: string }

const FALLBACK_TESTIMONIALS: TestimonialView[] = [
  {
    id: 't1',
    name: 'Maria Josephat',
    role: 'Youth retreat participant',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    quote:
      'The peaceful environment and spiritual guidance helped me reconnect with my faith in ways I never thought possible.',
  },
  {
    id: 't2',
    name: 'Fr. Thomas Mwangi',
    role: 'Clergy retreat',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    quote: 'DMRC is a true sanctuary for deep prayer and renewal. I recommend it to all my brother priests.',
  },
  {
    id: 't3',
    name: 'Sarah & John Kimani',
    role: 'Family retreat',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=80',
    quote: 'Our family left renewed and united in faith. The programmes for children and adults were thoughtfully prepared.',
  },
]

export const getTestimonials = () =>
  safely<TestimonialView[]>(
    'testimonials',
    () =>
      prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, role: true, imageUrl: true, quote: true },
      }),
    [],
  ).then((items) => (items.length ? items : FALLBACK_TESTIMONIALS))

export type GalleryPreviewItem = { id: string; src: string; title: string }

export const getGalleryPreview = async (limit = 5) => {
  const items = await safely<GalleryPreviewItem[]>(
    'gallery',
    async () => {
      const rows = await prisma.contentItem.findMany({
        where: { type: 'gallery', status: 'published', mediaUrl: { not: null } },
        orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
        take: 30,
        select: { id: true, title: true, mediaUrl: true, metadata: true },
      })
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
