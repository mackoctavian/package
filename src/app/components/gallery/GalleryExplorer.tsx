'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Disc3, Film, Headphones, ImageIcon, Play, ShoppingBag, X } from 'lucide-react'

import SmartImage from '@/app/components/site/SmartImage'
import type { GalleryMedia } from '@/app/types/gallery'
import type { GalleryBuckets } from '@/lib/gallery/mapping'
import { cn } from '@/lib/utils'

type Tab = keyof GalleryBuckets

const tabMeta: { id: Tab; label: string; icon: typeof ImageIcon }[] = [
  { id: 'photos', label: 'Photos', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: Film },
  { id: 'audio', label: 'Audio', icon: Headphones },
  { id: 'cds', label: 'Music CDs', icon: Disc3 },
]

const useModalKeys = (open: boolean, handlers: Record<string, () => void>) => {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => handlers[event.key]?.()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, handlers])
}

function Lightbox({ photos, index, onChange, onClose }: { photos: GalleryMedia[]; index: number; onChange: (i: number) => void; onClose: () => void }) {
  const photo = photos[index]
  const prev = useCallback(() => onChange((index - 1 + photos.length) % photos.length), [index, photos.length, onChange])
  const next = useCallback(() => onChange((index + 1) % photos.length), [index, photos.length, onChange])
  const keys = useMemo(() => ({ Escape: onClose, ArrowLeft: prev, ArrowRight: next }), [onClose, prev, next])
  useModalKeys(true, keys)

  return (
    <div role='dialog' aria-modal='true' aria-label={photo.title} className='fixed inset-0 z-[70] flex flex-col bg-navy-950/95 backdrop-blur-sm'>
      <div className='flex items-center justify-between px-4 py-4 text-white sm:px-8'>
        <p className='text-sm text-navy-200'>
          {index + 1} / {photos.length}
        </p>
        <button type='button' onClick={onClose} aria-label='Close' className='rounded-full p-2 hover:bg-white/10'>
          <X className='h-6 w-6' />
        </button>
      </div>
      <div className='relative flex-1'>
        <SmartImage src={photo.src} alt={photo.title} fill sizes='100vw' className='object-contain' priority />
        {photos.length > 1 && (
          <>
            <button type='button' onClick={prev} aria-label='Previous photo' className='absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-6'>
              <ChevronLeft className='h-6 w-6' />
            </button>
            <button type='button' onClick={next} aria-label='Next photo' className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-6'>
              <ChevronRight className='h-6 w-6' />
            </button>
          </>
        )}
      </div>
      <div className='px-4 py-5 text-center text-white sm:px-8'>
        <p className='font-display text-2xl'>{photo.title}</p>
        {photo.description && <p className='mx-auto mt-1 max-w-2xl text-sm text-navy-200'>{photo.description}</p>}
      </div>
    </div>
  )
}

function VideoModal({ video, onClose }: { video: GalleryMedia; onClose: () => void }) {
  const keys = useMemo(() => ({ Escape: onClose }), [onClose])
  useModalKeys(true, keys)
  return (
    <div role='dialog' aria-modal='true' aria-label={video.title} className='fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/95 p-4' onClick={onClose}>
      <button type='button' onClick={onClose} aria-label='Close' className='absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10'>
        <X className='h-6 w-6' />
      </button>
      <div className='w-full max-w-5xl' onClick={(event) => event.stopPropagation()}>
        <div className='aspect-video overflow-hidden rounded-2xl bg-black'>
          {video.youtubeId ? (
            <iframe src={`${video.src}&autoplay=1`} title={video.title} allow='autoplay; encrypted-media; picture-in-picture' allowFullScreen className='h-full w-full' />
          ) : (
            <video src={video.src} poster={video.poster} controls autoPlay className='h-full w-full' />
          )}
        </div>
        <p className='mt-4 font-display text-2xl text-white'>{video.title}</p>
        {video.description && <p className='mt-1 text-sm text-navy-200'>{video.description}</p>}
      </div>
    </div>
  )
}

