import { existsSync } from 'node:fs'
import path from 'node:path'
import { cache } from 'react'

import prisma from '@/lib/prisma'
import { galleryAudio, galleryCDs, galleryCollections, galleryHighlights, galleryVideos } from '@/app/data/gallery'
import type { GalleryMedia } from '@/app/types/gallery'
import { mapResponseToBuckets, type GalleryBuckets } from './mapping'

/** A local /public file that is missing is treated as "coming soon" rather than a broken player. */
const playable = (item: GalleryMedia): GalleryMedia => {
  if (!item.src.startsWith('/') || item.src.startsWith('//')) return item
  return existsSync(path.join(process.cwd(), 'public', item.src)) ? item : { ...item, src: '' }
}

const staticBuckets = (): GalleryBuckets => ({
  photos: [
    ...galleryHighlights.map((item) => ({ ...item, caption: item.caption ?? 'Highlights' })),
    ...galleryCollections.flatMap((collection) => collection.items.map((item) => ({ ...item, caption: item.caption ?? collection.title }))),
  ],
  videos: galleryVideos,
  audio: galleryAudio.map(playable),
  // CDs are sold through the publications shop.
  cds: galleryCDs.map((item) => ({ ...item, src: '/publications?category=CDs' })),
})

export const getGallery = cache(async (): Promise<GalleryBuckets> => {
  try {
    const records = await prisma.contentItem.findMany({
      where: { type: 'gallery', status: 'published' },
      orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
    })
    if (records.length) {
      return mapResponseToBuckets(
        records.map((record) => ({
          ...record,
          publishDate: record.publishDate?.toISOString() ?? null,
          metadata: (record.metadata ?? null) as Record<string, unknown> | null,
        })),
      )
    }
  } catch (error) {
    console.error('[gallery] database unavailable, using static data', error instanceof Error ? error.message : error)
  }
  return staticBuckets()
})
