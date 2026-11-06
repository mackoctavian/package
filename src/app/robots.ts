import type { MetadataRoute } from 'next'

import { siteConfig } from '@/app/data/site'

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, '')
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/login', '/retreats/*/payment'] },
    sitemap: `${base}/sitemap.xml`,
  }
}
