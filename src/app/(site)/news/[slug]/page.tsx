import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ContentItem } from '@prisma/client'

import prisma from '@/lib/prisma'
import { eventHighlights, newsItems } from '@/app/data/news'

type NewsRouteProps = {
  params: Promise<{
    slug: string
  }>
}

type ArticleDetail = {
  id: string
  slug: string
  title: string
  summary: string
  heroImage: string
  tag?: string
  publishedOn?: string
  readingTime?: string
  author?: string
  body?: string
  sections?: {
    heading?: string
    paragraphs: string[]
  }[]
  featuredQuote?: string
  featuredScripture?: string
  gallery: string[]
}

type ArticleSummary = {
  id: string
  slug: string
  title: string
  tag?: string
  publishedOn?: string
}

const fallbackImage = '/images/dmrc/gallery/IMG_0299.JPG'

const formatDate = (isoDate?: string) =>
  isoDate
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(isoDate))
    : ''

const getArticle = async (slug: string): Promise<ArticleDetail | null> => {
  try {
    const record = await prisma.contentItem.findFirst({
      where: { type: 'news', status: 'published', slug },
    })
    if (record) {
      return mapRecordToDetail(record)
    }
  } catch (error) {
    console.error('[news-detail] failed to load entry:', error)
  }

  const fallback = newsItems.find((item) => item.slug === slug)
  return fallback ? mapStaticToDetail(fallback) : null
}

const getOtherArticles = async (slug: string): Promise<ArticleSummary[]> => {
  try {
    const records = await prisma.contentItem.findMany({
      where: { type: 'news', status: 'published', slug: { not: slug } },
      orderBy: [{ publishDate: 'desc' }, { updatedAt: 'desc' }],
      take: 3,
    })
    if (records.length) {
      return records.map(mapRecordToSummary)
    }
  } catch (error) {
    console.error('[news-detail] failed to load related entries:', error)
  }

  return newsItems
    .filter((item) => item.slug !== slug)
    .slice(0, 3)
    .map(mapStaticToSummary)
}

const mapRecordToDetail = (record: ContentItem): ArticleDetail => {
  const metadata = (record.metadata ?? {}) as Record<string, unknown>
  const gallery = Array.isArray(metadata.gallery)
    ? metadata.gallery.filter((item): item is string => typeof item === 'string')
    : []

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary ?? '',
    heroImage: record.mediaUrl || fallbackImage,
    tag: record.category ?? undefined,
    publishedOn: (record.publishDate ?? record.createdAt).toISOString(),
    readingTime: typeof metadata.readingTime === 'string' ? metadata.readingTime : undefined,
    author: typeof metadata.author === 'string' ? metadata.author : undefined,
    body: record.body ?? '',
    featuredQuote: typeof metadata.featuredQuote === 'string' ? metadata.featuredQuote : undefined,
    featuredScripture:
      typeof metadata.featuredScripture === 'string' ? metadata.featuredScripture : undefined,
    gallery,
  }
}

const mapStaticToDetail = (item: (typeof newsItems)[number]): ArticleDetail => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  summary: item.summary,
  heroImage: item.heroImage,
  tag: item.tag,
  publishedOn: item.publishedOn,
  readingTime: item.readingTime,
  author: item.author,
  sections: item.content,
  featuredQuote: item.featuredQuote,
  featuredScripture: item.featuredScripture,
  gallery: [],
})

const mapRecordToSummary = (record: ContentItem): ArticleSummary => ({
  id: record.id,
  slug: record.slug,
  title: record.title,
  tag: record.category ?? undefined,
  publishedOn: (record.publishDate ?? record.createdAt).toISOString(),
})

const mapStaticToSummary = (item: (typeof newsItems)[number]): ArticleSummary => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  tag: item.tag,
  publishedOn: item.publishedOn,
})

export const generateMetadata = async ({ params }: NewsRouteProps): Promise<Metadata> => {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return {
      title: 'News Story Not Found | DMRC',
    }
  }

  return {
    title: `${article.title} | Divine Mercy Retreat Center`,
    description: article.summary,
  }
}

