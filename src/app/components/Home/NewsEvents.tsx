'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Loader2, MapPin } from 'lucide-react'

import { Button } from '@/app/components/ui/button'
import { eventHighlights, newsItems } from '@/app/data/news'

type ContentApiItem = {
  id: string
  title: string
  slug: string
  summary?: string | null
  body?: string | null
  mediaUrl?: string | null
  publishDate?: string | null
  status: string
  category?: string | null
  metadata?: Record<string, unknown> | null
}

type NewsCard = {
  id: string
  title: string
  summary: string
  tag?: string
  author?: string
  readingTime?: string
  heroImage?: string
  publishDate?: string
  slug?: string
  ctaLabel?: string
  ctaHref?: string
}

type EventCard = {
  id: string
  title: string
  summary: string
  category?: string
  location?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  ctaLabel?: string
  ctaHref?: string
  publishDate?: string
}

const fallbackImage = '/images/dmrc/gallery/IMG_0299.JPG'

const formatDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTime = (value?: string) => {
  if (!value) return ''
  const [hours, minutes] = value.split(':').map((part) => parseInt(part, 10))
  if (Number.isNaN(hours)) return ''
  const date = new Date()
  date.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, 0)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const formatEventRange = (event: EventCard) => {
  const startDate = formatDate(event.startDate ?? event.publishDate)
  const endDate = formatDate(event.endDate)
  const startTime = formatTime(event.startTime)
  const endTime = formatTime(event.endTime)

  if (!startDate) return 'Date to be announced'

  if (!endDate || startDate === endDate) {
    const timeRange = startTime || endTime ? [startTime, endTime].filter(Boolean).join(' – ') : ''
    return timeRange ? `${startDate} · ${timeRange}` : startDate
  }

  return `${startDate} – ${endDate}`
}

const mapNewsPayload = (items: ContentApiItem[]): NewsCard[] =>
  items
    .filter((item) => item.status === 'published')
    .sort((a, b) => {
      const left = new Date(a.publishDate ?? 0).getTime()
      const right = new Date(b.publishDate ?? 0).getTime()
      return right - left
    })
    .map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary ?? item.body?.slice(0, 160) ?? '',
      heroImage: item.mediaUrl || fallbackImage,
      publishDate: item.publishDate ?? undefined,
      tag: item.category ?? undefined,
      author: typeof item.metadata?.author === 'string' ? (item.metadata.author as string) : undefined,
      readingTime: typeof item.metadata?.readingTime === 'string' ? (item.metadata.readingTime as string) : undefined,
      slug: item.slug,
      ctaLabel: typeof item.metadata?.ctaLabel === 'string' ? (item.metadata.ctaLabel as string) : undefined,
      ctaHref: typeof item.metadata?.ctaHref === 'string' ? (item.metadata.ctaHref as string) : undefined,
    }))

const mapEventPayload = (items: ContentApiItem[]): EventCard[] =>
  items
    .filter((item) => item.status === 'published')
    .map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary ?? item.body ?? '',
      category: item.category ?? undefined,
      publishDate: item.publishDate ?? undefined,
      location: typeof item.metadata?.location === 'string' ? (item.metadata.location as string) : undefined,
      startDate: typeof item.metadata?.startDate === 'string' ? (item.metadata.startDate as string) : undefined,
      endDate: typeof item.metadata?.endDate === 'string' ? (item.metadata.endDate as string) : undefined,
      startTime: typeof item.metadata?.startTime === 'string' ? (item.metadata.startTime as string) : undefined,
      endTime: typeof item.metadata?.endTime === 'string' ? (item.metadata.endTime as string) : undefined,
      ctaLabel: typeof item.metadata?.ctaLabel === 'string' ? (item.metadata.ctaLabel as string) : undefined,
      ctaHref: typeof item.metadata?.ctaHref === 'string' ? (item.metadata.ctaHref as string) : undefined,
    }))
    .sort((a, b) => {
      const toTimestamp = (record: EventCard) => {
        if (record.startDate) {
          return new Date(`${record.startDate}T${record.startTime || '00:00'}`).getTime()
        }
        if (record.publishDate) {
          return new Date(record.publishDate).getTime()
        }
        return 0
      }
      return toTimestamp(a) - toTimestamp(b)
    })

