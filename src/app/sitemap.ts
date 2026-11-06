import type { MetadataRoute } from 'next'

import { siteConfig } from '@/app/data/site'
import { getMinistries } from '@/lib/ministries/queries'
import { getArticles } from '@/lib/news/queries'
import { getPublications } from '@/lib/publications/queries'
import { getAllRetreats } from '@/lib/retreats/queries'

export const revalidate = 3600

const staticRoutes = ['', '/retreats', '/retreats/check-booking', '/mass-intentions', '/donation', '/ministries', '/news', '/gallery', '/publications', '/about', '/apostolate']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, '')
  const [{ retreats }, ministries, articles, publications] = await Promise.all([getAllRetreats(), getMinistries(), getArticles(), getPublications()])

  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, changeFrequency: 'weekly' as const, priority: route === '' ? 1 : 0.7 })),
    ...retreats.map((retreat) => ({ url: `${base}/events/${retreat.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...ministries.map((ministry) => ({ url: `${base}/ministries/${ministry.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...articles.map((article) => ({
      url: `${base}/news/${article.slug}`,
      lastModified: article.publishedOn ? new Date(article.publishedOn) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...publications.map((publication) => ({ url: `${base}/publications/${publication.slug}`, changeFrequency: 'monthly' as const, priority: 0.4 })),
  ]
}