const NewsDetailPage = async ({ params }: NewsRouteProps) => {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  const otherArticles = await getOtherArticles(slug)
  const metaLine = [
    article.publishedOn ? formatDate(article.publishedOn) : null,
    article.readingTime,
    article.author ? `By ${article.author}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const bodyParagraphs =
    article.sections?.length || !article.body
      ? []
      : article.body
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)

  return (
    <main>
      <section className='relative overflow-hidden bg-slate-950 py-32 text-white'>
        <div className='pointer-events-none absolute inset-0'>
          <Image
            src={article.heroImage}
            alt={article.title}
            fill
            className='object-cover object-center opacity-40'
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]' />
        </div>
        <div className='relative container mx-auto max-w-3xl px-4 space-y-6 text-center'>
          {article.tag ? (
            <span className='inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80'>
              {article.tag}
            </span>
          ) : null}
          <h1 className='text-4xl font-semibold sm:text-5xl'>{article.title}</h1>
          {metaLine ? (
            <p className='text-sm font-semibold uppercase tracking-[0.3em] text-primary/70'>{metaLine}</p>
          ) : null}
          {article.summary ? <p className='text-base text-white/80 sm:text-lg'>{article.summary}</p> : null}
        </div>
      </section>

      <section className='bg-gray-50 py-16 sm:py-20'>
        <div className='container mx-auto max-w-6xl px-4 grid gap-12 lg:grid-cols-[2.1fr_0.9fr]'>
          <article className='space-y-10'>
            {article.featuredScripture ? (
              <blockquote className='rounded-3xl border border-primary/20 bg-white p-8 text-center text-base italic text-primary shadow-[0_18px_44px_rgba(59,130,246,0.12)]'>
                {article.featuredScripture}
              </blockquote>
            ) : null}

            {article.featuredQuote ? (
              <blockquote className='rounded-3xl border-l-4 border-primary bg-white p-6 text-lg italic text-slate-700 shadow-[0_18px_44px_rgba(15,23,42,0.08)]'>
                {article.featuredQuote}
              </blockquote>
            ) : null}

            {article.sections?.length
              ? article.sections.map((section, index) => (
                  <section key={`${section.heading ?? 'section'}-${index}`} className='space-y-4'>
                    {section.heading ? (
                      <h2 className='text-2xl font-semibold text-slate-900'>{section.heading}</h2>
                    ) : null}
                    <div className='space-y-4 text-base leading-7 text-slate-700'>
                      {section.paragraphs.map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))
              : null}

            {bodyParagraphs.length > 0 ? (
              <div className='space-y-4 text-base leading-7 text-slate-700'>
                {bodyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            {article.gallery.length > 0 ? (
              <div className='grid gap-4 sm:grid-cols-2'>
                {article.gallery.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className='relative h-48 overflow-hidden rounded-2xl border border-slate-200 bg-white'>
                    <Image src={image} alt='' fill className='object-cover' sizes='(max-width: 768px) 100vw, 50vw' />
                  </div>
                ))}
              </div>
            ) : null}

            <div className='flex flex-wrap items-center gap-3 pt-6'>
              <Link
                href='/news'
                className='inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-primary/90'>
                Back to News
                <span aria-hidden>→</span>
              </Link>
              <Link
                href='/events'
                className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary transition hover:border-primary hover:bg-primary/20'>
                Upcoming Events
              </Link>
            </div>
          </article>

          <aside className='space-y-10'>
            <div className='rounded-3xl border border-primary/20 bg-white p-8 shadow-[0_18px_44px_rgba(59,130,246,0.12)]'>
              <h3 className='text-xl font-semibold text-slate-900'>Upcoming Events</h3>
              <div className='mt-5 space-y-5'>
                {eventHighlights.slice(0, 2).map((event) => (
                  <div key={event.id} className='rounded-2xl border border-primary/10 bg-primary/5 p-5'>
                    <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary/70'>DMRC Event</p>
                    <h4 className='mt-2 text-lg font-semibold text-slate-900'>{event.title}</h4>
                    <p className='text-sm font-medium text-primary'>{event.dateRange}</p>
                    <p className='text-sm text-slate-600'>{event.location}</p>
                    <Link
                      href={event.ctaHref}
                      className='mt-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary transition hover:text-primary/80'>
                      {event.ctaLabel}
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className='space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_55px_rgba(15,23,42,0.1)]'>
              <h3 className='text-xl font-semibold text-slate-900'>More Stories</h3>
              <div className='space-y-4'>
                {otherArticles.length === 0 ? (
                  <p className='text-xs text-slate-500'>Once more stories are published, they’ll appear here.</p>
                ) : (
                  otherArticles.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className='block rounded-2xl border border-slate-200 bg-slate-100/60 p-4 transition hover:border-primary hover:bg-primary/10'>
                      {item.tag ? (
                        <p className='text-xs font-semibold uppercase tracking-[0.3em] text-primary/70'>{item.tag}</p>
                      ) : null}
                      <p className='mt-2 text-sm font-semibold text-slate-900'>{item.title}</p>
                      {item.publishedOn ? (
                        <p className='text-xs text-slate-500'>{formatDate(item.publishedOn)}</p>
                      ) : null}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className='bg-primary/10 py-16 sm:py-20'>
        <div className='container mx-auto max-w-5xl px-4 text-center space-y-6'>
          <h2 className='text-3xl font-semibold text-slate-900'>Share a Testimony or Story Idea</h2>
          <p className='text-base text-slate-600'>
            We would love to hear how Divine Mercy Retreat Center has impacted you. Submit testimonies, event updates,
            or mission stories to our communications team.
          </p>
          <a
            href='mailto:communications@dmrc.org'
            className='inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-primary/90'>
            Email Communications
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </main>
  )
}

export default NewsDetailPage

