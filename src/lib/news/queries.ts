import { cache } from 'react'
import type { ContentItem } from '@prisma/client'

import prisma from '@/lib/prisma'
import { newsItems } from '@/app/data/news'
import { imagery } from '@/app/data/site'
import type { Article, ArticleSection } from './format'

export type { Article, ArticleSection } from './format'
export { formatArticleDate } from './format'

/** Public news queries: published admin stories first, bundled stories as a fallback. */

const str = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined)

const estimateReadingTime = (sections: ArticleSection[]) => {
  const words = sections.flatMap((s) => s.paragraphs).join(' ').split(/\s+/).filter(Boolean).length
  return words ? `${Math.max(1, Math.round(words / 200))} min read` : undefined
}

const fromRecord = (record: ContentItem): Article => {
  const metadata = (record.metadata ?? {}) as Record<string, unknown>
  const paragraphs = (record.body ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  const sections = paragraphs.length ? [{ paragraphs }] : []
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary ?? paragraphs[0] ?? '',
    heroImage: record.mediaUrl || imagery.churchInterior,
    tag: record.category ?? undefined,
    publishedOn: (record.publishDate ?? record.createdAt).toISOString(),
    readingTime: str(metadata.readingTime) ?? estimateReadingTime(sections),
    author: str(metadata.author),
    sections,
    featuredQuote: str(metadata.featuredQuote),
    featuredScripture: str(metadata.featuredScripture),
    gallery: Array.isArray(metadata.gallery) ? metadata.gallery.filter((item): item is string => typeof item === 'string') : [],
  }
}

const fromStatic = (item: (typeof newsItems)[number]): Article => ({
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

const byNewest = (a: Article, b: Article) => (b.publishedOn ?? '').localeCompare(a.publishedOn ?? '')

export const getArticles = cache(async (): Promise<Article[]> => {
  try {
    const records = await prisma.contentItem.findMany({
      where: { type: 'news', status: 'published' },
      orderBy: [{ publishDate: 'desc' }, { updatedAt: 'desc' }],
    })
    if (records.length) return records.map(fromRecord)
  } catch (error) {
    console.error('[news] database unavailable, using static data', error instanceof Error ? error.message : error)
  }
  return newsItems.map(fromStatic).sort(byNewest)
})

export const getArticleBySlug = cache(async (slug: string): Promise<Article | undefined> => {
  try {
    const record = await prisma.contentItem.findFirst({ where: { type: 'news', status: 'published', slug } })
    if (record) return fromRecord(record)
  } catch (error) {
    console.error('[news] lookup failed', error instanceof Error ? error.message : error)
  }
  const fallback = newsItems.find((item) => item.slug === slug)
  return fallback ? fromStatic(fallback) : undefined
})

