import type { MetadataRoute } from 'next'

import { siteConfig } from '@/app/data/site'
import { LOCALES } from '@/i18n/config'
import { languageAlternates, localizeHref } from '@/i18n/navigation'
import { getMinistries } from '@/lib/ministries/queries'
import { getArticles } from '@/lib/news/queries'
import { getPublications } from '@/lib/publications/queries'
import { getAllRetreats } from '@/lib/retreats/queries'

export const revalidate = 3600

const staticRoutes = ['/', '/retreats', '/retreats/check-booking', '/mass-intentions', '/donation', '/ministries', '/news', '/gallery', '/publications', '/about', '/apostolate']

type Entry = { path: string; priority: number; changeFrequency: 'weekly' | 'monthly'; lastModified?: Date }

/** Every page is listed once per language, with `hreflang` alternates to its translations. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, '')
  const [{ retreats }, ministries, articles, publications] = await Promise.all([getAllRetreats(), getMinistries(), getArticles(), getPublications()])

  const entries: Entry[] = [
    ...staticRoutes.map((path) => ({ path, changeFrequency: 'weekly' as const, priority: path === '/' ? 1 : 0.7 })),
    ...retreats.map((retreat) => ({ path: `/events/${retreat.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...ministries.map((ministry) => ({ path: `/ministries/${ministry.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...articles.map((article) => ({
      path: `/news/${article.slug}`,
      lastModified: article.publishedOn ? new Date(article.publishedOn) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...publications.map((publication) => ({ path: `/publications/${publication.slug}`, changeFrequency: 'monthly' as const, priority: 0.4 })),
  ]

  return entries.flatMap((entry) =>
    LOCALES.map((locale) => ({
      url: `${base}${localizeHref(entry.path, locale)}`,
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: { languages: languageAlternates(entry.path, base) },
    })),
  )
}