const NewsEvents = () => {
  const [news, setNews] = useState<NewsCard[]>([])
  const [events, setEvents] = useState<EventCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const [newsRes, eventsRes] = await Promise.all([
          fetch('/api/content/news', { cache: 'no-store' }),
          fetch('/api/content/events', { cache: 'no-store' }),
        ])

        if (!newsRes.ok) {
          throw new Error('Unable to load news content')
        }
        if (!eventsRes.ok) {
          throw new Error('Unable to load events content')
        }

        const [newsJson, eventsJson] = await Promise.all([newsRes.json(), eventsRes.json()])
        if (!isMounted) return

        setNews(mapNewsPayload(newsJson.data ?? []))
        setEvents(mapEventPayload(eventsJson.data ?? []))
      } catch (error) {
        console.warn('[home-news-events] using fallback data', error)
        if (!isMounted) return

        setNews(
          newsItems.slice(0, 4).map((item) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            heroImage: item.heroImage,
            publishDate: item.publishedOn,
            tag: item.tag,
            author: item.author,
            readingTime: item.readingTime,
            slug: item.slug,
            ctaLabel: 'Read story',
            ctaHref: `/news/${item.slug}`,
          })),
        )
        setEvents(
          eventHighlights.map((highlight) => ({
            id: highlight.id,
            title: highlight.title,
            summary: highlight.description,
            location: highlight.location,
            startDate: highlight.dateRange,
            category: 'DMRC Event',
            ctaLabel: highlight.ctaLabel,
            ctaHref: highlight.ctaHref,
          })),
        )
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const newsList = useMemo(() => news.slice(0, 4), [news])
  const eventList = useMemo(() => events.slice(0, 3), [events])

  return (
    <section className='bg-white py-16'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600'>News & Events</p>
            <h2 className='mt-2 text-3xl font-bold text-slate-900'>Stories from the DMRC community</h2>
            <p className='mt-2 text-sm text-slate-600'>Highlight the latest testimonies, mission updates, and gatherings.</p>
          </div>
          <Button asChild variant='outline'>
            <Link href='/news'>Browse newsroom</Link>
          </Button>
        </div>

        <div className='mt-10 grid gap-8 lg:grid-cols-3'>
          <div className='space-y-6 lg:col-span-2'>
            {loading ? (
              <div className='flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Loading newsroom…
              </div>
            ) : newsList.length === 0 ? (
              <div className='rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500'>
                No stories published yet. Once you add news, highlights will appear here automatically.
              </div>
            ) : (
              newsList.map((article) => (
                <article
                  key={article.id}
                  className='overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-lg transition'>
                  <div className='relative h-56 w-full overflow-hidden'>
                    <Image
                      src={article.heroImage || fallbackImage}
                      alt={article.title}
                      fill
                      sizes='(max-width: 1024px) 100vw, 50vw'
                      className='object-cover transition duration-500 hover:scale-105'
                    />
                    {article.tag ? (
                      <span className='absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-800'>
                        {article.tag}
                      </span>
                    ) : null}
                  </div>
                  <div className='space-y-3 p-6'>
                    <div className='flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500'>
                      {article.publishDate ? <span>{formatDate(article.publishDate)}</span> : null}
                      {article.readingTime ? (
                        <>
                          <span className='h-1 w-1 rounded-full bg-slate-300' />
                          <span>{article.readingTime}</span>
                        </>
                      ) : null}
                    </div>
                    <h3 className='text-xl font-semibold text-slate-900'>{article.title}</h3>
                    <p className='text-sm text-slate-600'>{article.summary}</p>
                    <div className='flex items-center justify-between pt-2'>
                      <span className='text-xs font-semibold text-indigo-600'>
                        {article.author || 'DMRC Communications'}
                      </span>
                      <Link
                        href={article.slug ? `/news/${article.slug}` : article.ctaHref || '/news'}
                        className='inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-indigo-600'>
                        {article.ctaLabel || 'Read story'}
                        <ArrowUpRight className='h-4 w-4' />
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className='h-full rounded-3xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm'>
            <div className='border-b border-slate-200 pb-4'>
              <p className='text-sm font-semibold text-slate-900'>Upcoming events</p>
              <p className='text-xs text-slate-500'>Promote vigils, missions, and leadership gatherings.</p>
            </div>
            <div className='mt-4 space-y-4'>
              {loading ? (
                <div className='flex h-40 items-center justify-center text-sm text-slate-500'>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Loading events…
                </div>
              ) : eventList.length === 0 ? (
                <div className='rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500'>
                  Add events in the admin to feature them here.
                </div>
              ) : (
                eventList.map((event) => (
                  <div key={event.id} className='rounded-2xl border border-slate-100 bg-white p-4 shadow-sm'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>{event.title}</p>
                        <p className='text-xs text-slate-500'>{event.category || 'Ministry event'}</p>
                      </div>
                    </div>
                    <p className='mt-2 text-xs text-slate-600'>{event.summary}</p>
                    <div className='mt-3 space-y-2 text-xs text-slate-500'>
                      <p className='flex items-center gap-2'>
                        <CalendarDays className='h-4 w-4 text-indigo-600' />
                        {event.startDate && !event.startDate.includes('·')
                          ? formatEventRange(event)
                          : event.startDate || 'Date to be announced'}
                      </p>
                      <p className='flex items-center gap-2'>
                        <MapPin className='h-4 w-4 text-indigo-600' />
                        {event.location || 'DMRC Campus'}
                      </p>
                    </div>
                    {event.ctaHref ? (
                      <Link
                        href={event.ctaHref}
                        className='mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500'>
                        {event.ctaLabel || 'View details'}
                        <ArrowUpRight className='h-3.5 w-3.5' />
                      </Link>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NewsEvents


