'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ArrowUpRight, Sparkles } from 'lucide-react'

import type { RetreatType } from '@/app/types/retreat'

type NewsItem = {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  image?: string 
  author?: string
  date?: string
  category?: string
}

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

type EventItem = {
  title: string
  date: string
  description: string
  ctaHref: string
  image?: string
}

const FALLBACK_EVENT_LIMIT = 3

const YEAR_PATTERN = /\b(19|20)\d{2}\b/

const splitDateRangeTokens = (value?: string | null): [string, string] => {
  if (!value) return ['', '']
  const trimmed = value.trim()
  if (!trimmed) return ['', '']

  const separators = ['–', '—', ' to ', ' - ']
  for (const separator of separators) {
    if (trimmed.includes(separator)) {
      const [start, end] = trimmed.split(separator)
      return [start?.trim() ?? '', end?.trim() ?? '']
    }
  }

  return [trimmed, '']
}

const extractYear = (value?: string | null) => {
  if (!value) return null
  const match = value.match(YEAR_PATTERN)
  return match ? Number(match[0]) : null
}

const addYearIfMissing = (value: string, fallbackYear?: number | null) => {
  if (!value) return value
  if (YEAR_PATTERN.test(value)) return value
  return fallbackYear ? `${value.replace(/,\s*$/, '')}, ${fallbackYear}` : value
}

const parseDateToken = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const parseDateRange = (value?: string | null) => {
  const [startToken, endToken] = splitDateRangeTokens(value)
  const fallbackYear = extractYear(endToken) ?? extractYear(value)
  const normalizedStart = addYearIfMissing(startToken, fallbackYear)
  const normalizedEnd = addYearIfMissing(endToken || startToken, fallbackYear)
  const parsedStart = parseDateToken(normalizedStart)
  const parsedEnd = parseDateToken(normalizedEnd || normalizedStart)
  return { parsedStart, parsedEnd }
}

const getComparableTime = (value: { parsedStart: Date | null; parsedEnd: Date | null }) =>
  value.parsedStart?.getTime() ?? value.parsedEnd?.getTime() ?? Number.POSITIVE_INFINITY

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const fallbackNewsImage = '/images/dmrc/gallery/IMG_0227.JPG'

const formatDateLabel = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const mapNewsFromCms = (items: ContentApiItem[]): NewsItem[] =>
  items
    .filter((item) => item.status === 'published')
    .sort((a, b) => {
      const left = new Date(a.publishDate ?? 0).getTime()
      const right = new Date(b.publishDate ?? 0).getTime()
      return right - left
    })
    .map((item) => ({
      title: item.title,
      description: item.summary ?? item.body?.slice(0, 140) ?? 'Read the latest update from DMRC.',
      ctaLabel: 'Read story',
      ctaHref: item.slug ? `/news/${item.slug}` : '/news',
      image: item.mediaUrl || fallbackNewsImage,
      author: typeof item.metadata?.author === 'string' ? (item.metadata.author as string) : 'DMRC Communications',
      date: formatDateLabel(item.publishDate),
      category: item.category ?? 'News',
    }))

const buildNewsFallback = (): NewsItem[] => [
  {
    title: 'Divine Mercy media update',
    description: 'Stay tuned for fresh mission stories from the DMRC newsroom.',
    ctaLabel: 'Visit newsroom',
    ctaHref: '/news',
    image: fallbackNewsImage,
    author: 'DMRC Communications',
    date: formatDateLabel(new Date().toISOString()),
    category: 'News',
  },
]

// Helper to get a random image for demo purposes if one isn't provided
const getRandomImage = (index: number, type: 'news' | 'event') => {
    const newsImages = [
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1495020686667-45b00f055c5b?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80'
    ]
    const eventImages = [
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80'
    ]
    
    const images = type === 'news' ? newsImages : eventImages
    return images[index % images.length]
}

const mapRetreatsToEvents = (retreats: RetreatType[]): EventItem[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return retreats
    .filter((retreat) => retreat.status !== 'Closed')
    .map((retreat) => ({ retreat, ...parseDateRange(retreat.dateRange) }))
    .filter(({ parsedStart, parsedEnd }) => {
      const comparisonDate = parsedStart ?? parsedEnd
      if (!comparisonDate) return true
      return comparisonDate >= today
    })
    .sort((a, b) => getComparableTime(a) - getComparableTime(b))
    .slice(0, FALLBACK_EVENT_LIMIT)
    .map(({ retreat }, index) => ({
      title: retreat.title,
      description: retreat.description,
      date: retreat.dateRange,
      ctaHref: retreat.detailHref || `/events/${retreat.slug}`,
      image: retreat.imageSrc || getRandomImage(index, 'event'),
    }))
}

