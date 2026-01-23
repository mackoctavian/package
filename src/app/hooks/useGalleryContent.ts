'use client'

import { useEffect, useMemo, useState } from 'react'

import { galleryHighlights, galleryCollections, galleryVideos, galleryAudio, galleryCDs } from '@/app/data/gallery'
import type { GalleryMedia, GalleryMediaType } from '@/app/types/gallery'

type GalleryBuckets = {
  photos: GalleryMedia[]
  videos: GalleryMedia[]
  audio: GalleryMedia[]
  cds: GalleryMedia[]
}

type GalleryApiItem = {
  id: string
  title: string
  summary?: string | null
  body?: string | null
  category?: string | null
  status: string
  mediaUrl?: string | null
  publishDate?: string | null
  metadata?: Record<string, unknown> | null
}

const fallbackBuckets: GalleryBuckets = {
  photos: [...galleryHighlights, ...galleryCollections.flatMap((collection) => collection.items)],
  videos: galleryVideos,
  audio: galleryAudio,
  cds: galleryCDs,
}

const orientationValues = new Set(['landscape', 'portrait', 'square'])

const getString = (value: unknown) => (typeof value === 'string' && value.trim().length ? value : undefined)

const normalizeOrientation = (value?: string): GalleryMedia['orientation'] =>
  orientationValues.has(value ?? '') ? (value as GalleryMedia['orientation']) : 'landscape'

const extractYoutubeId = (value?: string) => {
  if (!value) return undefined
  const match = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  )
  return match ? match[1] : undefined
}

const mapItemToMedia = (item: GalleryApiItem): GalleryMedia | null => {
  const metadata = item.metadata ?? {}
  const mediaType = (metadata.mediaType as GalleryMediaType) || 'image'
  const src =
    getString(item.mediaUrl) ?? getString((metadata as Record<string, unknown>).source)

  if (!src) {
    // Without a source we cannot render images, videos, or audio cards
    if (mediaType !== 'cd') return null
  }

  const base: GalleryMedia = {
    id: item.id,
    mediaType,
    src: src || '#',
    title: item.title,
    description: item.summary ?? item.body ?? undefined,
    orientation: normalizeOrientation(getString(metadata.orientation as string)),
    caption: item.category ?? undefined,
    date: item.publishDate ?? undefined,
  }

  if (mediaType === 'video') {
    const explicitId = getString(metadata.youtubeId)
    const inferredId = explicitId || extractYoutubeId(src)
    if (inferredId) {
      base.youtubeId = inferredId
      base.src = `https://www.youtube.com/embed/${inferredId}?rel=0`
      base.poster = getString(metadata.poster) ?? `https://img.youtube.com/vi/${inferredId}/hqdefault.jpg`
    } else {
      base.poster = getString(metadata.poster)
    }
  } else if (mediaType === 'audio' || mediaType === 'cd') {
    base.coverArt = getString(metadata.coverArt)
    if (mediaType === 'cd' && !base.src) {
      // allow cds without direct media link (merch)
      base.src = getString(metadata.storeUrl) ?? '#'
    }
  } else if (mediaType === 'image') {
    base.poster = getString(metadata.poster)
  }

  if (mediaType === 'audio' || mediaType === 'cd') {
    base.duration = getString(metadata.duration)
    base.artist = getString(metadata.artist)
    base.album = getString(metadata.album)
    base.coverArt = getString(metadata.coverArt)
  }

  return base
}

const mapResponseToBuckets = (items: GalleryApiItem[]): GalleryBuckets => {
  const buckets: GalleryBuckets = { photos: [], videos: [], audio: [], cds: [] }

  items
    .filter((item) => item.status === 'published')
    .forEach((item) => {
      const media = mapItemToMedia(item)
      if (!media) return
      switch (media.mediaType) {
        case 'video':
          buckets.videos.push(media)
          break
        case 'audio':
          buckets.audio.push(media)
          break
        case 'cd':
          buckets.cds.push(media)
          break
        default:
          buckets.photos.push(media)
          break
      }
    })

  return buckets
}

export const useGalleryContent = () => {
  const [buckets, setBuckets] = useState<GalleryBuckets>(fallbackBuckets)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadGallery = async () => {
      try {
        const response = await fetch('/api/content/gallery', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Unable to load gallery content')
        }
        const json = await response.json()
        if (!isMounted) return
        const mapped = mapResponseToBuckets(json.data ?? [])
        setBuckets(mapped)
      } catch (error) {
        console.warn('[useGalleryContent] falling back to static data', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadGallery()
    return () => {
      isMounted = false
    }
  }, [])

  return useMemo(
    () => ({
      photos: buckets.photos,
      videos: buckets.videos,
      audio: buckets.audio,
      cds: buckets.cds,
      isLoading,
    }),
    [buckets, isLoading],
  )
}