export default function GalleryExplorer({ buckets }: { buckets: GalleryBuckets }) {
  const tabs = tabMeta.filter((tab) => buckets[tab.id].length > 0)
  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? 'photos')
  const [album, setAlbum] = useState<string | null>(null)
  const [photoIndex, setPhotoIndex] = useState<number | null>(null)
  const [video, setVideo] = useState<GalleryMedia | null>(null)

  const albums = useMemo(() => Array.from(new Set(buckets.photos.map((p) => p.caption).filter(Boolean))) as string[], [buckets.photos])
  const photos = album ? buckets.photos.filter((p) => p.caption === album) : buckets.photos
  const closeLightbox = useCallback(() => setPhotoIndex(null), [])
  const closeVideo = useCallback(() => setVideo(null), [])

  if (!tabs.length) {
    return <p className='rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground'>The gallery is being prepared. Please check back soon.</p>
  }

  return (
    <div>
      <div role='tablist' aria-label='Media type' className='flex flex-wrap gap-2'>
        {tabs.map((item) => (
          <button
            key={item.id}
            role='tab'
            type='button'
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition',
              tab === item.id ? 'border-navy-900 bg-navy-900 text-white' : 'border-border bg-white text-navy-800 hover:border-navy-300',
            )}
          >
            <item.icon className='h-4 w-4' /> {item.label}
            <span className={cn('text-xs', tab === item.id ? 'text-navy-200' : 'text-muted-foreground')}>{buckets[item.id].length}</span>
          </button>
        ))}
      </div>

      <div className='mt-10' role='tabpanel'>
        {tab === 'photos' && (
          <>
            {albums.length > 1 && (
              <div className='mb-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-border text-sm' aria-label='Albums'>
                {[null, ...albums].map((value) => (
                  <button
                    key={value ?? 'all'}
                    type='button'
                    aria-pressed={album === value}
                    onClick={() => setAlbum(value)}
                    className={cn('-mb-px border-b-2 pb-3 font-medium transition', album === value ? 'border-gold-500 text-navy-900' : 'border-transparent text-muted-foreground hover:text-navy-900')}
                  >
                    {value ?? 'All photos'}
                  </button>
                ))}
              </div>
            )}
            <div className='columns-1 gap-4 sm:columns-2 lg:columns-3'>
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type='button'
                  onClick={() => setPhotoIndex(index)}
                  className='group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl focus-visible:ring-4 focus-visible:ring-gold-300'
                >
                  <div className={cn('relative w-full', photo.orientation === 'portrait' ? 'aspect-[3/4]' : photo.orientation === 'square' ? 'aspect-square' : 'aspect-[4/3]')}>
                    <SmartImage src={photo.src} alt={photo.title} fill sizes='(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' className='object-cover transition-transform duration-700 group-hover:scale-105' />
                  </div>
                  <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/80 to-transparent p-4 text-left opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                    <p className='font-display text-lg text-white'>{photo.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'videos' && (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {buckets.videos.map((item) => (
              <button key={item.id} type='button' onClick={() => setVideo(item)} className='group text-left'>
                <div className='relative aspect-video overflow-hidden rounded-2xl bg-navy-900'>
                  {item.poster && <SmartImage src={item.poster} alt='' fill sizes='(min-width: 1024px) 33vw, 100vw' className='object-cover opacity-80 transition-transform duration-700 group-hover:scale-105' />}
                  <span className='absolute inset-0 flex items-center justify-center'>
                    <span className='flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-lift transition group-hover:scale-110'>
                      <Play className='ml-1 h-7 w-7' />
                    </span>
                  </span>
                </div>
                <p className='mt-4 font-display text-2xl font-semibold text-navy-900'>{item.title}</p>
                {item.description && <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>{item.description}</p>}
              </button>
            ))}
          </div>
        )}

        {tab === 'audio' && (
          <ul className='divide-y divide-border overflow-hidden rounded-[2rem] border border-border bg-white'>
            {buckets.audio.map((item) => (
              <li key={item.id} className='flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6'>
                <div className='flex flex-1 items-center gap-4'>
                  <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-parchment'>
                    {item.coverArt ? <SmartImage src={item.coverArt} alt='' fill sizes='64px' className='object-cover' /> : <Headphones className='m-5 h-6 w-6 text-gold-600' />}
                  </div>
                  <div className='min-w-0'>
                    <p className='font-semibold text-navy-900'>{item.title}</p>
                    <p className='text-sm text-muted-foreground'>{[item.artist, item.duration].filter(Boolean).join(' · ')}</p>
                    {item.description && <p className='mt-1 line-clamp-1 text-sm text-muted-foreground'>{item.description}</p>}
                  </div>
                </div>
                {item.src && item.src !== '#' ? (
                  <audio controls preload='none' src={item.src} className='w-full sm:w-72'>
                    Your browser does not support audio playback.
                  </audio>
                ) : (
                  <span className='rounded-full bg-parchment px-4 py-2 text-xs font-medium text-navy-700'>Recording coming soon</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {tab === 'cds' && (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {buckets.cds.map((item) => (
              <article key={item.id} className='overflow-hidden rounded-3xl border border-border bg-white shadow-soft'>
                <div className='relative aspect-square bg-parchment'>
                  {item.coverArt && <SmartImage src={item.coverArt} alt='' fill sizes='(min-width: 1024px) 25vw, 50vw' className='object-cover' />}
                </div>
                <div className='p-5'>
                  <p className='font-display text-xl font-semibold text-navy-900'>{item.title}</p>
                  {item.artist && <p className='text-sm text-gold-700'>{item.artist}</p>}
                  {item.description && <p className='mt-2 line-clamp-3 text-sm text-muted-foreground'>{item.description}</p>}
                  <Link href={item.src && item.src !== '#' ? item.src : '/publications?category=CDs'} className='mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-gold-700'>
                    <ShoppingBag className='h-4 w-4' /> Get this CD
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {photoIndex !== null && photos[photoIndex] && <Lightbox photos={photos} index={photoIndex} onChange={setPhotoIndex} onClose={closeLightbox} />}
      {video && <VideoModal video={video} onClose={closeVideo} />}
    </div>
  )
}