const mapStaticRetreats = (records: any[]): EventItem[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (records ?? [])
    .map((item: any) => ({ item, ...parseDateRange(item.dateRange) }))
    .filter(({ parsedStart, parsedEnd }) => {
      const comparisonDate = parsedStart ?? parsedEnd
      if (!comparisonDate) return true
      return comparisonDate >= today
    })
    .sort((a, b) => getComparableTime(a) - getComparableTime(b))
    .slice(0, FALLBACK_EVENT_LIMIT)
    .map(({ item }, index: number) => ({
      title: item.title,
      description: item.description,
      date: item.dateRange,
      ctaHref: item.detailHref ?? `/events/${item.slug}`,
      image: item.imageSrc || getRandomImage(index, 'event'),
    }))
}

const fetchFallbackEvents = async (): Promise<EventItem[]> => {
  try {
    const res = await fetch('/api/data')
    if (!res.ok) return []
    const payload = await res.json()
    return mapStaticRetreats(payload.RetreatData ?? [])
  } catch (error) {
    console.error('[RightSidebar] fallback retreat fetch failed:', error)
    return []
  }
}

const RightSidebar = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [eventItems, setEventItems] = useState<EventItem[]>([])

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const [retreatRes, newsRes] = await Promise.all([
          fetch('/api/retreats', { cache: 'no-store' }),
          fetch('/api/content/news', { cache: 'no-store' }),
        ])

        if (!retreatRes.ok) {
          throw new Error('Failed to fetch retreat feed')
        }
        if (!newsRes.ok) {
          throw new Error('Failed to fetch news feed')
        }

        const [retreatJson, newsJson] = await Promise.all([retreatRes.json(), newsRes.json()])
        if (!isMounted) return

        const mappedNews = mapNewsFromCms(newsJson.data ?? [])
        setNewsItems(mappedNews.length ? mappedNews : buildNewsFallback())

        const liveEvents = mapRetreatsToEvents(retreatJson.data ?? [])
        if (liveEvents.length) {
          setEventItems(liveEvents)
        } else {
          const fallbackEvents = await fetchFallbackEvents()
          if (isMounted) setEventItems(fallbackEvents)
        }
      } catch (error) {
        console.error('[RightSidebar] failed to load news/events:', error)
        if (!isMounted) return
        setNewsItems(buildNewsFallback())
        const fallbackEvents = await fetchFallbackEvents()
        setEventItems(fallbackEvents)
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [])

  const upcomingEvents = useMemo(() => eventItems, [eventItems])

  return (
    <div className='sticky top-32 flex flex-col gap-6 overflow-hidden'>
      
      {/* Featured Story - Large Card */}
      {newsItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-700/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative overflow-hidden rounded-xl bg-white">
            <div className="relative h-36 overflow-hidden">
              <Image
                src={newsItems[0].image!}
                alt={newsItems[0].title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wide">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
              </div>
            </div>
            <div className="p-4">
              <Link href={newsItems[0].ctaHref} className="block">
                <h3 className="text-base font-bold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                  {newsItems[0].title}
                </h3>
              </Link>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{newsItems[0].description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{newsItems[0].date}</span>
                <Link href={newsItems[0].ctaHref} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                  Read <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* More Stories - Compact List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Latest Stories</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {newsItems.slice(1).map((item, index) => (
            <motion.article
              key={index}
              variants={itemVariants}
              className="group flex gap-3 p-3 hover:bg-slate-50/50 transition-colors"
            >
              <Link href={item.ctaHref} className="flex-shrink-0 relative w-14 h-14 rounded-lg overflow-hidden">
                <Image
                  src={item.image!}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </Link>
              <div className="flex-grow min-w-0">
                <Link href={item.ctaHref}>
                  <h3 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-medium text-blue-600 uppercase">{item.category}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] text-slate-400">{item.date}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.div>

      {/* Upcoming Retreats - Modern Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Upcoming Retreats</h2>
          </div>
        </div>
        <div className="p-3 space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">New retreats coming soon.</p>
          ) : (
            upcomingEvents.map((event, index) => (
              <motion.article
                key={event.title}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-xl border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-md"
              >
                <div className="relative h-24 overflow-hidden">
                  <Image
                    src={event.image!}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <Link href={event.ctaHref}>
                      <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover:text-blue-200 transition-colors">
                        {event.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-medium text-blue-300 uppercase tracking-wide">{event.date}</span>
                      <Link 
                        href={event.ctaHref}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-semibold text-white hover:bg-white/30 transition-colors"
                      >
                        Details <ArrowUpRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <Link 
            href="/retreats" 
            className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Retreats <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default RightSidebar
